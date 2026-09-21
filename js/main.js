console.log("🎹 루이의 음악실이 시작되었습니다!");

const loginButton = document.getElementById("loginButton");

if (loginButton) {
    loginButton.addEventListener("click", function () {

        // index.html은 루트에, 나머지 페이지는 pages/ 아래에 있으므로
        // 현재 위치에 따라 올바른 상대 경로를 선택한다.
        const inPagesFolder =
            window.location.pathname.includes("/pages/");

        window.location.href =
            inPagesFolder
                ? "login.html"
                : "pages/login.html";

    });
}

const pianoButton = document.getElementById("pianoButton");

if (pianoButton) {
    pianoButton.addEventListener("click", function () {
        window.location.href = "pages/piano.html";
    });
}

const composerButton = document.getElementById("composerButton");

if (composerButton) {
    composerButton.addEventListener("click", function () {
        window.location.href = "pages/composer.html";
    });
}

// 피처 카드 안의 "연주하기 / 작곡하기 / 둘러보기" 버튼을
// data-target 속성에 적힌 페이지로 연결합니다.
const cardButtons =
    document.querySelectorAll(".card-button[data-target]");

cardButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        window.location.href = button.dataset.target;
    });
});

// 최근 게시글 카드를 클릭하면 해당 글로 이동합니다.
const postItems =
    document.querySelectorAll(".post-item[data-target]");

postItems.forEach(function (item) {
    item.addEventListener("click", function () {
        window.location.href = item.dataset.target;
    });
});

// 현재 페이지에 맞춰 내비게이션의 활성 링크를 자동으로 표시합니다.
// 각 HTML에 active 클래스를 하드코딩하지 않아도 됩니다.
(function highlightActiveNav() {

    const currentFile =
        window.location.pathname.split("/").pop() || "index.html";

    const navLinks =
        document.querySelectorAll(".main-nav a");

    navLinks.forEach(function (link) {

        link.classList.remove("active");

        const linkFile =
            link.getAttribute("href").split("/").pop().split("?")[0];

        if (linkFile === currentFile) {
            link.classList.add("active");
        }

    });

})();