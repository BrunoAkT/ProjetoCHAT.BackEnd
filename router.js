const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/user");
const conversationRoutes = require("./routes/conversations");

const { Router } = require("express"); 
const router = Router();

router.use("/messages", messageRoutes.router);
router.use("/user", userRoutes.router);
router.use("/conversations", conversationRoutes);   

module.exports = router;