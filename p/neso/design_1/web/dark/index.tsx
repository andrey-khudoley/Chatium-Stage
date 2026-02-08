// @shared
// Тёмная тема «Ночной лес» — главная страница примера приложения
import { jsx } from '@app/html-jsx'
import DesignDemoPage from '../../pages/DesignDemoPage.vue'
import { getDemoPageHead, getBootLoaderDiv } from '../../shared/demoPageShell'
import { getFullUrl, ROUTES } from '../../config/routes'
import { DEFAULT_PROJECT_TITLE } from '../../config/project'

const PROJECT_NAME = DEFAULT_PROJECT_TITLE
const PAGE_NAME = 'Сводка · Ночной лес'

export const designDemoDarkPageRoute = app.html('/', async (ctx) => {
  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const indexUrl = getFullUrl(ROUTES.index)

  return (
    <html>
      <head>{getDemoPageHead('dark', PAGE_NAME, PROJECT_NAME)}</head>
      <body>
        {getBootLoaderDiv('dark', PROJECT_NAME)}
        <DesignDemoPage
          theme="dark"
          pageTitle={PAGE_NAME}
          breadcrumbs={['Главная', 'Сводка']}
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

export default designDemoDarkPageRoute
