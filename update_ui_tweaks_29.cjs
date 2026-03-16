const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.share-panel h4 \{[\s\S]*?\}/, `.share-panel h4 {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}`);

css = css.replace(/\.archive-answer-card h4 \{[\s\S]*?\}/, `.archive-answer-card h4 {
  margin: 16px 0 8px;
  font-family: "Outfit", sans-serif;
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}`);

css = css.replace(/\.conversation-log h4 \{[\s\S]*?\}/, `.conversation-log h4 {
  margin: 0 0 12px;
  font-family: "Outfit", sans-serif;
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 29 applied');
