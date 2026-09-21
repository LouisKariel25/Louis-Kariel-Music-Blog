// 게시판: 목록의 각 글을 클릭하면 해당 게시글 상세로 이동합니다.
const boardItems =
    document.querySelectorAll(".board-item[data-target]");

boardItems.forEach(function (item) {
    item.addEventListener("click", function () {
        window.location.href = item.dataset.target;
    });
});
