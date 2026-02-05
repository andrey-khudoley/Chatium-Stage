/** Название проекта для демо-страниц дизайна */
export const DEFAULT_PROJECT_TITLE = 'A/Ley Services'

/** Текст для <title>: "Название страницы — Название проекта" */
export function getPageTitle(pageName: string, projectName: string): string {
  return `${pageName} - ${projectName}`
}

/** Текст для шапки: "Название проекта / Название страницы" */
export function getHeaderText(pageName: string, projectName: string): string {
  return `${projectName} / ${pageName}`
}
