const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const router = express.Router();

// ✅ 보호된 API (로그인한 사용자만 접근 가능)
router.get("/profile", authenticateToken, (req, res) => {
  res.json({ message: "인증된 사용자입니다.", user: req.user });
});

module.exports = router;
