// @shared

export interface TestDefinition {
  name: string
  description: string
}

export interface TestCategory {
  name: string
  title: string
  icon: string
  tests: TestDefinition[]
}

export const TEST_CATEGORIES: TestCategory[] = [
  {
    name: 'basic',
    title: 'Базовые тесты',
    icon: 'fa-flask',
    tests: [
      { name: 'app_loads', description: 'Приложение загружается' },
    ]
  },
  {
    name: 'api',
    title: 'Тесты API endpoints (route.run)',
    icon: 'fa-code',
    tests: [
      { name: 'validate_token_empty', description: 'Валидация токена: пустой токен' },
      { name: 'validate_token_invalid', description: 'Валидация токена: невалидный токен' },
      { name: 'add_bot_empty_token', description: 'Добавление бота: пустой токен' },
      { name: 'add_bot_duplicate', description: 'Добавление бота: проверка дубликатов' },
      { name: 'add_bot_success', description: 'Добавление бота: успешное создание' },
    ]
  },
  {
    name: 'api_http',
    title: 'Тесты HTTP доступности endpoints',
    icon: 'fa-globe',
    tests: [
      { name: 'http_post_validate_token', description: 'HTTP POST /api/bots/validate-token' },
      { name: 'http_post_add_bot', description: 'HTTP POST /api/bots/add' },
      { name: 'http_get_list', description: 'HTTP GET /api/bots/list' },
    ]
  },
  {
    name: 'pages',
    title: 'Тесты загрузки страниц',
    icon: 'fa-file-lines',
    tests: [
      { name: 'page_index', description: 'GET / - Главная страница' },
      { name: 'page_login', description: 'GET /login - Страница входа' },
      { name: 'page_profile', description: 'GET /profile - Страница профиля' },
      { name: 'page_settings', description: 'GET /settings - Страница настроек' },
      { name: 'page_channels', description: 'GET /channels - Страница каналов' },
    ]
  },
  {
    name: 'database',
    title: 'Тесты базы данных (Heap Table)',
    icon: 'fa-database',
    tests: [
      { name: 'table_exists', description: 'Проверка существования таблицы BotTokens' },
      { name: 'create_bot', description: 'Создание записи бота в таблице' },
      { name: 'find_bot_by_user', description: 'Поиск ботов по userId' },
      { name: 'find_bot_duplicate', description: 'Проверка поиска дубликатов токена' },
    ]
  }
]

 