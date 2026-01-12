const express = require("express");
const User = require("../models/user");
const jwt = require('../token');
const upload = require("../middlewares/upload");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const router = express.Router();


router.post("/register", upload.single("avatar"), async (req, res) => {
    try {
        let avatarUrl = null;

        if (req.file) {
            const streamUpload = () => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: "profile_avatars",
                            public_id: `avatar_${req.body.username}`,
                        },
                        (error, result) => {
                            if (result) resolve(result);
                            else reject(error);
                        }
                    );

                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
            };
            const result = await streamUpload();
            avatarUrl = result.secure_url;
        }

        const passwordHash = req.body.password;
        const userData = { ...req.body, passwordHash, avatarUrl };
        delete userData.password;

        const user = new User(userData);
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.passwordHash;

        userResponse.token = user.generateAuthToken();

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
});


router.post("/login", async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
})

router.patch("/:id", jwt.validateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        console.log(id)
        console.log(req.body);

        const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userResponse = user.toObject();
        delete userResponse.passwordHash;
        userResponse.token = user.generateAuthToken();

        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
})

router.patch("/:id/avatar", jwt.validateToken, upload.single("avatar"), async (req, res) => {
    try {
        const { id } = req.params;
        console.log(req.file);

        if (!req.file) {
            return res.status(400).json({ message: "Arquivo não enviado" });
        }

        const streamUpload = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "profile_avatars",
                        public_id: `avatar_${id}`,
                        overwrite: true,
                    },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        }

        const result = await streamUpload();

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { avatarUrl: result.secure_url } },
            { new: true });

        const userResponse = user.toObject();
        delete userResponse.passwordHash;
        userResponse.token = user.generateAuthToken();

        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ message: "Error updating avatar", error: error.message });
    }
})


router.get("/", async (req, res) => {
    try {
        const email = req.query.email;
        const username = req.query.username;
        let query = {};
        if (email) {
            query.email = email;
        }
        if (username) {
            query.username = username;
        }
        console.log(query);
        const users = await User.find(query).select("-passwordHash");
        if (users.length === 0) {
            return res.json({ message: "ok" });
        }
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erro na verificaçao de usuarios", error: error.message });
    }
});

router.get("/private", jwt.validateToken, async (req, res) => {
    try {
        const _id = req.query._id;
        // console.log(_id);
        const users = await User.findOne({ _id }).select("-passwordHash");
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erro na verificaçao de usuarios", error: error.message });
    }
});

const handleSocketEvents = (socket, io) => {
    socket.on('updateUserStatus', async (data) => {
        try {
            const { userId, status } = data;
            if (!userId) return;

            const user = await User.findByIdAndUpdate(userId, { $set: { status: status } }, { new: true });
            if (user) {
                io.emit('userStatusChanged', { userId: user._id, status: user.status });
            }
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    });

    socket.on('disconnect', async () => {
        try {
            userId = socket.handshake.query.userId;
            if (!userId) return;

            setTimeout(async () => {
                const user = await User.findOneAndUpdate(
                    { _id: userId },
                    { $set: { status: 'offline' } },
                    { new: true }
                );

                if (user) {
                    io.emit('userStatusChanged', { userId: user._id, status: 'offline' });
                }
            }, 5000);

        } catch (error) {
            console.error("Error on disconnect:", error);
        }
    });
};


module.exports = { router, handleSocketEvents };