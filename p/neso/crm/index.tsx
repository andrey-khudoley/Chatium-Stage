// @shared
import { jsx } from '@app/html-jsx'
import HomePage from './pages/HomePage.vue'
import { getPreloaderScript, getPreloaderStyles } from './shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from './shared/logLevel'
import { getFullUrl, ROUTES } from './config/routes'
import {
  BODY_SUBTEXT,
  BODY_TEXT,
  INDEX_PAGE_NAME,
  getHeaderText,
  getPageTitle
} from './config/project'
import * as loggerLib from './lib/logger.lib'
import * as settingsLib from './lib/settings.lib'
import { getCrmGlobalStyles } from './shared/design/globalStyles'
import {
  getGoogleFontsHref,
  getUiBootstrapScript
} from './shared/design/system'

const LOG_PATH = 'index'

export const indexPageRoute = app.html('/', async (ctx) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Render index page`,
    payload: { hasUser: !!ctx.user, isAdmin: ctx.user?.is?.('Admin') ?? false }
  })

  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false

  const loginUrl = getFullUrl(ROUTES.login)
  const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
  const testsUrl = isAuthenticated ? getFullUrl(ROUTES.tests) : ''

  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  const initialLocale = (ctx.lang === 'en' ? 'en' : 'ru') as 'ru' | 'en'

  return (
    <html>
      <head>
        <title>{getPageTitle(INDEX_PAGE_NAME, projectName)}</title>
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
          initialLocale={initialLocale}
        />
      </body>
    </html>
  )
})

export default indexPageRoute
