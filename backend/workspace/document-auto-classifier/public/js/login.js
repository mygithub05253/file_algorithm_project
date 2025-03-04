document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    console.log("📌 로그인 요청을 백엔드로 보냄!", { id: username, password });

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: username, password }),
      });

      const result = await response.json();
      console.log("📌 서버 응답:", result);

      if (response.ok) {
        alert("로그인 성공!");
        window.location.href = "../html/system.html";
      } else {
        alert(result.message);
        errorMessage.classList.remove("hidden");
      }
    } catch (error) {
      console.error("❌ 로그인 요청 실패:", error);
      alert("로그인 중 오류가 발생했습니다.");
    }
  });
});
