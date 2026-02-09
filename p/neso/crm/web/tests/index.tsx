// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import { genSocketId } from '@app/socket'
import { getAdminLogsSocketId } from '../../lib/logger.lib'
import TestsPageModule from '../../pages/TestsPage.vue'
import { getPreloaderScript, getPreloaderStyles } from '../../shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { TESTS_PAGE_NAME, getHeaderText, getPageTitle } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'
import { getCrmGlobalStyles } from '../../shared/design/globalStyles'
import {
  getGoogleFontsHref,
  getUiBootstrapScript
} from '../../shared/design/system'

const LOG_PATH = 'web/tests/index'
const TestsPage = ((TestsPageModule as unknown as { default?: unknown }).default ?? TestsPageModule) as any

export const testsPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Request tests page`,
    payload: { hasUser: !!ctx.user }
  })

  let user
  try {
    user = requireRealUser(ctx)
  } catch (error: unknown) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Redirect to login: auth required`,
      payload: { error: String(error), backUrl: req.url }
    })
    return ctx.resp.redirect('../login?back=' + encodeURIComponent(req.url))
  }

  const isAdmin = user.is('Admin')
  const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
  const loginUrl = getFullUrl(ROUTES.login)

  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  const logsSocketId = isAdmin ? getAdminLogsSocketId(ctx) : ''
  const encodedLogsSocketId = isAdmin ? await genSocketId(ctx, logsSocketId) : undefined
  const initialLocale = (ctx.lang === 'en' ? 'en' : 'ru') as 'ru' | 'en'

  return (
    <html>
      <head>
        <title>{getPageTitle(TESTS_PAGE_NAME, projectName)}</title>
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

        <TestsPage
          projectTitle={getHeaderText(TESTS_PAGE_NAME, projectName)}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          testsUrl={getFullUrl(ROUTES.tests)}
          loginUrl={loginUrl}
          isAuthenticated={true}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
          encodedLogsSocketId={encodedLogsSocketId}
          initialLocale={initialLocale}
        />
      </body>
    </html>
  )
})

export default testsPageRoute
