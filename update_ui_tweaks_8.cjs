const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.followup-item \{[\s\S]*?\}/, `.followup-item {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

css = css.replace(/\.question-card \{[\s\S]*?\}/, `.question-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

css = css.replace(/\.conversation-log li \{[\s\S]*?\}/, `.conversation-log li {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  background: #ffffff;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 8 applied');
