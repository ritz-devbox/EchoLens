const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.story-card h3 \{[\s\S]*?\}/, `.story-card h3 {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.5rem;
  letter-spacing: -0.3px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 27 applied');
