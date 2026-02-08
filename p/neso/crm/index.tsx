// @shared
import { jsx } from '@app/html-jsx'
import HomePage from './pages/HomePage.vue'
import { getFullUrl, ROUTES } from './config/routes'
import {
  INDEX_PAGE_NAME,
  BODY_TEXT,
  BODY_SUBTEXT,
  getHeaderText
} from './config/project'
import { getDemoPageHead, getBootLoaderDiv } from './shared/demoPageShell'
import { getLogLevelForPage } from './shared/logLevel'
import * as loggerLib from './lib/logger.lib'
import * as settingsLib from './lib/settings.lib'

const LOG_PATH = 'index'
const THEME = 'dark' as const

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
  const inquiriesUrl = isAuthenticated ? getFullUrl(ROUTES.inquiries) : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] URL-ы`,
    payload: { loginUrl, adminUrl, testsUrl }
  })
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { logLevel, projectName }
  })

  return (
    <html>
      <head>{getDemoPageHead(THEME, INDEX_PAGE_NAME, projectName, logLevel)}</head>
      <body>
        {getBootLoaderDiv(THEME, projectName)}
        <HomePage
          projectName={BODY_TEXT}
          projectTitle={getHeaderText(INDEX_PAGE_NAME, projectName)}
          projectDescription={BODY_SUBTEXT}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          loginUrl={loginUrl}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
          testsUrl={testsUrl}
          inquiriesUrl={inquiriesUrl}
        />
      </body>
    </html>
  )
})

export default indexPageRoute
