const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.auth-pill-loading \{[\s\S]*?\}/, `.auth-pill-loading {
  border-color: rgba(15, 23, 42, 0.1);
}`);

css = css.replace(/\.auth-pill-ready \{[\s\S]*?\}/, `.auth-pill-ready {
  border-color: rgba(16, 185, 129, 0.3);
  background: #ecfdf5;
}`);

css = css.replace(/\.auth-pill-demo \{[\s\S]*?\}/, `.auth-pill-demo {
  border-color: rgba(245, 158, 11, 0.3);
  background: #fffbeb;
}`);

css = css.replace(/\.auth-pill-error \{[\s\S]*?\}/, `.auth-pill-error {
  border-color: rgba(239, 68, 68, 0.3);
  background: #fef2f2;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 21 applied');
