import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import PanelHomePage from './pages/PanelHomePage.vue'
import { getPreloaderStyles, getPreloaderScript } from './shared/preloader'
import { crtBackgroundStyles, customScrollbarStyles } from './styles'
import { getLogLevelForPage, getLogLevelScript } from './shared/logLevel'
import { getFullUrl, ROUTES, ROUTE_PATHS } from './config/routes'
import {
  requireInternalAccess,
  InternalAccessDeniedError
} from './lib/access/requireInternalAccess'
import {
  getPageTitle,
  getHeaderText
} from './config/project'
import * as loggerLib from './lib/logger.lib'
import * as settingsLib from './lib/settings.lib'

const PANEL_PAGE_NAME = 'Панель'

const LOG_PATH = 'index'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Рендер главной страницы`,
    payload: { hasUser: !!ctx.user, isAdmin: ctx.user?.is?.('Admin') ?? false }
  })

  // Главная gateway — это панель. Доступ: requireRealUser + requireInternalAccess.
  // Анонимный → на вход; авторизованный без гранта → /web/forbidden.
  try {
    requireRealUser(ctx)
    await requireInternalAccess(ctx)
  } catch (err) {
    if (err instanceof InternalAccessDeniedError) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] forbidden_redirect`,
        payload: { userId: ctx.user?.id ?? null }
      })
      return ctx.resp.redirect(getFullUrl(ROUTE_PATHS.forbidden))
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] signin_redirect`,
      payload: { backUrl: req.url }
    })
    return ctx.resp.redirect(`/s/auth/signin?back=${encodeURIComponent(req.url)}`)
  }

  const isAdmin = ctx.user?.is('Admin') ?? false
  const loginUrl = getFullUrl(ROUTES.login)
  const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
  // Тесты доступны только роли Admin — ссылку в шапке показываем лишь админу.
  const testsUrl = isAdmin ? getFullUrl(ROUTES.tests) : ''
  const indexUrl = getFullUrl(ROUTES.index)
  const profileUrl = getFullUrl(ROUTES.profile)

  // Глобальный фильтр панели по дате/времени (Unix ms). Читается из Heap на SSR.
  const initialDateFilter = await settingsLib.getPanelDateFilter(ctx)

  const apiUrls = {
    invocations: getFullUrl('/api/gateway-analytics/invocations'),
    filterSave: getFullUrl('/api/gateway-analytics/filter-save'),
    accessGenerateInvite: getFullUrl('/api/access/generate-invite'),
    accessRevokeInvite: getFullUrl('/api/access/revoke-invite'),
    accessRevokeGrant: getFullUrl('/api/access/revoke-grant'),
    accessInvites: getFullUrl('/api/access/invites'),
    accessGrants: getFullUrl('/api/access/grants')
  }

  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { logLevel, projectName, isAdmin }
  })

  return (
    <html>
      <head>
        <title>{getPageTitle(PANEL_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script>{getLogLevelScript(logLevel)}</script>
        <style>{crtBackgroundStyles}</style>
        <style>{customScrollbarStyles}</style>
        <style>{getPreloaderStyles()}</style>
        <script>{getPreloaderScript()}</script>
        <script src="/s/metric/clarity.js"></script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="geometric-bg"></div>
        <div id="tv-glitch"></div>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
        <PanelHomePage
          projectTitle={getHeaderText(PANEL_PAGE_NAME, projectName)}
          indexUrl={indexUrl}
          profileUrl={profileUrl}
          loginUrl={loginUrl}
          isAuthenticated={true}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
          testsUrl={testsUrl}
          initialDateFilter={initialDateFilter}
          apiUrls={apiUrls}
        />
      </body>
    </html>
  )
})

export default indexPageRoute
