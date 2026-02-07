// Generated from design demo tokens/styles

export const darkThemeTokens = `

  :root {
    /* Фоны — глубокая тьма ночного леса */
    --bg-primary: #070b0d;
    --bg-secondary: #0d1214;
    --bg-elevated: #121a1d;
    
    /* Glassmorphism поверхности */
    --surface-glass: rgba(20, 35, 30, 0.4);
    --surface-glass-hover: rgba(25, 45, 38, 0.55);
    --border-glass: rgba(146, 164, 71, 0.12);
    --border-glass-light: rgba(255, 255, 255, 0.06);
    
    /* Текст */
    --text-primary: #f0f2ed;
    --text-secondary: rgba(240, 242, 237, 0.7);
    --text-tertiary: rgba(240, 242, 237, 0.45);
    
    /* Акценты — природная зелень */
    --accent-primary: #92a447;
    --accent-light: #a5b568;
    --accent-dark: #77884c;
    --accent-glow: rgba(146, 164, 71, 0.35);
    --accent-soft: rgba(146, 164, 71, 0.15);
    
    /* Биолюминесцентное свечение */
    --glow-ambient: rgba(100, 140, 90, 0.08);
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

export const darkPageStyles = `

  html { 
    margin: 0; 
    background: #070b0d;
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
    .main {
      scrollbar-width: thin;
      scrollbar-color: rgba(146, 164, 71, 0.25) rgba(7, 11, 13, 0.5);
    }
  }
  body::-webkit-scrollbar,
  .main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .main::-webkit-scrollbar-track {
    background: rgba(7, 11, 13, 0.5);
  }
  body::-webkit-scrollbar-thumb,
  .main::-webkit-scrollbar-thumb {
    background: rgba(146, 164, 71, 0.2);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .main::-webkit-scrollbar-thumb:hover {
    background: rgba(146, 164, 71, 0.35);
  }

`

export const lightThemeTokens = `

  :root {
    /* Фоны — мягкий кремовый свет */
    --bg-primary: #f5f8f0;
    --bg-secondary: #eef2e6;
    --bg-elevated: #ffffff;
    
    /* Glassmorphism поверхности */
    --surface-glass: rgba(255, 255, 255, 0.55);
    --surface-glass-hover: rgba(255, 255, 255, 0.75);
    --border-glass: rgba(74, 90, 36, 0.1);
    --border-glass-light: rgba(255, 255, 255, 0.8);
    
    /* Текст */
    --text-primary: #1a2518;
    --text-secondary: #3d4a35;
    --text-tertiary: #5a6652;
    
    /* Акценты — насыщенная зелень */
    --accent-primary: #4a5a24;
    --accent-light: #5d6d2e;
    --accent-dark: #3a4a1a;
    --accent-glow: rgba(74, 90, 36, 0.2);
    --accent-soft: rgba(74, 90, 36, 0.08);
    
    /* Солнечные лучи */
    --sunray: rgba(255, 252, 240, 0.9);
    --sunray-glow: rgba(255, 248, 230, 0.6);
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

export const lightPageStyles = `

  html { 
    margin: 0; 
    background: #f5f8f0;
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

export const lightScrollbarStyles = `

  @supports not selector(::-webkit-scrollbar) {
    body,
    .main {
      scrollbar-width: thin;
      scrollbar-color: rgba(74, 90, 36, 0.2) rgba(238, 242, 230, 0.8);
    }
  }
  body::-webkit-scrollbar,
  .main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .main::-webkit-scrollbar-track {
    background: rgba(238, 242, 230, 0.8);
  }
  body::-webkit-scrollbar-thumb,
  .main::-webkit-scrollbar-thumb {
    background: rgba(74, 90, 36, 0.18);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .main::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 90, 36, 0.3);
  }

`
