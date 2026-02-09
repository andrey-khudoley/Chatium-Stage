/** Project name used by demo pages. */
export const DEFAULT_PROJECT_TITLE = 'NeSo BPM Studio'

/** <title> text: "Page - Project" */
export function getPageTitle(pageName: string, projectName: string): string {
  return `${pageName} - ${projectName}`
}

/** Header helper for legacy integrations. */
export function getHeaderText(pageName: string, projectName: string): string {
  return `${projectName} / ${pageName}`
}
