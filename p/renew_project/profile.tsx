// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import ProfilePage from './pages/ProfilePage.vue'
import { loginPageRoute } from './login'
import { baseHtmlStyles } from './styles'

export const profilePageRoute = app.html('/', async (ctx, req) => {
  try {
    const user = requireRealUser(ctx)

    return (
      <html>
        <head>
          <title>Профиль</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta charset="UTF-8" />
          <script src="/s/metric/clarity.js"></script>
          <style>{baseHtmlStyles}</style>
        </head>
        <body>
          <ProfilePage
            user={{
              displayName: user.displayName,
              confirmedEmail: user.confirmedEmail,
              confirmedPhone: user.confirmedPhone
            }}
          />
        </body>
      </html>
    )
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
})

export default profilePageRoute
