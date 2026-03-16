const fs = require('fs');
const { execSync } = require('child_process');

for (let i = 1; i <= 38; i++) {
  const file = i === 1 ? 'update_ui_tweaks.cjs' : `update_ui_tweaks_${i}.cjs`;
  if (fs.existsSync(file)) {
    console.log(`Running ${file}...`);
    try {
      execSync(`node ${file}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed to run ${file}`);
    }
  }
}
