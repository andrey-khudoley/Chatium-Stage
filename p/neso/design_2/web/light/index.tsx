import { jsx } from '@app/html-jsx'
import DesignDemoPage from '../../pages/DesignDemoPage.vue'
import { getBootLoaderDiv, getDemoPageHead } from '../../shared/demoPageShell'
import { getFullUrl, ROUTES } from '../../config/routes'
import { DEFAULT_PROJECT_TITLE } from '../../config/project'

const PROJECT_NAME = DEFAULT_PROJECT_TITLE
const PAGE_NAME = 'BPM Control Workspace · Sunrise Leaf'
const PRESET_ID = 'sunrise-leaf'

export const designDemoLightPageRoute = app.html('/', async (ctx) => {
  const isAuthenticated = !!ctx.user
  const isAdmin = ctx.user?.is('Admin') ?? false
  const indexUrl = getFullUrl(ROUTES.index)

  return (
    <html>
      <head>{getDemoPageHead('light', PAGE_NAME, PROJECT_NAME, 'Info', PRESET_ID)}</head>
      <body>
        {getBootLoaderDiv('light', PROJECT_NAME, PRESET_ID)}
        <DesignDemoPage
          theme="light"
          themePresetId={PRESET_ID}
          pageTitle={PAGE_NAME}
          breadcrumbs={['Home', 'BPM']}
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

export default designDemoLightPageRoute
