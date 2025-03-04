document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        // ⚠️ 여기에 실제 회원정보 검증 로직이 필요 (예: 서버와 연동)
        const dummyUser = { id: "testUser", password: "1234" }; // 예제 계정

        if (username === dummyUser.id && password === dummyUser.password) {
            alert("로그인 성공!");
            window.location.href = "../html/system.html";
            errorMessage.classList.remove("hidden");
        }
    });
});
