// @shared
// Единый источник истины для всех тестов проекта аналитики

export const TEST_CATEGORIES = [
  {
    name: 'infrastructure',
    title: 'Инфраструктура проекта',
    icon: 'fa-cogs',
    tests: [
      { name: 'index_route_exists', description: 'Проверка существования главного роута' },
      { name: 'folder_structure', description: 'Проверка структуры папок' },
      { name: 'vue_component_exists', description: 'Проверка Vue компонента DashboardHome.vue' }
    ]
  },
  {
    name: 'auth',
    title: 'Авторизация',
    icon: 'fa-user-shield',
    tests: [
      { name: 'admin_required', description: 'Проверка требования роли Admin' },
      { name: 'user_context', description: 'Проверка доступности ctx.user' }
    ]
  },
  {
    name: 'pages',
    title: 'Страницы проекта',
    icon: 'fa-file-alt',
    tests: [
      { name: 'dashboard_home', description: 'Доступность главной страницы' },
      { name: 'events_dashboard', description: 'Доступность страницы "Обзор событий"' },
      { name: 'all_users_page', description: 'Доступность страницы "Все пользователи"' },
      { name: 'settings_page', description: 'Доступность страницы "Настройки"' }
    ]
  },
  {
    name: 'api',
    title: 'API эндпоинты',
    icon: 'fa-plug',
    tests: [
      { name: 'events_list_api', description: 'API получения списка событий (/api/events/list)' },
      { name: 'events_stats_api', description: 'API получения статистики событий (/api/events/stats)' },
      { name: 'user_events_api', description: 'API получения событий пользователя (/api/events/user-events)' },
      { name: 'users_list_api', description: 'API получения списка пользователей (/api/users/list)' },
      { name: 'users_search_api', description: 'API поиска пользователей (/api/users/list?search=...)' },
      { name: 'users_update_historical_api', description: 'API обновления исторических данных (/api/users/update-historical)' }
    ]
  },
  {
    name: 'functional',
    title: 'Функциональные тесты',
    icon: 'fa-tasks',
    tests: [
      { name: 'events_table_component', description: 'Компонент таблицы событий EventsTable.vue' },
      { name: 'all_users_component', description: 'Компонент страницы всех пользователей AllUsers.vue' },
      { name: 'user_events_spoiler', description: 'Функционал разворачивания событий пользователя' },
      { name: 'user_events_count_by_userid', description: 'Подсчет событий по user_id (включая события без email)' }
    ]
  },
  {
    name: 'database',
    title: 'База данных',
    icon: 'fa-database',
    tests: [
      { name: 'users_table_exists', description: 'Проверка существования таблицы пользователей' },
      { name: 'users_table_structure', description: 'Проверка структуры таблицы пользователей' }
    ]
  }
]

