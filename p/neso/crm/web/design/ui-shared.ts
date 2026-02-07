export const uiSharedStyles = `
.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  animation: overlay-in 0.25s ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.menu-toggle {
  display: none;
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
    padding: 24px 16px;
  }
}

@media (max-width: 600px) {
  .menu-toggle {
    position: absolute;
    top: 0;
    left: 0;
    margin-right: 0;
  }
}
`
