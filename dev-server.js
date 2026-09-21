const http = require("http");
const fs = require("fs");
const path = require("path");

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml"
};

const PORT = 4173;

http.createServer((req, res) => {

    let urlPath = decodeURIComponent(req.url.split("?")[0]);

    if (urlPath === "/") {
        urlPath = "/index.html";
    }

    const filePath = path.join(process.cwd(), urlPath);

    fs.readFile(filePath, (error, data) => {

        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
            return;
        }

        res.writeHead(200, {
            "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream"
        });

        res.end(data);

    });

}).listen(PORT, () => {
    console.log(`serving on http://localhost:${PORT}`);
});
