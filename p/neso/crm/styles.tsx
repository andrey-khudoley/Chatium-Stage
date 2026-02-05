// @shared
// Дизайн-система Tarot Vision (тёмная тема): тёмный фон, светло-зелёные и золотые акценты. Шрифты Old Standard TT + Mulish.

/** CSS-переменные тёмной палитры по брендбуку (тёмный основной фон, светло-зелёный и золотой акценты). */
export const designTokens = `
  :root {
    /* Основной фон — тёмный (глубокий тёмно-зелёный / charcoal) */
    --color-bg: #131321;
    --color-bg-secondary: #1a1e2e;
    --color-bg-tertiary: #222838;

    /* Светло-зелёный/бирюзовый акцент (primary) */
    --color-green: #46F0D2;
    --color-green-medium: #5ef5dc;
    --color-green-light: #7df8e4;
    --color-green-pale: rgba(70, 240, 210, 0.15);

    /* Золотой акцент (брендбук, secondary) */
    --color-gold-dark: #CD9443;
    --color-gold: #FDC760;
    --color-gold-medium: #FDD88E;
    --color-gold-light: #FBE2B4;
    --color-gold-cream: rgba(251, 226, 180, 0.12);
    --color-gold-pale: rgba(253, 199, 96, 0.2);

    /* Текст на тёмном */
    --color-text: #ffffff;
    --color-text-secondary: #b0b4c0;
    --color-text-tertiary: #7a7e8c;

    /* Границы и акценты */
    --color-border: #2a2e3e;
    --color-border-light: #363a4a;
    --color-accent: var(--color-green);
    --color-accent-hover: var(--color-green-medium);
    --color-accent-alt: var(--color-gold);
    --color-accent-alt-hover: var(--color-gold-medium);
    --color-btn-primary-text: #131321;
  }

  body {
    font-family: 'Mulish', system-ui, sans-serif;
    margin: 0;
    background: var(--color-bg);
    color: var(--color-text);
    letter-spacing: 0.02em;
  }

  ::selection {
    background: var(--color-green-pale);
    color: var(--color-text);
  }

  ::-moz-selection {
    background: var(--color-green-pale);
    color: var(--color-text);
  }
`

export const baseHtmlStyles = `
  body {
    height: 100%;
    width: 100%;
    background-color: var(--color-bg);
  }
`

/** Стили скроллбара для тёмной темы (светло-зелёный акцент). */
export const customScrollbarStyles = `
  @supports not selector(::-webkit-scrollbar) {
    body,
    .content-wrapper,
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: var(--color-green) var(--color-bg-secondary);
    }
  }
  body::-webkit-scrollbar,
  .content-wrapper::-webkit-scrollbar,
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .content-wrapper::-webkit-scrollbar-track,
  .custom-scrollbar::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb,
  .content-wrapper::-webkit-scrollbar-thumb,
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-green);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .content-wrapper::-webkit-scrollbar-thumb:hover,
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: var(--color-green-medium);
  }
  body::-webkit-scrollbar-thumb:active,
  .content-wrapper::-webkit-scrollbar-thumb:active,
  .custom-scrollbar::-webkit-scrollbar-thumb:active {
    background: var(--color-green-light);
  }
`

/** Переопределение переменных для светлой темы (класс .theme-light на контейнере). */
export const lightThemeOverrides = `
  .theme-light {
    --color-bg: #ffffff;
    --color-bg-secondary: #f7f8f9;
    --color-bg-tertiary: #eef0f2;
    --color-green: #1a5c3a;
    --color-green-medium: #2d6a4f;
    --color-green-light: #40916c;
    --color-green-pale: rgba(26, 92, 58, 0.12);
    --color-gold-dark: #AB701C;
    --color-gold: #FDC760;
    --color-gold-medium: #CD9443;
    --color-gold-light: #FDD88E;
    --color-gold-cream: #FFFEE5;
    --color-gold-pale: rgba(253, 199, 96, 0.2);
    --color-text: #1a2e1f;
    --color-text-secondary: #4a5c52;
    --color-text-tertiary: #6b7c72;
    --color-border: #e2e6e9;
    --color-border-light: #ebeeef;
    --color-btn-primary-text: #ffffff;
    --color-sidebar-bg: rgba(255, 255, 255, 0.98);
    --color-sidebar-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
    --color-card-glass-bg: rgba(255, 255, 255, 0.85);
    --color-card-glass-border: rgba(0, 0, 0, 0.08);
    --color-sidebar-hover: rgba(0, 0, 0, 0.04);
    --color-sidebar-active-bg: rgba(26, 92, 58, 0.12);
  }
`
