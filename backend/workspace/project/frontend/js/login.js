document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    // ✅ 입력값 검증 추가 (아이디 또는 비밀번호가 비어 있을 경우 요청 보내지 않음)
    if (!username || !password) {
      alert("아이디와 비밀번호를 입력하세요.");
      return;
    }

    console.log("📌 로그인 요청을 백엔드로 보냄!", { id: username, password });

    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: username, password }),
      });

      const result = await response.json();
      console.log("📌 서버 응답:", result);

      if (response.ok) {
        alert("로그인 성공!");

        // ✅ 로그인 성공 시 JWT 토큰 & 사용자 정보 저장
        localStorage.setItem("token", result.token);
        localStorage.setItem("userId", username);

        // ✅ 에러 메시지 숨기기
        errorMessage.classList.add("hidden");

        // ✅ 시스템 페이지로 이동
        window.location.href = "../html/system.html";
      } else {
        console.error(`❌ 로그인 실패 (Status: ${response.status})`);
        alert(result.message);
        errorMessage.classList.remove("hidden");
      }
    } catch (error) {
      console.error("❌ 로그인 요청 실패:", error);
      alert("로그인 중 오류가 발생했습니다.");
    }
  });
});
