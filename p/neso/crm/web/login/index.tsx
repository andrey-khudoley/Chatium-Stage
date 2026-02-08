// @shared
import { jsx } from '@app/html-jsx'
import LoginPage from '../../pages/LoginPage.vue'
import { PROJECT_ROOT } from '../../config/routes'
import { DEFAULT_PROJECT_TITLE } from '../../config/project'
import { getDemoPageHead, getBootLoaderDiv } from '../../shared/demoPageShell'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'web/login/index'
const THEME = 'dark' as const

export const loginPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы входа`,
    payload: { queryKeys: Object.keys(req.query ?? {}), query: req.query }
  })
  const back = (req.query?.back as string) || `/${PROJECT_ROOT}/`
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные для рендера`,
    payload: { back, hasQuery: !!req.query?.back }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Рендер страницы входа`,
    payload: { back, hasQuery: !!req.query?.back }
  })

  return (
    <html>
      <head>{getDemoPageHead(THEME, 'Вход', DEFAULT_PROJECT_TITLE)}</head>
      <body>
        {getBootLoaderDiv(THEME, DEFAULT_PROJECT_TITLE)}
        <LoginPage back={back} />
      </body>
    </html>
  )
})

export default loginPageRoute
