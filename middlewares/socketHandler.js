const messageHandler = require('../routes/messages');

function initializeSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Usuário conectado: ${socket.id}`);

        // Junta o usuário a uma sala com seu próprio ID
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`Usuário com ID ${userId} entrou na sua sala.`);
        });

        // Delega os eventos de mensagem para o handler de mensagens
        messageHandler.handleSocketEvents(socket, io);

        socket.on("disconnect", () => {
            console.log(`Usuário desconectado: ${socket.id}`);
        });
    });
}

module.exports = initializeSocket;
