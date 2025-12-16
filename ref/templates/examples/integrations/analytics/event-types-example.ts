/**
 * Пример работы с типами событий и динамической фильтрацией
 * 
 * Демонстрирует:
 * - TypeScript типизацию событий через EventDefinition
 * - Категории событий с urlPattern
 * - Динамическую фильтрацию через SQL WHERE
 * - Комбинирование HTTP, GetCourse и event:// событий
 * 
 * Файл: examples/integrations/analytics/event-types-example.ts
 */

// @shared

export interface EventDefinition {
  name: string              // Уникальное имя события (для UI и фильтрации)
  type: 'traffic' | 'getcourse' | 'workspace' | 'custom'  // Тип события
  description: string       // Человекочитаемое описание
  urlPath?: string         // Конкретный путь для точного совпадения (для event://)
  urlPattern?: string      // Паттерн URL для LIKE фильтрации (для категорий)
}

/**
 * HTTP События трафика (8 базовых)
 * 
 * ⚠️ ВАЖНО: HTTP/HTTPS события группируются по полю `action`, а не по конкретным URL!
 * 
 * SQL фильтрация: WHERE action = 'pageview'
 */
export const TRAFFIC_EVENTS: EventDefinition[] = [
  { 
    name: 'pageview', 
    type: 'traffic', 
    description: 'Просмотр страницы' 
  },
  { 
    name: 'button_click', 
    type: 'traffic', 
    description: 'Клик по кнопке' 
  },
  { 
    name: 'link_click', 
    type: 'traffic', 
    description: 'Клик по ссылке' 
  },
  { 
    name: 'scroll', 
    type: 'traffic', 
    description: 'Прокрутка страницы' 
  },
  { 
    name: 'form_submit', 
    type: 'traffic', 
    description: 'Отправка формы' 
  },
  { 
    name: 'video_play', 
    type: 'traffic', 
    description: 'Воспроизведение видео' 
  },
  { 
    name: 'video_pause', 
    type: 'traffic', 
    description: 'Пауза видео' 
  },
  { 
    name: 'video_complete', 
    type: 'traffic', 
    description: 'Просмотр видео до конца' 
  }
]

/**
 * GetCourse События (34 конкретных события)
 * 
 * Источник: https://getcourse.chatium.com/docs/events
 * 
 * SQL фильтрация: WHERE urlPath = 'event://getcourse/dealCreated'
 */
