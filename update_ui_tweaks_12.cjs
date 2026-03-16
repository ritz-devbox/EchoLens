const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.storyboard-controls \{[\s\S]*?\}/, `.storyboard-controls {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
}`);

css = css.replace(/\.film-controls \{[\s\S]*?\}/, `.film-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 20px;
}`);

css = css.replace(/\.film-actions \{[\s\S]*?\}/, `.film-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  grid-column: 1 / -1;
  margin-top: 8px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 12 applied');
