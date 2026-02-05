// @shared
import { jsx } from '@app/html-jsx'
import DesignDemoLightPage from '../../pages/DesignDemoLightPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import { getFullUrl, ROUTES } from '../../config/routes'
import { getPageTitle, getHeaderText } from '../../config/project'
import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'

const LOG_PATH = 'web/design-demo-light/index'

// CSS переменные — светлая тема (природа + солнечный свет + стекло)
const designDemoTokens = `
  :root {
    /* Мягкий природный фон */
    --bg: #e8ede0;
    --bg-secondary: #dfe6d3;
    --glass: rgba(255, 255, 255, 0.35);
    --glass-border: rgba(255, 255, 255, 0.5);
    
    /* Тёмный текст */
    --text: #1b2b1c;
    --text-secondary: #3d4a35;
    --text-tertiary: #5a6652;
    
    /* Насыщенный зелёный акцент */
    --accent: #4a5a24;
    --accent-light: #5d6d2e;
    --accent-dark: #3a4a1a;
    --accent-glow: rgba(74, 90, 36, 0.25);
    
    /* Солнечный свет — тёплый белый */
    --sunray: rgba(255, 255, 250, 0.9);
    --sunray-soft: rgba(255, 252, 245, 0.6);
    --sunray-glow: rgba(255, 250, 240, 0.5);
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
    background: #e8ede0;
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
      scrollbar-color: rgba(74, 90, 36, 0.3) rgba(223, 230, 211, 0.5);
    }
  }
  body::-webkit-scrollbar,
  .main::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  body::-webkit-scrollbar-track,
  .main::-webkit-scrollbar-track {
    background: rgba(223, 230, 211, 0.5);
  }
  body::-webkit-scrollbar-thumb,
  .main::-webkit-scrollbar-thumb {
    background: rgba(74, 90, 36, 0.25);
    border-radius: 4px;
  }
  body::-webkit-scrollbar-thumb:hover,
  .main::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 90, 36, 0.4);
  }
`

export const designDemoLightPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы Design Demo Light`,
    payload: { hasUser: !!ctx.user }
  })

  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  const logoUrl = await settingsLib.getLogoUrl(ctx)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Рендер страницы Design Demo Light`,
    payload: { isAuthenticated, isAdmin, logLevel }
  })

  return (
    <html>
      <head>
        <title>{getPageTitle('Design Demo (Light)', projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#e8ede0" />
        <script>{getLogLevelScript(logLevel)}</script>
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
          projectTitle={getHeaderText('Design Demo (Light)', projectName)}
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

export default designDemoLightPageRoute