export const GETCOURSE_EVENTS: EventDefinition[] = [
  // Заказы (6)
  { name: 'dealCreated', type: 'getcourse', description: 'Создан заказ', urlPath: 'event://getcourse/dealCreated' },
  { name: 'dealPaid', type: 'getcourse', description: 'Заказ оплачен', urlPath: 'event://getcourse/dealPaid' },
  { name: 'dealStatusChanged', type: 'getcourse', description: 'Изменен статус заказа', urlPath: 'event://getcourse/dealStatusChanged' },
  { name: 'dealPaymentAccepted', type: 'getcourse', description: 'Принят платеж по заказу', urlPath: 'event://getcourse/dealPaymentAccepted' },
  { name: 'dealMoneyValuesChanged', type: 'getcourse', description: 'Изменилась сумма заказа', urlPath: 'event://getcourse/dealMoneyValuesChanged' },
  { name: 'dealTagsChanged', type: 'getcourse', description: 'Изменены теги заказа', urlPath: 'event://getcourse/dealTagsChanged' },
  
  // Пользователи (13)
  { name: 'user/created', type: 'getcourse', description: 'Пользователь зарегистрировался', urlPath: 'event://getcourse/user/created' },
  { name: 'user/group_added', type: 'getcourse', description: 'Пользователь добавлен в группу', urlPath: 'event://getcourse/user/group_added' },
  { name: 'user/group_removed', type: 'getcourse', description: 'Пользователь удален из группы', urlPath: 'event://getcourse/user/group_removed' },
  { name: 'user/banned', type: 'getcourse', description: 'Пользователь забанен', urlPath: 'event://getcourse/user/banned' },
  { name: 'user/unbanned', type: 'getcourse', description: 'Пользователя вернули из бана', urlPath: 'event://getcourse/user/unbanned' },
  { name: 'user/commented', type: 'getcourse', description: 'Оставили комментарий к профилю ученика', urlPath: 'event://getcourse/user/commented' },
  { name: 'user/session_link', type: 'getcourse', description: 'Сессия связана с юзером', urlPath: 'event://getcourse/user/session_link' },
  { name: 'user/chatbot/telegram_enabled', type: 'getcourse', description: 'Привязал Telegram к профилю', urlPath: 'event://getcourse/user/chatbot/telegram_enabled' },
  { name: 'user/chatbot/telegram_disabled', type: 'getcourse', description: 'Отвязал Telegram от профиля', urlPath: 'event://getcourse/user/chatbot/telegram_disabled' },
  { name: 'user/chatbot/vk_enabled', type: 'getcourse', description: 'Привязал ВКонтакте к профилю', urlPath: 'event://getcourse/user/chatbot/vk_enabled' },
  { name: 'user/chatbot/vk_disabled', type: 'getcourse', description: 'Отвязал ВКонтакте от профиля', urlPath: 'event://getcourse/user/chatbot/vk_disabled' },
  { name: 'user/chatbot/whatsapp_enabled', type: 'getcourse', description: 'Привязал WhatsApp к профилю', urlPath: 'event://getcourse/user/chatbot/whatsapp_enabled' },
  { name: 'user/chatbot/whatsapp_disabled', type: 'getcourse', description: 'Отвязал WhatsApp от профиля', urlPath: 'event://getcourse/user/chatbot/whatsapp_disabled' },
  
  // Обучение (5)
  { name: 'teach/lesson/action', type: 'getcourse', description: 'Действие с уроком (открыл, прошел, ответил)', urlPath: 'event://getcourse/teach/lesson/action' },
  { name: 'teach/lesson/answerCreated', type: 'getcourse', description: 'Ответил на урок тренинга', urlPath: 'event://getcourse/teach/lesson/answerCreated' },
  { name: 'teach/lesson/answerUpdated', type: 'getcourse', description: 'Изменен статус ответа на урок', urlPath: 'event://getcourse/teach/lesson/answerUpdated' },
  { name: 'teach/trainingStarted', type: 'getcourse', description: 'Стартовал прохождение тренинга', urlPath: 'event://getcourse/teach/trainingStarted' },
  { name: 'teach/trainingFinished', type: 'getcourse', description: 'Завершил тренинг', urlPath: 'event://getcourse/teach/trainingFinished' },
  
  // Сообщения (4)
  { name: 'message/sent', type: 'getcourse', description: 'Сообщение отправлено', urlPath: 'event://getcourse/message/sent' },
  { name: 'message/viewed', type: 'getcourse', description: 'Просмотрел сообщение', urlPath: 'event://getcourse/message/viewed' },
  { name: 'message/clicked', type: 'getcourse', description: 'Клик на ссылке в сообщении', urlPath: 'event://getcourse/message/clicked' },
  { name: 'message/unsubscribed', type: 'getcourse', description: 'Отписался от рассылки', urlPath: 'event://getcourse/message/unsubscribed' },
  
  // Формы и анкеты (2)
  { name: 'form/sent', type: 'getcourse', description: 'Отправлена форма', urlPath: 'event://getcourse/form/sent' },
  { name: 'survey/answerCreated', type: 'getcourse', description: 'Добавлен ответ на анкету', urlPath: 'event://getcourse/survey/answerCreated' },
  
  // Обращения (3)
  { name: 'conversation/addedMessage', type: 'getcourse', description: 'Добавлено сообщение к обращению', urlPath: 'event://getcourse/conversation/addedMessage' },
  { name: 'conversation/responsibilityCreated', type: 'getcourse', description: 'Назначен ответственный или дедлайн по обращению', urlPath: 'event://getcourse/conversation/responsibilityCreated' },
  { name: 'conversation/responsibilityUpdated', type: 'getcourse', description: 'Обновлен ответственный или дедлайн по обращению', urlPath: 'event://getcourse/conversation/responsibilityUpdated' },
  
  // Контакты (2)
  { name: 'contact/created', type: 'getcourse', description: 'Создана запись звонка или иного контакта', urlPath: 'event://getcourse/contact/created' },
  { name: 'contact/call_file_added', type: 'getcourse', description: 'Добавлен файл звонка', urlPath: 'event://getcourse/contact/call_file_added' },
  
  // ВКонтакте (1)
  { name: 'vk/visitSuccess', type: 'getcourse', description: 'Успешный визит ВКонтакте', urlPath: 'event://getcourse/vk/visitSuccess' }
]

