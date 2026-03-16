const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.comments-list li \{[\s\S]*?\}/, `.comments-list li {
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}`);

css = css.replace(/\.comments-list li\.empty-state \{[\s\S]*?\}/, `.comments-list li.empty-state {
  background: transparent;
  border: 1px dashed rgba(15, 23, 42, 0.2);
  color: var(--ink-soft);
  text-align: center;
  padding: 24px;
  box-shadow: none;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 7 applied');
