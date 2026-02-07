// @shared
import { jsx } from '@app/html-jsx'
import { requireAccountRole } from '@app/auth'
import { genSocketId } from '@app/socket'
import AdminPage from '../../pages/AdminPage.vue'
import { loginPageRoute } from '../login'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import { getAdminLogsSocketId } from '../../lib/logger.lib'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { ADMIN_PAGE_NAME, getPageTitle, getHeaderText } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'
import {
  darkThemeTokens,
  darkPageStyles,
  darkScrollbarStyles,
  lightThemeTokens,
  lightPageStyles,
  lightScrollbarStyles
} from '../design/theme'
import { darkUiStyles } from '../design/ui-dark'
import { lightUiStyles } from '../design/ui-light'
import { uiSharedStyles } from '../design/ui-shared'
import { getThemeInitScript } from '../design/themeRuntime'

const LOG_PATH = 'web/admin/index'

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
          <style data-theme="dark">{darkThemeTokens}</style>
          <style data-theme="dark">{darkPageStyles}</style>
          <style data-theme="dark">{darkUiStyles}</style>
          <style data-theme="light" media="not all">{lightThemeTokens}</style>
          <style data-theme="light" media="not all">{lightPageStyles}</style>
          <style data-theme="light" media="not all">{lightUiStyles}</style>
          <style>{uiSharedStyles}</style>
          <script>{getThemeInitScript()}</script>
          <link
            href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap"
            rel="stylesheet"
          />
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
      <head>
        <title>{getPageTitle(ADMIN_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script>{getLogLevelScript(logLevel)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style data-theme="dark">{darkThemeTokens}</style>
        <style data-theme="dark">{darkPageStyles}</style>
        <style data-theme="dark">{darkScrollbarStyles}</style>
        <style data-theme="dark">{darkUiStyles}</style>
        <style data-theme="light" media="not all">{lightThemeTokens}</style>
        <style data-theme="light" media="not all">{lightPageStyles}</style>
        <style data-theme="light" media="not all">{lightScrollbarStyles}</style>
        <style data-theme="light" media="not all">{lightUiStyles}</style>
        <style>{uiSharedStyles}</style>
        <script>{getThemeInitScript()}</script>
        <style>{getPreloaderStyles()}</style>
        <script>{getPreloaderScript()}</script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
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
