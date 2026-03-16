const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.demo-checklist li\.demo-step-complete::marker \{[\s\S]*?\}/, `.demo-checklist li.demo-step-complete::marker {
  color: var(--ink);
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 23 applied');
