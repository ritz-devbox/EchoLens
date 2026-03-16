const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.demo-label \{[\s\S]*?\}/, `.demo-label {
  margin: 0 0 12px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}`);

css = css.replace(/\.demo-card h3 \{[\s\S]*?\}/, `.demo-card h3 {
  margin: 0 0 12px;
  font-family: "Outfit", sans-serif;
  font-size: 1.2rem;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 22 applied');
