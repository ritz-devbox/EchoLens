const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');
css = css.replace(/Fraunces/g, 'Outfit');
css = css.replace(/Manrope/g, 'Inter');
fs.writeFileSync('backend/web/app.css', css);
console.log('Fonts updated in app.css');