/**
 * Категории событий по паттернам (5)
 * 
 * Позволяют фильтровать ВСЕ события определенного типа одним условием,
 * включая будущие события, которые еще не добавлены в систему.
 * 
 * SQL фильтрация: WHERE urlPath LIKE 'event://getcourse/%'
 */
export const EVENT_CATEGORIES: EventDefinition[] = [
  { 
    name: 'all_getcourse', 
    type: 'getcourse', 
    description: 'ВСЕ события GetCourse (любые event://getcourse/*)', 
    urlPattern: 'event://getcourse/%' 
  },
  { 
    name: 'refunnels_all', 
    type: 'custom', 
    description: 'ВСЕ события ReFunnels (event://refunnels/*)', 
    urlPattern: 'event://refunnels/%' 
  },
  { 
    name: 'workspace_all', 
    type: 'workspace', 
    description: 'ВСЕ события приложения (event://workspace/*)', 
    urlPattern: 'event://workspace/%' 
  },
  { 
    name: 'custom_all', 
    type: 'custom', 
    description: 'ВСЕ пользовательские события (event://custom/*)', 
    urlPattern: 'event://custom/%' 
  },
  { 
    name: 'all_event_protocol', 
    type: 'custom', 
    description: 'ВСЕ события с протоколом event:// (любые)', 
    urlPattern: 'event://%' 
  }
]

/**
 * Возвращает все доступные события (47 типов)
 */
export function getAllEvents(): EventDefinition[] {
  return [...TRAFFIC_EVENTS, ...GETCOURSE_EVENTS, ...EVENT_CATEGORIES]
}

/**
 * Построение SQL WHERE условия для фильтрации событий
 * 
 * @param selectedEvents - Массив выбранных событий
 * @returns SQL WHERE условие
 */
export function buildEventFilter(selectedEvents: EventDefinition[]): string {
  const conditions: string[] = []
  
  for (const event of selectedEvents) {
    if (event.urlPattern) {
      // Паттерн (категория событий) - используем LIKE
      conditions.push(`urlPath LIKE '${event.urlPattern}'`)
    } else if (event.urlPath) {
      // Конкретный путь (GetCourse событие) - используем =
      conditions.push(`urlPath = '${event.urlPath}'`)
    } else {
      // HTTP событие (traffic) - используем action
      conditions.push(`action = '${event.name}'`)
    }
  }
  
  return conditions.length > 0 ? conditions.join(' OR ') : '1=1'
}

/**
 * Пример использования в Job для мониторинга событий
 */
