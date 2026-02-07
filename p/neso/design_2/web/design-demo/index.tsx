// @shared
import { jsx } from '@app/html-jsx'
import DesignDemoPage from '../../pages/DesignDemoPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelScript } from '../../shared/logLevel'
import { getFullUrl, ROUTES } from '../../config/routes'
import { DEFAULT_PROJECT_TITLE, getPageTitle, getHeaderText } from '../../config/project'

// CSS переменные — премиальная тёмная тема "Ночной лес" (Modern Nature Minimal)
const designDemoTokens = `
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

const pageStyles = `
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

const darkScrollbarStyles = `
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

const PROJECT_NAME = DEFAULT_PROJECT_TITLE
const LOG_LEVEL = 'Info'

export const designDemoPageRoute = app.html('/', async (ctx) => {
  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const indexUrl = getFullUrl(ROUTES.index)

  return (
    <html>
      <head>
        <title>{getPageTitle('Design Demo', PROJECT_NAME)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#070b0d" />
        <script>{getLogLevelScript(LOG_LEVEL)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style>{designDemoTokens}</style>
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
        <DesignDemoPage
          projectTitle={getHeaderText('Design Demo', PROJECT_NAME)}
          logoUrl=""
          indexUrl={indexUrl}
          profileUrl={indexUrl}
          loginUrl={indexUrl}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          adminUrl={isAdmin ? indexUrl : ''}
        />
      </body>
    </html>
  )
})

export default designDemoPageRoute
