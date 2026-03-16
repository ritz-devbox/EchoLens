const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');
css += `
/* Podcast Studio */
.podcast-studio-block {
  background: var(--surface);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
}
.podcast-studio-block h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-family: var(--font-serif);
  color: var(--accent);
}
.podcast-studio-block p {
  margin-bottom: 16px;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.podcast-studio-block .audio-preview {
  margin-top: 16px;
  width: 100%;
}
`;
fs.writeFileSync('backend/web/app.css', css);
