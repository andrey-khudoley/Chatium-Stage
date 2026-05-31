import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import ClientHomePage from './pages/HomePage.vue'
import { getPreloaderStyles, getPreloaderScript } from './lib/preloader'
import { crtBackgroundStyles, customScrollbarStyles } from './styles'
import { sbpHomeCss1 } from './pagecss/sbpHomeCss1'
import { sbpHomeCss2 } from './pagecss/sbpHomeCss2'
import { sbpHomeCss3 } from './pagecss/sbpHomeCss3'
import { sbpHomeCss4 } from './pagecss/sbpHomeCss4'
import { sbpAdminCss1 } from './pagecss/sbpAdminCss1'
import { sbpAdminCss2 } from './pagecss/sbpAdminCss2'
import { sbpAdminCss3 } from './pagecss/sbpAdminCss3'
import { sbpAdminCss4 } from './pagecss/sbpAdminCss4'
import { sbpWidgetsCss1 } from './pagecss/sbpWidgetsCss1'
import { sbpSettingsCss1 } from './pagecss/sbpSettingsCss1'
import { sbpHeaderCss1 } from './pagecss/sbpHeaderCss1'
import { sbpHeaderCss2 } from './pagecss/sbpHeaderCss2'
import { getLogLevelForPage, getLogLevelScript } from './lib/logLevel'
import { getFullUrl, ROUTES, ROUTE_PATHS } from './config/routes'
import {
  requireInternalAccess,
  InternalAccessDeniedError
} from './lib/access/requireInternalAccess'
import { getPageTitle, getHeaderText } from './config/project'
import * as loggerLib from './lib/logger.lib'
import * as settingsLib from './lib/settings.lib'
import { fetchGcOperations } from './lib/gateway/gcOperationsLoader'
import { getWidgetSettings } from './lib/widget/widgetSettings.lib'
import { htmlRedirect } from './lib/htmlRedirect'

const LOG_PATH = 'index'

// Имя главной страницы для заголовка <title> и шапки. Локально, по аналогии с p/saas/gw/gc.
const PANEL_PAGE_NAME = 'Панель'

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
      return htmlRedirect(ctx, getFullUrl(ROUTE_PATHS.forbidden))
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] signin_redirect`,
      payload: { backUrl: req.url }
    })
    return htmlRedirect(ctx, `/s/auth/signin?back=${encodeURIComponent(req.url)}`)
  }

  const isAdmin = ctx.user?.is('Admin') ?? false

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { hasUser: !!ctx.user, isAdmin }
  })

  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
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

  // Lava.Top webhook URL (без секрета в query: Lava.Top передаёт его в заголовке).
  const webhookLavatopPath = getFullUrl(ROUTES.webhookLavatop)
  const webhookUrlLavatop = `https://${ctx.account.host}${webhookLavatopPath}`

  // Base URL: путь до эндпоинта создания счёта (из config/routes). Хост дописывается
  // на фронте через window.location.origin — см. HomePage.vue (ClientHomePage) computed baseUrl.
  const baseUrlPath = getFullUrl(ROUTES.createBill)

  // Глобальный фильтр панели по дате/времени (Unix ms). Читается из Heap на SSR
  // и передаётся пропсом — общий для всех пользователей и сессий.
  const initialDateFilter = await settingsLib.getPanelDateFilter(ctx)

  // Каталог enabled-операций GC. При отключённом gc_enabled или сбое — пустой
  // массив (дропдаун рендерится без группы GetCourse, остальные гейтвеи работают).
  const gcOperations = await fetchGcOperations(ctx)

  // Флаг активации GC для вкладки «Настройки» (operational-тоггл, перенесён
  // из /web/admin: секреты/URL/host GC остались в админке, активация живёт
  // рядом с панелью и доступна сотрудникам).
  const initialGcEnabled = await settingsLib.getGcEnabled(ctx)

  // Виджет-настройки для карточки «Виджеты оплаты» на вкладке «Настройки»
  // (бизнес-настройки: enabled, domains, min/max, фильтр офферов). Перенесены
  // из /web/admin вместе с картой; доступ — guardInternalApi (сотрудник + Admin).
  // graceful degradation: при сбое геттера компонент получает дефолтный объект.
  let initialWidgetSettings
  try {
    initialWidgetSettings = await getWidgetSettings(ctx)
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] getWidgetSettings failed — fallback to defaults`,
      payload: { error: String(e) }
    })
    initialWidgetSettings = {
      lifepayEnabled: false,
      lifepayDomains: '',
      lifepayMin: 0,
      lifepayMax: 0,
      lifepayOfferListType: 'whitelist' as const,
      lifepayOffers: [] as import('./shared/widgetSettingsTypes').AllowedOffer[],
      lavatopEnabled: false,
      lavatopDomains: '',
      lavatopMin: 0,
      lavatopMax: 0,
      lavatopOfferListType: 'whitelist' as const,
      lavatopOffers: [] as import('./shared/widgetSettingsTypes').AllowedOffer[]
    }
  }
  const anchorBaseUrl = `https://${ctx.account.host}`

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
    filterSave: `${getFullUrl('/api/lp/analytics/filter-save')}`,
    paymentSocket: `${getFullUrl('/api/lp/payment-socket')}`
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
    payload: {
      hasApikey: !!initialSettings.lp_apikey,
      hasGatewayBaseUrl: !!initialSettings.gateway_base_url,
      gcOperationsCount: gcOperations.length
    }
  })

  return (
    <html>
      <head>
        <title>{getPageTitle(PANEL_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        {/* Флаги esm-bundler сборки Vue — выставляем ДО загрузки Vue-чанков
            платформой Chatium, иначе runtime пишет варнинг в консоль. */}
        <script>{`window.__VUE_OPTIONS_API__=true;window.__VUE_PROD_DEVTOOLS__=false;window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__=false;`}</script>
        <script>{getLogLevelScript(logLevel)}</script>
        <style>{crtBackgroundStyles}</style>
        <style>{customScrollbarStyles}</style>
        <style>{sbpHomeCss1}</style>
        <style>{sbpHomeCss2}</style>
        <style>{sbpHomeCss3}</style>
        <style>{sbpHomeCss4}</style>
        <style>{sbpAdminCss1}</style>
        <style>{sbpAdminCss2}</style>
        <style>{sbpAdminCss3}</style>
        <style>{sbpAdminCss4}</style>
        <style>{sbpWidgetsCss1}</style>
        <style>{sbpSettingsCss1}</style>
        <style>{sbpHeaderCss1}</style>
        <style>{sbpHeaderCss2}</style>
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
        <ClientHomePage
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
          webhookUrlLavatop={webhookUrlLavatop}
          baseUrlPath={baseUrlPath}
          apiUrls={apiUrls}
          initialSettings={initialSettings}
          initialDateFilter={initialDateFilter}
          initialGcEnabled={initialGcEnabled}
          initialWidgetSettings={initialWidgetSettings}
          anchorBaseUrl={anchorBaseUrl}
          gcOperations={gcOperations}
        />
      </body>
    </html>
  )
})

export default indexPageRoute
