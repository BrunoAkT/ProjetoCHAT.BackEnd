require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const initializeSocket = require('./middlewares/socketHandler');


const app = express();
app.use(cors());
app.use(express.json());


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

initializeSocket(io);

mongoose.connect(process.env.DB_CONNECT)
    .then(() => console.log("MongoDB conectado"))
    .catch(err => console.log(err));


app.use((req, res, next) => {
    req.io = io;
    next();
})

const router = require("./router");
app.use(router)

server.listen(3001, () => console.log("Servidor rodando"));