const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/message");
const jwt = require('../token');
const Conversation = require("../models/conversations");

const router = express.Router();

router.get("/", jwt.validateToken, async (req, res) => {
    const messages = [];

    if (!req.query.conversationId) {
        const userId = req.query.userId;
        const friendId = req.query.friendId;

        messages.push(...await Message.find({
            $or: [
                { senderId: userId, readBy: friendId },
                { senderId: friendId, readBy: userId }
            ]
        }).sort({ createdAt: 1 }));

    } else {
        const conversationId = req.query.conversationId;
        messages.push(...await Message.find({ conversationId }).sort({ createdAt: 1 }));
    }

    res.json(messages);
});

const handleSocketEvents = (socket, io) => {
    socket.on('sendMessage', async (data) => {
        const decodedToken = jwt.validateTokenForSocket(data.token);
        if (!decodedToken) {
            socket.emit('auth_error', { message: 'Token inválido ou não fornecido.' });
            return;
        }
        if (decodedToken.id !== data.senderId) {
            socket.emit('auth_error', { message: 'Token não corresponde ao remetente.' });
            return;
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let conversationId = data.conversationId;
            if (!conversationId) {
                const newConversation = new Conversation({
                    participants: [data.senderId, data.receiverId],
                    lastMessage: {
                        text: data.text,
                        senderId: data.senderId,
                        createdAt: new Date()
                    }
                });
                const savedConversation = await newConversation.save({ session });
                conversationId = savedConversation._id;
            } else {
                const conversation = await Conversation.findById(conversationId).session(session);
                if (conversation) {
                    conversation.lastMessage = {
                        text: data.text,
                        senderId: data.senderId,
                        createdAt: new Date()
                    };
                    await conversation.save({ session });
                }
            }

            const message = new Message({
                conversationId: conversationId,
                senderId: data.senderId,
                type: data.type,
                text: data.text,
                fileUrl: data.fileUrl,
                readBy: [data.receiverId]
            });
            const savedMessage = await message.save({ session });

            await session.commitTransaction();

            io.to(data.senderId).to(data.receiverId).emit('receiveMessage', savedMessage);

            io.to(data.senderId).emit('conversationUpdated');
            io.to(data.receiverId).emit('conversationUpdated');

        } catch (error) {
            await session.abortTransaction();
            console.error("Erro ao enviar mensagem:", error);
        } finally {
            session.endSession();
        }
    });

    socket.on('typing', ({ conversationId }) => {
        console.log(`User typing in conversation ${conversationId}`);
        socket.broadcast.emit("typing", { conversationId });
    });

    socket.on('stopTyping', ({ conversationId }) => {
        console.log(`User stopped typing in conversation ${conversationId}`);
        socket.broadcast.emit("stopTyping", { conversationId });
    });

};

module.exports = { router, handleSocketEvents };

