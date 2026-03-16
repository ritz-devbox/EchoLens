const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.archive-list li \{[\s\S]*?\}/, `.archive-list li {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  background: #ffffff;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}`);

css = css.replace(/\.archive-answer-card \{[\s\S]*?\}/, `.archive-answer-card {
  margin-top: 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 20px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 9 applied');
