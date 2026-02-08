// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import { genSocketId } from '@app/socket'
import { getAdminLogsSocketId } from '../../lib/logger.lib'
import TestsPage from '../../pages/TestsPage.vue'
import { getDemoPageHead, getBootLoaderDiv } from '../../shared/demoPageShell'
import { getLogLevelForPage } from '../../shared/logLevel'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { TESTS_PAGE_NAME, getHeaderText } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'

const LOG_PATH = 'web/tests/index'
const THEME = 'dark' as const

/**
 * Страница тестов: отображает TestsPage.vue и даёт доступ к каталогу тестов (api/tests/list)
 * и к проверкам всех слоёв: config, lib (settings, dashboard, logger), repo (settings, logs), API (admin).
 */
export const testsPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы тестов`,
    payload: { hasUser: !!ctx.user }
  })

  let user
  try {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Проверка requireRealUser`,
      payload: { hasUser: !!ctx.user }
    })
    user = requireRealUser(ctx)
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] requireRealUser пройдена`,
      payload: { displayName: user.displayName }
    })
  } catch (error: unknown) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Редирект на логин: требуется авторизация`,
      payload: { error: String(error), backUrl: req.url }
    })
    return ctx.resp.redirect('../login?back=' + encodeURIComponent(req.url))
  }

  const isAdmin = user.is('Admin')
  const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
  const loginUrl = getFullUrl(ROUTES.login)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные после user`,
    payload: { isAdmin, adminUrl, loginUrl, displayName: user.displayName }
  })
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  const logsSocketId = isAdmin ? getAdminLogsSocketId(ctx) : ''
  const encodedLogsSocketId = isAdmin ? await genSocketId(ctx, logsSocketId) : undefined
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { logLevel, projectName, logsSocketId, hasEncodedLogsSocketId: !!encodedLogsSocketId }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Рендер страницы тестов`,
    payload: { isAdmin, displayName: user.displayName }
  })

  return (
    <html>
      <head>{getDemoPageHead(THEME, TESTS_PAGE_NAME, projectName, logLevel)}</head>
      <body>
        {getBootLoaderDiv(THEME, projectName)}
        <TestsPage
          projectTitle={getHeaderText(TESTS_PAGE_NAME, projectName)}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          testsUrl={getFullUrl(ROUTES.tests)}
          inquiriesUrl={getFullUrl(ROUTES.inquiries)}
          loginUrl={loginUrl}
          isAuthenticated={true}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
          encodedLogsSocketId={encodedLogsSocketId}
        />
      </body>
    </html>
  )
})

export default testsPageRoute
