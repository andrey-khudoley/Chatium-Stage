// Generated from design demo styles
export const lightUiStyles = `
/* ===== CSS Variables — Light Theme "Modern Nature Minimal" ===== */
.app {
  --bg-primary: #f5f8f0;
  --bg-secondary: #eef2e6;
  --bg-elevated: #ffffff;
  --surface-glass: rgba(255, 255, 255, 0.55);
  --surface-glass-hover: rgba(255, 255, 255, 0.75);
  --border-glass: rgba(74, 90, 36, 0.1);
  --border-glass-light: rgba(255, 255, 255, 0.8);
  --text-primary: #1a2518;
  --text-secondary: #3d4a35;
  --text-tertiary: #5a6652;
  --accent-primary: #4a5a24;
  --accent-glow: rgba(74, 90, 36, 0.2);
  --accent-soft: rgba(74, 90, 36, 0.08);
  --sunray: rgba(255, 252, 240, 0.9);
  --sunray-glow: rgba(255, 248, 230, 0.6);
  
  --radius: 24px;
  --radius-md: 16px;
  --radius-sm: 12px;
}

/* ===== Base ===== */
.app {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.app-ready {
  opacity: 1;
}

/* ===== Background ===== */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_09YXnJj0kv.1408x768.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(135deg, 
    rgba(245, 248, 240, 0.85) 0%, 
    rgba(238, 242, 230, 0.75) 50%,
    rgba(255, 255, 255, 0.65) 100%
  );
  backdrop-filter: blur(2px);
}

/* ===== Floating Orbs (Sunrays) ===== */
.orbs {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, 
    var(--sunray), 
    var(--sunray-glow) 40%, 
    transparent 70%
  );
  animation: orb-float 20s ease-in-out infinite;
  filter: blur(40px);
}

.orb-1 {
  width: 400px;
  height: 400px;
  top: -10%;
  right: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  bottom: 15%;
  left: 5%;
  opacity: 0.7;
  animation-delay: -7s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  top: 45%;
  left: 40%;
  opacity: 0.5;
  animation-delay: -14s;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -20px); }
  66% { transform: translate(-20px, 30px); }
}

/* ===== Sidebar ===== */
.sidebar {
  --sidebar-width-expanded: 260px;
  --sidebar-width-collapsed: 80px;
  --sidebar-padding-y: 24px;
  --sidebar-padding-x: 16px;
  width: var(--sidebar-width-expanded);
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: var(--sidebar-padding-y) var(--sidebar-padding-x);
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-right: 1px solid var(--border-glass-light);
  box-shadow: 
    0 8px 32px rgba(74, 90, 36, 0.08),
    0 2px 8px rgba(74, 90, 36, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  z-index: 100;
  overflow-x: hidden;
  overflow-y: hidden;
  transition:
    width 0.45s cubic-bezier(0.25, 0.1, 0.25, 1),
    padding 0.45s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar-layout {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  row-gap: 16px;
  min-height: 0;
  height: 100%;
}

.sidebar-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  align-items: center;
  column-gap: 12px;
  min-height: 44px;
  transition:
    grid-template-columns 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    row-gap 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    column-gap 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.sidebar.collapsed .sidebar-header {
  grid-template-columns: 1fr;
  justify-items: center;
  row-gap: 10px;
}

.logo {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  column-gap: 12px;
  min-width: 0;
  transition:
    grid-template-columns 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    column-gap 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.sidebar.collapsed .logo {
  grid-template-columns: 44px 0;
  column-gap: 0;
}

.logo-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent-primary), #5d6d2e);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.logo-text-wrap {
  min-width: 0;
  overflow: hidden;
}

.logo-text {
  display: block;
  font-family: 'Old Standard TT', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 0.28s ease,
    transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
  transition-delay: 0s;
}

.sidebar.collapsed .logo-text {
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
  transition-delay: 0.08s;
}

.toggle-btn {
  min-width: 40px;
  min-height: 40px;
  width: 40px;
  height: 40px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease;
  font-size: 0.875rem;
}

.toggle-btn:hover {
  background: var(--accent-soft);
  color: var(--accent-primary);
}

/* ===== Navigation ===== */
.nav {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
  margin-right: -2px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-list-item {
  min-width: 0;
}

.nav-item {
  width: 100%;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 14px;
  min-height: 48px;
  padding: 0 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    grid-template-columns 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    column-gap 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    padding-left 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    padding-right 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    background-color 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;
  text-align: left;
  line-height: 1.2;
}

.sidebar.collapsed .nav-item {
  grid-template-columns: 20px 0 0;
  justify-content: center;
  column-gap: 0;
  padding-left: 14px;
  padding-right: 14px;
}

.nav-item-icon {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-item-icon i {
  font-size: 1.1rem;
}

.nav-item-main {
  min-width: 0;
  overflow: hidden;
}

.nav-item-label {
  display: block;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 0.28s ease,
    transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
  transition-delay: 0s;
}

.sidebar.collapsed .nav-item-label {
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
  transition-delay: 0.08s;
}

.nav-item-trailing {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
  max-width: 120px;
  color: inherit;
  opacity: 0.85;
  transition:
    width 0.35s cubic-bezier(0.25, 0.1, 0.25, 1),
    opacity 0.28s ease;
  transition-delay: 0s;
}

.sidebar.collapsed .nav-item-trailing {
  width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition-delay: 0.08s;
}

.nav-item-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--accent-soft);
  color: var(--accent-primary);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
}

.nav-item-trailing-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
}

.nav-item:hover {
  background: var(--accent-soft);
  color: var(--accent-primary);
}

.nav-item.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.nav-item:focus-visible,
.toggle-btn:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.nav-item:disabled {
  opacity: 0.55;
  cursor: default;
  box-shadow: none;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 200px;
  opacity: 1;
  overflow: hidden;
  min-width: 0;
  transition:
    opacity 0.4s ease,
    max-height 0.5s cubic-bezier(0.25, 0.1, 0.25, 1),
    padding 0.5s cubic-bezier(0.25, 0.1, 0.25, 1),
    border-color 0.5s ease;
}

.sidebar-footer:not(.visible) {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  border-top-color: transparent;
  visibility: hidden;
  pointer-events: none;
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3a4a1a, var(--accent-primary));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.role {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* ===== Main Content ===== */
.main {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 10;
  padding: 24px 32px;
  overflow-y: auto;
}

/* ===== Header ===== */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Old Standard TT', serif;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  line-height: 1.1;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  position: relative;
}

.action-btn.glass {
  width: 44px;
  padding: 0;
  justify-content: center;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-light);
  color: var(--text-secondary);
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.action-btn.glass:hover {
  background: var(--surface-glass-hover);
  color: var(--accent-primary);
  transform: translateY(-2px);
}

.action-btn.primary {
  background: var(--accent-primary);
  color: white;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--accent-glow);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: var(--accent-primary);
  border-radius: 50%;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
}

/* ===== Bento Grid ===== */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 20px;
  margin-bottom: 48px;
}

.bento-item {
  background: var(--surface-glass);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius);
  padding: 24px;
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  box-shadow: 
    0 8px 32px rgba(74, 90, 36, 0.08),
    0 2px 8px rgba(74, 90, 36, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: bento-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  animation-delay: var(--delay, 0s);
}

@keyframes bento-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

.bento-item:hover {
  background: var(--surface-glass-hover);
  transform: translateY(-4px);
  box-shadow: 
    0 16px 48px rgba(74, 90, 36, 0.12),
    0 4px 12px rgba(74, 90, 36, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

/* Hero Card */
.hero-card {
  grid-column: span 2;
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.sunray-diagonal {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 150%;
  height: 150%;
  background: linear-gradient(135deg, 
    transparent 0%, 
    var(--sunray) 40%, 
    transparent 60%
  );
  opacity: 0.4;
  pointer-events: none;
  transform: rotate(-15deg);
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--accent-soft);
  color: var(--accent-primary);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
  margin-bottom: 16px;
}

.hero-title {
  font-family: 'Old Standard TT', serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 12px 0;
  max-width: 400px;
  color: var(--text-primary);
}

.hero-desc {
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  max-width: 380px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

.btn-glow {
  padding: 12px 24px;
  background: var(--accent-primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px var(--accent-glow);
  transition: all 0.2s;
}

.btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--accent-glow);
}

.btn-glass {
  padding: 12px 24px;
  background: var(--surface-glass);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.btn-glass:hover {
  background: var(--surface-glass-hover);
  transform: translateY(-2px);
}

.hero-visual {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 200px;
  height: 200px;
}

.floating-card {
  position: absolute;
  background: var(--surface-glass);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  box-shadow: 
    0 8px 24px rgba(74, 90, 36, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: float-card 8s ease-in-out infinite;
}

.card-1 {
  width: 60px;
  height: 60px;
  font-size: 1.2rem;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.card-2 {
  width: 50px;
  height: 50px;
  bottom: 20%;
  left: 10%;
  animation-delay: -2.5s;
}

.card-3 {
  width: 45px;
  height: 45px;
  top: 50%;
  right: 30%;
  animation-delay: -5s;
}

@keyframes float-card {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(3deg); }
}

/* Stats Cards */
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
  background: var(--accent-soft);
  color: var(--accent-primary);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Actions Card */
.actions-card {
  grid-column: span 2;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.quick-btn:hover {
  background: var(--surface-glass);
  border-color: var(--border-glass-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 90, 36, 0.08);
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent-primary);
}

/* Activity Card */
.activity-card {
  grid-row: span 2;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--accent-soft);
  color: var(--accent-primary);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-primary);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.activity-item:hover {
  background: var(--surface-glass);
  transform: translateX(4px);
}

.activity-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  background: var(--accent-soft);
  color: var(--accent-primary);
}

.activity-info {
  display: flex;
  flex-direction: column;
}

.activity-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Chart Card */
.chart-card {
  grid-column: span 2;
}

.chart-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-elevated);
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.tab {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: var(--accent-primary);
  color: white;
  box-shadow: 0 2px 8px var(--accent-glow);
}

.chart-visual {
  margin-top: 20px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 120px;
  gap: 12px;
}

.bar {
  flex: 1;
  height: var(--h);
  background: linear-gradient(180deg, 
    rgba(74, 90, 36, 0.15), 
    rgba(74, 90, 36, 0.05)
  );
  border-radius: 8px 8px 0 0;
  position: relative;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bar span {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.bar:hover {
  background: linear-gradient(180deg, 
    var(--accent-primary), 
    rgba(74, 90, 36, 0.2)
  );
}

.bar.active {
  background: linear-gradient(180deg, 
    var(--accent-primary), 
    #5d6d2e
  );
  box-shadow: 0 0 16px var(--accent-glow);
}

/* ===== Showcase ===== */
.showcase {
  margin-bottom: 48px;
}

.section-title {
  font-family: 'Old Standard TT', serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 24px 0;
  color: var(--text-primary);
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.showcase-card {
  background: var(--surface-glass);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius);
  padding: 24px;
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  box-shadow: 
    0 8px 32px rgba(74, 90, 36, 0.08),
    0 2px 8px rgba(74, 90, 36, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.showcase-card.wide {
  grid-column: span 2;
}

.showcase-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.showcase-content {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.showcase-content.column {
  flex-direction: column;
}

.showcase-content.wrap {
  flex-wrap: wrap;
}

/* Buttons */
.btn-ghost {
  padding: 12px 24px;
  background: transparent;
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: var(--accent-soft);
  color: var(--accent-primary);
}

.btn-outline {
  padding: 12px 24px;
  background: transparent;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-md);
  color: var(--accent-primary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: var(--accent-soft);
}

/* Inputs */
.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.input-group:focus-within {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.input-group i {
  color: var(--text-tertiary);
}

.input-group input {
  flex: 1;
  height: 48px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
}

.input-group input::placeholder {
  color: var(--text-tertiary);
}

.input-action {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 8px;
  transition: color 0.2s;
}

.input-action:hover {
  color: var(--accent-primary);
}

/* Tags */
.tag {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--accent-soft);
  color: var(--accent-primary);
}

.tag-light {
  background: var(--bg-elevated);
  color: var(--accent-primary);
  border: 1px solid var(--border-glass);
}

.tag-outline {
  background: transparent;
  border: 1px solid var(--accent-primary);
  color: var(--accent-primary);
}

.tag-muted {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

/* Toggle */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.toggle-row span {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.toggle {
  appearance: none;
  width: 48px;
  height: 26px;
  background: var(--bg-secondary);
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toggle:checked {
  background: var(--accent-primary);
}

.toggle:checked::before {
  transform: translateX(22px);
}

/* Progress */
.progress-item {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.progress-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: var(--w);
  border-radius: 4px;
  transition: width 1s ease;
  background: linear-gradient(90deg, #3a4a1a, var(--accent-primary));
}

/* Avatar Group */
.avatar-group {
  display: flex;
}

.avatar-item {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  margin-left: -8px;
  border: 2px solid var(--bg-primary);
  background: var(--accent-primary);
  color: white;
}

.avatar-item:first-child {
  margin-left: 0;
}

.avatar-item:nth-child(2) { background: #5d6d2e; }
.avatar-item:nth-child(3) { background: #3a4a1a; }
.avatar-item:nth-child(4) { background: #6b7d38; }

.avatar-item.more {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

/* ===== Palette ===== */
.palette-section {
  margin-bottom: 48px;
}

.palette-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.palette-swatch {
  width: 72px;
  height: 72px;
  background: var(--c);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 16px rgba(74, 90, 36, 0.12);
  transition: transform 0.2s;
}

.palette-swatch.swatch-light {
  border: 1px solid var(--border-glass);
}

.palette-swatch:hover {
  transform: scale(1.1);
}

.palette-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.palette-hex {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-family: monospace;
}

/* ===== Responsive ===== */
@media (max-width: 1200px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-card {
    grid-column: span 2;
  }
  .chart-card {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
  }
  .sidebar.collapsed {
    width: 0;
    padding: 0;
    overflow: hidden;
  }
  .main {
    padding: 20px;
  }
  .showcase-grid {
    grid-template-columns: 1fr;
  }
  .showcase-card.wide {
    grid-column: span 1;
  }
}

@media (max-width: 600px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .hero-card, .actions-card, .chart-card {
    grid-column: span 1;
  }
  .activity-card {
    grid-row: span 1;
  }
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  .header {
    flex-direction: column;
    gap: 16px;
  }
  .hero-visual {
    display: none;
  }
}
`
