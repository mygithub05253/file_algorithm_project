let folders = JSON.parse(localStorage.getItem("folders")) || { "전체 파일": [], "기타 파일": [] };
let currentTab = "전체 파일";

// 폴더 저장 함수
function saveFolders() {
    localStorage.setItem("folders", JSON.stringify(folders));
}

// 기존 폴더 불러오기
function loadFoldersFromStorage() {
    let storedFolders = JSON.parse(localStorage.getItem("folders"));
    if (!storedFolders) {
        storedFolders = { "전체 파일": [], "기타 파일": [] };
        localStorage.setItem("folders", JSON.stringify(storedFolders));
    } else {
        if (!storedFolders["기타 파일"]) storedFolders["기타 파일"] = []; // 기타 파일 폴더가 없으면 추가
    }
    return storedFolders;
}

// 카테고리 네비게이션 표시
function loadCategories() {
    const folderTabs = document.getElementById("folderTabs");
    folderTabs.innerHTML = "";

    Object.keys(folders).forEach(folder => {
        const button = document.createElement("button");
        button.classList.add("tab");
        button.innerHTML = `📁 <span>${folder}</span>`;

        if (folder !== "전체 파일" && folder !== "기타 파일") {
            const removeButton = document.createElement("button");
            removeButton.innerHTML = "❌";
            removeButton.classList.add("remove-folder-btn");
            removeButton.onclick = (e) => {
                e.stopPropagation();
                removeCategory(folder);
            };
            button.appendChild(removeButton);
        }

        button.onclick = () => changeTab(folder);
        folderTabs.appendChild(button);
    });
}

// ✅ 폴더 추가 함수
function createCategory() {
    const newCategory = document.getElementById("newCategoryName").value.trim();
    if (newCategory && !folders[newCategory]) {
        fetch("/create-folder", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ folderName: newCategory })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "폴더 추가 성공") {
                folders[newCategory] = [];
                saveFolders(); 
                loadCategories(); 
                alert(`폴더 "${newCategory}"가 추가되었습니다.`);
            } else {
                alert(data.message);
            }
        })
        .catch(error => console.error("❌ 폴더 추가 오류:", error));
    }
    document.getElementById("newCategoryName").value = "";
}

// ✅ 폴더 삭제 함수
function removeCategory(folderName) {
    if (folderName === "전체 파일" || folderName === "기타 파일") {
        alert("해당 폴더는 삭제할 수 없습니다.");
        return;
    }

    fetch("/delete-folder", {
        method: "DELETE",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ folderName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "폴더 삭제 성공") {
            delete folders[folderName];
            saveFolders(); 
            loadCategories(); 
            alert(`폴더 "${folderName}"가 삭제되었습니다.`);
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error("❌ 폴더 삭제 오류:", error));
}

// 폴더 변경
function changeTab(folderName) {
    currentTab = folderName;
    document.getElementById("folderTitle").innerText = `📁 ${folderName}`;
    displayFiles();
}

// 파일 분류 (여러 폴더에 추가)
function classifyFile(fileName, callback) {
    const fileNameWithoutSpaces = fileName.replace(/\s/g, "").toLowerCase();
    let matchedFolders = ["전체 파일"];
    let hasMatchingFolder = false;

    const query = `SELECT folder_id, folder_name FROM folders`;
    db.query(query, [], (err, results) => {
        if (err) {
            console.error("❌ 폴더 목록 조회 오류:", err);
            return callback(null, "기타 파일");
        }

        const folderList = results.map(row => ({
            id: row.folder_id,
            name: row.folder_name.toLowerCase()
        }));

        let primaryFolder = { id: null, name: "기타 파일" };

        folderList.forEach(folder => {
            const folderNameWithoutSpaces = folder.name.replace(/\s/g, "").toLowerCase();
            if (fileNameWithoutSpaces.includes(folderNameWithoutSpaces)) {
                matchedFolders.push(folder.name);
                primaryFolder = folder;
                hasMatchingFolder = true;
            }
        });

        if (!hasMatchingFolder) {
            matchedFolders.push("기타 파일");
        }

        callback(primaryFolder.id, primaryFolder.name);
    });
}

// ✅ 파일 업로드 (DB 저장 + UI 반영)
function uploadFiles() {
    const fileInput = document.getElementById("fileInput");
    const files = fileInput.files;

    if (files.length === 0) return alert("업로드할 파일을 선택하세요.");

    const formData = new FormData();
    formData.append("file", files[0]);

    const token = localStorage.getItem("token");

    fetch("/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "파일 업로드 성공") {
            fetchFilesFromServer();
        }
    })
    .catch(() => alert("파일 업로드 중 오류 발생"));
}

