let folders = JSON.parse(localStorage.getItem("folders")) || {
  "전체 파일": [],
  "기타 파일": [],
};

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

// 카테고리를 네비게이션 바(#folderTabs)에 표시하는 기능
function loadCategories() {
  const folderTabs = document.getElementById("folderTabs");
  folderTabs.innerHTML = "";

  Object.keys(folders).forEach((folder) => {
    const button = document.createElement("button");
    button.classList.add("tab");
    button.innerHTML = `📁 <span>${folder}</span>`;

    // "전체 파일"과 "기타 파일"에는 삭제 버튼을 표시하지 않음
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

// 카테고리 생성 (추가 기능 복구)
function createCategory() {
  const newCategory = document.getElementById("newCategoryName").value.trim();
  if (newCategory && !folders[newCategory]) {
    folders[newCategory] = [];
    saveFolders();
    loadCategories(); // 폴더 리스트 갱신
  }
  document.getElementById("newCategoryName").value = "";
}

// 카테고리 제거 (삭제 기능 복구)
function removeCategory(category) {
  if (category === "전체 파일" || category === "기타 파일") return; // 기본 폴더 삭제 불가
  delete folders[category];
  saveFolders();
  loadCategories();
  changeTab("전체 파일");
}

// 폴더 변경 기능 복구
function changeTab(folderName) {
  currentTab = folderName;
  document.getElementById("folderTitle").innerText = `📁 ${folderName}`;
  displayFiles();
}

// 파일명을 폴더명과 비교하여 분류 => 여러 폴더에 추가되도록 수정
function classifyFile(fileName) {
  const fileNameWithoutSpaces = fileName.replace(/\s/g, ""); // 파일명 공백 제거
  let matchedCategories = ["전체 파일"]; // 기본적으로 전체 파일에 추가됨
  let hasMatchingFolder = false; // 폴더명과 일치하는 단어가 있는지 여부

  Object.keys(folders).forEach((folder) => {
    const folderNameWithoutSpaces = folder.replace(/\s/g, ""); // 폴더명 공백 제거
    if (
      folder !== "기타 파일" &&
      fileNameWithoutSpaces.includes(folderNameWithoutSpaces)
    ) {
      matchedCategories.push(folder);
      hasMatchingFolder = true; // 매칭되는 폴더가 있으면 true 설정
    }
  });

  // **파일명이 어떤 폴더명에도 포함되지 않으면 "기타 파일" 폴더에도 추가**
  if (!hasMatchingFolder) {
    matchedCategories.push("기타 파일");
  }

  return matchedCategories;
}

// 파일 업로드 및 자동 분류
function uploadFiles() {
  const input = document.getElementById("fileInput");
  const files = input.files;

  if (files.length === 0) {
    alert("파일을 선택하세요.");
    return;
  }

  for (let file of files) {
    const fileId = `${file.name}-${Date.now()}`;
    const categories = classifyFile(file.name); // 파일이 여러 폴더에 들어갈 수 있도록 변경

    categories.forEach((category) => {
      if (!folders[category]) {
        folders[category] = [];
      }
      folders[category].push({ id: fileId, name: file.name, date: new Date() });
    });
  }

  input.value = ""; // 파일 선택 초기화
  saveFolders();
  displayFiles();

  console.log("📌 파일이 추가됨! 이제 서버로 전송 시도");
  sendFileRecords(); // ✅ 서버로 데이터 전송 (이 함수가 실행되는지 확인 필요)
}

function sortFiles() {
  let sortOption = document.getElementById("sortOption").value;
  let fileList = document.getElementById("fileList");
  let files = Array.from(fileList.children);

  files.sort((a, b) => {
    let dateA = new Date(a.getAttribute("data-date"));
    let dateB = new Date(b.getAttribute("data-date"));

    return sortOption === "latest" ? dateB - dateA : dateA - dateB;
  });

  fileList.innerHTML = "";
  files.forEach((file) => fileList.appendChild(file));
}

// 파일 목록 표시
function displayFiles() {
  const fileList = document.getElementById("fileList");
  fileList.innerHTML = "";
  let allFiles = folders[currentTab] || [];

  if (allFiles.length === 0) {
    fileList.innerHTML = "<p>파일이 없습니다.</p>";
    return;
  }

  allFiles.forEach((fileObj) => {
    const listItem = document.createElement("li");
    listItem.setAttribute("data-date", fileObj.date);
    listItem.innerHTML = `
            <input type="checkbox" class="fileCheckbox" data-id="${fileObj.id}">
            ${fileObj.name} (업로드 날짜: ${new Date(
      fileObj.date
    ).toLocaleString()})
            <button onclick="downloadFile('${fileObj.id}')">📥 다운로드</button>
            <button onclick="deleteFile('${fileObj.id}')">🗑 삭제</button>
        `;
    fileList.appendChild(listItem);
  });
}

// 파일 삭제
function deleteFile(fileId) {
  folders[currentTab] = folders[currentTab].filter(
    (file) => file.id !== fileId
  );
  saveFolders();
  displayFiles();
}

// 파일 다운로드 (가상의 동작)
function downloadFile(fileId) {
  const file = folders[currentTab].find((file) => file.id === fileId);
  if (file) {
    alert(`${file.name} 다운로드 시작 (서버 구현 필요)`);
  } else {
    alert("파일을 찾을 수 없습니다.");
  }
}

// 전체 파일 선택/해제
function selectAllFiles(selectAll) {
  const checkboxes = document.querySelectorAll(".fileCheckbox");
  checkboxes.forEach((checkbox) => {
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

  selectedFiles.forEach((file) => {
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

  if (confirm("선택한 파일을 삭제하시겠습니까?")) {
    selectedFiles.forEach((file) => {
      folders[currentTab] = folders[currentTab].filter((f) => f.id !== file.id);
    });
    saveFolders();
    displayFiles();
  }
}

// 선택된 파일 가져오기
function getSelectedFiles() {
  const checkboxes = document.querySelectorAll(".fileCheckbox:checked");
  return Array.from(checkboxes)
    .map((checkbox) => {
      return folders[currentTab].find((f) => f.id === checkbox.dataset.id);
    })
    .filter((file) => file);
}

function logout() {
  alert("로그아웃 되었습니다.");
  window.location.href = "../html/index.html";
}

async function sendFileRecords() {
  const userId = "testUser";
  const files = Object.values(folders).flat();
  const foldersList = Object.keys(folders);
  const categories = foldersList;

  console.log("📌 파일 업로드 요청을 백엔드로 보냄!", {
    userId,
    files,
    folders: foldersList,
    categories,
  });

  try {
    const response = await fetch("http://localhost:3000/file-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, files, folders: foldersList, categories }),
    });

    console.log("📌 서버 응답 수신!");
    const result = await response.json();
    console.log("📌 서버 응답 데이터:", result);
  } catch (error) {
    console.error("파일 업로드 요청 실패:", error);
  }
}

// 페이지 로드 시 기존 데이터 불러오기
document.addEventListener("DOMContentLoaded", function () {
  folders = loadFoldersFromStorage();
  loadCategories();
});
