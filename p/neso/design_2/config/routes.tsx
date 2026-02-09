export const PROJECT_ROOT = 'p/neso/design_2'

const BASE_PATH = `/${PROJECT_ROOT}`

export const ROUTES = {
  index: './',
  componentsDark: './web/dark/components',
  componentsLight: './web/light/components',
  pageDark: './web/dark',
  pageLight: './web/light'
} as const

export const ROUTE_PATHS = {
  index: '/',
  componentsDark: '/web/dark/components',
  componentsLight: '/web/light/components',
  pageDark: '/web/dark',
  pageLight: '/web/light'
} as const

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
