// PROJECT_ROOT — путь от корня воркспэйса до проекта (БЕЗ домена)
export const PROJECT_ROOT = 'p/renew_project'

// Все маршруты внутри проекта задаются ОТНОСИТЕЛЬНО (через ./)
export const ROUTES = {
  index: './',
  admin: './admin',
  profile: './profile',
  login: './login'
} as const

export function withProjectRoot(route: string): string {
  const clean = route.startsWith('./') ? route.slice(2) : route
  return `./${PROJECT_ROOT}/${clean}`
}

export function withProjectRootAndSubroute(route: string, subroute?: string): string {
  if (!subroute || subroute === '/') return withProjectRoot(route)
  const clean = subroute.startsWith('/') ? subroute.slice(1) : subroute
  return `${withProjectRoot(route)}~${clean}`
}
