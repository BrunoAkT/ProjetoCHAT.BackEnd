const express = require("express");
const User = require("../models/user");

const router = express.Router();


router.post("/register", async (req, res) => {
    try {
        const passwordHash = req.body.password;
        req.body.passwordHash = passwordHash;
        delete req.body.password;

        const user = new User(req.body);
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.passwordHash;

        userResponse.token = user.generateAuthToken();
        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const userResponse = user.toObject();
    delete userResponse.passwordHash;
    userResponse.token = user.generateAuthToken();

    res.json(userResponse);
})

module.exports = router;