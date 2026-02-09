// @shared
import { jsx } from '@app/html-jsx'
import DesignIndexPage from '../../pages/DesignIndexPage.vue'
import { getBootLoaderDiv, getDemoPageHead } from '../../shared/demoPageShell'
import { DEFAULT_PROJECT_TITLE, DESIGN_PAGE_NAME } from '../../config/project'
import {
  ROUTES,
  getDesignScenarioRoute,
  getFullUrl
} from '../../config/routes'
import { BPM_DESIGN_SCENARIOS } from '../../shared/bpmScenarios'

export const designIndexPageRoute = app.html('/', async () => {
  const scenarios = BPM_DESIGN_SCENARIOS.map((scenario) => ({
    slug: scenario.slug,
    title: scenario.title,
    description: scenario.description,
    objective: scenario.objective,
    tags: scenario.tags,
    theme: scenario.theme,
    presetId: scenario.presetId,
    layout: scenario.layout,
    url: getFullUrl(getDesignScenarioRoute(scenario.slug))
  }))

  return (
    <html>
      <head>{getDemoPageHead('light', DESIGN_PAGE_NAME, DEFAULT_PROJECT_TITLE, 'Info', 'sunrise-leaf')}</head>
      <body>
        {getBootLoaderDiv('light', DEFAULT_PROJECT_TITLE, 'sunrise-leaf')}
        <DesignIndexPage
          homeUrl={getFullUrl(ROUTES.index)}
          loginUrl={getFullUrl(ROUTES.login)}
          adminUrl={getFullUrl(ROUTES.admin)}
          testsUrl={getFullUrl(ROUTES.tests)}
          scenarios={scenarios}
        />
      </body>
    </html>
  )
})

export default designIndexPageRoute
