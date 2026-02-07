// PROJECT_ROOT — путь от корня воркспэйса до проекта (от /), должен совпадать с путём папки
export const PROJECT_ROOT = 'p/neso/design_1'

// Базовый путь проекта для формирования ссылок (от корня, без домена)
const BASE_PATH = `/${PROJECT_ROOT}`

// Все маршруты: библиотека компонентов и пример страницы, в тёмной и светлой теме
export const ROUTES = {
  index: './',
  /** Библиотека компонентов · тёмная тема */
  componentsDark: './web/dark/components',
  /** Библиотека компонентов · светлая тема */
  componentsLight: './web/light/components',
  /** Пример страницы (dashboard) · тёмная тема */
  pageDark: './web/dark',
  /** Пример страницы (dashboard) · светлая тема */
  pageLight: './web/light'
} as const

/** Пути для getFullUrl (абсолютные от корня проекта) */
export const ROUTE_PATHS = {
  index: '/',
  componentsDark: '/web/dark/components',
  componentsLight: '/web/light/components',
  pageDark: '/web/dark',
  pageLight: '/web/light'
} as const

/**
 * Формирует путь для передачи на фронтенд (Vue компоненты, ссылки).
 * От корня "/" через PROJECT_ROOT, без хардкода домена.
 */
export function getFullUrl(path: string): string {
  const clean = path.replace(/^\.\//, '').replace(/^\//, '')
  const normalized = clean ? `/${clean}` : '/'
  return `${BASE_PATH}${normalized}`
}

export function withProjectRoot(route: string): string {
  const clean = route.startsWith('./') ? route.slice(2) : route
  return `./${PROJECT_ROOT}/${clean}`
}

export function withProjectRootAndSubroute(route: string, subroute?: string): string {
  if (!subroute || subroute === '/') return withProjectRoot(route)
  const clean = subroute.startsWith('/') ? subroute.slice(1) : subroute
  return `${withProjectRoot(route)}~${clean}`
}
