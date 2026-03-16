const fs = require('fs');
const shell = fs.readFileSync('backend/web/studio-shell.js', 'utf8');
const html = fs.readFileSync('backend/web/index.html', 'utf8');

const matches = shell.matchAll(/([a-zA-Z0-9_]+):\s*document\.getElementById\(\"([^\"]+)\"\)/g);
const missing = [];
for (const match of matches) {
  const prop = match[1];
  const id = match[2];
  if (!html.includes('id=\"' + id + '\"')) {
    missing.push({prop, id});
  }
}
console.log('Missing IDs:', missing);
