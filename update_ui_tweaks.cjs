const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

// Increase grid gap
css = css.replace(/grid-template-columns: 1\.2fr 1fr;\n  gap: 18px;/, `grid-template-columns: 1.2fr 1fr;\n  gap: 24px;`);

// Make demo director sleeker
css = css.replace(/\.demo-director \{[\s\S]*?\}/, `.demo-director {
  margin-bottom: 24px;
  background: #ffffff;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  border-radius: 16px;
  padding: 24px;
}`);

// Make demo card sleeker
css = css.replace(/\.demo-card \{[\s\S]*?\}/, `.demo-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
}`);

// Make auth pill sleeker
css = css.replace(/\.auth-pill \{[\s\S]*?\}/, `.auth-pill {
  display: grid;
  gap: 2px;
  min-width: 220px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

// Make demo chip sleeker
css = css.replace(/\.demo-chip \{[\s\S]*?\}/, `.demo-chip {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  padding: 8px 16px;
  background: #ffffff;
  color: var(--ink);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}`);

// Make demo chip active sleeker
css = css.replace(/\.demo-chip-active \{[\s\S]*?\}/, `.demo-chip-active {
  border-color: var(--ink);
  background: var(--ink);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks applied');
