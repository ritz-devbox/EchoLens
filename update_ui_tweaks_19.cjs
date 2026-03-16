const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.demo-eyebrow \{[\s\S]*?\}/, `.demo-eyebrow {
  margin: 0 0 8px;
  color: var(--ink-soft);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 19 applied');
