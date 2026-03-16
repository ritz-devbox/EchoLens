const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.ask-clip-block h4 \{[\s\S]*?\}/, `.ask-clip-block h4 {
  margin: 0 0 8px;
  font-family: "Outfit", sans-serif;
  font-size: 1.15rem;
  letter-spacing: -0.2px;
}`);

css = css.replace(/\.storyboard-block h3 \{[\s\S]*?\}/, `.storyboard-block h3 {
  margin: 0 0 8px;
  font-family: "Outfit", sans-serif;
  font-size: 1.25rem;
  letter-spacing: -0.2px;
}`);

css = css.replace(/\.film-block h3 \{[\s\S]*?\}/, `.film-block h3 {
  margin: 0 0 8px;
  font-family: "Outfit", sans-serif;
  font-size: 1.25rem;
  letter-spacing: -0.2px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 32 applied');
