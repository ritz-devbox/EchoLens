const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.demo-badge \{[\s\S]*?\}/, `.demo-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #ffffff;
  color: var(--ink);
  font-size: 0.85rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

css = css.replace(/\.demo-badge\.demo-badge-judge \{[\s\S]*?\}/, `.demo-badge.demo-badge-judge {
  border-color: var(--ink);
  background: var(--ink);
  color: #ffffff;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 20 applied');