// ✅ 서버에서 파일 목록 가져와 `folders`에 저장 후 `displayFiles()` 실행
function fetchFilesFromServer() {
    const token = localStorage.getItem("token");

    fetch("/files", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(files => {
        folders = loadFoldersFromStorage();

        if (!folders["전체 파일"]) folders["전체 파일"] = [];
        if (!folders["기타 파일"]) folders["기타 파일"] = [];

        files.forEach(file => {
            const folderList = file.folder_names ? file.folder_names.split(",") : ["기타 파일"];

            // ✅ "전체 파일"이 없으면 추가
            if (!folderList.includes("전체 파일")) {
                folderList.push("전체 파일");
            }

            folderList.forEach(folder => {
                if (!folders[folder]) {
                    folders[folder] = [];
                }
                folders[folder].push({
                    id: file.file_id,
                    name: file.file_name,
                    date: new Date(file.uploaded_at).toISOString(),
                    path: file.file_path
                });
            });
        });

        saveFolders();
        displayFiles();
    })
    .catch(error => console.error("❌ 파일 목록 불러오기 오류:", error));
}

// 고유 ID 생성
function generateUniqueId() {
    return 'file-' + Math.random().toString(36).substr(2, 9);
}

// ✅ 파일 목록 표시 (콘솔 로그 추가)
function displayFiles() {
    console.log("📂 현재 폴더:", currentTab);
    console.log("📂 folders 데이터:", folders);

    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";

    const allFiles = folders[currentTab] || [];

    if (allFiles.length === 0) {
        fileList.innerHTML = "<p>파일이 없습니다.</p>";
        return;
    }

    allFiles.forEach(fileObj => {
        const listItem = document.createElement("li");
        listItem.setAttribute("data-date", fileObj.date);
        listItem.innerHTML = `
            <input type="checkbox" class="fileCheckbox" data-id="${fileObj.id}">
            ${fileObj.name} (업로드 날짜: ${new Date(fileObj.date).toLocaleString()})
            <button onclick="downloadFile('${fileObj.id}')">📥 다운로드</button>
            <button onclick="deleteFile('${fileObj.id}')">🗑 삭제</button>
        `;
        fileList.appendChild(listItem);
    });
}

// 파일 삭제
function deleteFile(fileId) {
    const token = localStorage.getItem("token");

    console.log(`🗑 파일 삭제 요청 (ID: ${fileId})`);

    fetch(`/files/${fileId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "파일이 삭제되었습니다.") {
            console.log(`✅ 파일 삭제 성공 (ID: ${fileId})`);

            // ✅ 삭제된 파일을 `folders`에서 즉시 제거
            Object.keys(folders).forEach(folder => {
                folders[folder] = folders[folder].filter(file => file.id !== Number(fileId));
            });

            saveFolders();
            displayFiles(); // ✅ UI 즉시 업데이트

            // ✅ 최신 파일 목록 불러와 정리
            fetchFilesFromServer();
        } else {
            console.warn("⚠ 파일 삭제 실패:", data.message);
            alert("파일 삭제에 실패했습니다.");
        }
    })
    .catch(error => {
        console.error("❌ 파일 삭제 요청 오류:", error);
        alert("파일 삭제 중 오류가 발생했습니다.");
    });
}

// 파일 다운로드 (가상 동작)
function downloadFile(fileId) {
    const file = folders[currentTab].find(file => file.id === fileId);
    if (file) {
        alert(`${file.name} 다운로드 시작 (서버 구현 필요)`);
    } else {
        alert("파일을 찾을 수 없습니다.");
    }
}

// 파일 정렬
function sortFiles() {
    const sortOption = document.getElementById("sortOption").value;
    const fileList = document.getElementById("fileList");
    const files = Array.from(fileList.children);

    files.sort((a, b) => {
        let dateA = new Date(a.getAttribute("data-date"));
        let dateB = new Date(b.getAttribute("data-date"));
        
        return sortOption === "latest" ? dateB - dateA : dateA - dateB;
    });
    
    fileList.innerHTML = "";
    files.forEach(file => fileList.appendChild(file));
}

// 전체 파일 선택/해제
function selectAllFiles(selectAll) {
    const checkboxes = document.querySelectorAll('.fileCheckbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

// 선택된 파일 다운로드
function downloadSelected() {
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) {
        alert("선택된 파일이 없습니다.");
        return;
    }

    selectedFiles.forEach(file => {
        alert(`${file.name} 다운로드 시작 (서버 구현 필요)`);
    });
}

// 선택된 파일 삭제
function deleteSelected() {
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) {
        alert("선택된 파일이 없습니다.");
        return;
    }

    if (!confirm("선택한 파일을 삭제하시겠습니까?")) return;

    const token = localStorage.getItem("token");
    let deletePromises = [];

    selectedFiles.forEach(file => {
        const deletePromise = fetch(`/files/${file.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        }).then(response => response.json());

        deletePromises.push(deletePromise);
    });

    Promise.all(deletePromises)
    .then(results => {
        results.forEach(data => {
            if (data.message !== "파일이 삭제되었습니다.") {
                console.warn("⚠ 파일 삭제 실패:", data.message);
            }
        });

        console.log("✅ 선택한 파일 삭제 완료");

        // ✅ 삭제된 파일을 `folders`에서 즉시 제거
        selectedFiles.forEach(file => {
            Object.keys(folders).forEach(folder => {
                folders[folder] = folders[folder].filter(f => f.id !== Number(file.id));
            });
        });

        saveFolders();
        displayFiles(); // ✅ UI 즉시 업데이트

        // ✅ 최신 파일 목록 불러와 정리
        fetchFilesFromServer();
    })
    .catch(error => console.error("❌ 파일 삭제 요청 오류:", error));
}

// 선택된 파일 가져오기
function getSelectedFiles() {
    const checkboxes = document.querySelectorAll('.fileCheckbox:checked');
    return Array.from(checkboxes).map(checkbox => {
        return folders[currentTab].find(f => f.id === checkbox.dataset.id);
    }).filter(file => file);
}

// 로그아웃
function logout() {
    alert("로그아웃 되었습니다.");
    window.location.href = "../html/index.html";
}

// ✅ 페이지 로드 시 기존 데이터 불러오기 + 서버에서 파일 목록 가져오기
document.addEventListener("DOMContentLoaded", function() {
    folders = loadFoldersFromStorage();
    loadCategories();
    fetchFilesFromServer(); // ✅ 서버에서 파일 목록 가져와 UI 반영
});

