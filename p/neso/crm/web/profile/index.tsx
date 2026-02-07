// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import ProfilePage from '../../pages/ProfilePage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { PROFILE_PAGE_NAME, getPageTitle, getHeaderText } from '../../config/project'
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

const LOG_PATH = 'web/profile/index'

export const profilePageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы профиля`,
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
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { logLevel, projectName }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Рендер страницы профиля`,
    payload: { isAdmin, displayName: user.displayName }
  })

  return (
    <html>
      <head>
        <title>{getPageTitle(PROFILE_PAGE_NAME, projectName)}</title>
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
        <style>{getPreloaderStyles()}</style>
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
        <ProfilePage
          projectTitle={getHeaderText(PROFILE_PAGE_NAME, projectName)}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          testsUrl={getFullUrl(ROUTES.tests)}
          inquiriesUrl={getFullUrl(ROUTES.inquiries)}
          loginUrl={loginUrl}
          isAuthenticated={true}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
          user={{
            displayName: user.displayName,
            confirmedEmail: user.confirmedEmail,
            confirmedPhone: user.confirmedPhone
          }}
        />
      </body>
    </html>
  )
})

export default profilePageRoute
