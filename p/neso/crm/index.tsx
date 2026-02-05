// @shared
import { jsx } from '@app/html-jsx'
import HomePage from './pages/HomePage.vue'
import { getPreloaderStyles, getPreloaderScript } from './shared/preloader'
import { customScrollbarStyles, designTokens } from './styles'
import { getLogLevelForPage, getLogLevelScript } from './shared/logLevel'
import { getFullUrl, ROUTES } from './config/routes'
import {
  INDEX_PAGE_NAME,
  BODY_TEXT,
  BODY_SUBTEXT,
  getPageTitle,
  getHeaderText
} from './config/project'
import * as loggerLib from './lib/logger.lib'
import * as settingsLib from './lib/settings.lib'

const LOG_PATH = 'index'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Рендер главной страницы`,
    payload: { hasUser: !!ctx.user, isAdmin: ctx.user?.is?.('Admin') ?? false }
  })

  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные auth`,
    payload: { isAuthenticated, isAdmin }
  })
  const loginUrl = getFullUrl(ROUTES.login)
  const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
  const testsUrl = isAuthenticated ? getFullUrl(ROUTES.tests) : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] URL-ы`,
    payload: { loginUrl, adminUrl, testsUrl }
  })
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  const logoUrl = await settingsLib.getLogoUrl(ctx)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { logLevel, projectName }
  })

  return (
    <html>
      <head>
        <title>{getPageTitle(INDEX_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script>{getLogLevelScript(logLevel)}</script>
        <style>{designTokens}</style>
        <style>{`
          html { margin: 0; background: var(--color-bg); }
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
          ${getPreloaderStyles()}
        `}</style>
        <script>{getPreloaderScript()}</script>
        <script src="/s/metric/clarity.js"></script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700&family=Old+Standard+TT:wght@700&display=swap" rel="stylesheet" />
        <style>{customScrollbarStyles}</style>
      </head>
      <body>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
        <HomePage
          projectName={BODY_TEXT}
          projectTitle={getHeaderText(INDEX_PAGE_NAME, projectName)}
          projectDescription={BODY_SUBTEXT}
          logoUrl={logoUrl}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          loginUrl={loginUrl}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
          testsUrl={testsUrl}
        />
      </body>
    </html>
  )
})

export default indexPageRoute