export const monitorSelectedEventsJob = app.job(async (ctx) => {
  // 1. Загружаем выбранные типы событий из настроек (Heap таблица)
  const filterSetting = await Settings.findOne(ctx, { key: 'events_filter' })
  
  let selectedEventNames: string[] = []
  if (filterSetting?.value) {
    try {
      selectedEventNames = JSON.parse(filterSetting.value)
    } catch {}
  }
  
  // 2. По умолчанию - все события
  if (selectedEventNames.length === 0) {
    selectedEventNames = getAllEvents().map(e => e.name)
  }
  
  // 3. Получаем определения выбранных событий
  const allEvents = getAllEvents()
  const selectedEvents = selectedEventNames
    .map(name => allEvents.find(e => e.name === name))
    .filter(Boolean) as EventDefinition[]
  
  // 4. Строим WHERE условие
  const whereClause = buildEventFilter(selectedEvents)
  
  // 5. Один SQL запрос для всех выбранных событий
  const query = `
    SELECT 
      urlPath,
      action,
      user_id,
      resolved_user_id,
      title,
      dt,
      ts,
      CASE 
        WHEN action IS NOT NULL AND urlPath IS NULL THEN 'traffic'
        WHEN urlPath LIKE 'event://getcourse/%' THEN 'getcourse'
        WHEN urlPath LIKE 'event://refunnels/%' THEN 'refunnels'
        WHEN urlPath LIKE 'event://workspace/%' THEN 'workspace'
        ELSE 'other'
      END as event_category
    FROM chatium_ai.access_log
    WHERE (${whereClause})
      AND dt >= today() - 1
    ORDER BY ts DESC
    LIMIT 100
  `
  
  // 6. Выполнение запроса (gcQueryAi или queryAi)
  const result = await gcQueryAi(ctx, query)
  
  // 7. Отправка событий через WebSocket для real-time мониторинга
  for (const event of result.rows) {
    await sendDataToSocket(ctx, 'events', {
      ...event,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * API для сохранения фильтра событий
 */
export const apiSaveEventFilterRoute = app.post('/save-filter', async (ctx, req) => {
  const { eventTypes } = req.body
  
  if (!Array.isArray(eventTypes)) {
    return { success: false, error: 'eventTypes должен быть массивом' }
  }
  
  // Валидация - проверяем, что все события существуют
  const allEvents = getAllEvents()
  const validEventNames = allEvents.map(e => e.name)
  const invalidEvents = eventTypes.filter(name => !validEventNames.includes(name))
  
  if (invalidEvents.length > 0) {
    return { 
      success: false, 
      error: `Неизвестные типы событий: ${invalidEvents.join(', ')}` 
    }
  }
  
  // Сохранение в настройки
  await Settings.upsert(ctx, {
    key: 'events_filter',
    value: JSON.stringify(eventTypes),
    description: 'Выбранные типы событий для мониторинга'
  })
  
  // Перезапуск мониторинга с новым фильтром
  const wasActive = await isMonitoringActive(ctx)
  if (wasActive) {
    await stopMonitoring(ctx)
    await startMonitoring(ctx)
  }
  
  return { success: true }
})

/**
 * API для загрузки текущего фильтра
 */
export const apiGetEventFilterRoute = app.get('/filter', async (ctx, req) => {
  const setting = await Settings.findOne(ctx, { key: 'events_filter' })
  
  if (!setting?.value) {
    // По умолчанию - все события
    return getAllEvents().map(e => e.name)
  }
  
  try {
    return JSON.parse(setting.value)
  } catch {
    return []
  }
})

/**
 * Примеры SQL запросов с разными типами фильтрации
 */

// Пример 1: Только HTTP события
const trafficOnlyQuery = `
  SELECT * FROM chatium_ai.access_log
  WHERE action IN ('pageview', 'button_click', 'form_submit')
  AND dt >= today() - 7
`

// Пример 2: Только GetCourse события
const getcourseOnlyQuery = `
  SELECT * FROM chatium_ai.access_log
  WHERE urlPath LIKE 'event://getcourse/%'
  AND dt >= today() - 7
`

// Пример 3: Комбинированный запрос (HTTP + GetCourse)
const combinedQuery = `
  SELECT * FROM chatium_ai.access_log
  WHERE (
    action = 'pageview'                            -- HTTP событие
    OR urlPath = 'event://getcourse/dealCreated'   -- Конкретное GetCourse
    OR urlPath LIKE 'event://refunnels/%'          -- Категория ReFunnels
  )
  AND dt >= today() - 7
`

// Пример 4: Динамический фильтр на основе настроек
const selectedEvents: EventDefinition[] = [
  { name: 'pageview', type: 'traffic', description: 'Просмотр страницы' },
  { name: 'dealCreated', type: 'getcourse', description: 'Создан заказ', urlPath: 'event://getcourse/dealCreated' },
  { name: 'all_getcourse', type: 'getcourse', description: 'ВСЕ GetCourse', urlPattern: 'event://getcourse/%' }
]

const whereClause = buildEventFilter(selectedEvents)
// Результат: "action = 'pageview' OR urlPath = 'event://getcourse/dealCreated' OR urlPath LIKE 'event://getcourse/%'"

const dynamicQuery = `
  SELECT * FROM chatium_ai.access_log
  WHERE (${whereClause}) AND dt >= today() - 7
`

