const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.story-body \{[\s\S]*?\}/, `.story-body {
  margin: 16px 0 20px;
  line-height: 1.7;
  color: var(--ink);
  white-space: pre-wrap;
  font-size: 1.05rem;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 18 applied');
