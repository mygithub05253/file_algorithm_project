document.addEventListener("DOMContentLoaded", function() {
    // 회원가입 버튼 클릭 시 회원가입 페이지로 이동
    document.getElementById("signupBtn").addEventListener("click", function() {
        window.location.href = "../html/signup.html"; 
    });
    // 로그인 버튼 클릭 시 로그인 페이지로 이동
    document.getElementById("loginBtn").addEventListener("click", function() {
        window.location.href = "../html/login.html"; 
    });
});
