// @shared
import { jsx } from '@app/html-jsx'
import DesignComponentsLightPage from '../../../pages/DesignComponentsLightPage.vue'
import { getBootLoaderDiv, getDemoPageHead } from '../../../shared/demoPageShell'
import { getFullUrl, ROUTES } from '../../../config/routes'
import { DEFAULT_PROJECT_TITLE } from '../../../config/project'

const PAGE_NAME = 'BPM Components Catalog · Sunrise Leaf'
const PRESET_ID = 'sunrise-leaf'

export const designComponentsLightPageRoute = app.html('/', async () => {
  const indexUrl = getFullUrl(ROUTES.index)
  const pageUrl = getFullUrl(ROUTES.pageLight)

  return (
    <html>
      <head>{getDemoPageHead('light', PAGE_NAME, DEFAULT_PROJECT_TITLE, 'Info', PRESET_ID)}</head>
      <body>
        {getBootLoaderDiv('light', DEFAULT_PROJECT_TITLE, PRESET_ID)}
        <DesignComponentsLightPage indexUrl={indexUrl} pageUrl={pageUrl} />
      </body>
    </html>
  )
})

export default designComponentsLightPageRoute
