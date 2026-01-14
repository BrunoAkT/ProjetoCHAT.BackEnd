const messageHandler = require('../routes/messages');
const userHandler = require('../routes/user');
const User = require('../models/user');

function initializeSocket(io) {
    io.on("connection", async (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            try {
                const user = await User.findByIdAndUpdate(userId, { $set: { status: 'online'} });
                if (user){
                    console.log(`User ${userId} set to online, username: ${user.username}`);
                }
                io.emit('userStatusChanged', { userId, status: 'online' });
            } catch (error) {
                console.error("Error updating user status to online:", error);
            }
        }

        socket.on('join', (userId) => {
            socket.join(userId);
        });

        messageHandler.handleSocketEvents(socket, io);
        userHandler.handleSocketEvents(socket, io);

        socket.on("disconnect", async () => {
            console.log(`Usuário desconectado: ${socket.id}`);
        });
    });
}

module.exports = initializeSocket;
