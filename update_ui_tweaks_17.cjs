const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.panel-head p \{[\s\S]*?\}/, `.panel-head p {
  margin: 8px 0 16px;
  color: var(--ink-soft);
  line-height: 1.6;
  font-size: 1.05rem;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 17 applied');
