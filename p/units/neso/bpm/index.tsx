// @shared
import { jsx } from '@app/html-jsx'
import HomePage from './pages/HomePage.vue'
import { getBootLoaderDiv, getDemoPageHead } from './shared/demoPageShell'
import { DEFAULT_PROJECT_TITLE, INDEX_PAGE_NAME } from './config/project'
import {
  ROUTES,
  getDesignScenarioRoute,
  getFullUrl
} from './config/routes'
import { BPM_DESIGN_SCENARIOS } from './shared/bpmScenarios'

export const indexPageRoute = app.html('/', async () => {
  const featuredScenarios = BPM_DESIGN_SCENARIOS.slice(0, 6).map((scenario) => ({
    slug: scenario.slug,
    title: scenario.title,
    description: scenario.description,
    url: getFullUrl(getDesignScenarioRoute(scenario.slug))
  }))

  return (
    <html>
      <head>{getDemoPageHead('light', INDEX_PAGE_NAME, DEFAULT_PROJECT_TITLE, 'Info', 'sunrise-leaf')}</head>
      <body>
        {getBootLoaderDiv('light', DEFAULT_PROJECT_TITLE, 'sunrise-leaf')}
        <HomePage
          projectTitle={DEFAULT_PROJECT_TITLE}
          loginUrl={getFullUrl(ROUTES.login)}
          adminUrl={getFullUrl(ROUTES.admin)}
          testsUrl={getFullUrl(ROUTES.tests)}
          designUrl={getFullUrl(ROUTES.design)}
          scenarioCount={BPM_DESIGN_SCENARIOS.length}
          featuredScenarios={featuredScenarios}
        />
      </body>
    </html>
  )
})

export default indexPageRoute
