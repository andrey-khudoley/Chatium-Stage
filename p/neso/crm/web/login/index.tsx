// @shared
import { jsx } from '@app/html-jsx'
import LoginPage from '../../pages/LoginPage.vue'
import { getPreloaderStyles, getPreloaderScript } from '../../shared/preloader'
import { PROJECT_ROOT, getFullUrl, ROUTES } from '../../config/routes'
import * as loggerLib from '../../lib/logger.lib'
import {
  darkThemeTokens,
  darkPageStyles,
  darkScrollbarStyles,
  lightThemeTokens,
  lightPageStyles,
  lightScrollbarStyles
} from '../design/theme'
import { darkUiStyles } from '../design/ui-dark'
import { lightUiStyles } from '../design/ui-light'
import { uiSharedStyles } from '../design/ui-shared'
import { getThemeInitScript } from '../design/themeRuntime'

const LOG_PATH = 'web/login/index'

export const loginPageRoute = app.html('/', async (ctx, req) => {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос страницы входа`,
    payload: { queryKeys: Object.keys(req.query ?? {}), query: req.query }
  })
  const back = (req.query?.back as string) || `/${PROJECT_ROOT}/`
  const indexUrl = getFullUrl(ROUTES.index)
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
        <style data-theme="dark">{darkThemeTokens}</style>
        <style data-theme="dark">{darkPageStyles}</style>
        <style data-theme="dark">{darkScrollbarStyles}</style>
        <style data-theme="dark">{darkUiStyles}</style>
        <style data-theme="light" media="not all">{lightThemeTokens}</style>
        <style data-theme="light" media="not all">{lightPageStyles}</style>
        <style data-theme="light" media="not all">{lightScrollbarStyles}</style>
        <style data-theme="light" media="not all">{lightUiStyles}</style>
        <style>{uiSharedStyles}</style>
        <script>{getThemeInitScript()}</script>
        <style>{getPreloaderStyles()}</style>
        <script>{getPreloaderScript()}</script>
        <link rel="stylesheet" href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="boot-loader">
          <div class="boot-messages">
            <div id="boot-messages-container"></div>
          </div>
        </div>
        <LoginPage back={back} indexUrl={indexUrl} />
      </body>
    </html>
  )
})

export default loginPageRoute
