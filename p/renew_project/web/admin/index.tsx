// @shared
import { jsx } from '@app/html-jsx'
import { requireAccountRole } from '@app/auth'
import AdminPage from '../../pages/AdminPage.vue'
import { loginPageRoute } from '../login'
import { baseHtmlStyles } from '../../styles'

export const adminPageRoute = app.html('/', async (ctx, req) => {
  try {
    requireAccountRole(ctx, 'Admin')
  } catch (error) {
    const loginUrl = loginPageRoute.url() + `?back=${encodeURIComponent(req.url)}`
    return (
      <html>
        <head>
          <title>Вход</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charset="UTF-8" />
          <script src="/s/metric/clarity.js"></script>
          <meta http-equiv="refresh" content={`0; url=${loginUrl}`} />
          <script>{`window.location.href = '${loginUrl}'`}</script>
          <style>{baseHtmlStyles}</style>
        </head>
        <body>
          <p>Перенаправление на страницу входа...</p>
        </body>
      </html>
    )
  }

  return (
    <html>
      <head>
        <title>Админка</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <style>{baseHtmlStyles}</style>
      </head>
      <body>
        <AdminPage />
      </body>
    </html>
  )
})

export default adminPageRoute
