const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.collection-form \{[\s\S]*?\}/, `.collection-form {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 20px;
  background: #f8fafc;
  margin-bottom: 24px;
}`);

css = css.replace(/\.collection-actions \{[\s\S]*?\}/, `.collection-actions {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
  flex-wrap: wrap;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 13 applied');
