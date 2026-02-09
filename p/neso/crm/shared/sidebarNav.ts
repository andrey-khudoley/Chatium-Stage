// @shared
// Общая конфигурация левого меню (сайдбара) для всех страниц CRM.
// Изменения здесь автоматически отражаются на всех страницах.

export interface SidebarNavChildItem {
  id: string
  label: string
  icon?: string
}

export interface SidebarNavItem {
  id: string
  icon: string
  label: string
  children?: SidebarNavChildItem[]
}

export interface SidebarNavParams {
  indexUrl: string
  adminUrl?: string
  testsUrl?: string
  inquiriesUrl?: string
  isAdmin?: boolean
}

/**
 * Возвращает пункты меню для сайдбара.
 * Структура: Главная | Админка (только для админов) — Админ-панель, Тесты
 */
export function getSidebarNavItems(params: SidebarNavParams): SidebarNavItem[] {
  const { indexUrl, adminUrl, testsUrl, inquiriesUrl, isAdmin } = params

  const items: SidebarNavItem[] = [
    {
      id: 'dashboard',
      icon: 'fa-house',
      label: 'Главная'
    }
  ]

  if (inquiriesUrl) {
    items.push({
      id: 'inquiries',
      icon: 'fa-inbox',
      label: 'Заявки'
    })
  }

  if ((isAdmin && adminUrl) || testsUrl) {
    const adminChildren: SidebarNavItem['children'] = []
    if (isAdmin && adminUrl) {
      adminChildren.push({ id: 'admin-panel', label: 'Админ-панель' })
    }
    if (testsUrl) {
      adminChildren.push({ id: 'tests', label: 'Тесты' })
    }
    if (adminChildren.length > 0) {
      items.push({
        id: 'admin',
        icon: 'fa-gear',
        label: 'Админка',
        children: adminChildren
      })
    }
  }

  return items
}

/**
 * Возвращает маппинг id пункта меню → URL для перехода.
 */
export function getSidebarNavIdToUrl(params: SidebarNavParams): Record<string, string> {
  const { indexUrl, adminUrl, testsUrl, inquiriesUrl } = params

  const map: Record<string, string> = {
    dashboard: indexUrl,
    inquiries: inquiriesUrl ?? '',
    'admin-panel': adminUrl ?? '',
    tests: testsUrl ?? ''
  }

  return map
}
