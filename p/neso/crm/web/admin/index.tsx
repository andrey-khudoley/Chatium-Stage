// @shared
import { jsx } from '@app/html-jsx'
import { requireAccountRole } from '@app/auth'
import { genSocketId } from '@app/socket'
import AdminPageModule from '../../pages/AdminPage.vue'
import { loginPageRoute } from '../login'
import { getPreloaderScript, getPreloaderStyles } from '../../shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import { getAdminLogsSocketId } from '../../lib/logger.lib'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { ADMIN_PAGE_NAME, getHeaderText, getPageTitle } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'
import { getCrmGlobalStyles } from '../../shared/design/globalStyles'
import {
  getGoogleFontsHref,
  getUiBootstrapScript
} from '../../shared/design/system'

const LOG_PATH = 'web/admin/index'
const AdminPage = ((AdminPageModule as unknown as { default?: unknown }).default ?? AdminPageModule) as any

export const adminPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Request admin page`,
    payload: { hasUser: !!ctx.user }
  })

  try {
    requireAccountRole(ctx, 'Admin')
  } catch (error) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Redirect to login: Admin required`,
      payload: { error: String(error), backUrl: req.url }
    })

    const loginUrl = loginPageRoute.url() + `?back=${encodeURIComponent(req.url)}`
    return (
      <html>
        <head>
          <title>Login</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charset="UTF-8" />
          <script src="/s/metric/clarity.js"></script>
          <meta http-equiv="refresh" content={`0; url=${loginUrl}`} />
          <script>{`window.location.href = '${loginUrl}'`}</script>
          <style>{getCrmGlobalStyles()}</style>
        </head>
        <body>
          <p>Redirecting to login...</p>
        </body>
      </html>
    )
  }

  const indexUrl = getFullUrl(ROUTES.index)
  const profileUrl = getFullUrl(ROUTES.profile)
  const adminUrl = getFullUrl(ROUTES.admin)
  const loginUrl = getFullUrl(ROUTES.login)

  const logLevel = await getLogLevelForPage(ctx)
  const logsSocketId = getAdminLogsSocketId(ctx)
  const encodedLogsSocketId = await genSocketId(ctx, logsSocketId)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  const initialLocale = (ctx.lang === 'en' ? 'en' : 'ru') as 'ru' | 'en'

  return (
    <html>
      <head>
        <title>{getPageTitle(ADMIN_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script>{getLogLevelScript(logLevel)}</script>
        <script>{getUiBootstrapScript()}</script>
        <style>{getCrmGlobalStyles()}</style>
        <style>{getPreloaderStyles()}</style>
        <script>{getPreloaderScript()}</script>
        <script src="/s/metric/clarity.js"></script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href={getGoogleFontsHref()} rel="stylesheet" />
      </head>
      <body>
        <div id="crm-boot-loader" role="status" aria-live="polite">
          <div class="crm-loader-card">
            <div class="crm-loader-head">
              <span class="crm-loader-title">CRM Interface Engine</span>
              <span class="crm-loader-meta">v2 UI shell</span>
            </div>
            <div class="crm-loader-progress">
              <div id="crm-loader-progress-value" class="crm-loader-progress-value"></div>
            </div>
            <ul id="crm-loader-list" class="crm-loader-list"></ul>
          </div>
        </div>

        <AdminPage
          projectTitle={getHeaderText(ADMIN_PAGE_NAME, projectName)}
          indexUrl={indexUrl}
          profileUrl={profileUrl}
          testsUrl={getFullUrl(ROUTES.tests)}
          loginUrl={loginUrl}
          isAuthenticated={true}
          isAdmin={true}
          adminUrl={adminUrl}
          encodedLogsSocketId={encodedLogsSocketId}
          initialLocale={initialLocale}
        />
      </body>
    </html>
  )
})

export default adminPageRoute
