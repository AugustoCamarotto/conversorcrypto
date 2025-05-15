const express = require("express");
const { registerUser, loginUser, getLoginStatus } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/status", protect, getLoginStatus); // Rota protegida para verificar status

module.exports = router;

