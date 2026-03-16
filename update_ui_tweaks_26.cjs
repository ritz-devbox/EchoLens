const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.demo-scenarios \{[\s\S]*?\}/, `.demo-scenarios {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 26 applied');
