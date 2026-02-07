// @shared
import { jsx } from '@app/html-jsx'
import DesignDemoLightPage from './components/DesignDemoLightPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getLogLevelScript } from '../../shared/logLevel'
import { getFullUrl, ROUTES } from '../../config/routes'
import { DEFAULT_PROJECT_TITLE, getPageTitle, getHeaderText } from '../../config/project'
import { lightThemeTokens, lightPageStyles, lightScrollbarStyles } from './theme'
import { lightUiStyles } from './ui-light'
import type { LogLevel } from '../../lib/settings.lib'

const PROJECT_NAME = DEFAULT_PROJECT_TITLE
const LOG_LEVEL: LogLevel = 'Info'

export const designLightPageRoute = app.html('/', async (ctx) => {
  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const indexUrl = getFullUrl(ROUTES.index)

  return (
    <html>
      <head>
        <title>{getPageTitle('Design Demo (Light)', PROJECT_NAME)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <meta name="theme-color" content="#f5f8f0" />
        <script>{getLogLevelScript(LOG_LEVEL)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style>{lightThemeTokens}</style>
        <style>{lightPageStyles}</style>
        <style>{lightScrollbarStyles}</style>
        <style>{lightUiStyles}</style>
        <style>{getPreloaderStyles()}</style>
        <script>{getPreloaderScript()}</script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
        <DesignDemoLightPage
          projectTitle={getHeaderText('Design Demo (Light)', PROJECT_NAME)}
          logoUrl=""
          indexUrl={indexUrl}
          profileUrl={indexUrl}
          loginUrl={indexUrl}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          adminUrl={isAdmin ? indexUrl : ''}
        />
      </body>
    </html>
  )
})

export default designLightPageRoute
