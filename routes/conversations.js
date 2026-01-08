const express = require("express");
const mongoose = require("mongoose");
const Conversation = require("../models/conversations");
const jwt = require('../token');

const router = express.Router();


router.get("/", jwt.validateToken, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.query.userId
        }).sort({ "lastMessage.createdAt": -1 });

        const otherParticipantIds = conversations.map(conversation => {
            return conversation.participants.find(participantId => participantId.toString() !== req.query.userId);
        });

        const otherParticipants = await mongoose.model('User').find({
            _id: { $in: otherParticipantIds }
        }).select('name username avatarUrl status');

        const participantsMap = new Map(
            otherParticipants.map(p => [p._id.toString(), p])
        );

        const formattedConversations = conversations.map(conversation => {
            const otherId = conversation.participants.find(p => p.toString() !== req.query.userId).toString();
            const otherParticipantProfile = participantsMap.get(otherId);

            return {
                ...conversation.toObject(), 
                otherParticipant: otherParticipantProfile 
            };
        });

        res.json(formattedConversations);
    } catch (error) {
        res.status(500).json({ message: "Error fetching conversations", error: error.message });
    }
});

module.exports = router;