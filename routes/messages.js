const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/message");
const jwt = require('../token');
const Conversation = require("../models/conversations");


const router = express.Router();


router.get("/", async (req, res) => {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
});


router.post("/", jwt.validateToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const conversationId = req.body.conversationId;
        const conversation = await Conversation.findById(conversationId).session(session);

        if (!conversation) {
            const newConversation = new Conversation({
                participants: [req.body.senderId, req.body.receiverId],
                lastMessage: {
                    text: req.body.text,
                    senderId: req.body.senderId,
                    createdAt: new Date()
                }
            });
            await newConversation.save({ session });
            req.body.conversationId = newConversation._id;
        } else {
            conversation.lastMessage = {
                text: req.body.text,
                senderId: req.body.senderId,
                createdAt: new Date()
            };
            await conversation.save({ session });
        }

        const message = new Message({
            conversationId: req.body.conversationId,
            senderId: req.body.senderId,
            type: req.body.type,
            text: req.body.text,
            fileUrl: req.body.fileUrl,
            readBy: [req.body.receiverId]
        });
        await message.save({ session });

        await session.commitTransaction();
        res.json(message);

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: "Transaction failed", details: error.message });
    } finally {
        session.endSession();
    }
});


module.exports = router;
