/** Название проекта по умолчанию (если в настройках не задано) */
export const DEFAULT_PROJECT_TITLE = 'Ассистент'

/** Имя страницы: для главной и профиля */
export const INDEX_PAGE_NAME = 'Главная'
export const PROFILE_PAGE_NAME = 'Профиль'
export const ADMIN_PAGE_NAME = 'Админка'
export const TESTS_PAGE_NAME = 'Тесты'

/** Имена страниц разделов главной */
export const CALENDAR_PAGE_NAME = 'Календарь'
export const MY_DAY_PAGE_NAME = 'Мой день'
export const WEEK_PAGE_NAME = 'Неделя'
export const HABITS_PAGE_NAME = 'Привычки'
export const NOTEBOOK_PAGE_NAME = 'Блокнот'

/** Текст для <title>: "Название страницы - Название из настроек" */
export function getPageTitle(pageName: string, projectName: string): string {
  return `${pageName} - ${projectName}`
}

/** Текст для шапки (h1): "Название из настроек / Название страницы" */
export function getHeaderText(pageName: string, projectName: string): string {
  return `${projectName} / ${pageName}`
}

/** Текст контента домашней страницы (заголовок) */
export const BODY_TEXT = 'Ассистент'

/** Подзаголовок домашней страницы */
export const BODY_SUBTEXT = 'В разработке'
