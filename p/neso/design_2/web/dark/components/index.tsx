// @shared
import { jsx } from '@app/html-jsx'
import DesignComponentsDarkPage from '../../../pages/DesignComponentsDarkPage.vue'
import { getBootLoaderDiv, getDemoPageHead } from '../../../shared/demoPageShell'
import { getFullUrl, ROUTES } from '../../../config/routes'
import { DEFAULT_PROJECT_TITLE } from '../../../config/project'

const PAGE_NAME = 'BPM Components Catalog · Night Forest'
const PRESET_ID = 'forest-night'

export const designComponentsDarkPageRoute = app.html('/', async () => {
  const indexUrl = getFullUrl(ROUTES.index)
  const pageUrl = getFullUrl(ROUTES.pageDark)

  return (
    <html>
      <head>{getDemoPageHead('dark', PAGE_NAME, DEFAULT_PROJECT_TITLE, 'Info', PRESET_ID)}</head>
      <body>
        {getBootLoaderDiv('dark', DEFAULT_PROJECT_TITLE, PRESET_ID)}
        <DesignComponentsDarkPage indexUrl={indexUrl} pageUrl={pageUrl} />
      </body>
    </html>
  )
})

export default designComponentsDarkPageRoute
