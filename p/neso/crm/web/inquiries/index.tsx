// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import InquiriesPage from '../../pages/InquiriesPage.vue'
import { getDemoPageHead, getBootLoaderDiv } from '../../shared/demoPageShell'
import { getLogLevelForPage } from '../../shared/logLevel'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { INQUIRIES_PAGE_NAME, getHeaderText } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'

const LOG_PATH = 'web/inquiries/index'
const THEME = 'dark' as const

export const inquiriesPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы библиотеки компонентов`,
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
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { isAdmin, adminUrl, logLevel, projectName }
  })

  return (
    <html>
      <head>{getDemoPageHead(THEME, INQUIRIES_PAGE_NAME, projectName, logLevel)}</head>
      <body>
        {getBootLoaderDiv(THEME, projectName)}
        <InquiriesPage
          projectTitle={getHeaderText(INQUIRIES_PAGE_NAME, projectName)}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          testsUrl={getFullUrl(ROUTES.tests)}
          inquiriesUrl={getFullUrl(ROUTES.inquiries)}
          loginUrl={loginUrl}
          isAuthenticated={true}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
        />
      </body>
    </html>
  )
})

export default inquiriesPageRoute
