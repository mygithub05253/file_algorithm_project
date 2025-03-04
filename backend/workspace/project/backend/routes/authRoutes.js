const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/connection");
const router = express.Router();

//  회원가입 API (`POST /auth/register`)
router.post("/register", async (req, res) => {
  const { id, password, email, phone } = req.body;

  if (!id || !password || !email || !phone) {
    return res.status(400).json({ message: "모든 필드를 입력해야 합니다." });
  }

  // ✅ 전화번호 길이 검증 (11자리인지 확인)
  if (!/^\d{11}$/.test(phone)) {
    return res.status(400).json({
      message: "잘못된 전화번호 형식입니다. 11자리 숫자를 입력하세요.",
    });
  }

  try {
    // ✅ 기존 사용자 중복 확인
    const checkQuery =
      "SELECT * FROM users WHERE id = ? OR email = ? OR phone = ?";
    db.query(checkQuery, [id, email, phone], async (err, results) => {
      if (results.length > 0) {
        return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
      }

      // ✅ 비밀번호 해싱 후 저장
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery =
        "INSERT INTO users (id, password, email, phone) VALUES (?, ?, ?, ?)";

      db.query(
        insertQuery,
        [id, hashedPassword, email, phone],
        (err, result) => {
          if (err) {
            console.error("❌ 회원가입 실패:", err);
            return res.status(500).json({ message: "회원가입 중 오류 발생" });
          }
          res.status(201).json({ message: "회원가입 성공!" });
        }
      );
    });
  } catch (error) {
    console.error("❌ 서버 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 로그인 API (`POST /login`)
router.post("/login", (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
      return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." });
  }

  const query = "SELECT key_number, id, password FROM users WHERE id = ?";
  db.query(query, [id], async (err, results) => {
      if (err || results.length === 0) {
          return res.status(401).json({ message: "존재하지 않는 사용자입니다." });
      }

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
          return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });
      }

      const token = jwt.sign(
          { key_number: user.key_number, id: user.id }, // ✅ key_number 포함
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
      );

      res.json({ message: "로그인 성공!", token });
  });
});


module.exports = router;
