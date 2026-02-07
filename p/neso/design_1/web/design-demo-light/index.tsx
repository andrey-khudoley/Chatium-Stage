// @shared
import { jsx } from '@app/html-jsx'
import DesignDemoLightPage from '../../pages/DesignDemoLightPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelScript } from '../../shared/logLevel'
import { getFullUrl, ROUTES } from '../../config/routes'
import { DEFAULT_PROJECT_TITLE, getPageTitle, getHeaderText } from '../../config/project'

// CSS переменные — CRM Design System Light «Солнечная листва»
const designDemoTokens = `
  :root {
    --bg-primary: #f8f6eb;
    --bg-secondary: #f0ede0;
    --surface: #ffffff;
    --accent: #4f6f2f;
    --accent-warm: #7a8f3f;
    --text-primary: #243523;
    --accent-glow: rgba(79, 111, 47, 0.15);
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
    background: #f8f6eb;
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

const lightScrollbarStyles = `
  @supports not selector(::-webkit-scrollbar) {
    body,
    .main {
      scrollbar-width: thin;
      scrollbar-color: rgba(79, 111, 47, 0.2) rgba(248, 246, 235, 0.8);
    }
  }
  body::-webkit-scrollbar,
  .main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .main::-webkit-scrollbar-track {
    background: rgba(248, 246, 235, 0.8);
  }
  body::-webkit-scrollbar-thumb,
  .main::-webkit-scrollbar-thumb {
    background: rgba(79, 111, 47, 0.18);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .main::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 111, 47, 0.3);
  }
`

const PROJECT_NAME = DEFAULT_PROJECT_TITLE
const LOG_LEVEL = 'Info'

export const designDemoLightPageRoute = app.html('/', async (ctx) => {
  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const indexUrl = getFullUrl(ROUTES.index)

  return (
    <html>
      <head>
        <title>{getPageTitle('Design Demo (Light)', PROJECT_NAME)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#f8f6eb" />
        <script>{getLogLevelScript(LOG_LEVEL)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style>{designDemoTokens}</style>
        <style>{pageStyles}</style>
        <style>{lightScrollbarStyles}</style>
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
        <DesignDemoLightPage
          projectTitle={getHeaderText('Design Demo (Light)', PROJECT_NAME)}
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

export default designDemoLightPageRoute
