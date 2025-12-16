// @shared
// Единый источник истины для всех тестов проекта
// Используется и для /tests (интерактивная страница), и для /tests/ai (JSON для AI)

export const TEST_CATEGORIES = [
  {
    name: 'database',
    title: 'Тесты базы данных (Heap Table)',
    icon: 'fa-database',
    tests: [
      { name: 'table_exists', description: 'Проверка существования таблицы chat_messages' },
      { name: 'create_message', description: 'Создание нового сообщения в таблице' },
      { name: 'find_messages', description: 'Поиск сообщений по фильтрам (userId, chainKey, agentId)' },
      { name: 'update_visibility', description: 'Обновление поля isVisible (скрытие сообщений)' },
      { name: 'context_reset_marker', description: 'Создание маркера сброса контекста (isContextReset)' }
    ]
  },
  {
    name: 'api_internal',
    title: 'Тесты API (внутренние вызовы)',
    icon: 'fa-code',
    tests: [
      { name: 'get_agents_list', description: 'Получение списка агентов (route.run)' },
      { name: 'get_socket_id', description: 'Генерация encodedSocketId (route.run)' },
      { name: 'send_message', description: 'Отправка сообщения агенту (route.run)' },
      { name: 'get_history', description: 'Получение истории сообщений (route.run)' },
      { name: 'clear_chat', description: 'Очистка чата (route.run)' },
      { name: 'reset_context', description: 'Сброс контекста (route.run)' }
    ]
  },
  {
    name: 'api_http',
    title: 'Тесты HTTP доступности endpoints',
    icon: 'fa-globe',
    tests: [
      { name: 'http_get_agents', description: 'HTTP GET /api/chat/agents' },
      { name: 'http_get_socket_id', description: 'HTTP GET /api/chat/socket-id' },
      { name: 'http_post_send', description: 'HTTP POST /api/chat/send' },
      { name: 'http_get_history', description: 'HTTP GET /api/chat/history' },
      { name: 'http_post_clear', description: 'HTTP POST /api/chat/clear' },
      { name: 'http_post_reset', description: 'HTTP POST /api/chat/reset-context' }
    ]
  },
  {
    name: 'functional',
    title: 'Тесты функциональности чата',
    icon: 'fa-comments',
    tests: [
      { name: 'agent_selection', description: 'Выбор агента и генерация chainKey' },
      { name: 'agent_change_marker', description: 'Создание маркера смены агента' },
      { name: 'message_persistence', description: 'Сохранение и загрузка истории сообщений' },
      { name: 'clear_functionality', description: 'Очистка окна чата (скрытие, не удаление)' },
      { name: 'context_reset', description: 'Сброс контекста и создание новой цепочки' }
    ]
  },
  {
    name: 'integration',
    title: 'Интеграционные тесты',
    icon: 'fa-network-wired',
    tests: [
      { name: 'full_conversation_flow', description: 'Полный цикл диалога: выбор агента → сообщение → ответ' },
      { name: 'agent_switch', description: 'Переключение между агентами с сохранением цепочек' },
      { name: 'multiple_users', description: 'Изоляция сообщений разных пользователей' },
      { name: 'persistence_after_clear', description: 'Сохранение данных после очистки окна' }
    ]
  },
  {
    name: 'tools',
    title: 'Тесты инструментов (Tools)',
    icon: 'fa-wrench',
    tests: [
      { name: 'tool_exists', description: 'Проверка существования инструмента sendChatResponsePodolyak' },
      { name: 'tool_save_message', description: 'Инструмент сохраняет сообщение в базу данных' },
      { name: 'tool_extract_params', description: 'Инструмент корректно извлекает параметры из context' },
      { name: 'tool_validation', description: 'Инструмент валидирует входные данные (пустое сообщение)' }
    ]
  }
]

