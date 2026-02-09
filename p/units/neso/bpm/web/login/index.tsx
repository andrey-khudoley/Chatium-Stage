// @shared
import { jsx } from '@app/html-jsx'
import LoginPage from '../../pages/LoginPage.vue'
import { getBootLoaderDiv, getDemoPageHead } from '../../shared/demoPageShell'
import { DEFAULT_PROJECT_TITLE, LOGIN_PAGE_NAME } from '../../config/project'
import { ROUTES, getFullUrl } from '../../config/routes'

export const loginPageRoute = app.html('/', async (ctx, req) => {
  const back = typeof req.query?.back === 'string' ? req.query.back : getFullUrl(ROUTES.index)

  return (
    <html>
      <head>{getDemoPageHead('dark', LOGIN_PAGE_NAME, DEFAULT_PROJECT_TITLE, 'Info', 'midnight-pine')}</head>
      <body>
        {getBootLoaderDiv('dark', DEFAULT_PROJECT_TITLE, 'midnight-pine')}
        <LoginPage back={back} homeUrl={getFullUrl(ROUTES.index)} />
      </body>
    </html>
  )
})

export default loginPageRoute
