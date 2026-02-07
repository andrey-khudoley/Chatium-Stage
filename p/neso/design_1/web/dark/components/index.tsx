// @shared
// Библиотека компонентов · тёмная тема «Ночной лес»
import { jsx } from '@app/html-jsx'
import DesignComponentsDarkPage from '../../../pages/DesignComponentsDarkPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../../shared/preloader'
import { getLogLevelScript } from '../../../shared/logLevel'
import { getFullUrl, ROUTES } from '../../../config/routes'
import { DEFAULT_PROJECT_TITLE, getPageTitle } from '../../../config/project'

const darkThemeTokens = `
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

const pageStyles = `
  html { margin: 0; background: #05080a; }
  body { margin: 0; position: relative; min-height: 100vh; overflow: hidden; }
  body.boot-complete { overflow-x: hidden; overflow-y: auto; }
`

const darkScrollbarStyles = `
  @supports not selector(::-webkit-scrollbar) {
    body, .content { scrollbar-width: thin; scrollbar-color: rgba(175, 196, 95, 0.25) rgba(5, 8, 10, 0.5); }
  }
  body::-webkit-scrollbar, .content::-webkit-scrollbar { width: 8px; height: 8px; }
  body::-webkit-scrollbar-track, .content::-webkit-scrollbar-track { background: rgba(5, 8, 10, 0.5); }
  body::-webkit-scrollbar-thumb, .content::-webkit-scrollbar-thumb { background: rgba(175, 196, 95, 0.2); border-radius: 4px; }
  body::-webkit-scrollbar-thumb:hover, .content::-webkit-scrollbar-thumb:hover { background: rgba(175, 196, 95, 0.35); }
`

const PAGE_NAME = 'Библиотека компонентов · Ночной лес (Dark)'
const LOG_LEVEL = 'Info'

export const designComponentsDarkPageRoute = app.html('/', async (ctx) => {
  const indexUrl = getFullUrl(ROUTES.index)
  const pageUrl = getFullUrl(ROUTES.pageDark)

  return (
    <html>
      <head>
        <title>{getPageTitle(PAGE_NAME, DEFAULT_PROJECT_TITLE)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#05080a" />
        <script>{getLogLevelScript(LOG_LEVEL)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style>{darkThemeTokens}</style>
        <style>{pageStyles}</style>
        <style>{darkScrollbarStyles}</style>
        <style>{getPreloaderStyles()}</style>
        <script>{getPreloaderScript()}</script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
        <DesignComponentsDarkPage indexUrl={indexUrl} pageUrl={pageUrl} />
      </body>
    </html>
  )
})

export default designComponentsDarkPageRoute
