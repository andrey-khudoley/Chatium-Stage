/** Название проекта по умолчанию (если в настройках не задано) */
export const DEFAULT_PROJECT_TITLE = 'NeSo CRM'

/** Имя страницы: для главной и профиля */
export const INDEX_PAGE_NAME = 'Главная'
export const PROFILE_PAGE_NAME = 'Профиль'
export const ADMIN_PAGE_NAME = 'Админка'
export const TESTS_PAGE_NAME = 'Тесты'
export const INQUIRIES_PAGE_NAME = 'Библиотека компонентов'

/** Текст для <title>: "Название страницы - Название из настроек" */
export function getPageTitle(pageName: string, projectName: string): string {
  return `${pageName} - ${projectName}`
}

/** Текст для шапки (h1): "Название из настроек / Название страницы" */
export function getHeaderText(pageName: string, projectName: string): string {
  return `${projectName} / ${pageName}`
}

/** Текст контента домашней страницы (заголовок) */
export const BODY_TEXT = 'NeSo CRM'

/** Подзаголовок домашней страницы */
export const BODY_SUBTEXT = 'Заготовка в новом дизайне'
