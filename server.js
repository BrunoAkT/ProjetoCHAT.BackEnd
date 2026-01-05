const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();
 
const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.DB_CONNECT)
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log(err));

const router = require("./router");
app.use(router)

app.listen(3001, () => console.log("Servidor rodando"));