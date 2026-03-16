const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

// story-card
css = css.replace(/\.story-card \{[\s\S]*?\}/, `.story-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  background: #ffffff;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}`);

// share-panel
css = css.replace(/\.share-panel \{[\s\S]*?\}/, `.share-panel {
  margin: 0 0 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
}`);

// archive-qa
css = css.replace(/\.archive-qa \{[\s\S]*?\}/, `.archive-qa {
  margin-top: 24px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 20px;
  background: #f8fafc;
}`);

// interview-block
css = css.replace(/\.interview-block \{[\s\S]*?\}/, `.interview-block {
  margin-top: 24px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 16px;
  padding: 20px;
  background: #f8fafc;
}`);

// voice-block
css = css.replace(/\.voice-block \{[\s\S]*?\}/, `.voice-block {
  margin-top: 24px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
}`);

// state-line
css = css.replace(/\.state-line \{[\s\S]*?\}/, `.state-line {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
  color: var(--ink-soft);
  font-size: 0.9rem;
}`);

// panel-state
css = css.replace(/\.panel-state \{[\s\S]*?\}/, `.panel-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #ffffff;
  color: var(--ink-soft);
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.5;
}`);

fs.writeFileSync('backend/web/app.css', css);
console.log('UI tweaks 2 applied');
