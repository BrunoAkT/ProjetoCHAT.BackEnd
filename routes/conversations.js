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

        



        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: "Error fetching conversations", error: error.message });
    }
});

module.exports = router;