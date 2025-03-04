require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const authenticateToken = require("./middleware/authMiddleware");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 미들웨어 설정
app.use(express.json());
app.use(cors());

// ✅ MySQL 연결 (별도의 `connection.js` 파일 사용)
const db = require("./db/connection");

// ✅ 정적 파일 제공 (frontend 폴더)
app.use(express.static(path.join(__dirname, "../frontend")));

// ✅ 보호된 API 라우트 추가
const protectedRoutes = require("./routes/protectedRoutes");
app.use("/protected", protectedRoutes);

// ✅ 회원가입 & 로그인 라우트 추가
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// ✅ 파일 저장 설정 (multer 사용)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "uploads"); // ✅ 수정된 경로
      cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// ✅ 파일 분류 알고리즘 적용 (클라이언트와 동일한 로직)
function classifyFile(fileName, callback) {
    const fileNameWithoutSpaces = fileName.replace(/\s/g, "").toLowerCase();
    let matchedFolderIds = [];
    let hasMatchingFolder = false;

    // ✅ 최신 폴더 목록 가져오기
    const query = `SELECT folder_id, folder_name FROM folders`;
    db.query(query, [], (err, results) => {
        if (err) {
            console.error("❌ 폴더 목록 조회 오류:", err);
            return callback([]);
        }

        const folderList = results.map(row => ({
            id: row.folder_id,
            name: row.folder_name.toLowerCase()
        }));

        folderList.forEach(folder => {
            const folderNameWithoutSpaces = folder.name.replace(/\s/g, "").toLowerCase();
            if (fileNameWithoutSpaces.includes(folderNameWithoutSpaces)) {
                matchedFolderIds.push(folder.id);
                hasMatchingFolder = true;
            }
        });

        if (!hasMatchingFolder) {
            matchedFolderIds.push(2); // ✅ 기본값: "기타 파일" (folder_id = 2)
        }

        callback(matchedFolderIds);
    });
}

function getFolders(callback) {
    const query = `SELECT folder_id, folder_name FROM folders`;
    db.query(query, [], (err, results) => {
        if (err) {
            console.error("❌ 폴더 목록 조회 오류:", err);
            return callback([]);
        }

        let folderList = results.map(row => ({
            id: row.folder_id,
            name: row.folder_name
        }));

        // ✅ 기본 폴더가 없으면 추가
        const existingFolderNames = folderList.map(folder => folder.name);
        if (!existingFolderNames.includes("전체 파일")) {
            folderList.push({ id: null, name: "전체 파일" });
        }
        if (!existingFolderNames.includes("기타 파일")) {
            folderList.push({ id: null, name: "기타 파일" });
        }

        callback(folderList);
    });
}

// ✅ 파일 업로드 API (POST /upload)
app.post("/upload", authenticateToken, upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "파일을 업로드하세요." });
    }

    const userKey = req.user.key_number;
    if (!Number.isInteger(userKey)) {
        return res.status(400).json({ message: "유효한 사용자 정보를 찾을 수 없습니다." });
    }

    let originalFileName = Buffer.from(req.file.originalname, "binary").toString("utf8");
    const savedFileName = req.file.filename;
    const filePath = `/uploads/${savedFileName}`;

    classifyFile(originalFileName, (folderIds) => {
        if (!Array.isArray(folderIds) || folderIds.length === 0) {
            folderIds = [1]; // ✅ 기본값: "전체 파일" (folder_id = 1)
        }

        const insertFileQuery = `INSERT INTO files (user_key, file_name, file_path) VALUES (?, ?, ?)`;
        db.query(insertFileQuery, [userKey, originalFileName, filePath], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "파일 저장 실패", error: err });
            }

            const fileId = result.insertId;
            const insertFileFolderQuery = `INSERT INTO file_folders (file_id, folder_id) VALUES ?`;  // ✅ 테이블명 수정
            const values = folderIds.map(folderId => [fileId, folderId]);

            db.query(insertFileFolderQuery, [values], (err) => {
                if (err) {
                    return res.status(500).json({ message: "파일-폴더 연결 실패", error: err });
                }
                res.status(201).json({ message: "파일 업로드 성공", fileId });
            });
        });
    });
});

// ✅ 파일 목록 조회 API (GET /files)
app.get("/files", authenticateToken, (req, res) => {
    const userKey = req.user.key_number;

    const query = `
        SELECT f.file_id, f.file_name, f.file_path, f.uploaded_at, 
               GROUP_CONCAT(DISTINCT fd.folder_name ORDER BY fd.folder_id ASC) AS folder_names
        FROM files f
        LEFT JOIN file_folders ff ON f.file_id = ff.file_id
        LEFT JOIN folders fd ON ff.folder_id = fd.folder_id
        WHERE f.user_key = ?
        GROUP BY f.file_id
        ORDER BY f.uploaded_at DESC
    `;

    db.query(query, [userKey], (err, results) => {
        if (err) {
            console.error("❌ 파일 목록 조회 오류:", err);
            return res.status(500).json({ message: "파일 목록 조회 실패", error: err });
        }

        results.forEach(file => {
            if (!file.folder_names.includes("전체 파일")) {
                file.folder_names += ",전체 파일"; // ✅ "전체 파일"이 없으면 추가
            }
        });

        res.json(results);
    });
});

