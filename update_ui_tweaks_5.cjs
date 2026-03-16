const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.scene-card \{[\s\S]*?\}/, `.scene-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

css = css.replace(/\.scene-card h4 \{[\s\S]*?\}/, `.scene-card h4 {
  margin: 0 0 12px;
  font-family: "Outfit", sans-serif;
  font-size: 1.1rem;
  color: var(--ink);
}`);

css = css.replace(/\.scene-card p \{[\s\S]*?\}/, `.scene-card p {
  margin: 0 0 8px;
  font-size: 0.9rem;
  color: var(--ink-soft);
  line-height: 1.5;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 5 applied');
