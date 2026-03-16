const fs = require('fs');

// 1. UPDATE CSS
let css = fs.readFileSync('backend/web/app.css', 'utf8');

// Add CSS variables for surfaces and dark mode
css = css.replace(':root {', `:root {
  --surface: rgba(255, 255, 255, 0.62);
  --surface-hover: rgba(255, 255, 255, 0.8);
  --surface-border: rgba(31, 31, 27, 0.12);
  --input-bg: rgba(255, 255, 255, 0.75);
`);

const darkModeCss = `
[data-theme="dark"] {
  --bg: #1a1814;
  --bg-deep: #12100d;
  --ink: #f4ede2;
  --ink-soft: #c2b8a3;
  --accent: #d9734d;
  --accent-dark: #ff9e7d;
  --olive: #8a9c75;
  --line: rgba(244, 237, 226, 0.16);
  --panel: rgba(30, 28, 24, 0.6);
  --shadow: 0 18px 55px rgba(0, 0, 0, 0.4);
  --surface: rgba(40, 38, 33, 0.62);
  --surface-hover: rgba(50, 48, 43, 0.8);
  --surface-border: rgba(244, 237, 226, 0.12);
  --input-bg: rgba(20, 18, 15, 0.75);
}

/* Update hardcoded backgrounds to use variables */
.demo-card, .auth-pill, .question-card, .story-card, .archive-answer-card, .state-line, .panel-state, .archive-list li, .comments-list li {
  background: var(--surface);
  border-color: var(--surface-border);
}

textarea, input[type="text"], input[type="file"], input[type="number"], input[type="email"], select {
  background: var(--input-bg);
  border-color: var(--surface-border);
  color: var(--ink);
}

/* Search Bar */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}
.search-bar input {
  border-radius: 999px;
  padding: 8px 16px;
  width: 260px;
  font-size: 0.85rem;
  border: 1px solid var(--surface-border);
  background: var(--input-bg);
  transition: all 0.2s ease;
}
.search-bar input:focus {
  width: 320px;
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(166, 75, 42, 0.2);
}

/* Dropzone */
.dropzone {
  border: 2px dashed var(--olive);
  border-radius: 14px;
  padding: 32px 20px;
  text-align: center;
  background: var(--surface);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;
  position: relative;
}
.dropzone:hover, .dropzone.dragover {
  background: var(--surface-hover);
  border-color: var(--accent);
}
.dropzone p {
  margin: 0;
  color: var(--ink-soft);
  font-weight: 600;
  pointer-events: none;
}
.file-input-hidden {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  opacity: 0;
  cursor: pointer;
}

/* Skeleton Loader */
.skeleton {
  background: linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 8px;
  color: transparent !important;
}
.skeleton * {
  visibility: hidden;
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Theme Toggle */
#themeToggle {
  font-size: 1.2rem;
  padding: 6px 10px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

fs.writeFileSync('backend/web/app.css', css + '\n' + darkModeCss);

// 2. UPDATE HTML
let html = fs.readFileSync('backend/web/index.html', 'utf8');

// Add Search and Theme Toggle to Topbar
html = html.replace(
  '<div class="topbar-actions">',
  `<div class="topbar-actions">
          <div class="search-bar">
            <input type="text" placeholder="Search memories, people, places..." id="globalSearch" />
          </div>
          <button id="themeToggle" class="btn btn-outline" title="Toggle Dark Mode">🌙</button>`
);

// Add Dashboard Panel and Nav Item
html = html.replace(
  '<button class="nav-item active" data-target="demo-director">Demo Director</button>',
  `<button class="nav-item active" data-target="dashboard-panel">Dashboard</button>
            <button class="nav-item" data-target="demo-director">Demo Director</button>`
);

const dashboardHtml = `
      <section class="panel dashboard-panel active-panel">
        <div class="panel-head">
          <h2>Welcome Home</h2>
          <p>Your family's living documentary. Here is a quick overview of your archive.</p>
        </div>
        <div class="demo-grid">
          <article class="demo-card">
            <p class="demo-label">On This Day</p>
            <h3>1952 Naples Dance</h3>
            <p>Your grandparents met 74 years ago today. Relive the moment they first danced.</p>
            <button class="btn btn-soft" style="margin-top: 12px; width: 100%;">View Memory</button>
          </article>
          <article class="demo-card">
            <p class="demo-label">Suggested Interview</p>
            <h3>Childhood Homes</h3>
            <p>Ask your dad about the house he grew up in. We have 0 memories about this.</p>
            <button class="btn btn-outline" style="margin-top: 12px; width: 100%;">Start Interview</button>
          </article>
          <article class="demo-card">
            <p class="demo-label">Recent Activity</p>
            <ul class="demo-bullets">
              <li><strong>Aunt Sarah</strong> commented on "Rome Wedding"</li>
              <li>New film rendered for "Chicago Migration"</li>
              <li><strong>You</strong> added 3 new photos</li>
            </ul>
          </article>
        </div>
      </section>
`;

// Insert Dashboard Panel right after <main class="main-content">
html = html.replace('<main class="main-content">', '<main class="main-content">\n' + dashboardHtml);

// Remove active-panel from demo-director
html = html.replace('<section class="panel demo-director active-panel">', '<section class="panel demo-director">');

// Update Voice Intake to use Dropzone
html = html.replace(
  '<input id="voiceFileInput" type="file" accept="audio/*" />',
  `<div class="dropzone" id="voiceDropzone">
                <p>Drag & drop audio file here, or click to select</p>
                <input id="voiceFileInput" type="file" accept="audio/*" class="file-input-hidden" />
              </div>`
);

// Update Photo Restore to use Dropzone
html = html.replace(
  '<input type="file" id="photoRestoreInput" accept="image/*" class="hidden" />\n              <div class="actions">\n                <button id="uploadPhotoRestoreBtn" class="btn btn-primary">Select Photo to Restore</button>',
  `<div class="dropzone" id="photoDropzone">
                <p>Drag & drop photo here, or click to select</p>
                <input type="file" id="photoRestoreInput" accept="image/*" class="file-input-hidden" />
              </div>
              <div class="actions">`
);

fs.writeFileSync('backend/web/index.html', html);

// 3. UPDATE SIDEBAR.JS to handle theme and dropzones
let sidebarJs = fs.readFileSync('backend/web/sidebar.js', 'utf8');

const extraJs = `
  // Theme Toggle Logic
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = localStorage.getItem('theme') || 'light';
  
  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
  }

  themeToggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = '☀️';
    }
  });

  // Dropzone Logic
  const setupDropzone = (dropzoneId) => {
    const dropzone = document.getElementById(dropzoneId);
    if (!dropzone) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
      let dt = e.dataTransfer;
      let files = dt.files;
      const input = dropzone.querySelector('input[type="file"]');
      if (input && files.length > 0) {
        input.files = files;
        // Trigger change event manually
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
        dropzone.querySelector('p').textContent = files[0].name;
      }
    });
    
    const input = dropzone.querySelector('input[type="file"]');
    if(input) {
      input.addEventListener('change', (e) => {
        if(e.target.files.length > 0) {
          dropzone.querySelector('p').textContent = e.target.files[0].name;
        }
      });
    }
  };

  setupDropzone('voiceDropzone');
  setupDropzone('photoDropzone');
`;

sidebarJs = sidebarJs.replace('});', extraJs + '\n});');
fs.writeFileSync('backend/web/sidebar.js', sidebarJs);

console.log('App enhanced successfully');
