const fs = require('fs');
let html = fs.readFileSync('backend/web/index.html', 'utf8');

// 1. Add sidebar script
html = html.replace(
  '<script type="module" src="/studio/assets/app.js"></script>',
  '<script type="module" src="/studio/assets/app.js"></script>\n    <script src="/studio/assets/sidebar.js"></script>'
);

// 2. Wrap layout
const headerEndIndex = html.indexOf('</header>') + '</header>'.length;
const beforeHeader = html.substring(0, headerEndIndex);
const afterHeader = html.substring(headerEndIndex);

const sidebarHtml = `
      <div class="app-layout">
        <aside class="sidebar">
          <nav class="sidebar-nav">
            <button class="nav-item active" data-target="demo-director">Demo Director</button>
            <button class="nav-item" data-target="input-panel">Memory Intake</button>
            <button class="nav-item" data-target="story-panel">Story Studio</button>
            <button class="nav-item" data-target="insights-panel">Insights</button>
            <button class="nav-item" data-target="book-panel">Memory Book</button>
            <button class="nav-item" data-target="timeline-panel">Timeline</button>
            <button class="nav-item" data-target="replay-panel">Replay Map</button>
            <button class="nav-item" data-target="graph-panel">Family Graph</button>
            <button class="nav-item" data-target="collections-panel">Collections</button>
          </nav>
        </aside>
        <main class="main-content">`;

// Replace `<main class="grid">` with nothing (since we are wrapping everything in main-content)
let newAfterHeader = afterHeader.replace('<main class="grid">', '');
// Replace `</main>` with nothing
newAfterHeader = newAfterHeader.replace('</main>', '');

// Add `active-panel` to demo-director
newAfterHeader = newAfterHeader.replace('<section class="panel demo-director">', '<section class="panel demo-director active-panel">');

// Close the app-layout and main-content before the closing script tags
const scriptIndex = newAfterHeader.indexOf('    </div>\n    <script type="module"');
newAfterHeader = newAfterHeader.substring(0, scriptIndex) + '        </main>\n      </div>\n' + newAfterHeader.substring(scriptIndex);

fs.writeFileSync('backend/web/index.html', beforeHeader + sidebarHtml + newAfterHeader);
console.log('index.html updated');
