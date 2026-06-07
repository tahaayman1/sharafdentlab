const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".stl": "application/octet-stream",
  ".zip": "application/zip",
  ".pdf": "application/pdf"
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split("?")[0];
  
  // Block access to pricelist and return 404
  if (urlPath.toLowerCase() === "/pricelist" || urlPath.toLowerCase() === "/pricelist.html") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
    return;
  }
  
  // Normalize clean URLs (e.g. /services -> /services.html)
  if (urlPath === "/") {
    urlPath = "/index.html";
  }
  
  let filePath = path.join(__dirname, urlPath);
  let ext = path.extname(filePath);
  
  // If no extension, check if an HTML file exists
  if (!ext) {
    if (fs.existsSync(filePath + ".html")) {
      filePath += ".html";
      ext = ".html";
    } else if (fs.existsSync(path.join(filePath, "index.html"))) {
      filePath = path.join(filePath, "index.html");
      ext = ".html";
    }
  }

  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // Serve 404 page if exists, otherwise fallback to basic response
        const errorPage = path.join(__dirname, "404.html");
        if (fs.existsSync(errorPage)) {
          fs.readFile(errorPage, (err404, content404) => {
            res.writeHead(404, { "Content-Type": "text/html" });
            res.end(content404, "utf-8");
          });
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        }
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Sharaf Dent Lab Server running locally at:`);
  console.log(`   👉 http://localhost:${PORT}\n`);
  
  // Open the page in browser automatically
  try {
    const open = require("open");
    open(`http://localhost:${PORT}`);
  } catch (e) {
    // Ignore if "open" isn't fully installed yet
  }
});
