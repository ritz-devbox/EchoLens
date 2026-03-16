const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.demo-head h2 \{[\s\S]*?\}/, `.demo-head h2 {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.75rem;
  letter-spacing: -0.5px;
}`);

css = css.replace(/\.demo-head p \{[\s\S]*?\}/, `.demo-head p {
  margin: 8px 0 0;
  max-width: 760px;
  color: var(--ink-soft);
  line-height: 1.6;
  font-size: 1.05rem;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 16 applied');
