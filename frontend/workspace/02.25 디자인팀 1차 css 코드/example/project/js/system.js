const folders = {
    "교내": [],
    "업무": [],
    "개인": []
  };
  
  let currentTab = "전체 파일";
  
  // 폴더 선택 UI 업데이트
  function changeTab(folderName) {
    currentTab = folderName;
    document.getElementById("folderTitle").innerText = `📁 ${folderName}`;
  
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
        if (tab.textContent.includes(folderName)) {
            tab.classList.add("active");
        }
    });
  
    // 전체 파일에서는 삭제 버튼 비활성화
    document.getElementById("deleteSelectedBtn").disabled = (folderName === "전체 파일");
    displayFiles();
  }
  
  // 새 폴더 선택 시 입력창 표시
  function toggleNewFolderInput() {
    const folderSelect = document.getElementById("folderSelect");
    const newFolderSection = document.getElementById("newFolderSection");
  
    newFolderSection.style.display = folderSelect.value === "new" ? "block" : "none";
  }
  
  // 새 폴더 생성 기능
  function createNewFolder() {
    const newFolderName = document.getElementById("newFolderName").value.trim();
  
    if (newFolderName === "" || folders[newFolderName]) {
        alert("올바른 폴더명을 입력하세요.");
        return;
    }
  
    folders[newFolderName] = [];
  
    const folderTabs = document.getElementById("folderTabs");
    const newTab = document.createElement("button");
    newTab.classList.add("tab");
    newTab.textContent = `📁 ${newFolderName}`;
    newTab.onclick = () => changeTab(newFolderName);
    folderTabs.appendChild(newTab);
  
    const folderSelect = document.getElementById("folderSelect");
    const newOption = document.createElement("option");
    newOption.value = newFolderName;
    newOption.textContent = newFolderName;
    folderSelect.appendChild(newOption);
  
    folderSelect.value = newFolderName;
    toggleNewFolderInput();
    document.getElementById("newFolderName").value = "";
    alert(`"${newFolderName}" 폴더가 추가되었습니다.`);
  }
  
  function uploadFiles() {
    const input = document.getElementById('fileInput');
    const files = input.files;
    const selectedFolder = document.getElementById("folderSelect").value;
  
    if (files.length === 0) {
        alert("파일을 선택하세요.");
        return;
    }
  
    if (selectedFolder === "new") {
        alert("새 폴더를 생성한 후 업로드하세요.");
        return;
    }
  
    if (!folders[selectedFolder]) {
        alert("폴더를 선택하세요.");
        return;
    }
  
    for (let file of files) {
        folders[selectedFolder].push({ name: file.name, file, date: new Date() });
    }
  
    displayFiles();
  }
  
  // 파일 삭제 기능 추가 (전체 파일에서는 삭제 X)
  function deleteFile(folder, fileName) {
    if (folder === "전체 파일") return;
  
    folders[folder] = folders[folder].filter(file => file.name !== fileName);
    displayFiles();
  }
  
  // 선택한 파일 삭제 (전체 파일에서는 실행 안 됨)
  function deleteSelected() {
    if (currentTab === "전체 파일") return;
  
    const selectedFiles = document.querySelectorAll(".fileCheckbox:checked");
    selectedFiles.forEach(fileCheckbox => {
        const fileName = fileCheckbox.dataset.name;
        deleteFile(currentTab, fileName);
    });
  
    displayFiles();
  }
  
  function categorizeFile(file) {
    if (file.name.includes("학교") || file.name.includes("수업")) {
        folders["교내"].push({ name: file.name, file, date: new Date() });
    } else if (file.name.includes("업무") || file.name.includes("프로젝트")) {
        folders["업무"].push({ name: file.name, file, date: new Date() });
    } else {
        folders["개인"].push({ name: file.name, file, date: new Date() });
    }
  }
  
  // 파일 목록 표시
  function displayFiles() {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";
  
    let allFiles = currentTab === "전체 파일" 
        ? Object.values(folders).flat() 
        : folders[currentTab] || [];
  
    if (allFiles.length === 0) {
        fileList.innerHTML = "<p>파일이 없습니다.</p>";
        return;
    }
  
    allFiles.forEach(fileObj => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
            <input type="checkbox" class="fileCheckbox" data-name="${fileObj.name}">
            ${fileObj.name} 
            <button onclick="downloadFile('${fileObj.name}')">📥 다운로드</button>
            <button class="delete-btn ${currentTab === "전체 파일" ? "disabled" : ""}" 
                onclick="deleteFile('${currentTab}', '${fileObj.name}')" ${currentTab === "전체 파일" ? "disabled" : ""}>🗑 삭제</button>
        `;
        fileList.appendChild(listItem);
    });
  }
  
  function selectAllFiles(selectAll) {
    document.querySelectorAll(".fileCheckbox").forEach(checkbox => {
        checkbox.checked = selectAll;
    });
  }
  
  function downloadSelected() {
    document.querySelectorAll(".fileCheckbox:checked").forEach(fileCheckbox => {
        downloadFile(fileCheckbox.dataset.name);
    });
  }
  
  function downloadFile(fileName) {
    alert(`${fileName} 다운로드 시작 (서버 구현 필요)`);
  }
  
  function downloadAll() {
    let allFiles = currentTab === "전체 파일" 
        ? Object.values(folders).flat() 
        : folders[currentTab];
  
    if (!allFiles || allFiles.length === 0) {
        alert("다운로드할 파일이 없습니다.");
        return;
    }
  
    allFiles.forEach(fileObj => {
        downloadFile(fileObj.name);
    });
  }
  
  function searchFiles() {
    const query = document.getElementById("searchBox").value.toLowerCase();
    const fileList = document.getElementById("fileList").children;
  
    Array.from(fileList).forEach(item => {
        const fileName = item.textContent.toLowerCase();
        item.style.display = fileName.includes(query) ? "flex" : "none";
    });
  }
  