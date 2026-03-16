const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.job-card \{[\s\S]*?\}/, `.job-card {
  margin-top: 24px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

css = css.replace(/\.job-badge \{[\s\S]*?\}/, `.job-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`);

css = css.replace(/\.job-badge-idle \{[\s\S]*?\}/, `.job-badge-idle {
  background: #f1f5f9;
  color: #64748b;
}`);

css = css.replace(/\.job-badge-running \{[\s\S]*?\}/, `.job-badge-running {
  background: #dbeafe;
  color: #2563eb;
}`);

css = css.replace(/\.job-badge-done \{[\s\S]*?\}/, `.job-badge-done {
  background: #dcfce7;
  color: #16a34a;
}`);

css = css.replace(/\.job-badge-error \{[\s\S]*?\}/, `.job-badge-error {
  background: #fee2e2;
  color: #dc2626;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 3 applied');
