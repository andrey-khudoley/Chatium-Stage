export const uiCoreStyles = `
/* ===== Layout ===== */
.app {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  min-height: 100dvh;
  color: var(--text-primary);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 320ms ease, transform 420ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.app-ready {
  opacity: 1;
  transform: translateY(0);
}

.bg-layer,
.bg-overlay,
.orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.bg-layer {
  z-index: 0;
  background:
    radial-gradient(circle at 0% 10%, color-mix(in srgb, var(--accent-primary) 26%, transparent), transparent 46%),
    radial-gradient(circle at 95% 8%, color-mix(in srgb, var(--accent-light) 18%, transparent), transparent 44%),
    radial-gradient(circle at 50% 110%, color-mix(in srgb, var(--accent-dark) 22%, transparent), transparent 54%);
}

.bg-overlay {
  z-index: 1;
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--bg-primary) 88%, transparent) 0%, color-mix(in srgb, var(--bg-secondary) 74%, transparent) 56%, color-mix(in srgb, var(--bg-primary) 86%, transparent) 100%);
  backdrop-filter: blur(2px);
}

.orbs {
  z-index: 2;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(32px);
  opacity: 0.42;
  background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--accent-primary) 32%, transparent), transparent 72%);
  animation: orb-drift 22s ease-in-out infinite;
}

.orb-1 {
  width: 340px;
  height: 340px;
  top: -120px;
  right: 4%;
  animation-delay: 0s;
}

.orb-2 {
  width: 280px;
  height: 280px;
  bottom: 10%;
  left: -80px;
  animation-delay: -7s;
}

.orb-3 {
  width: 230px;
  height: 230px;
  top: 44%;
  left: 42%;
  animation-delay: -14s;
}

@keyframes orb-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  33% {
    transform: translate3d(22px, -18px, 0) scale(1.03);
  }
  66% {
    transform: translate3d(-16px, 24px, 0) scale(0.96);
  }
}

/* ===== Sidebar ===== */
.sidebar {
  position: sticky;
  top: 0;
  z-index: 16;
  width: 246px;
  height: 100dvh;
  padding: 14px;
  border-right: 1px solid var(--border-glass-light);
  background: linear-gradient(165deg, color-mix(in srgb, var(--surface-glass-card) 88%, transparent), color-mix(in srgb, var(--surface-glass) 78%, transparent));
  backdrop-filter: blur(26px) saturate(136%);
  box-shadow: var(--shadow-soft);
  transition: width 280ms ease, padding 280ms ease, transform 280ms ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 74px;
  padding: 12px 10px;
}

.sidebar-layout {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
  gap: 14px;
}

.sidebar-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  align-items: center;
  gap: 8px;
}

.sidebar.collapsed .sidebar-header {
  grid-template-columns: 1fr;
  justify-items: center;
}

.logo {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.sidebar.collapsed .logo {
  grid-template-columns: 38px;
}

.logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
  color: color-mix(in srgb, var(--bg-primary) 84%, #fff 16%);
  font-size: 1.05rem;
  box-shadow: 0 12px 26px color-mix(in srgb, var(--accent-primary) 32%, transparent);
}

.logo-text-wrap {
  min-width: 0;
  overflow: hidden;
}

.logo-text {
  display: block;
  font-family: var(--font-display);
  font-size: 1.32rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition: opacity 220ms ease, transform 220ms ease;
}

.sidebar.collapsed .logo-text {
  opacity: 0;
  transform: translateX(-8px);
}

.toggle-btn,
.menu-toggle {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-soft);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 180ms ease;
}

.toggle-btn:hover,
.menu-toggle:hover {
  color: var(--accent-primary);
  border-color: var(--border-glass);
  background: color-mix(in srgb, var(--accent-soft) 72%, var(--surface-soft));
}

.nav {
  min-height: 0;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 100%;
  overflow: auto;
}

.nav-list-item {
  min-width: 0;
}

.nav-item {
  width: 100%;
  min-height: 40px;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 10px 12px;
  background: transparent;
  color: var(--text-secondary);
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  transition: all 180ms ease;
}

.nav-item:hover {
  border-color: var(--border-glass-light);
  background: color-mix(in srgb, var(--surface-soft) 90%, transparent);
  color: var(--text-primary);
}

.nav-item.active {
  border-color: var(--border-glass);
  color: var(--text-primary);
  background: linear-gradient(120deg, color-mix(in srgb, var(--accent-soft) 84%, transparent), color-mix(in srgb, var(--surface-soft) 95%, transparent));
}

.nav-item:disabled {
  opacity: 0.54;
  cursor: not-allowed;
}

.nav-item-icon {
  display: inline-flex;
  justify-content: center;
  font-size: 0.92rem;
}

.nav-item-main,
.nav-item-label {
  min-width: 0;
}

.nav-item-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 600;
}

.nav-item-trailing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nav-item-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-primary) 22%, transparent);
  color: var(--text-primary);
  border: 1px solid color-mix(in srgb, var(--accent-primary) 42%, transparent);
  font-size: 0.68rem;
  font-weight: 700;
}

.nav-item-trailing-text {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

.sidebar.collapsed .nav-item {
  grid-template-columns: 38px;
  justify-items: center;
  padding: 10px 0;
  border-radius: 10px;
}

.sidebar.collapsed .nav-item-main,
.sidebar.collapsed .nav-item-trailing,
.sidebar.collapsed .nav-item-label {
  display: none;
}

.sidebar-footer {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 180ms ease, transform 180ms ease;
  pointer-events: none;
  display: grid;
  gap: 12px;
}

.sidebar-footer.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.sidebar-footer.compact {
  gap: 8px;
}

.sidebar-footer.compact .toggle-row {
  min-height: 34px;
  padding: 6px;
  grid-template-columns: 1fr;
  justify-items: center;
}

.sidebar-footer.compact .toggle-row span {
  display: none;
}

.user-pill {
  border: 1px solid var(--border-glass-light);
  border-radius: 14px;
  padding: 10px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  background: color-mix(in srgb, var(--surface-soft) 88%, transparent);
}

.avatar,
.activity-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-light));
  color: #fff;
  font-weight: 700;
  font-size: 0.84rem;
}

.user-info {
  min-width: 0;
  display: grid;
}

.name {
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 14;
  background: color-mix(in srgb, var(--bg-primary) 56%, transparent);
  backdrop-filter: blur(2px);
}

/* ===== Main ===== */
.main {
  position: relative;
  z-index: 3;
  padding: 0 0 26px;
  min-width: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
  padding: 14px 18px 16px;
  border-bottom: 1px solid var(--border-glass-light);
  background: color-mix(in srgb, var(--surface-glass-card) 94%, transparent);
  backdrop-filter: blur(16px) saturate(115%);
}

.header-left {
  min-width: 0;
}

.page-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 3vw, 2.2rem);
  line-height: 1.08;
  letter-spacing: 0.01em;
}

.page-subtitle {
  margin: 7px 0 0;
  color: var(--text-secondary);
  font-size: 0.93rem;
}

.header-actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px 18px 0;
}

/* ===== Buttons ===== */
.action-btn,
.btn-glow,
.btn-glass,
.btn-ghost,
.btn-outline,
.tests-load-more-btn,
.tests-run-group-btn,
.tests-run-all-btn,
.tests-logs-clear-btn {
  --btn-height: 42px;
  height: var(--btn-height);
  border-radius: 12px;
  border: 1px solid transparent;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.84rem;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform 140ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease;
  text-decoration: none;
}

.action-btn:active,
.btn-glow:active,
.btn-glass:active,
.btn-ghost:active,
.btn-outline:active {
  transform: translateY(1px);
}

.action-btn.glass,
.btn-glass,
.btn-outline,
.btn-ghost,
.tests-load-more-btn,
.tests-run-group-btn,
.tests-run-all-btn,
.tests-logs-clear-btn {
  border-color: var(--border-glass-light);
  background: var(--surface-glass);
  color: var(--text-secondary);
}

.action-btn.glass:hover,
.btn-glass:hover,
.btn-outline:hover,
.btn-ghost:hover,
.tests-load-more-btn:hover,
.tests-run-group-btn:hover,
.tests-run-all-btn:hover,
.tests-logs-clear-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-glass);
  background: var(--surface-glass-hover);
}

.btn-outline {
  background: transparent;
}

.action-btn.primary,
.btn-glow {
  border-color: color-mix(in srgb, var(--accent-primary) 40%, transparent);
  color: #fff;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
  box-shadow: 0 10px 22px color-mix(in srgb, var(--accent-primary) 30%, transparent);
}

.action-btn.primary:hover,
.btn-glow:hover {
  background: linear-gradient(135deg, var(--accent-light), var(--accent-primary));
  border-color: color-mix(in srgb, var(--accent-light) 58%, transparent);
}

.action-btn,
.badge,
.btn-glow,
.btn-glass,
.btn-ghost,
.btn-outline {
  white-space: nowrap;
}

.action-btn {
  position: relative;
}

.badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  position: absolute;
  top: -6px;
  right: -5px;
  border-radius: 999px;
  border: 1px solid var(--border-glass-light);
  font-size: 0.63rem;
  font-weight: 700;
  line-height: 1;
  display: grid;
  place-items: center;
  background: var(--surface-glass-card);
  color: var(--text-primary);
}

.action-btn:disabled,
.btn-glow:disabled,
.btn-glass:disabled,
.btn-ghost:disabled,
.btn-outline:disabled,
.tests-load-more-btn:disabled,
.tests-run-group-btn:disabled,
.tests-run-all-btn:disabled,
.tests-logs-clear-btn:disabled,
.tests-load-more-btn-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* ===== Generic controls ===== */
.input-group {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  padding: 0 12px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  background: var(--surface-soft);
  color: var(--text-secondary);
}

.input-group:focus-within {
  border-color: var(--border-glass);
  background: var(--surface-glass-hover);
}

.input-group i {
  color: var(--text-tertiary);
  font-size: 0.85rem;
}

.input-group input,
.input-group textarea,
.input-group select,
.inquiries-compose-input {
  border: 0;
  background: transparent;
  color: var(--text-primary);
  width: 100%;
  font-family: var(--font-sans);
  font-size: 0.89rem;
}

.input-group input::placeholder,
.input-group textarea::placeholder,
.inquiries-compose-input::placeholder {
  color: var(--text-tertiary);
}

.input-group input:focus,
.input-group textarea:focus,
.input-group select:focus,
.inquiries-compose-input:focus {
  outline: none;
}

.input-action {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.input-action:hover {
  color: var(--accent-primary);
  background: var(--accent-soft);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 11px;
  border: 1px solid color-mix(in srgb, var(--accent-primary) 36%, transparent);
  background: color-mix(in srgb, var(--accent-soft) 88%, transparent);
  color: var(--text-primary);
  font-size: 0.74rem;
  font-weight: 600;
}

.tag-light {
  background: color-mix(in srgb, var(--accent-primary) 20%, transparent);
}

.tag-outline {
  background: transparent;
  border-style: dashed;
}

.tag-muted {
  opacity: 0.58;
}

.tab {
  border: 1px solid var(--border-glass-light);
  border-radius: 999px;
  height: 34px;
  padding: 0 12px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 170ms ease;
}

.tab:hover {
  border-color: var(--border-glass);
  color: var(--text-primary);
}

.tab.active {
  background: color-mix(in srgb, var(--accent-soft) 82%, transparent);
  border-color: var(--border-glass);
  color: var(--text-primary);
}

.toggle-row {
  min-height: 36px;
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  padding: 8px 10px;
  background: var(--surface-soft);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.toggle-row span {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.toggle {
  appearance: none;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-tertiary) 35%, transparent);
  border: 1px solid transparent;
  position: relative;
  cursor: pointer;
  transition: background 170ms ease;
}

.toggle::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #fff;
  transition: transform 170ms ease;
}

.toggle:checked {
  background: var(--accent-primary);
}

.toggle:checked::before {
  transform: translateX(18px);
}

.helper-error,
.logs-error,
.tests-logs-error,
.tests-endpoints-list-error {
  margin: 8px 0 0;
  color: var(--danger);
  font-size: 0.82rem;
}

/* ===== Common cards ===== */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}

.bento-item {
  grid-column: span 3;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-glass-light);
  padding: 18px;
  background: linear-gradient(165deg, color-mix(in srgb, var(--surface-glass-card) 96%, transparent), color-mix(in srgb, var(--surface-soft) 92%, transparent));
  box-shadow: var(--shadow-soft);
  min-width: 0;
}

.hero-card {
  grid-column: span 6;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 14px;
  overflow: hidden;
  position: relative;
}

.hero-card::after {
  content: '';
  position: absolute;
  inset: -20% -25% auto auto;
  width: 280px;
  height: 280px;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 26%, transparent), transparent 70%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  font-size: 0.74rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-secondary);
  border: 1px solid var(--border-glass-light);
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--surface-soft);
}

.hero-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.7vw, 1.95rem);
  line-height: 1.12;
}

.hero-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.45;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-visual {
  position: relative;
  min-height: 170px;
}

.floating-card {
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-glass-light);
  background: var(--surface-soft);
  color: var(--accent-primary);
  box-shadow: var(--shadow-soft);
  animation: floating-card 7s ease-in-out infinite;
}

.card-1 {
  top: 14px;
  right: 30px;
  animation-delay: 0s;
}

.card-2 {
  top: 78px;
  right: 96px;
  animation-delay: -2s;
}

.card-3 {
  top: 122px;
  right: 20px;
  animation-delay: -4s;
}

@keyframes floating-card {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.stat-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--accent-primary);
  border: 1px solid var(--border-glass-light);
  background: var(--surface-soft);
}

.stat-value {
  display: block;
  font-size: 1.46rem;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--text-tertiary);
}

.stat-glow {
  display: none;
}

.actions-card {
  grid-column: span 3;
}

.card-title {
  margin: 0 0 10px;
  font-size: 0.92rem;
  font-weight: 700;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quick-btn {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  min-height: 74px;
  padding: 10px;
  background: var(--surface-soft);
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  gap: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 600;
}

.quick-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-glass);
}

.quick-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent-soft) 84%, transparent);
  color: var(--accent-primary);
}

.activity-card,
.chart-card {
  grid-column: span 3;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--success);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--success) 18%, transparent);
}

.activity-list {
  display: grid;
  gap: 9px;
}

.activity-item {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  background: var(--surface-soft);
  padding: 9px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.activity-info {
  min-width: 0;
}

.activity-name {
  display: block;
  font-size: 0.84rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-time {
  display: block;
  margin-top: 2px;
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

.chart-tabs {
  display: inline-flex;
  gap: 8px;
}

.chart-visual {
  padding-top: 8px;
}

.chart-bars {
  height: 116px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  align-items: end;
}

.bar {
  height: var(--h);
  min-height: 18%;
  border-radius: 12px 12px 8px 8px;
  background: color-mix(in srgb, var(--accent-primary) 58%, transparent);
  display: grid;
  align-items: end;
  justify-items: center;
  transition: transform 180ms ease;
}

.bar span {
  padding-top: 6px;
  font-size: 0.64rem;
  color: var(--text-tertiary);
}

.bar.active,
.bar:hover {
  transform: translateY(-2px);
  background: color-mix(in srgb, var(--accent-light) 72%, transparent);
}

/* ===== Showcase ===== */
.showcase,
.palette-section {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-glass-light);
  background: linear-gradient(165deg, color-mix(in srgb, var(--surface-glass-card) 94%, transparent), color-mix(in srgb, var(--surface-soft) 90%, transparent));
  box-shadow: var(--shadow-soft);
  padding: 18px;
}

.section-title {
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-size: 1.28rem;
  line-height: 1.2;
}

.showcase-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.showcase-card {
  grid-column: span 4;
  border: 1px solid var(--border-glass-light);
  border-radius: 14px;
  background: var(--surface-soft);
  padding: 14px;
  min-width: 0;
}

.showcase-card.wide {
  grid-column: span 8;
}

.showcase-label {
  margin: 0 0 10px;
  font-size: 0.8rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.showcase-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.showcase-content.column {
  flex-direction: column;
}

.showcase-content.wrap {
  align-items: center;
}

.showcase-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.45;
}

.progress-item {
  display: grid;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.progress-bar {
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-tertiary) 18%, transparent);
  overflow: hidden;
}

.progress-fill {
  width: var(--w);
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-light));
}

.avatar-group {
  display: flex;
  align-items: center;
}

.avatar-item {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 2px solid var(--bg-primary);
  margin-left: -8px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent-primary) 74%, #fff 26%);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}

.avatar-item:first-child {
  margin-left: 0;
}

.avatar-item.more {
  background: var(--surface-strong);
  color: var(--text-primary);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.palette-item {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  background: var(--surface-soft);
  padding: 10px;
  display: grid;
  gap: 5px;
}

.palette-swatch {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--text-primary) 8%, transparent);
  background: var(--c);
}

.palette-name {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.palette-hex {
  font-size: 0.69rem;
  color: var(--text-tertiary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

/* ===== Shared log/table helpers ===== */
.logs-card,
.tests-logs-card,
.tests-card,
.inquiries-list-card,
.inquiries-thread-card,
.inquiries-client-card,
.inquiries-thread-empty {
  background: var(--surface-glass-card);
  border: 1px solid var(--border-glass-light);
  box-shadow: var(--shadow-soft);
}

.logs-output,
.tests-logs-output {
  background: var(--surface-soft);
}

.log-entry,
.tests-log-entry,
.tests-endpoints-list-item,
.inquiries-prop-row,
.inquiries-note-card,
.inquiries-list-item,
.inquiries-message-bubble,
.inquiries-system-event {
  border-color: var(--border-glass-light);
}

.log-level-error,
.tests-log-level-error {
  color: var(--danger);
}

.log-level-warning,
.tests-log-level-warning,
.tests-log-level-warn {
  color: var(--warning);
}

.log-level-info,
.tests-log-level-info {
  color: var(--info);
}

/* ===== Design System Demo ===== */
.ds-stack {
  display: grid;
  gap: 18px;
}

.ds-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.ds-kicker {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ds-title {
  margin: 4px 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.7vw, 2rem);
}

.ds-meta {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ds-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
}

.ds-card {
  grid-column: span 4;
  border: 1px solid var(--border-glass-light);
  border-radius: 16px;
  background: var(--surface-soft);
  padding: 14px;
  min-width: 0;
  display: grid;
  gap: 10px;
}

.ds-card.wide {
  grid-column: span 8;
}

.ds-card.full {
  grid-column: span 12;
}

.ds-card h3 {
  margin: 0;
  font-size: 0.95rem;
}

.ds-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.45;
}

.ds-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.ds-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ds-stat-row {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.ds-stat {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  background: var(--surface-glass);
  padding: 10px;
}

.ds-stat-value {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.ds-stat-label {
  margin: 4px 0 0;
  font-size: 0.74rem;
  color: var(--text-tertiary);
}

.ds-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.ds-list li {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  padding: 10px;
  background: var(--surface-glass);
  display: grid;
  gap: 4px;
}

.ds-list-title {
  font-size: 0.84rem;
  font-weight: 700;
}

.ds-list-meta {
  font-size: 0.74rem;
  color: var(--text-tertiary);
}

.ds-table-wrap {
  overflow: auto;
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
}

.ds-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
}

.ds-table th,
.ds-table td {
  border-bottom: 1px solid var(--border-glass-light);
  padding: 10px 12px;
  text-align: left;
  font-size: 0.82rem;
}

.ds-table th {
  color: var(--text-tertiary);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
}

.ds-table tr:last-child td {
  border-bottom: 0;
}

.ds-alerts {
  display: grid;
  gap: 8px;
}

.ds-alert {
  border-radius: 12px;
  border: 1px solid var(--border-glass-light);
  padding: 9px 11px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ds-alert.info {
  color: var(--info);
  background: color-mix(in srgb, var(--info) 12%, transparent);
}

.ds-alert.success {
  color: var(--success);
  background: color-mix(in srgb, var(--success) 12%, transparent);
}

.ds-alert.warn {
  color: var(--warning);
  background: color-mix(in srgb, var(--warning) 12%, transparent);
}

.ds-alert.error {
  color: var(--danger);
  background: color-mix(in srgb, var(--danger) 12%, transparent);
}

.ds-states {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ds-state {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  min-height: 120px;
  padding: 12px;
  background: var(--surface-glass);
  display: grid;
  place-items: center;
  text-align: center;
  gap: 8px;
}

.ds-state i {
  font-size: 1rem;
  color: var(--accent-primary);
}

.ds-modal-preview {
  border: 1px dashed var(--border-glass);
  border-radius: 12px;
  min-height: 200px;
  padding: 14px;
  position: relative;
  background: color-mix(in srgb, var(--surface-glass) 88%, transparent);
}

.ds-modal-window {
  width: min(430px, 100%);
  margin: 18px auto;
  border: 1px solid var(--border-glass-light);
  border-radius: 16px;
  background: var(--surface-glass-card);
  box-shadow: var(--shadow-soft);
  padding: 14px;
  display: grid;
  gap: 12px;
}

.ds-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.ds-modal-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.ds-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ds-toast-stack {
  display: grid;
  gap: 8px;
}

.ds-toast {
  border: 1px solid var(--border-glass-light);
  border-left-width: 4px;
  border-radius: 12px;
  background: var(--surface-glass);
  padding: 10px;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.ds-toast.success {
  border-left-color: var(--success);
}

.ds-toast.warn {
  border-left-color: var(--warning);
}

.ds-toast.error {
  border-left-color: var(--danger);
}

.ds-skeleton {
  display: grid;
  gap: 7px;
}

.ds-skeleton span {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--surface-soft) 82%, transparent), color-mix(in srgb, var(--surface-strong) 56%, transparent), color-mix(in srgb, var(--surface-soft) 82%, transparent));
  background-size: 300% 100%;
  animation: skeleton-shift 1.4s linear infinite;
}

.ds-skeleton span:nth-child(2) {
  width: 82%;
}

.ds-skeleton span:nth-child(3) {
  width: 60%;
}

@keyframes skeleton-shift {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* ===== CRM DS v2 ===== */
.crm-ds-layout {
  width: min(1260px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.crm-ds-panel {
  border: 1px solid var(--border-glass-light);
  border-radius: 18px;
  background:
    linear-gradient(
      155deg,
      color-mix(in srgb, var(--surface-glass-card) 97%, transparent) 0%,
      color-mix(in srgb, var(--surface-soft) 94%, transparent) 100%
    );
  box-shadow: var(--shadow-soft);
}

.crm-ds-hero {
  padding: 22px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 108px;
  gap: 14px;
  position: relative;
  overflow: hidden;
}

.crm-ds-hero::after {
  content: '';
  position: absolute;
  inset: auto -120px -120px auto;
  width: 320px;
  height: 320px;
  border-radius: 999px;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 24%, transparent), transparent 70%);
  pointer-events: none;
}

.crm-ds-hero-main {
  position: relative;
  z-index: 1;
}

.crm-ds-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent-primary) 42%, transparent);
  background: color-mix(in srgb, var(--accent-soft) 78%, transparent);
  color: var(--accent-light);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  font-weight: 700;
  text-transform: uppercase;
}

.crm-ds-hero-title {
  margin: 14px 0 8px;
  font-family: var(--font-display);
  font-size: clamp(1.85rem, 3.1vw, 2.6rem);
  line-height: 1.1;
}

.crm-ds-hero-text {
  margin: 0;
  color: var(--text-secondary);
  max-width: 700px;
  font-size: 1rem;
  line-height: 1.42;
}

.crm-ds-hero-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.crm-ds-hero-side {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  align-content: start;
}

.crm-ds-icon-tile {
  width: 100%;
  min-height: 66px;
  border-radius: 16px;
  border: 1px solid var(--border-glass-light);
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  color: var(--accent-primary);
  font-size: 1.05rem;
  cursor: pointer;
  transition: transform 150ms ease, border-color 180ms ease;
}

.crm-ds-icon-tile:hover {
  transform: translateY(-1px);
  border-color: var(--border-glass);
}

.crm-ds-stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.crm-ds-stat-card {
  min-height: 92px;
  padding: 16px;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.crm-ds-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-soft) 82%, transparent);
  border: 1px solid var(--border-glass-light);
}

.crm-ds-stat-value {
  margin: 0;
  font-size: 2rem;
  line-height: 1;
  font-weight: 800;
}

.crm-ds-stat-label {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.crm-ds-overview-row {
  display: grid;
  grid-template-columns: 1.05fr 1fr 1.1fr;
  gap: 12px;
}

.crm-ds-overview-card {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.crm-ds-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.crm-ds-panel-head h3 {
  margin: 0;
  font-size: 1.14rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.crm-ds-live-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72rem;
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.crm-ds-live-chip i {
  font-size: 0.52rem;
  color: var(--accent-primary);
}

.crm-ds-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.crm-ds-action-pill {
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border-glass-light);
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
}

.crm-ds-action-pill:hover {
  border-color: var(--border-glass);
  color: var(--text-primary);
}

.crm-ds-action-pill i {
  color: var(--accent-primary);
}

.crm-ds-feed {
  display: grid;
  gap: 8px;
}

.crm-ds-feed-item {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  padding: 9px 10px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
}

.crm-ds-feed-tag {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-dark));
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}

.crm-ds-feed-item p {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
}

.crm-ds-feed-item small {
  color: var(--text-tertiary);
  font-size: 0.74rem;
}

.crm-ds-tabs-mini {
  display: inline-flex;
  gap: 8px;
}

.crm-ds-tabs-mini .tab {
  height: 30px;
  font-size: 0.72rem;
  padding: 0 10px;
}

.crm-ds-release-bars {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 9px;
  align-items: end;
  height: 150px;
  margin-top: 6px;
}

.crm-ds-release-col {
  display: grid;
  justify-items: center;
  align-items: end;
  gap: 6px;
}

.crm-ds-release-col span {
  font-size: 0.76rem;
  color: var(--text-tertiary);
}

.crm-ds-release-bar {
  width: 100%;
  min-height: 20%;
  height: var(--h);
  border-radius: 12px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-light) 88%, transparent), color-mix(in srgb, var(--accent-primary) 60%, transparent));
  border: 1px solid color-mix(in srgb, var(--accent-primary) 42%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, #fff 16%, transparent);
}

.crm-ds-section {
  display: grid;
  gap: 12px;
}

.crm-ds-section-title {
  margin: 2px 0 0;
  padding: 0 2px;
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 2.5vw, 2.08rem);
  line-height: 1.18;
}

.crm-ds-catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.crm-ds-catalog-card {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.crm-ds-control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.crm-ds-control-row.center {
  justify-content: center;
}

.crm-ds-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.crm-ds-field-stack {
  display: grid;
  gap: 10px;
}

.crm-ds-field-stack.compact {
  gap: 8px;
}

.crm-ds-field-stack label {
  display: grid;
  gap: 5px;
}

.crm-ds-field-stack label span {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
}

.crm-ds-field-stack label small {
  font-size: 0.73rem;
  color: var(--text-tertiary);
}

.crm-ds-field-stack label.has-error .input-group,
.crm-ds-field-stack label.has-error .crm-ds-textarea {
  border-color: color-mix(in srgb, var(--danger) 55%, transparent);
}

.crm-ds-field-stack label.has-error small {
  color: var(--danger);
}

.crm-ds-textarea {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  padding: 10px 12px;
}

.crm-ds-textarea textarea {
  width: 100%;
  border: 0;
  resize: vertical;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.88rem;
}

.crm-ds-textarea textarea:focus {
  outline: none;
}

.crm-ds-notice-list {
  display: grid;
  gap: 8px;
}

.crm-ds-notice {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  padding: 9px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.crm-ds-notice p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.crm-ds-notice small {
  color: var(--text-tertiary);
  font-size: 0.73rem;
}

.crm-ds-notice.success p {
  color: var(--success);
}

.crm-ds-notice.warn p {
  color: var(--warning);
}

.crm-ds-notice.info p {
  color: var(--info);
}

.crm-ds-table-panel {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.crm-ds-conversation-list {
  display: grid;
  gap: 8px;
}

.crm-ds-conversation-item {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.crm-ds-conversation-item p {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
}

.crm-ds-conversation-item small {
  color: var(--text-tertiary);
  font-size: 0.74rem;
}

.crm-ds-conversation-item time {
  color: var(--text-tertiary);
  font-size: 0.82rem;
}

.crm-ds-stage {
  min-width: 48px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--accent-primary) 34%, transparent);
  background: color-mix(in srgb, var(--accent-soft) 84%, transparent);
  color: var(--accent-light);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.crm-ds-table-wrap {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  overflow: auto;
}

.crm-ds-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}

.crm-ds-table th,
.crm-ds-table td {
  text-align: left;
  border-bottom: 1px solid var(--border-glass-light);
  padding: 11px 12px;
  font-size: 0.89rem;
}

.crm-ds-table th {
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  background: color-mix(in srgb, var(--surface-soft) 92%, transparent);
}

.crm-ds-table tbody tr:last-child td {
  border-bottom: 0;
}

.crm-ds-states-panel {
  padding: 14px;
  display: grid;
  gap: 12px;
}

.crm-ds-state-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.crm-ds-state-item {
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  min-height: 130px;
  padding: 10px;
  display: grid;
  align-content: start;
  gap: 7px;
}

.crm-ds-state-title {
  font-size: 0.73rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}

.crm-ds-state-item p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.crm-ds-state-item p.error-text {
  color: var(--danger);
}

.crm-ds-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid color-mix(in srgb, var(--accent-soft) 75%, transparent);
  border-top-color: var(--accent-primary);
  border-radius: 999px;
  animation: crm-ds-spin 1s linear infinite;
}

@keyframes crm-ds-spin {
  to {
    transform: rotate(360deg);
  }
}

.crm-ds-skeleton-line {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--surface-soft) 76%, transparent), color-mix(in srgb, var(--surface-strong) 54%, transparent), color-mix(in srgb, var(--surface-soft) 76%, transparent));
  background-size: 220% 100%;
  animation: skeleton-shift 1.6s linear infinite;
}

.crm-ds-skeleton-line.short {
  width: 76%;
}

.crm-ds-modal-zone {
  min-height: 286px;
  border: 1px dashed color-mix(in srgb, var(--border-glass) 56%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-soft) 85%, transparent);
  padding: 16px;
  display: grid;
  place-items: center;
}

.crm-ds-modal-card {
  width: min(430px, 100%);
  border: 1px solid var(--border-glass-light);
  border-radius: 16px;
  background: color-mix(in srgb, var(--surface-glass-card) 98%, transparent);
  box-shadow: 0 26px 40px color-mix(in srgb, var(--bg-primary) 44%, transparent);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.crm-ds-modal-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.crm-ds-modal-card h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.crm-ds-modal-card footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.crm-ds-modal-closed {
  text-align: center;
  display: grid;
  gap: 10px;
}

.crm-ds-modal-closed p {
  margin: 0;
  color: var(--text-secondary);
}

.crm-ds-placeholder-panel {
  min-height: 192px;
  padding: 18px;
  border-style: dashed;
  display: grid;
  place-items: center;
  text-align: center;
  gap: 9px;
}

.crm-ds-placeholder-panel > i {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--accent-primary);
  border: 1px solid var(--border-glass-light);
  background: color-mix(in srgb, var(--accent-soft) 86%, transparent);
}

.crm-ds-placeholder-panel h3 {
  margin: 0;
  font-size: 1.75rem;
  font-family: var(--font-display);
}

.crm-ds-placeholder-panel p {
  margin: 0;
  color: var(--text-secondary);
  max-width: 680px;
}

.crm-ds-coverage-panel {
  padding: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.crm-ds-coverage-chip {
  min-height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border-glass-light);
  background: color-mix(in srgb, var(--surface-soft) 96%, transparent);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-size: 0.86rem;
  font-weight: 600;
}

.crm-ds-coverage-chip i {
  color: var(--accent-primary);
  font-size: 0.8rem;
}

.crm-ds-palette-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.crm-ds-palette-card {
  border: 1px solid var(--border-glass-light);
  border-radius: 14px;
  background: color-mix(in srgb, var(--surface-soft) 95%, transparent);
  padding: 10px;
  display: grid;
  gap: 8px;
}

.crm-ds-palette-swatch {
  height: 40px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--text-primary) 14%, transparent);
}

.crm-ds-palette-card p {
  margin: 0;
  font-size: 0.76rem;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
}

.crm-ds-palette-card strong {
  font-size: 0.88rem;
}

/* ===== Responsive ===== */
.menu-toggle {
  display: none;
}

@media (max-width: 1280px) {
  .bento-item {
    grid-column: span 4;
  }

  .hero-card {
    grid-column: span 8;
  }

  .showcase-card {
    grid-column: span 6;
  }

  .showcase-card.wide {
    grid-column: span 12;
  }

  .ds-card {
    grid-column: span 6;
  }

  .ds-card.wide,
  .ds-card.full {
    grid-column: span 12;
  }

  .crm-ds-overview-row {
    grid-template-columns: 1fr;
  }

  .crm-ds-catalog-grid {
    grid-template-columns: 1fr;
  }

  .crm-ds-state-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .crm-ds-palette-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .app {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    padding: 0;
    transform: translateX(-8px);
    overflow: hidden;
    z-index: 20;
  }

  .sidebar.mobile-open {
    width: min(246px, calc(100vw - 60px));
    padding: 18px;
    transform: translateX(0);
  }

  .sidebar.mobile-open.collapsed {
    width: 74px;
    padding: 12px 10px;
  }

  .menu-toggle {
    display: inline-flex;
  }

  .header {
    align-items: center;
  }

  .main {
    padding: 18px 14px 22px;
  }

  .bento-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .hero-card {
    grid-column: span 6;
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 66px;
  }

  .actions-card,
  .activity-card,
  .chart-card {
    grid-column: span 3;
  }

  .showcase-grid,
  .ds-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .showcase-card,
  .showcase-card.wide,
  .ds-card,
  .ds-card.wide,
  .ds-card.full {
    grid-column: span 6;
  }

  .ds-toolbar {
    grid-template-columns: 1fr;
  }

  .ds-states,
  .ds-stat-row {
    grid-template-columns: 1fr;
  }

  .crm-ds-hero {
    grid-template-columns: 1fr;
  }

  .crm-ds-hero-side {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-content: stretch;
  }

  .crm-ds-stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .action-btn.primary span {
    display: none;
  }

  .bento-grid,
  .showcase-grid,
  .ds-grid {
    grid-template-columns: 1fr;
  }

  .hero-card,
  .bento-item,
  .actions-card,
  .activity-card,
  .chart-card,
  .showcase-card,
  .showcase-card.wide,
  .ds-card,
  .ds-card.wide,
  .ds-card.full {
    grid-column: span 1;
  }

  .quick-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-visual {
    display: none;
  }

  .inquiries-message-bubble {
    max-width: 92%;
  }

  .ds-table {
    min-width: 600px;
  }

  .crm-ds-state-grid,
  .crm-ds-stats-row,
  .crm-ds-palette-grid {
    grid-template-columns: 1fr;
  }

  .crm-ds-conversation-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .crm-ds-conversation-item time {
    justify-self: start;
  }
}

@media (min-width: 981px) {
  .sidebar-overlay {
    display: none;
  }
}
`
