// @shared
// Библиотека компонентов · светлая тема «Солнечная листва»
import { jsx } from '@app/html-jsx'
import DesignComponentsLightPage from '../../../pages/DesignComponentsLightPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../../shared/preloader'
import { getLogLevelScript } from '../../../shared/logLevel'
import { getFullUrl, ROUTES } from '../../../config/routes'
import { DEFAULT_PROJECT_TITLE, getPageTitle } from '../../../config/project'

const lightThemeTokens = `
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

const pageStyles = `
  html { margin: 0; background: var(--bg-primary, #f2eedf); }
  body { margin: 0; position: relative; min-height: 100vh; overflow: hidden; }
  body.boot-complete { overflow-x: hidden; overflow-y: auto; }
`

const lightScrollbarStyles = `
  @supports not selector(::-webkit-scrollbar) {
    body, .content { scrollbar-width: thin; scrollbar-color: rgba(79, 111, 47, 0.3) rgba(232, 226, 206, 0.78); }
  }
  body::-webkit-scrollbar, .content::-webkit-scrollbar { width: 8px; height: 8px; }
  body::-webkit-scrollbar-track, .content::-webkit-scrollbar-track { background: rgba(232, 226, 206, 0.78); }
  body::-webkit-scrollbar-thumb, .content::-webkit-scrollbar-thumb { background: rgba(79, 111, 47, 0.26); border-radius: 4px; }
  body::-webkit-scrollbar-thumb:hover, .content::-webkit-scrollbar-thumb:hover { background: rgba(79, 111, 47, 0.44); }
`

const PAGE_NAME = 'Библиотека компонентов · Солнечная листва (Light)'
const LOG_LEVEL = 'Info'

export const designComponentsLightPageRoute = app.html('/', async (ctx) => {
  const indexUrl = getFullUrl(ROUTES.index)
  const pageUrl = getFullUrl(ROUTES.pageLight)

  return (
    <html>
      <head>
        <title>{getPageTitle(PAGE_NAME, DEFAULT_PROJECT_TITLE)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#f2eedf" />
        <script>{getLogLevelScript(LOG_LEVEL)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style>{lightThemeTokens}</style>
        <style>{pageStyles}</style>
        <style>{lightScrollbarStyles}</style>
        <style>{getPreloaderStyles()}</style>
        <script>{getPreloaderScript('light')}</script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="boot-loader" data-theme="light" data-theme-hint="light" data-project-name={DEFAULT_PROJECT_TITLE} aria-live="polite" aria-busy="true">
          <div class="boot-shell" role="status">
            <span class="boot-orb boot-orb--top" aria-hidden="true"></span>
            <span class="boot-orb boot-orb--bottom" aria-hidden="true"></span>
            <p class="boot-kicker">System Boot</p>
            <h1 class="boot-title">{DEFAULT_PROJECT_TITLE}</h1>
            <p class="boot-subtitle">Подготавливаем интерфейс...</p>
            <div class="boot-progress-track" aria-hidden="true">
              <span id="boot-progress-bar" class="boot-progress-bar"></span>
            </div>
            <div class="boot-meta">
              <span id="boot-status-text" class="boot-status-text">Собираем визуальную оболочку...</span>
              <span id="boot-progress-value" class="boot-progress-value">0%</span>
            </div>
            <div class="boot-theme-chip" id="boot-theme-pill">Солнечная листва</div>
          </div>
        </div>
        <DesignComponentsLightPage indexUrl={indexUrl} pageUrl={pageUrl} />
      </body>
    </html>
  )
})

export default designComponentsLightPageRoute
