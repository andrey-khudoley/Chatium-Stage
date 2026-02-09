// @shared

export function getCrmGlobalStyles(): string {
  return `
    :root {
      --crm-bg: #070a12;
      --crm-bgAlt: #0e1321;
      --crm-surface: #131a2b;
      --crm-surfaceRaised: #1a233a;
      --crm-border: #2a3550;
      --crm-borderStrong: #3b4b71;
      --crm-text: #f2f6ff;
      --crm-textMuted: #c4cee5;
      --crm-textDim: #8e9abc;
      --crm-accent: #4da3ff;
      --crm-accentStrong: #1a7cff;
      --crm-accentSoft: rgba(77, 163, 255, 0.2);
      --crm-success: #36d399;
      --crm-warning: #f7b955;
      --crm-danger: #ff6b7f;
      --crm-info: #7dd3fc;
      --crm-shadow: rgba(2, 6, 23, 0.55);

      --crm-density-scale: 1;
      --crm-table-density-scale: 1;
      --crm-radius-scale: 1;
      --crm-shadow-scale: 1;
      --crm-element-scale: 1;

      --crm-font-heading: 'Space Grotesk', sans-serif;
      --crm-font-body: 'Manrope', sans-serif;
      --crm-font-tables: 'JetBrains Mono', monospace;
      --crm-font-forms: 'Manrope', sans-serif;
      --crm-font-navigation: 'Inter', sans-serif;

      --crm-radius-xs: calc(6px * var(--crm-radius-scale));
      --crm-radius-sm: calc(10px * var(--crm-radius-scale));
      --crm-radius-md: calc(14px * var(--crm-radius-scale));
      --crm-radius-lg: calc(18px * var(--crm-radius-scale));
      --crm-radius-xl: calc(24px * var(--crm-radius-scale));

      --crm-space-1: calc(4px * var(--crm-density-scale));
      --crm-space-2: calc(8px * var(--crm-density-scale));
      --crm-space-3: calc(12px * var(--crm-density-scale));
      --crm-space-4: calc(16px * var(--crm-density-scale));
      --crm-space-5: calc(20px * var(--crm-density-scale));
      --crm-space-6: calc(24px * var(--crm-density-scale));
      --crm-space-8: calc(32px * var(--crm-density-scale));
      --crm-space-10: calc(40px * var(--crm-density-scale));
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      min-height: 100%;
      background: var(--crm-bg);
      color: var(--crm-text);
      font-family: var(--crm-font-body);
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    body {
      background-image:
        radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--crm-accent) 30%, transparent) 0%, transparent 28%),
        radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--crm-info) 28%, transparent) 0%, transparent 25%),
        linear-gradient(180deg, var(--crm-bgAlt) 0%, var(--crm-bg) 100%);
      background-attachment: fixed;
      overflow-x: hidden;
    }

    body.boot-complete {
      overflow-y: auto;
    }

    a {
      color: inherit;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 0;
      color: var(--crm-text);
      font-family: var(--crm-font-heading);
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    p {
      margin: 0;
      color: var(--crm-textMuted);
      line-height: 1.5;
    }

    code,
    pre,
    .crm-font-mono {
      font-family: var(--crm-font-tables);
    }

    .crm-app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }

    .crm-page {
      width: min(1400px, 100% - 2.5rem);
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-6);
      padding-bottom: var(--crm-space-8);
    }

    .crm-hero {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: var(--crm-space-4);
      align-items: stretch;
    }

    .crm-grid {
      display: grid;
      gap: var(--crm-space-4);
    }

    .crm-grid.crm-grid-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .crm-grid.crm-grid-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .crm-grid.crm-grid-4 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .crm-surface {
      background: color-mix(in srgb, var(--crm-surface) 92%, var(--crm-bgAlt) 8%);
      border: 1px solid var(--crm-border);
      border-radius: var(--crm-radius-lg);
      box-shadow:
        0 calc(16px * var(--crm-shadow-scale)) calc(40px * var(--crm-shadow-scale)) color-mix(in srgb, var(--crm-shadow) 78%, transparent),
        inset 0 1px 0 color-mix(in srgb, white 10%, transparent);
      backdrop-filter: blur(12px);
    }

    .crm-surface-raised {
      background: color-mix(in srgb, var(--crm-surfaceRaised) 90%, var(--crm-bgAlt) 10%);
      border: 1px solid var(--crm-borderStrong);
      border-radius: var(--crm-radius-lg);
      box-shadow:
        0 calc(22px * var(--crm-shadow-scale)) calc(42px * var(--crm-shadow-scale)) color-mix(in srgb, var(--crm-shadow) 70%, transparent),
        inset 0 1px 0 color-mix(in srgb, white 9%, transparent);
    }

    .crm-card {
      padding: var(--crm-space-5);
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-4);
      position: relative;
      overflow: hidden;
    }

    .crm-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, var(--crm-accent) 46%, transparent 100%);
      opacity: 0.8;
      pointer-events: none;
    }

    .crm-card-title {
      display: flex;
      align-items: center;
      gap: var(--crm-space-2);
      justify-content: space-between;
      margin-bottom: var(--crm-space-2);
    }

    .crm-card-title h2 {
      font-size: clamp(1rem, 1.5vw, 1.2rem);
    }

    .crm-card-subtitle {
      color: var(--crm-textDim);
      font-size: 0.88rem;
    }

    .crm-kpi {
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-2);
      padding: var(--crm-space-4);
      border-radius: var(--crm-radius-md);
      border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 65%, transparent);
      background: color-mix(in srgb, var(--crm-surfaceRaised) 88%, transparent);
    }

    .crm-kpi-value {
      font-size: clamp(1.2rem, 2.2vw, 1.8rem);
      font-weight: 700;
      color: var(--crm-text);
      font-variant-numeric: tabular-nums;
    }

    .crm-kpi-label {
      color: var(--crm-textDim);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .crm-stack {
      display: flex;
      flex-direction: column;
      gap: var(--crm-space-3);
    }

    .crm-inline {
      display: inline-flex;
      align-items: center;
      gap: var(--crm-space-2);
    }

    .crm-row {
      display: flex;
      align-items: center;
      gap: var(--crm-space-3);
      flex-wrap: wrap;
    }

    .crm-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.34rem 0.72rem;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 65%, transparent);
      background: color-mix(in srgb, var(--crm-accentSoft) 42%, transparent);
      color: var(--crm-textMuted);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .crm-chip.is-success { color: var(--crm-success); }
    .crm-chip.is-warning { color: var(--crm-warning); }
    .crm-chip.is-danger { color: var(--crm-danger); }
    .crm-chip.is-info { color: var(--crm-info); }

    .crm-btn {
      border: 1px solid transparent;
      border-radius: var(--crm-radius-sm);
      padding: calc(0.66rem * var(--crm-element-scale)) calc(0.92rem * var(--crm-element-scale));
      font-family: var(--crm-font-navigation);
      font-size: 0.86rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: transform 0.16s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      min-height: calc(2.3rem * var(--crm-element-scale));
    }

    .crm-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    .crm-btn-primary {
      color: #fff;
      background: linear-gradient(135deg, var(--crm-accent) 0%, var(--crm-accentStrong) 100%);
      box-shadow: 0 8px 20px color-mix(in srgb, var(--crm-accent) 35%, transparent);
    }

    .crm-btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px color-mix(in srgb, var(--crm-accent) 44%, transparent);
    }

    .crm-btn-ghost {
      color: var(--crm-textMuted);
      border-color: color-mix(in srgb, var(--crm-borderStrong) 72%, transparent);
      background: color-mix(in srgb, var(--crm-surfaceRaised) 70%, transparent);
    }

    .crm-btn-ghost:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: var(--crm-accent);
      color: var(--crm-text);
      background: color-mix(in srgb, var(--crm-accentSoft) 30%, transparent);
    }

    .crm-btn-danger {
      color: #fff;
      border-color: color-mix(in srgb, var(--crm-danger) 80%, transparent);
      background: linear-gradient(120deg, color-mix(in srgb, var(--crm-danger) 86%, black 14%) 0%, var(--crm-danger) 100%);
    }

    .crm-input,
    .crm-select,
    .crm-textarea {
      width: 100%;
      border-radius: var(--crm-radius-sm);
      border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 75%, transparent);
      background: color-mix(in srgb, var(--crm-surfaceRaised) 88%, transparent);
      color: var(--crm-text);
      font-family: var(--crm-font-forms);
      font-size: 0.9rem;
      padding: calc(0.65rem * var(--crm-element-scale)) calc(0.75rem * var(--crm-element-scale));
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }

    .crm-input:focus,
    .crm-select:focus,
    .crm-textarea:focus {
      outline: none;
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--crm-accentSoft) 58%, transparent);
    }

    .crm-textarea {
      min-height: 8rem;
      resize: vertical;
      line-height: 1.5;
    }

    .crm-field {
      display: flex;
      flex-direction: column;
      gap: 0.42rem;
    }

    .crm-field-label {
      color: var(--crm-textDim);
      font-size: 0.77rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 600;
    }

    .crm-muted {
      color: var(--crm-textDim);
      font-size: 0.82rem;
    }

    .crm-divider {
      width: 100%;
      height: 1px;
      border: 0;
      background: color-mix(in srgb, var(--crm-borderStrong) 68%, transparent);
      margin: 0;
    }

    .crm-status-success { color: var(--crm-success); }
    .crm-status-warning { color: var(--crm-warning); }
    .crm-status-danger { color: var(--crm-danger); }
    .crm-status-info { color: var(--crm-info); }

    .crm-loading-shimmer {
      position: relative;
      overflow: hidden;
      background: color-mix(in srgb, var(--crm-surfaceRaised) 82%, transparent);
    }

    .crm-loading-shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.12) 45%, transparent 100%);
      transform: translateX(-100%);
      animation: crm-shimmer 1.4s linear infinite;
    }

    .crm-reveal {
      animation: crm-reveal 0.35s ease both;
    }

    @keyframes crm-reveal {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes crm-shimmer {
      to {
        transform: translateX(100%);
      }
    }

    @supports not selector(::-webkit-scrollbar) {
      body,
      .crm-scroll {
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--crm-accent) 45%, transparent) color-mix(in srgb, var(--crm-bgAlt) 70%, transparent);
      }
    }

    body::-webkit-scrollbar,
    .crm-scroll::-webkit-scrollbar {
      width: 9px;
      height: 9px;
    }

    body::-webkit-scrollbar-track,
    .crm-scroll::-webkit-scrollbar-track {
      background: color-mix(in srgb, var(--crm-bgAlt) 76%, transparent);
    }

    body::-webkit-scrollbar-thumb,
    .crm-scroll::-webkit-scrollbar-thumb {
      border-radius: 99px;
      background: color-mix(in srgb, var(--crm-accent) 55%, transparent);
    }

    body::-webkit-scrollbar-thumb:hover,
    .crm-scroll::-webkit-scrollbar-thumb:hover {
      background: color-mix(in srgb, var(--crm-accentStrong) 74%, transparent);
    }

    @media (max-width: 1100px) {
      .crm-hero {
        grid-template-columns: 1fr;
      }

      .crm-grid.crm-grid-4,
      .crm-grid.crm-grid-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      .crm-page {
        width: min(100% - 1rem, 1200px);
        gap: var(--crm-space-4);
      }

      .crm-grid.crm-grid-2,
      .crm-grid.crm-grid-3,
      .crm-grid.crm-grid-4 {
        grid-template-columns: 1fr;
      }

      .crm-card {
        padding: var(--crm-space-4);
      }
    }
  `
}
