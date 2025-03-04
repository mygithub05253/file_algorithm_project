const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 정적 파일 제공 (public 폴더 안의 HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// 기본 페이지 설정 (localhost:3000에 접속하면 index.html 띄우기)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/index.html"));
});

//  1. 회원가입 요청 받기 (데이터 저장 X, 콘솔에 출력만)
app.post("/signup", (req, res) => {
  console.log("📌 회원가입 API 요청이 들어옴!");

  const { id, password, email, phone } = req.body;

  if (!id || !password || !email || !phone) {
    console.log("❌ 회원가입 실패: 필수 데이터 누락");
    return res
      .status(400)
      .json({ message: "아이디, 비밀번호, 이메일, 전화번호를 입력하세요." });
  }

  console.log("✅ 회원가입 요청 수신됨!");
  console.log(`   - ID: ${id}`);
  console.log(`   - Password: ${password}`);
  console.log(`   - Email: ${email}`);
  console.log(`   - Phone: ${phone}`);

  res.status(200).json({ message: "회원가입 정보 수신 완료" });
});

//  2. 파일 및 폴더 기록 저장 (데이터 저장 X, 콘솔에 출력만)
app.post("/file-records", (req, res) => {
  console.log("📌 파일 업로드 API 요청이 들어옴!");

  const { userId, files, folders, categories } = req.body;

  if (!userId || !files || !folders || !categories) {
    console.log("❌ 파일 기록 저장 실패: 필수 데이터 누락");
    return res.status(400).json({ message: "필수 데이터가 누락되었습니다." });
  }

  console.log("✅ 파일 기록 요청 수신됨!");
  console.log(`   - 사용자 ID: ${userId}`);
  console.log(`   - 파일 개수: ${files.length}`);
  console.log(`   - 폴더 개수: ${folders.length}`);
  console.log(`   - 카테고리 개수: ${categories.length}`);

  res.status(200).json({ message: "파일 기록 정보 수신 완료 (DB 저장 X)" });
});

//  3. 로그인 요청 받기 (데이터 저장 X, 콘솔에 출력만)
app.post("/login", (req, res) => {
  console.log("📌 로그인 API 요청이 들어옴!");

  const { id, password } = req.body;

  if (!id || !password) {
    console.log("❌ 로그인 실패: 아이디 또는 비밀번호 누락");
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." });
  }

  console.log("✅ 로그인 요청 수신됨!");
  console.log(`   - ID: ${id}`);
  console.log(`   - Password: ${password}`);

  res.status(200).json({ message: "로그인 정보 수신 완료" });
});

// 서버 실행
app.listen(port, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${port}`);
});
