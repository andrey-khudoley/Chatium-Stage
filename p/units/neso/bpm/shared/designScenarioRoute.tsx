// @shared
import { jsx } from '@app/html-jsx'
import DesignScenarioPage from '../pages/DesignScenarioPage.vue'
import { getBootLoaderDiv, getDemoPageHead } from './demoPageShell'
import { DEFAULT_PROJECT_TITLE } from '../config/project'
import { ROUTES, getFullUrl } from '../config/routes'
import { getBpmScenarioBySlug } from './bpmScenarios'
import { getDefaultThemePresetId } from './themeCatalog'

export function createDesignScenarioRoute(scenarioSlug: string) {
  return app.html('/', async () => {
    const scenario = getBpmScenarioBySlug(scenarioSlug)
    const theme = scenario?.theme ?? 'dark'
    const presetId = scenario?.presetId ?? getDefaultThemePresetId(theme)
    const pageTitle = scenario ? `Design · ${scenario.title}` : `Design · ${scenarioSlug}`

    return (
      <html>
        <head>{getDemoPageHead(theme, pageTitle, DEFAULT_PROJECT_TITLE, 'Info', presetId)}</head>
        <body>
          {getBootLoaderDiv(theme, DEFAULT_PROJECT_TITLE, presetId)}
          <DesignScenarioPage
            scenarioSlug={scenarioSlug}
            homeUrl={getFullUrl(ROUTES.index)}
            loginUrl={getFullUrl(ROUTES.login)}
            adminUrl={getFullUrl(ROUTES.admin)}
            testsUrl={getFullUrl(ROUTES.tests)}
            designIndexUrl={getFullUrl(ROUTES.design)}
          />
        </body>
      </html>
    )
  })
}
