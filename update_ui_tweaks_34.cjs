const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css += `
.book-panel h2,
.timeline-panel h2,
.replay-panel h2,
.graph-panel h2,
.collections-panel h2 {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.45rem;
  letter-spacing: -0.3px;
}
`;

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 34 applied');
