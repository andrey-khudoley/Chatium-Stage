// @shared
import { jsx } from '@app/html-jsx'
import { requireAccountRole } from '@app/auth'
import { genSocketId } from '@app/socket'
import AdminPage from '../../pages/AdminPage.vue'
import { loginPageRoute } from '../login'
import { getDemoPageHead, getBootLoaderDiv } from '../../shared/demoPageShell'
import { getLogLevelForPage } from '../../shared/logLevel'
import { getAdminLogsSocketId } from '../../lib/logger.lib'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { ADMIN_PAGE_NAME, getHeaderText } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'

const LOG_PATH = 'web/admin/index'
const THEME = 'dark' as const

export const adminPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы админки`,
    payload: { hasUser: !!ctx.user }
  })

  try {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Проверка requireAccountRole Admin`,
      payload: { hasUser: !!ctx.user }
    })
    requireAccountRole(ctx, 'Admin')
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] requireAccountRole пройдена`,
      payload: {}
    })
  } catch (error) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Редирект на логин: требуется роль Admin`,
      payload: { error: String(error), backUrl: req.url }
    })
    const loginUrl = loginPageRoute.url() + `?back=${encodeURIComponent(req.url)}`
    return (
      <html>
        <head>
          <title>Вход</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charset="UTF-8" />
          <script src="/s/metric/clarity.js"></script>
          <meta http-equiv="refresh" content={`0; url=${loginUrl}`} />
          <script>{`window.location.href = '${loginUrl}'`}</script>
        </head>
        <body>
          <p>Перенаправление на страницу входа...</p>
        </body>
      </html>
    )
  }

  const indexUrl = getFullUrl(ROUTES.index)
  const profileUrl = getFullUrl(ROUTES.profile)
  const adminUrl = getFullUrl(ROUTES.admin)
  const loginUrl = getFullUrl(ROUTES.login)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] URL-ы`,
    payload: { indexUrl, profileUrl, adminUrl, loginUrl }
  })
  const logLevel = await getLogLevelForPage(ctx)
  const logsSocketId = getAdminLogsSocketId(ctx)
  const encodedLogsSocketId = await genSocketId(ctx, logsSocketId)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные сокета и уровня`,
    payload: { logLevel, logsSocketId, hasEncodedLogsSocketId: !!encodedLogsSocketId }
  })
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { projectName }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Рендер страницы админки`,
    payload: { logLevel, logsSocketId }
  })

  return (
    <html>
      <head>{getDemoPageHead(THEME, ADMIN_PAGE_NAME, projectName, logLevel)}</head>
      <body>
        {getBootLoaderDiv(THEME, projectName)}
        <AdminPage
          projectTitle={getHeaderText(ADMIN_PAGE_NAME, projectName)}
          indexUrl={indexUrl}
          profileUrl={profileUrl}
          testsUrl={getFullUrl(ROUTES.tests)}
          inquiriesUrl={getFullUrl(ROUTES.inquiries)}
          loginUrl={loginUrl}
          isAuthenticated={true}
          isAdmin={true}
          adminUrl={adminUrl}
          encodedLogsSocketId={encodedLogsSocketId}
        />
      </body>
    </html>
  )
})

export default adminPageRoute
