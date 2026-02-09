// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import DesignModuleDemoPage from '../../pages/DesignModuleDemoPage.vue'
import { getPreloaderScript, getPreloaderStyles } from '../preloader'
import { getLogLevelForPage, getLogLevelScript } from '../logLevel'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { getHeaderText, getPageTitle } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'
import { getCrmGlobalStyles } from './globalStyles'
import { getGoogleFontsHref, getUiBootstrapScript } from './system'
import {
  getDesignCatalogModule,
  getDesignCatalogNeighbors
} from './catalog'

const LOG_PATH = 'shared/design/moduleDemoRouteFactory'
const DESIGN_PAGE_PREFIX = 'Design Demo'

export function createDesignModuleDemoRoute(slug: string) {
  return app.html('/', async (ctx, req) => {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Request design module page`,
      payload: { hasUser: !!ctx.user, slug }
    })

    let user
    try {
      user = requireRealUser(ctx)
    } catch (error: unknown) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] Redirect to login: auth required`,
        payload: { error: String(error), backUrl: req.url, slug }
      })

      const loginUrl = getFullUrl(ROUTES.login)
      return ctx.resp.redirect(`${loginUrl}?back=${encodeURIComponent(req.url)}`)
    }

    const module = getDesignCatalogModule(slug)
    if (!module) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] Unknown design module slug`,
        payload: { slug }
      })

      return ctx.resp.redirect(getFullUrl('./web/design'))
    }

    const { previous, next } = getDesignCatalogNeighbors(slug)
    const isAdmin = user.is('Admin')
    const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
    const loginUrl = getFullUrl(ROUTES.login)
    const catalogUrl = getFullUrl('./web/design')
    const logLevel = await getLogLevelForPage(ctx)
    const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
    const initialLocale = (ctx.lang === 'en' ? 'en' : 'ru') as 'ru' | 'en'

    const pageName = `${DESIGN_PAGE_PREFIX} · ${module.title}`

    return (
      <html>
        <head>
          <title>{getPageTitle(pageName, projectName)}</title>
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

          <DesignModuleDemoPage
            projectTitle={getHeaderText(pageName, projectName)}
            indexUrl={getFullUrl(ROUTES.index)}
            profileUrl={getFullUrl(ROUTES.profile)}
            testsUrl={getFullUrl(ROUTES.tests)}
            loginUrl={loginUrl}
            isAuthenticated={true}
            isAdmin={isAdmin}
            adminUrl={adminUrl}
            initialLocale={initialLocale}
            module={module}
            catalogUrl={catalogUrl}
            previous={
              previous
                ? {
                    title: previous.title,
                    url: getFullUrl(`./web/design/${previous.slug}`)
                  }
                : undefined
            }
            next={
              next
                ? {
                    title: next.title,
                    url: getFullUrl(`./web/design/${next.slug}`)
                  }
                : undefined
            }
          />
        </body>
      </html>
    )
  })
}
