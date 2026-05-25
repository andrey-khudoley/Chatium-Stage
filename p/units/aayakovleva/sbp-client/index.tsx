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
  PANEL_PAGE_NAME,
  getPageTitle,
  getHeaderText
} from './config/project'
import * as loggerLib from './lib/logger.lib'
import * as settingsLib from './lib/settings.lib'

const LOG_PATH = 'index'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  // Доступ: requireRealUser + requireInternalAccess (ADR 0003, §1.11.8).
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

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { hasUser: !!ctx.user, isAdmin }
  })

  const projectName = await settingsLib.getSettingString(
    ctx,
    settingsLib.SETTING_KEYS.PROJECT_NAME
  )
  const logLevel = await getLogLevelForPage(ctx)

  const initialSettings = {
    lp_apikey: await settingsLib.getLpApikey(ctx),
    lp_login: await settingsLib.getLpLogin(ctx),
    lp_webhook_token: await settingsLib.getLpWebhookToken(ctx),
    gateway_base_url: await settingsLib.getGatewayBaseUrl(ctx)
  }

  const tokenForUrl = initialSettings.lp_webhook_token
    ? initialSettings.lp_webhook_token
    : '<not_configured>'
  const webhookPath = getFullUrl(ROUTES.webhook)
  const webhookUrl = `https://${ctx.account.host}${webhookPath}?token=${tokenForUrl}`

  // Base URL: путь до эндпоинта создания счёта (из config/routes). Хост дописывается
  // на фронте через window.location.origin — см. PanelHomePage.vue computed baseUrl.
  const baseUrlPath = getFullUrl(ROUTES.createBill)

  // Глобальный фильтр панели по дате/времени (Unix ms). Читается из Heap на SSR
  // и передаётся пропсом — общий для всех пользователей и сессий.
  const initialDateFilter = await settingsLib.getPanelDateFilter(ctx)

  const apiUrls = {
    invoke: `${getFullUrl('/api/lp/invoke')}`,
    recentRequests: `${getFullUrl('/api/lp/recent-requests')}`,
    recentWebhooks: `${getFullUrl('/api/lp/recent-webhooks')}`,
    analyticsSummary: `${getFullUrl('/api/lp/analytics/summary')}`,
    searchByRequestId: `${getFullUrl('/api/lp/search-by-request-id')}`,
    rawRequest: `${getFullUrl('/api/lp/raw-request')}`,
    rawWebhook: `${getFullUrl('/api/lp/raw-webhook')}`,
    accessGenerateInvite: `${getFullUrl('/api/access/generate-invite')}`,
    accessRevokeInvite: `${getFullUrl('/api/access/revoke-invite')}`,
    accessRevokeGrant: `${getFullUrl('/api/access/revoke-grant')}`,
    accessInvites: `${getFullUrl('/api/access/invites')}`,
    accessGrants: `${getFullUrl('/api/access/grants')}`,
    filterSave: `${getFullUrl('/api/lp/analytics/filter-save')}`
  }

  const indexUrl = getFullUrl(ROUTES.index)
  const profileUrl = getFullUrl(ROUTES.profile)
  const adminUrl = getFullUrl(ROUTES.admin)
  const testsUrl = getFullUrl(ROUTES.tests)
  const panelUrl = getFullUrl(ROUTES.panel)
  const loginUrl = getFullUrl(ROUTES.login)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] render`,
    payload: { hasApikey: !!initialSettings.lp_apikey, hasGatewayBaseUrl: !!initialSettings.gateway_base_url }
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
          panelUrl={panelUrl}
          webhookUrl={webhookUrl}
          baseUrlPath={baseUrlPath}
          apiUrls={apiUrls}
          initialSettings={initialSettings}
          initialDateFilter={initialDateFilter}
        />
      </body>
    </html>
  )
})

export default indexPageRoute
