const fs = require('fs');
const app = fs.readFileSync('backend/web/app.js', 'utf8');
const html = fs.readFileSync('backend/web/index.html', 'utf8');

const matches = app.matchAll(/document\.getElementById\(\"([^\"]+)\"\)/g);
const missing = [];
for (const match of matches) {
  const id = match[1];
  if (!html.includes(id)) {
    missing.push(id);
  }
}
console.log('Missing IDs in app.js:', missing);
