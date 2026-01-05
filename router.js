const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/user");

const { Router } = require("express"); 
const router = Router();

router.use("/messages", messageRoutes);
router.use("/user", userRoutes);

module.exports = router;