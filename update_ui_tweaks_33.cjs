const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css += `
.ask-clip-block p,
.storyboard-block p,
.film-block p {
  margin: 0 0 16px;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
`;

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 33 applied');
