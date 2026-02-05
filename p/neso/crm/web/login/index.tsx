// @shared
import { jsx } from '@app/html-jsx'
import LoginPage from '../../pages/LoginPage.vue'
import { baseHtmlStyles, customScrollbarStyles, designTokens } from '../../styles'
import { PROJECT_ROOT } from '../../config/routes'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'web/login/index'

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
      <head>
        <title>Вход</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <style>{designTokens}</style>
        <style>{baseHtmlStyles}</style>
        <style>{customScrollbarStyles}</style>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700&family=Old+Standard+TT:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LoginPage back={back} />
      </body>
    </html>
  )
})

export default loginPageRoute
