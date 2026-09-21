// 로그인 페이지: 아직 실제 인증은 없고, 제출 시 안내 메시지만 보여줍니다.
const loginForm =
    document.getElementById("loginForm");

const loginNote =
    document.getElementById("loginNote");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            if (loginNote) {
                loginNote.textContent =
                    "로그인 기능은 다음 단계에서 만들어집니다. 🔐";
            }

        }
    );

}
