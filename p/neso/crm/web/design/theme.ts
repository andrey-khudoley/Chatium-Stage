export const darkThemeTokens = `

  :root {
    color-scheme: dark;

    --bg-primary: #05080a;
    --bg-secondary: #0b1013;
    --bg-elevated: #11191b;

    --surface-glass: rgba(8, 13, 14, 0.8);
    --surface-glass-hover: rgba(13, 22, 21, 0.9);
    --surface-glass-card: rgba(5, 9, 10, 0.86);
    --surface-soft: rgba(15, 24, 22, 0.68);
    --surface-strong: rgba(28, 42, 39, 0.8);

    --border-glass: rgba(175, 196, 95, 0.34);
    --border-glass-light: rgba(238, 244, 235, 0.14);

    --text-primary: #eef4eb;
    --text-secondary: rgba(238, 244, 235, 0.78);
    --text-tertiary: rgba(238, 244, 235, 0.52);

    --accent-primary: #afc45f;
    --accent-light: #c5d879;
    --accent-dark: #6f8440;
    --accent-glow: rgba(175, 196, 95, 0.34);
    --accent-soft: rgba(175, 196, 95, 0.16);

    --success: #9dbf62;
    --warning: #d4aa58;
    --danger: #dd7367;
    --info: #78aaca;

    --shadow-soft: 0 18px 46px rgba(0, 0, 0, 0.54);
    --shadow-focus: 0 0 0 3px rgba(175, 196, 95, 0.26);

    --radius-lg: 22px;
    --radius-md: 16px;
    --radius-sm: 12px;
    --radius-xs: 10px;

    --font-sans: 'Manrope', 'Segoe UI', sans-serif;
    --font-display: 'Fraunces', 'Times New Roman', serif;
  }

  body {
    margin: 0;
    color: var(--text-primary);
    background: var(--bg-primary);
    font-family: var(--font-sans);
    font-feature-settings: 'liga' 1, 'cv03' 1, 'cv04' 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  *:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  ::selection {
    color: var(--text-primary);
    background: var(--accent-glow);
  }

`

export const darkPageStyles = `

  html {
    margin: 0;
    background:
      radial-gradient(circle at 10% -10%, rgba(175, 196, 95, 0.2), transparent 45%),
      radial-gradient(circle at 88% 2%, rgba(56, 77, 70, 0.32), transparent 52%),
      #05080a;
  }

  body {
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
    .main,
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(175, 196, 95, 0.34) rgba(5, 8, 10, 0.72);
    }
  }

  body::-webkit-scrollbar,
  .main::-webkit-scrollbar,
  .custom-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  body::-webkit-scrollbar-track,
  .main::-webkit-scrollbar-track,
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(5, 8, 10, 0.72);
  }

  body::-webkit-scrollbar-thumb,
  .main::-webkit-scrollbar-thumb,
  .custom-scrollbar::-webkit-scrollbar-thumb {
    border-radius: 999px;
    border: 2px solid rgba(5, 8, 10, 0.72);
    background: rgba(175, 196, 95, 0.34);
  }

  body::-webkit-scrollbar-thumb:hover,
  .main::-webkit-scrollbar-thumb:hover,
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(175, 196, 95, 0.48);
  }

`

export const lightThemeTokens = `

  :root {
    color-scheme: light;

    --bg-primary: #f8fbe9;
    --bg-secondary: #f0f5e1;
    --bg-elevated: #ffffff;

    --surface-glass: rgba(255, 255, 255, 0.9);
    --surface-glass-hover: rgba(255, 255, 255, 0.97);
    --surface-glass-card: rgba(255, 255, 255, 0.95);
    --surface-soft: rgba(249, 252, 240, 0.97);
    --surface-strong: rgba(239, 245, 227, 0.95);

    --border-glass: rgba(79, 111, 47, 0.24);
    --border-glass-light: rgba(79, 111, 47, 0.16);

    --text-primary: #243523;
    --text-secondary: #3f513a;
    --text-tertiary: #73816d;

    --accent-primary: #4f6f2f;
    --accent-light: #7a8f3f;
    --accent-dark: #3c5928;
    --accent-glow: rgba(79, 111, 47, 0.24);
    --accent-soft: rgba(79, 111, 47, 0.12);

    --success: #5a8d43;
    --warning: #b58733;
    --danger: #c65d53;
    --info: #4e789d;

    --shadow-soft: 0 16px 38px rgba(69, 88, 46, 0.14);
    --shadow-focus: 0 0 0 3px rgba(79, 111, 47, 0.2);

    --radius-lg: 22px;
    --radius-md: 16px;
    --radius-sm: 12px;
    --radius-xs: 10px;

    --font-sans: 'Manrope', 'Segoe UI', sans-serif;
    --font-display: 'Fraunces', 'Times New Roman', serif;
  }

  body {
    margin: 0;
    color: var(--text-primary);
    background: var(--bg-primary);
    font-family: var(--font-sans);
    font-feature-settings: 'liga' 1, 'cv03' 1, 'cv04' 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  *:focus-visible {
    outline: none;
    box-shadow: var(--shadow-focus);
  }

  ::selection {
    color: var(--text-primary);
    background: var(--accent-glow);
  }

`

export const lightPageStyles = `

  html {
    margin: 0;
    background:
      radial-gradient(circle at 12% 8%, rgba(122, 143, 63, 0.25), transparent 48%),
      radial-gradient(circle at 90% 0%, rgba(255, 255, 255, 0.82), transparent 55%),
      #f8fbe9;
  }

  body {
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
    .main,
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(79, 111, 47, 0.3) rgba(240, 245, 225, 0.9);
    }
  }

  body::-webkit-scrollbar,
  .main::-webkit-scrollbar,
  .custom-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  body::-webkit-scrollbar-track,
  .main::-webkit-scrollbar-track,
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(240, 245, 225, 0.9);
  }

  body::-webkit-scrollbar-thumb,
  .main::-webkit-scrollbar-thumb,
  .custom-scrollbar::-webkit-scrollbar-thumb {
    border-radius: 999px;
    border: 2px solid rgba(240, 245, 225, 0.9);
    background: rgba(79, 111, 47, 0.3);
  }

  body::-webkit-scrollbar-thumb:hover,
  .main::-webkit-scrollbar-thumb:hover,
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 111, 47, 0.44);
  }

`
