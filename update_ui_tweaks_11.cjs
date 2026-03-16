const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.insights-grid article \{[\s\S]*?\}/, `.insights-grid article {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 20px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

css = css.replace(/\.big-number \{[\s\S]*?\}/, `.big-number {
  margin: 10px 0 0;
  font-family: "Outfit", sans-serif;
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 11 applied');
