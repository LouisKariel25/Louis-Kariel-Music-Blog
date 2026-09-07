console.log("🎹 루이의 음악실이 시작되었습니다!");

const loginButton = document.getElementById("loginButton");

loginButton.addEventListener("click", function () {
    alert("로그인 기능은 다음 단계에서 만들어집니다! 🔐");
});

const pianoButton = document.getElementById("pianoButton");

pianoButton.addEventListener("click", function () {
    window.location.href = "pages/piano.html";
});

const composerButton = document.getElementById("composerButton");

composerButton.addEventListener("click", function () {
    alert("🎼 작곡실을 준비하고 있습니다!");
});