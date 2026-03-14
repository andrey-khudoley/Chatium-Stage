// @shared
import { jsx } from '@app/html-jsx'
import WeekPage from '../../pages/WeekPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { getSectionPageLayoutStyles, sectionPageVariablesStyles } from '../../shared/sectionPageStyles'
import { getLogLevelForPage, getLogLevelScript } from '../../shared/logLevel'
import * as loggerLib from '../../lib/logger.lib'
import { getFullUrl, ROUTES } from '../../config/routes'
import { WEEK_PAGE_NAME, getPageTitle, getHeaderText } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'
import { customScrollbarStyles } from '../../styles'

const LOG_PATH = 'web/week/index'

export const weekPageRoute = app.html('/', async (ctx) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы «Неделя»`,
    payload: { hasUser: !!ctx.user }
  })

  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is?.('Admin') ?? false
  const adminUrl = isAdmin ? getFullUrl(ROUTES.admin) : ''
  const testsUrl = isAuthenticated ? getFullUrl(ROUTES.tests) : ''
  const loginUrl = getFullUrl(ROUTES.login)
  const logLevel = await getLogLevelForPage(ctx)
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)

  return (
    <html>
      <head>
        <title>{getPageTitle(WEEK_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script>{getLogLevelScript(logLevel)}</script>
        <script src="/s/metric/clarity.js"></script>
        <style>{getPreloaderStyles()}</style>
        <style>{customScrollbarStyles}</style>
        <style>{getSectionPageLayoutStyles(getPreloaderStyles)}</style>
        <script>{getPreloaderScript()}</script>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
        <style>{sectionPageVariablesStyles}</style>
      </head>
      <body>
        <div id="geometric-bg"></div>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
        <WeekPage
          projectTitle={getHeaderText(WEEK_PAGE_NAME, projectName)}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          loginUrl={loginUrl}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          adminUrl={adminUrl}
          testsUrl={testsUrl}
          calendarUrl={getFullUrl(ROUTES.calendar)}
          myDayUrl={getFullUrl(ROUTES.myDay)}
          weekUrl={getFullUrl(ROUTES.week)}
          habitsUrl={getFullUrl(ROUTES.habits)}
          notebookUrl={getFullUrl(ROUTES.notebook)}
        />
      </body>
    </html>
  )
})

export default weekPageRoute
