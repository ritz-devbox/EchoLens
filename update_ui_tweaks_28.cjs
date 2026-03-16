const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css = css.replace(/\.archive-qa h3 \{[\s\S]*?\}/, `.archive-qa h3 {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.25rem;
  letter-spacing: -0.2px;
}`);

css = css.replace(/\.interview-block h3 \{[\s\S]*?\}/, `.interview-block h3 {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.25rem;
  letter-spacing: -0.2px;
}`);

css = css.replace(/\.voice-block h3 \{[\s\S]*?\}/, `.voice-block h3 {
  margin: 0;
  font-family: "Outfit", sans-serif;
  font-size: 1.25rem;
  letter-spacing: -0.2px;
}`);

css = css.replace(/\.ingest-results h3,\n\.followups h3 \{[\s\S]*?\}/, `.ingest-results h3,
.followups h3 {
  margin: 0 0 12px;
  font-family: "Outfit", sans-serif;
  font-size: 1.25rem;
  letter-spacing: -0.2px;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 28 applied');
