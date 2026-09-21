// 게시글 상세: URL의 ?id= 값을 읽어 알맞은 글을 표시합니다.
const POSTS = {

    "1": {
        category: "음악 이야기",
        title: "루이의 음악실에 오신 것을 환영합니다.",
        date: "2026-01-01",
        body: [
            "앞으로 만들어갈 음악실의 이야기를 소개합니다.",
            "가상 피아노, 작곡실, 그리고 음악 게시판까지 — 음악을 좋아하는 모든 분들을 위한 공간입니다."
        ]
    },

    "2": {
        category: "피아노",
        title: "피아노와 함께하는 새로운 시작",
        date: "2026-01-05",
        body: [
            "피아노를 좋아하는 사람들을 위한 이야기입니다.",
            "컴퓨터 키보드의 A · W · S · E · D · F · T · G · Y · H · U · J 키로 직접 연주해보세요."
        ]
    },

    "3": {
        category: "작곡",
        title: "나만의 음악을 만들어보자",
        date: "2026-01-10",
        body: [
            "앞으로 구현될 가상 작곡 시스템을 소개합니다.",
            "피아노롤에서 음표를 찍어 나만의 멜로디를 만들고 재생할 수 있습니다."
        ]
    }

};

function renderPost() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id") || "1";

    const post =
        POSTS[id] || POSTS["1"];

    const categoryEl =
        document.getElementById("postCategory");

    const titleEl =
        document.getElementById("postTitle");

    const dateEl =
        document.getElementById("postDate");

    const bodyEl =
        document.getElementById("postBody");

    if (categoryEl) {
        categoryEl.textContent =
            post.category;
    }

    if (titleEl) {
        titleEl.textContent =
            post.title;
    }

    if (dateEl) {
        dateEl.textContent =
            post.date;
    }

    if (bodyEl) {

        bodyEl.innerHTML = "";

        post.body.forEach(function (paragraph) {

            const p =
                document.createElement("p");

            p.textContent =
                paragraph;

            bodyEl.appendChild(p);

        });

    }

}

document.addEventListener(
    "DOMContentLoaded",
    renderPost
);
