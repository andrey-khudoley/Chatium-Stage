// Generated from design demo styles
export const darkUiStyles = `
/* ===== CSS Variables - Dark Theme "Night Forest" ===== */
.app {
  --bg-primary: #070b0d;
  --bg-secondary: #0d1214;
  --bg-elevated: #121a1d;
  --surface-glass: rgba(20, 35, 30, 0.4);
  --surface-glass-hover: rgba(25, 45, 38, 0.55);
  /* Матовое стекло: темнее и прозрачнее для карточек и сайдбара */
  --surface-glass-card: rgba(6, 10, 8, 0.36);
  --border-glass: rgba(146, 164, 71, 0.12);
  --border-glass-light: rgba(255, 255, 255, 0.06);
  --text-primary: #f0f2ed;
  --text-secondary: rgba(240, 242, 237, 0.7);
  --text-tertiary: rgba(240, 242, 237, 0.45);
  --accent-primary: #92a447;
  --accent-glow: rgba(146, 164, 71, 0.35);
  --accent-soft: rgba(146, 164, 71, 0.15);
  --glow-ambient: rgba(100, 140, 90, 0.08);
  
  --radius-lg: 24px;
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
  overflow-x: hidden;
  opacity: 0;
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-ready {
  opacity: 1;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== Background Layers ===== */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_3IQ3znw7md.1376x768.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.4;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    135deg,
    rgba(7, 11, 13, 0.85) 0%,
    rgba(13, 18, 20, 0.75) 50%,
    rgba(18, 26, 29, 0.85) 100%
  );
  backdrop-filter: blur(2px);
}

/* ===== Floating orbs — движущиеся объекты поверх фона, под карточками ===== */
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
  background: radial-gradient(
    circle at 30% 30%,
    rgba(146, 164, 71, 0.06),
    transparent 70%
  );
  animation: orb-float 20s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  top: calc(10% + 100px);
  right: 15%;
  animation-delay: 0s;
}

.orb-2 {
  width: 200px;
  height: 200px;
  bottom: 20%;
  left: 10%;
  animation-delay: -5s;
}

.orb-3 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 30%;
  animation-delay: -10s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.5;
  }
  33% {
    transform: translate(30px, -30px) rotate(120deg);
    opacity: 1;
  }
  66% {
    transform: translate(-20px, 20px) rotate(240deg);
    opacity: 0.5;
  }
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
  background: var(--surface-glass-card);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-right: 1px solid var(--border-glass);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    4px 0 32px rgba(0, 0, 0, 0.3);
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

/* Mobile menu overlay - visible when in DOM; hidden on desktop */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  animation: overlay-in 0.25s ease;
}

/* Hamburger - hidden on desktop */
.menu-toggle {
  display: none;
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
  background: linear-gradient(135deg, var(--accent-primary), #9aa56a);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--bg-primary);
  box-shadow: 
    0 8px 32px var(--accent-glow),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
  background: var(--surface-glass);
  border: 1px solid var(--border-glass-light);
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
  border-color: var(--border-glass);
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
  border-radius: var(--radius-md);
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
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
  box-shadow: 
    0 4px 20px var(--accent-glow),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
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
  border-top: 1px solid var(--border-glass-light);
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
  background: var(--surface-glass);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass-light);
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #77884c, var(--accent-primary));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-primary);
  box-shadow: 0 4px 12px rgba(146, 164, 71, 0.2);
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
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.action-btn {
  height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.action-btn.glass {
  width: 44px;
  padding: 0;
  justify-content: center;
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-glass-light);
  color: var(--text-secondary);
  box-shadow: 
    0 4px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.action-btn.glass:hover {
  background: var(--surface-glass-hover);
  color: var(--accent-primary);
  border-color: var(--border-glass);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px var(--glow-ambient);
}

.action-btn.primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  box-shadow: 
    0 4px 20px var(--accent-glow),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.action-btn.primary:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 8px 30px var(--accent-glow),
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
  color: var(--bg-primary);
  box-shadow: 0 2px 8px var(--accent-glow);
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
  background: var(--surface-glass-card);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 
    0 4px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
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
  border-color: var(--border-glass);
  transform: translateY(-4px);
  box-shadow: 
    0 8px 40px rgba(0, 0, 0, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 32px var(--glow-ambient),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
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
  background: linear-gradient(135deg, var(--surface-glass-card), rgba(146, 164, 71, 0.04));
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
  box-shadow: 0 2px 8px rgba(146, 164, 71, 0.2);
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
  color: var(--bg-primary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 
    0 4px 20px var(--accent-glow),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 30px var(--accent-glow),
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-ghost:hover {
  background: var(--surface-glass);
  color: var(--text-primary);
  border-color: var(--border-glass);
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
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.3),
    0 0 12px var(--glow-ambient);
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
  animation-delay: -2.6s;
}

.card-3 {
  width: 45px;
  height: 45px;
  top: 50%;
  right: 30%;
  animation-delay: -5.3s;
}

@keyframes float-card {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}

/* Stats Cards */
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
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
  box-shadow: 0 4px 12px rgba(146, 164, 71, 0.15);
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

.stat-glow {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  right: -30px;
  bottom: -30px;
  opacity: 0.1;
  filter: blur(40px);
  background: var(--accent-primary);
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
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-btn:hover {
  background: var(--accent-soft);
  border-color: var(--border-glass);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
  box-shadow: 0 2px 8px rgba(146, 164, 71, 0.15);
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
  box-shadow: 0 2px 8px rgba(146, 164, 71, 0.2);
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-primary);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent-glow);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
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
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.activity-item:hover {
  background: var(--accent-soft);
  border-color: var(--border-glass);
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
  box-shadow: 0 2px 8px rgba(146, 164, 71, 0.15);
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
  background: var(--surface-glass);
  padding: 4px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass-light);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
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
  background: linear-gradient(180deg, rgba(146, 164, 71, 0.3), rgba(146, 164, 71, 0.1));
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: 0 2px 8px rgba(146, 164, 71, 0.1);
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
  background: linear-gradient(180deg, var(--accent-primary), rgba(146, 164, 71, 0.3));
  box-shadow: 0 4px 16px var(--accent-glow);
}

.bar.active {
  background: linear-gradient(180deg, var(--accent-primary), #77884c);
  box-shadow: 0 4px 20px var(--accent-glow);
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
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 
    0 4px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
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
.btn-glass {
  padding: 12px 24px;
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-glass:hover {
  background: var(--surface-glass-hover);
  border-color: var(--border-glass);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-outline:hover {
  background: var(--accent-soft);
  box-shadow: 0 4px 16px var(--accent-glow);
}

/* Inputs */
.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: var(--surface-glass);
  backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-group:focus-within {
  border-color: var(--accent-primary);
  box-shadow: 
    0 0 0 3px var(--accent-soft),
    0 4px 16px var(--accent-glow);
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
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  box-shadow: 0 2px 8px rgba(146, 164, 71, 0.15);
}

.tag-light {
  background: rgba(154, 165, 106, 0.15);
  color: #9aa56a;
}

.tag-outline {
  background: transparent;
  border: 1px solid var(--accent-primary);
  color: var(--accent-primary);
}

.tag-muted {
  background: var(--surface-glass);
  color: var(--text-secondary);
  box-shadow: none;
}

/* Toggle */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-row:hover {
  background: var(--surface-glass-hover);
  border-color: var(--border-glass);
}

.toggle-row span {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.toggle {
  appearance: none;
  width: 48px;
  height: 26px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-glass-light);
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: var(--text-secondary);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.toggle:checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  box-shadow: 0 0 12px var(--accent-glow);
}

.toggle:checked::before {
  transform: translateX(22px);
  background: var(--bg-primary);
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
  background: var(--bg-elevated);
  border: 1px solid var(--border-glass-light);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-fill {
  height: 100%;
  width: var(--w);
  border-radius: 4px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(90deg, #77884c, var(--accent-primary));
  box-shadow: 0 0 12px var(--accent-glow);
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
  color: var(--bg-primary);
  box-shadow: 0 2px 8px rgba(146, 164, 71, 0.3);
}

.avatar-item:first-child {
  margin-left: 0;
}

.avatar-item:nth-child(2) { background: #9aa56a; }
.avatar-item:nth-child(3) { background: #77884c; }
.avatar-item:nth-child(4) { background: #a5b068; }

.avatar-item.more {
  background: var(--surface-glass);
  color: var(--text-secondary);
  border-color: var(--border-glass);
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
  border: 1px solid var(--border-glass-light);
  box-shadow: 
    0 4px 20px color-mix(in srgb, var(--c) 30%, transparent),
    0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.palette-swatch:hover {
  transform: scale(1.1);
  box-shadow: 
    0 8px 32px color-mix(in srgb, var(--c) 40%, transparent),
    0 4px 16px rgba(0, 0, 0, 0.4);
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
  .showcase-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 900px) {
  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-right: 12px;
    background: var(--surface-glass);
    backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid var(--border-glass-light);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .menu-toggle:hover {
    background: var(--accent-soft);
    color: var(--accent-primary);
  }
  .menu-toggle i {
    font-size: 1.2rem;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    width: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: auto;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 32px rgba(0, 0, 0, 0.4);
  }
  .sidebar.mobile-open {
    width: 260px;
    padding: 24px 16px;
  }
  .sidebar.mobile-open.collapsed {
    width: 80px;
    padding: 24px 12px;
  }
  .main {
    padding: 20px 16px;
  }
  .header {
    flex-wrap: wrap;
  }
  .header-left {
    min-width: 0;
    flex: 1;
  }
  .showcase-grid {
    grid-template-columns: 1fr;
  }
  .showcase-card.wide {
    grid-column: span 1;
  }
  .page-title {
    font-size: 2rem;
  }
  .section-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }
  .hero-card {
    grid-column: span 1;
    grid-row: span 1;
  }
  .actions-card,
  .chart-card {
    grid-column: span 1;
  }
  .activity-card {
    grid-row: span 1;
  }
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .bento-item {
    padding: 20px;
  }
  .hero-title {
    font-size: 1.5rem;
  }
  .hero-desc {
    font-size: 0.9rem;
  }
  .stat-value {
    font-size: 1.5rem;
  }
  .chart-bars {
    height: 100px;
    gap: 8px;
  }
  .bar span {
    font-size: 0.65rem;
  }
  .showcase,
  .palette-section {
    margin-bottom: 32px;
  }
  .palette-grid {
    gap: 12px;
  }
  .palette-swatch {
    width: 56px;
    height: 56px;
  }
  .palette-name,
  .palette-hex {
    font-size: 0.7rem;
  }
}

@media (max-width: 600px) {
  .header {
    position: relative;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    margin-bottom: 24px;
  }
  .header-left {
    order: 1;
    padding-left: 52px;
    min-width: 0;
  }
  .menu-toggle {
    position: absolute;
    top: 0;
    left: 0;
    margin-right: 0;
  }
  .header .page-title {
    font-size: 1.5rem;
  }
  .page-subtitle {
    font-size: 0.9rem;
  }
  .header-actions {
    order: 2;
    justify-content: flex-end;
  }
  .action-btn.primary span {
    display: inline;
  }
  .hero-visual {
    display: none;
  }
  .hero-actions {
    flex-wrap: wrap;
  }
  .btn-glow,
  .btn-ghost {
    padding: 10px 18px;
    font-size: 0.85rem;
  }
  .main {
    padding: 16px 12px;
  }
  .content {
    min-width: 0;
  }
  .showcase-content {
    gap: 8px;
  }
  .input-group input {
    height: 44px;
    font-size: 16px; /* avoid zoom on iOS */
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.35rem;
  }
  .header .page-title {
    padding-left: 48px;
    font-size: 1.35rem;
  }
  .section-title {
    font-size: 1.25rem;
    margin-bottom: 16px;
  }
  .stat-card {
    padding: 16px;
    gap: 12px;
  }
  .stat-icon {
    width: 44px;
    height: 44px;
    font-size: 1.1rem;
  }
  .stat-value {
    font-size: 1.35rem;
  }
  .stat-label {
    font-size: 0.75rem;
  }
  .quick-btn {
    padding: 12px 8px;
    font-size: 0.75rem;
  }
  .quick-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  .activity-item {
    padding: 10px;
  }
  .activity-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
  .activity-name {
    font-size: 0.8rem;
  }
  .avatar-item {
    width: 36px;
    height: 36px;
    font-size: 0.75rem;
    margin-left: -6px;
  }
  .tag {
    padding: 5px 10px;
    font-size: 0.7rem;
  }
}

@media (min-width: 901px) {
  .sidebar-overlay {
    display: none !important;
  }
}
`
