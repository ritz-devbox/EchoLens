const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.ask-clip-block \{[\s\S]*?\}/, `.ask-clip-block {
  margin-top: 24px;
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  padding-top: 24px;
}`);

css = css.replace(/\.storyboard-block \{[\s\S]*?\}/, `.storyboard-block {
  margin-top: 24px;
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  padding-top: 24px;
}`);

css = css.replace(/\.film-block \{[\s\S]*?\}/, `.film-block {
  margin-top: 24px;
  border-top: 1px solid rgba(15, 23, 42, 0.1);
  padding-top: 24px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 10 applied');
