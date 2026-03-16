const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.state-line-loading \{[\s\S]*?\}/, `.state-line-loading {
  color: #64748b;
}`);

css = css.replace(/\.state-line-error \{[\s\S]*?\}/, `.state-line-error {
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
  background: #fef2f2;
}`);

css = css.replace(/\.state-line-auth \{[\s\S]*?\}/, `.state-line-auth {
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.2);
  background: #fffbeb;
}`);

css = css.replace(/\.panel-state-loading \{[\s\S]*?\}/, `.panel-state-loading {
  color: #64748b;
}`);

css = css.replace(/\.panel-state-error \{[\s\S]*?\}/, `.panel-state-error {
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.2);
  background: #fef2f2;
}`);

css = css.replace(/\.panel-state-auth \{[\s\S]*?\}/, `.panel-state-auth {
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.2);
  background: #fffbeb;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 24 applied');