// ✅ 파일 삭제 API (DELETE /files/:id)
app.delete("/files/:id", authenticateToken, (req, res) => {
    const fileId = req.params.id;
    const userKey = req.user.key_number; // 현재 로그인한 사용자의 파일만 삭제할 수 있도록 설정

    // ✅ 해당 파일이 현재 사용자의 파일인지 확인
    const checkQuery = `SELECT file_path FROM files WHERE file_id = ? AND user_key = ?`;

    db.query(checkQuery, [fileId, userKey], (err, results) => {
        if (err) {
            console.error("❌ 파일 조회 오류:", err);
            return res.status(500).json({ message: "파일 조회 실패" });
        }

        if (results.length === 0) {
            console.warn("⚠ 해당 파일이 존재하지 않거나 삭제 권한이 없습니다.");
            return res.status(403).json({ message: "삭제 권한이 없습니다." });
        }

        const filePath = results[0].file_path;
        const absoluteFilePath = path.join(__dirname, filePath);

        // ✅ 파일 시스템에서 실제 파일 삭제
        fs.unlink(absoluteFilePath, (fsErr) => {
            if (fsErr && fsErr.code !== "ENOENT") {
                console.error("❌ 파일 삭제 오류:", fsErr);
                return res.status(500).json({ message: "파일 삭제 실패" });
            }

            // ✅ DB에서 파일 정보 삭제
            const deleteQuery = `DELETE FROM files WHERE file_id = ?`;
            db.query(deleteQuery, [fileId], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error("❌ DB 파일 삭제 오류:", deleteErr);
                    return res.status(500).json({ message: "DB에서 파일 삭제 실패" });
                }

                console.log(`🗑 파일 삭제 완료 (ID: ${fileId})`);
                res.json({ message: "파일이 삭제되었습니다.", fileId });
            });
        });
    });
});

// ✅ 폴더 추가 API
app.post("/create-folder", authenticateToken, (req, res) => {
    const { folderName } = req.body;

    if (!folderName || folderName.trim() === "") {
        return res.status(400).json({ message: "폴더 이름을 입력하세요." });
    }

    const checkFolderQuery = `SELECT folder_id FROM folders WHERE folder_name = ?`;
    db.query(checkFolderQuery, [folderName], (err, results) => {
        if (err) {
            console.error("❌ 폴더 조회 오류:", err);
            return res.status(500).json({ message: "폴더 조회 실패" });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: "이미 존재하는 폴더입니다." });
        }

        const insertFolderQuery = `INSERT INTO folders (folder_name) VALUES (?)`;
        db.query(insertFolderQuery, [folderName], (insertErr, result) => {
            if (insertErr) {
                console.error("❌ 폴더 저장 오류:", insertErr);
                return res.status(500).json({ message: "폴더 저장 실패" });
            }

            res.status(201).json({ message: "폴더 추가 성공", folderId: result.insertId, folderName });
        });
    });
});

// ✅ 폴더 삭제 API
app.delete("/delete-folder", authenticateToken, (req, res) => {
    const { folderName } = req.body;

    if (!folderName || folderName.trim() === "" || folderName === "전체 파일" || folderName === "기타 파일") {
        return res.status(400).json({ message: "삭제할 수 없는 폴더입니다." });
    }

    const deleteFolderQuery = `DELETE FROM folders WHERE folder_name = ?`;
    db.query(deleteFolderQuery, [folderName], (err, result) => {
        if (err) {
            console.error("❌ 폴더 삭제 오류:", err);
            return res.status(500).json({ message: "폴더 삭제 실패" });
        }

        res.status(200).json({ message: "폴더 삭제 성공", folderName });
    });
});

app.delete("/delete-file/:fileId", authenticateToken, (req, res) => {
    const fileId = req.params.fileId;

    const deleteFileQuery = `DELETE FROM files WHERE file_id = ?`;
    db.query(deleteFileQuery, [fileId], (err) => {
        if (err) {
            return res.status(500).json({ message: "파일 삭제 실패", error: err });
        }

        const deleteFileFolderQuery = `DELETE FROM file_folders WHERE file_id = ?`;  // ✅ 테이블명 수정
        db.query(deleteFileFolderQuery, [fileId], (err) => {
            if (err) {
                return res.status(500).json({ message: "파일-폴더 연결 삭제 실패", error: err });
            }
            res.status(200).json({ message: "파일 삭제 성공" });
        });
    });
});

// ✅ 기본 API 라우트 (테스트용)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/html/index.html"));
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
