const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css += `
.insights-grid h3 {
  margin: 0 0 12px;
  font-family: "Outfit", sans-serif;
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}
`;

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 36 applied');
