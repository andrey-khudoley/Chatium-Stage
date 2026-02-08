// @shared
// Общие стили страницы: токены темы, база html/body, скроллбар.
// Единственный источник правды — подключается через роут (SSR) и/или компонент DcThemeGlobalStyles.

export const darkThemeTokens = `
  :root {
    --bg-primary: #05080a;
    --bg-secondary: #0d1214;
    --surface: #11191b;
    --accent: #afc45f;
    --accent-deep: #6f8440;
    --text-primary: #eef4eb;
    --accent-glow: rgba(175, 196, 95, 0.25);
  }

  body {
    font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    background: var(--bg-primary);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background: var(--accent-glow);
    color: var(--text-primary);
  }
`

export const lightThemeTokens = `
  :root {
    --bg-primary: #f2eedf;
    --bg-secondary: #e8e2ce;
    --surface: #f9f5ea;
    --surface-soft: rgba(250, 247, 238, 0.88);
    --surface-muted: rgba(238, 232, 214, 0.82);
    --accent: #4f6f2f;
    --accent-deep: #3d5525;
    --text-primary: #1f2f1d;
    --text-secondary: #34432f;
    --text-tertiary: #55624f;
    --border-subtle: rgba(79, 111, 47, 0.2);
    --border-strong: rgba(79, 111, 47, 0.3);
    --accent-glow: rgba(79, 111, 47, 0.26);
  }

  body {
    font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    background: var(--bg-primary);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background: var(--accent-glow);
    color: var(--text-primary);
  }
`

export const pageStyles = `
  html {
    margin: 0;
    background: var(--bg-primary, #05080a);
  }
  body {
    margin: 0;
    position: relative;
    min-height: 100vh;
    overflow: hidden;
  }
  body.boot-complete {
    overflow-x: hidden;
    overflow-y: auto;
  }
`

export const darkScrollbarStyles = `
  @supports not selector(::-webkit-scrollbar) {
    body,
    .dc-main {
      scrollbar-width: thin;
      scrollbar-color: rgba(175, 196, 95, 0.25) rgba(5, 8, 10, 0.5);
    }
  }
  body::-webkit-scrollbar,
  .dc-main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .dc-main::-webkit-scrollbar-track {
    background: rgba(5, 8, 10, 0.5);
  }
  body::-webkit-scrollbar-thumb,
  .dc-main::-webkit-scrollbar-thumb {
    background: rgba(175, 196, 95, 0.2);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .dc-main::-webkit-scrollbar-thumb:hover {
    background: rgba(175, 196, 95, 0.35);
  }
`

export const lightScrollbarStyles = `
  @supports not selector(::-webkit-scrollbar) {
    body,
    .dc-main {
      scrollbar-width: thin;
      scrollbar-color: rgba(79, 111, 47, 0.3) rgba(232, 226, 206, 0.78);
    }
  }
  body::-webkit-scrollbar,
  .dc-main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .dc-main::-webkit-scrollbar-track {
    background: rgba(232, 226, 206, 0.78);
  }
  body::-webkit-scrollbar-thumb,
  .dc-main::-webkit-scrollbar-thumb {
    background: rgba(79, 111, 47, 0.26);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .dc-main::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 111, 47, 0.44);
  }
`

const ID_THEME_GLOBAL = 'dc-theme-global'

function getThemeTokens(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? darkThemeTokens : lightThemeTokens
}

function getScrollbarStyles(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? darkScrollbarStyles : lightScrollbarStyles
}

/** Полный блок общих стилей страницы для данной темы (для SSR и для компонента). Только токены, база html/body, скроллбар — без стилей компонентов. */
export function getGlobalThemeStyles(theme: 'dark' | 'light'): string {
  return [
    getThemeTokens(theme),
    pageStyles,
    getScrollbarStyles(theme)
  ].join('\n')
}

/** Id тега стилей, чтобы компонент не дублировал, если роут уже вставил стили */
export function getThemeStyleElementId(): string {
  return ID_THEME_GLOBAL
}
