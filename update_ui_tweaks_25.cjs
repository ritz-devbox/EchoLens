const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.demo-grid \{[\s\S]*?\}/, `.demo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 24px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 25 applied');
