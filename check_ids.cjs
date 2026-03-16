const fs = require('fs');
const shell = fs.readFileSync('backend/web/studio-shell.js', 'utf8');
const html = fs.readFileSync('backend/web/index.html', 'utf8');

const matches = shell.matchAll(/document\.getElementById\(\"([^\"]+)\"\)/g);
const missing = [];
for (const match of matches) {
  const id = match[1];
  if (!html.includes(id)) {
    missing.push(id);
  }
}
console.log('Missing IDs:', missing);
