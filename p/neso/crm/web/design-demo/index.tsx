// @shared
import { jsx } from '@app/html-jsx'
import DesignDemoPage from '../../pages/DesignDemoPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import { getFullUrl, ROUTES } from '../../config/routes'
import { getPageTitle, getHeaderText } from '../../config/project'
import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'

const LOG_PATH = 'web/design-demo/index'

// CSS переменные — нейтральная тёмная тема с зелёными акцентами
const designDemoTokens = `
  :root {
    --bg: #0a0a0c;
    --bg-secondary: #111114;
    --glass: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.06);
    
    --text: #f0f0f2;
    --text-secondary: rgba(240, 240, 242, 0.65);
    --text-tertiary: rgba(240, 240, 242, 0.4);
    
    --accent: #92a447;
    --accent-light: #9aa56a;
    --accent-dark: #77884c;
    --accent-glow: rgba(146, 164, 71, 0.3);
  }

  body {
    font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background: var(--accent-glow);
    color: var(--text);
  }
`

const pageStyles = `
  html { 
    margin: 0; 
    background: #0a0a0c;
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
      scrollbar-color: rgba(255, 255, 255, 0.15) rgba(255, 255, 255, 0.02);
    }
  }
  body::-webkit-scrollbar,
  .main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .main::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.01);
  }
  body::-webkit-scrollbar-thumb,
  .main::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .main::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

export const designDemoPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы Design Demo`,
    payload: { hasUser: !!ctx.user }
  })

  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  const logoUrl = await settingsLib.getLogoUrl(ctx)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Рендер страницы Design Demo`,
    payload: { isAuthenticated, isAdmin, logLevel }
  })

  return (
    <html>
      <head>
        <title>{getPageTitle('Design Demo', projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#0a0a0c" />
        <script>{getLogLevelScript(logLevel)}</script>
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
          projectTitle={getHeaderText('Design Demo', projectName)}
          logoUrl={logoUrl}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          loginUrl={getFullUrl(ROUTES.login)}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          adminUrl={isAdmin ? getFullUrl(ROUTES.admin) : ''}
        />
      </body>
    </html>
  )
})

export default designDemoPageRoute
