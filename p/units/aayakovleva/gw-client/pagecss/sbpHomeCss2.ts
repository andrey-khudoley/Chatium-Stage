// @shared
export const sbpHomeCss2 = `
/* date filter */
.date-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
  flex-wrap: wrap;
  min-width: 0;
}
.date-filter-icon {
  color: var(--color-accent);
  font-size: 0.8rem;
}
.date-filter-field {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.date-filter-cap {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.date-filter-input {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border-light);
  padding: 0.2rem 0.4rem;
  font-size: 0.7rem;
  font-family: inherit;
  color-scheme: dark;
}
.date-filter-sep {
  color: var(--color-text-tertiary);
}
.date-filter-reset {
  white-space: nowrap;
}
.date-filter-error {
  color: #f0a0a0;
  font-size: 0.68rem;
  max-width: 220px;
}

/* quick search */
.quick-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 200px;
  max-width: 480px;
  min-width: 0;
}
.quick-search-icon {
  position: absolute;
  left: 0.6rem;
  color: var(--color-text-tertiary);
  font-size: 0.75rem;
  pointer-events: none;
}
.quick-search-input {
  background: var(--color-bg);
  color: var(--color-text);
  border: 1px solid var(--color-border-light);
  padding: 0.35rem 1.85rem 0.35rem 1.85rem;
  font-family: inherit;
  letter-spacing: inherit;
  font-size: 0.75rem;
  width: 100%;
  min-width: 0;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.quick-search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px rgba(211, 35, 75, 0.25);
}
.quick-search-clear {
  position: absolute;
  right: 0.35rem;
  background: transparent;
  border: 0;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.15rem 0.35rem;
}
.quick-search-clear:hover {
  color: var(--color-accent);
}

/* ===================== PANEL SECTIONS ===================== */
.panel-section {
  position: relative;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid var(--color-border);
  padding: 1.25rem 1.25rem 1rem;
  clip-path: polygon(
    0 4px,
    4px 4px,
    4px 0,
    calc(100% - 4px) 0,
    calc(100% - 4px) 4px,
    100% 4px,
    100% calc(100% - 4px),
    calc(100% - 4px) calc(100% - 4px),
    calc(100% - 4px) 100%,
    4px 100%,
    4px calc(100% - 4px),
    0 calc(100% - 4px)
  );
}
.panel-section::before,
.panel-section::after {
  content: '';
  position: absolute;
  top: 8px;
  width: 16px;
  height: 16px;
  border-top: 2px solid rgba(211, 35, 75, 0.35);
  pointer-events: none;
}
.panel-section::before {
  left: 8px;
  border-left: 2px solid rgba(211, 35, 75, 0.35);
}
.panel-section::after {
  right: 8px;
  border-right: 2px solid rgba(211, 35, 75, 0.35);
}

.panel-section-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.85rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.panel-section-head h2 {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-accent);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 0 5px rgba(211, 35, 75, 0.25);
}
.panel-section-head .prompt {
  color: var(--color-accent);
  font-size: 1.1rem;
  line-height: 1;
}
.panel-section-head .head-action {
  margin-left: auto;
}
.panel-section-head .head-meta {
  margin-left: auto;
  font-size: 0.7rem;
}
.updated-since {
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  margin-left: 0.6rem;
}
.search-h3 {
  margin: 1rem 0 0.5rem;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* search result section accent */
.search-result-section {
  border-color: var(--color-accent);
}
.search-result-section::before,
.search-result-section::after {
  border-color: var(--color-accent);
}
.search-query {
  margin-left: 0.4rem;
  font-size: 0.7rem;
  color: var(--color-text);
  background: var(--color-bg);
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--color-border);
}

/* ===================== KPI ===================== */
.manager-summary {
  margin-bottom: 1.1rem;
}
.admin-summary {
  margin-bottom: 1.1rem;
}
.admin-summary .kpi-grid + .kpi-grid {
  margin-top: 0.9rem;
}
.summary-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.7rem;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text);
}
.summary-title .prompt {
  color: var(--color-accent);
}
.summary-period {
  margin-left: 0.5rem;
  font-size: 0.72rem;
  text-transform: none;
  letter-spacing: normal;
  color: var(--color-accent);
  font-weight: normal;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;
}
.kpi-grid-secondary {
  grid-template-columns: repeat(4, 1fr);
}
.kpi-card {
  position: relative;
  background: rgba(20, 20, 20, 0.65);
  border: 1px solid var(--color-border);
  padding: 1.1rem 1.25rem;
  overflow: hidden;
  clip-path: polygon(
    0 4px,
    4px 4px,
    4px 0,
    calc(100% - 4px) 0,
    calc(100% - 4px) 4px,
    100% 4px,
    100% calc(100% - 4px),
    calc(100% - 4px) calc(100% - 4px),
    calc(100% - 4px) 100%,
    4px 100%,
    4px calc(100% - 4px),
    0 calc(100% - 4px)
  );
}
.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.08) 0px,
    rgba(0, 0, 0, 0.08) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 0;
}
.kpi-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0.5;
}
.kpi-icon,
.kpi-label,
.kpi-value {
  position: relative;
  z-index: 1;
}
.kpi-icon {
  font-size: 1rem;
  color: var(--color-accent);
  margin-bottom: 0.4rem;
}
.kpi-label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.kpi-value {
  font-size: 1.85rem;
  color: var(--color-text);
  margin-top: 0.3rem;
  text-shadow: 0 0 8px rgba(232, 232, 232, 0.2);
  line-height: 1;
}
.kpi-unit {
  font-size: 0.85rem;
  color: var(--color-text-tertiary);
  margin-left: 0.2rem;
}
.kpi-success .kpi-icon {
  color: #6aaf7e;
}
.kpi-success .kpi-value {
  text-shadow: 0 0 8px rgba(106, 175, 126, 0.25);
}

.stat-card {
  position: relative;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  padding: 0.7rem 0.85rem;
  overflow: hidden;
  clip-path: polygon(
    0 3px,
    3px 3px,
    3px 0,
    calc(100% - 3px) 0,
    calc(100% - 3px) 3px,
    100% 3px,
    100% calc(100% - 3px),
    calc(100% - 3px) calc(100% - 3px),
    calc(100% - 3px) 100%,
    3px 100%,
    3px calc(100% - 3px),
    0 calc(100% - 3px)
  );
}
.stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  opacity: 0.35;
}
.stat-label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.stat-label i {
  margin-right: 0.3rem;
  color: var(--color-accent);
  opacity: 0.85;
}
.stat-value {
  font-size: 1.2rem;
  color: var(--color-text);
  margin-top: 0.15rem;
  line-height: 1.1;
}
.stat-value.small {
  font-size: 0.95rem;
}
.stat-unit {
  font-size: 0.7rem;
  color: var(--color-text-tertiary);
  margin-left: 0.15rem;
}
`
