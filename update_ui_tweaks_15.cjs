const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.topbar \{[\s\S]*?\}/, `.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 24px;
}`);

css = css.replace(/\.brand p \{[\s\S]*?\}/, `.brand p {
  margin: 2px 0 0;
  color: var(--ink-soft);
  font-size: 0.92rem;
  font-weight: 500;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 15 applied');
