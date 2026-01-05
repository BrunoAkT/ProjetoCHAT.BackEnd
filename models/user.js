const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const { generateToken } = require('../token');

const UserSchema = new mongoose.Schema({
    name: String,
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: String,
    passwordHash: String,
    avatarUrl: String,
    status: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
})

UserSchema.pre('save', async function() {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('passwordHash')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (err) {
        console.error("Error hashing password:", err);
        throw err;
    }
});

UserSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.generateAuthToken = function () {
    return generateToken(this._id);
};


module.exports = mongoose.model("User", UserSchema)
