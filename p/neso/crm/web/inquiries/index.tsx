// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import InquiriesPage from '../../pages/InquiriesPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { INQUIRIES_PAGE_NAME, getPageTitle, getHeaderText } from '../../config/project'
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

const LOG_PATH = 'web/inquiries/index'

export const inquiriesPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы обращений`,
    payload: { hasUser: !!ctx.user }
  })

  let user
  try {
    user = requireRealUser(ctx)
  } catch (error: unknown) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Редирект на логин`,
      payload: { error: String(error), backUrl: req.url }
    })
    return ctx.resp.redirect('../login?back=' + encodeURIComponent(req.url))
  }

  const isAdmin = user.is('Admin')
  const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)

  return (
    <html>
      <head>
        <title>{getPageTitle(INQUIRIES_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script>{getLogLevelScript(logLevel)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style>{getPreloaderStyles()}</style>
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
        <script>{getPreloaderScript()}</script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
        <InquiriesPage
          projectTitle={getHeaderText(INQUIRIES_PAGE_NAME, projectName)}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          testsUrl={getFullUrl(ROUTES.tests)}
          inquiriesUrl={getFullUrl(ROUTES.inquiries)}
          loginUrl={getFullUrl(ROUTES.login)}
          isAuthenticated={true}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
        />
      </body>
    </html>
  )
})

export default inquiriesPageRoute
