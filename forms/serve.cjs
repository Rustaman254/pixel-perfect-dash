const http = require('http');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const port = 8084;

const server = http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }
  
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
  };
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Forms frontend running at http://localhost:${port}`);
});