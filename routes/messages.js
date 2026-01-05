const express = require("express");
const Message = require("../models/message");


const router = express.Router();


router.get("/", async (req, res) => {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
});


router.post("/", async (req, res) => {
    const message = new Message(req.body);
    await message.save();
    res.json(message);
});


module.exports = router;