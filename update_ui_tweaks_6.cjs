const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.collections-list li \{[\s\S]*?\}/, `.collections-list li {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}
.collections-list li:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
  border-color: rgba(15, 23, 42, 0.2);
}`);

css = css.replace(/\.collection-detail-list li \{[\s\S]*?\}/, `.collection-detail-list li {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
}
.collection-detail-list li:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
  border-color: rgba(15, 23, 42, 0.2);
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 6 applied');
