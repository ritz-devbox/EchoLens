const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.collaboration-panel h4 \{[\s\S]*?\}/, `.collaboration-panel h4 {
  margin: 0 0 8px 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 30 applied');
