const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.graph-filters \{[\s\S]*?\}/, `.graph-filters {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
}`);

css = css.replace(/\.graph-lists \{[\s\S]*?\}/, `.graph-lists {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 14 applied');
