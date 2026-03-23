// @shared
import { jsx } from '@app/html-jsx'
import PomodoroPage from '../../pages/PomodoroPage.vue'
import { getApiUrlForRoute, getFullUrl, ROUTES } from '../../config/routes'
import { POMODORO_PAGE_NAME, getPageTitle, getHeaderText } from '../../config/project'
import * as settingsLib from '../../lib/settings.lib'
import { getPomodoroStateRoute } from '../../api/pomodoro/state/get'
import { pomodoroControlRoute } from '../../api/pomodoro/control'
import { savePomodoroSettingsRoute } from '../../api/pomodoro/settings/save'
import { pomodoroAssignTaskRoute } from '../../api/pomodoro/assign-task'
import { getInProgressTasksRoute } from '../../api/tasks/in-progress'
import { customScrollbarStyles, mobileSafeAreaStyles, VIEWPORT_META_CONTENT } from '../../styles'

export const pomodoroPageRoute = app.html('/', async (ctx) => {
  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const projectName = await settingsLib.getSettingString(ctx, settingsLib.SETTING_KEYS.PROJECT_NAME)
  return (
    <html>
      <head>
        <title>{getPageTitle(POMODORO_PAGE_NAME, projectName)}</title>
        <meta name="viewport" content={VIEWPORT_META_CONTENT} />
        <meta charset="UTF-8" />
        <style>{customScrollbarStyles}</style>
        <style>{mobileSafeAreaStyles}</style>
        <style>{`
          html {
            margin: 0;
            padding: 0;
            background: #0a0a0a;
          }
          body {
            margin: 0;
            padding: 0;
            background: #0a0a0a;
            font-family: 'Share Tech Mono', 'Courier New', monospace;
          }
          :root {
            --color-bg: #0a0a0a;
            --color-bg-secondary: #141414;
            --color-bg-tertiary: #1a1a1a;
            --color-text: #e8e8e8;
            --color-text-secondary: #a0a0a0;
            --color-border: #2a2a2a;
            --color-border-light: #3a3a3a;
            --color-accent: #d3234b;
            --color-accent-hover: #e6395f;
            --color-accent-light: rgba(211, 35, 75, 0.1);
          }
        `}</style>
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PomodoroPage
          projectTitle={getHeaderText(POMODORO_PAGE_NAME, projectName)}
          indexUrl={getFullUrl(ROUTES.index)}
          profileUrl={getFullUrl(ROUTES.profile)}
          loginUrl={getFullUrl(ROUTES.login)}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          adminUrl={isAdmin ? getFullUrl(ROUTES.admin) : ''}
          testsUrl={isAuthenticated ? getFullUrl(ROUTES.tests) : ''}
          stateGetUrl={getApiUrlForRoute(getPomodoroStateRoute.url())}
          controlUrl={getApiUrlForRoute(pomodoroControlRoute.url())}
          settingsSaveUrl={getApiUrlForRoute(savePomodoroSettingsRoute.url())}
          assignTaskUrl={getApiUrlForRoute(pomodoroAssignTaskRoute.url())}
          getTasksUrl={getApiUrlForRoute(getInProgressTasksRoute.url())}
        />
      </body>
    </html>
  )
})

export default pomodoroPageRoute
