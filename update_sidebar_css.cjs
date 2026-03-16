const fs = require('fs');
let css = fs.readFileSync('backend/web/app.css', 'utf8');

css += `
.app-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 22px;
  padding: 16px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(3px);
}

.sidebar-nav .nav-item {
  background: transparent;
  border: none;
  text-align: left;
  padding: 12px 16px;
  border-radius: 12px;
  font-family: "Manrope", sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--ink-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-nav .nav-item:hover {
  background: rgba(255, 255, 255, 0.5);
  color: var(--ink);
}

.sidebar-nav .nav-item.active {
  background: linear-gradient(135deg, var(--accent), #c3643f);
  color: #fff;
  box-shadow: 0 4px 12px rgba(140, 58, 29, 0.2);
}

.main-content {
  flex: 1;
  min-width: 0;
}

.main-content .panel {
  display: none;
}

.main-content .panel.active-panel {
  display: block;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 900px) {
  .app-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    position: static;
  }
  .sidebar-nav {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
`;

fs.writeFileSync('backend/web/app.css', css);
console.log('Sidebar CSS applied');
