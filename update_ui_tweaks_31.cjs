const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css += `
.prompt-box {
  margin-top: 24px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
}

.prompt-box h4 {
  margin: 0 0 8px;
  font-family: "Outfit", sans-serif;
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}

.prompt-box p {
  margin: 0 0 12px;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
`;

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 31 applied');
