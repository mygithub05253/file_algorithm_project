document.addEventListener("DOMContentLoaded", function () {
  const emailInput = document.getElementById("email");
  const emailVerifyBtn = document.getElementById("emailVerify");
  const emailCodeInput = document.getElementById("emailCode");
  const idInput = document.getElementById("ID");
  const passwordInput = document.getElementById("password");
  const passwordConfirmInput = document.getElementById("password correct");
  const phoneInput = document.getElementById("phone");
  const smsVerifyBtn = document.getElementById("smsVerify");
  const smsCodeInput = document.getElementById("smsCode");
  const signupForm = document.getElementById("signupForm");

  function setupPasswordToggle(inputId) {
    const input = document.getElementById(inputId);
    input.type = "password";
    input.style.position = "relative";
    input.style.paddingRight = "30px";

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = "100%";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggleBtn = document.createElement("span");
    toggleBtn.innerHTML = `<svg id="eyeIcon" xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
            <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'></path>
            <circle cx='12' cy='12' r='3'></circle>
        </svg>`;
    toggleBtn.style.position = "absolute";
    toggleBtn.style.right = "10px";
    toggleBtn.style.top = "50%";
    toggleBtn.style.transform = "translateY(-50%)";
    toggleBtn.style.cursor = "pointer";
    toggleBtn.style.color = "gray";

    toggleBtn.addEventListener("click", function () {
      if (input.type === "password") {
        input.type = "text";
        toggleBtn.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                    <path d="M17.94 17.94A10.41 10.41 0 0112 20c-7 0-11-8-11-8a19.12 19.12 0 014.22-5.38m3.32-1.89A10.4 10.4 0 0112 4c7 0 11 8 11 8a18.85 18.85 0 01-3.64 4.87" />
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>`; // 눈 감긴 아이콘
      } else {
        input.type = "password";
        toggleBtn.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
                    <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'></path>
                    <circle cx='12' cy='12' r='3'></circle>
                </svg>`; // 눈 뜬 아이콘
      }
    });

    wrapper.appendChild(toggleBtn);
  }

  setupPasswordToggle("password");
  setupPasswordToggle("password correct");

  // 이메일 인증 요청
  emailVerify.addEventListener("click", function () {
    const email = emailInput.value.trim();
    alert("이메일 인증 코드가 전송되었습니다.");
  });

  // 문자 인증 요청
  smsVerify.addEventListener("click", function () {
    const phone = phoneInput.value.trim();
    if (!phone.match(/^\d{10,11}$/)) {
      alert("올바른 전화번호를 입력하세요.");
      return;
    }
    alert("문자 인증 코드가 전송되었습니다.");
  });

  // 폼 제출 처리
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const id = idInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    const phone = phoneInput.value.trim();

    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password, email, phone }),
      });

      const result = await response.json();
      console.log("📌 서버 응답:", result);

      if (response.ok) {
        alert("회원가입 성공! 로그인 페이지로 이동합니다.");
        window.location.href = "login.html";
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("❌ 회원가입 요청 실패:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    }
  });
});
