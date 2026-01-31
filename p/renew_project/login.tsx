// @shared
import { jsx } from '@app/html-jsx'
import LoginPage from './pages/LoginPage.vue'
import { baseHtmlStyles } from './styles'
import { PROJECT_ROOT } from './config/routes'

export const loginPageRoute = app.html('/', async (ctx, req) => {
  const back = (req.query?.back as string) || `/${PROJECT_ROOT}/`

  return (
    <html>
      <head>
        <title>Вход</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <style>{baseHtmlStyles}</style>
      </head>
      <body>
        <LoginPage back={back} />
      </body>
    </html>
  )
})

export default loginPageRoute
