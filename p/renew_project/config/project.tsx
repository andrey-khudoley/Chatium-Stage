/** Название проекта (для заголовков и шапки) */
export const PROJECT_TITLE = 'A/Ley Services'

/** Имя страницы: для главной и профиля */
export const INDEX_PAGE_NAME = 'Главная'
export const PROFILE_PAGE_NAME = 'Профиль'

/** Текст для <title>: "PAGE_NAME | PROJECT_TITLE" */
export function getPageTitle(pageName: string): string {
  return `${pageName} | ${PROJECT_TITLE}`
}

/** Текст для шапки: "PROJECT_TITLE / PAGE_NAME" */
export function getHeaderText(pageName: string): string {
  return `${PROJECT_TITLE} / ${pageName}`
}

/** Текст контента домашней страницы (заголовок) */
export const BODY_TEXT = 'Шаблон проекта'

/** Подзаголовок домашней страницы */
export const BODY_SUBTEXT = 'В разработке'
