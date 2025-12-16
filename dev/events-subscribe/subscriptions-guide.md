# Внутренние инструкции по созданию и управлению подписками

## Обзор

Система подписок Events Subscribe позволяет пользователям получать уведомления о событиях из двух основных источников:
- **Traffic Events** - события с веб-интерфейса (21 тип)
- **GetCourse Events** - события образовательной платформы (30 типов)

## Архитектура системы подписок

### Структура данных

Таблица `subscriptions.table` хранит информацию о подписках:

```json
{
  "id": "subscription_uuid",
  "userId": "user_id_reflink",     // UserRefLinkKind
  "eventType": "traffic|getcourse", // String
  "eventName": "event_name",       // String (pageview, dealCreated, etc.)
  "isActive": true,                // Boolean
  "createdAt": "2025-01-07T14:30:00Z",
  "updatedAt": "2025-01-07T14:30:00Z"
}
```

### Интеграция с shared/eventTypes.ts

Файл `shared/eventTypes.ts` содержит полную информацию о всех доступных событиях:

```typescript
// Типы событий
export enum EventType {
  TRAFFIC = 'traffic',
  GETCOURSE = 'getcourse'
}

// События трафика
export interface TrafficEvent {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  exampleFields: Record<string, any>;
}

export const trafficEvents: TrafficEvent[] = [
  {
    id: 'pageview',
    name: 'pageview',
    title: 'Просмотр страницы',
    description: 'Фиксирует каждое посещение страницы пользователем',
    category: 'Navigation',
    exampleFields: {
      event_type: 'pageview',
      page_url: 'https://example.com/page',
      user_id: 'user_12345'
    }
  },
  // ... остальные 20 событий
];

// События GetCourse
export interface GetCourseEvent {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  exampleFields: Record<string, any>;
}

export const getCourseEvents: GetCourseEvent[] = [
  {
    id: 'dealCreated',
    name: 'dealCreated',
    title: 'Создание заказа',
    description: 'Фиксирует создание нового заказа в системе',
    category: 'Orders',
    exampleFields: {
      event_type: 'dealCreated',
      deal_id: 'deal_12345',
      user_id: 'user_abc123'
    }
  },
  // ... остальные 29 событий
];
```

## API для управления подписками

### Эндпоинты системы `/api/subscriptions`

#### 1. GET `/api/subscriptions/list`
**Назначение:** Получение списка всех подписок текущего пользователя.

**Запрос:**
```json
GET /api/subscriptions/list
```

**Ответ:**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": "sub_001",
      "eventType": "traffic",
      "eventName": "pageview",
      "isActive": true,
      "createdAt": "2025-01-07T14:30:00Z"
    }
  ]
}
```

#### 2. POST `/api/subscriptions/subscribe`
**Назначение:** Создание подписки на конкретное событие.

**Запрос:**
```json
POST /api/subscriptions/subscribe
{
  "eventType": "traffic",
  "eventName": "pageview"
}
```

**Ответ:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_001",
    "eventType": "traffic",
    "eventName": "pageview",
    "isActive": true
  }
}
```

#### 3. POST `/api/subscriptions/unsubscribe`
**Назначение:** Отключение подписки на конкретное событие.

**Запрос:**
```json
POST /api/subscriptions/unsubscribe
{
  "eventType": "traffic",
  "eventName": "pageview"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Подписка успешно отключена"
}
```

#### 4. POST `/api/subscriptions/subscribe-all`
**Назначение:** Массовая подписка на все события или определенную категорию.

**Запрос (подписка на всё):**
```json
POST /api/subscriptions/subscribe-all
{
  "category": "all"
}
```

**Запрос (подписка на события трафика):**
```json
POST /api/subscriptions/subscribe-all
{
  "category": "traffic"
}
```

**Запрос (подписка на события GetCourse):**
```json
POST /api/subscriptions/subscribe-all
{
  "category": "getcourse"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Подписаны на 15 событий",
  "createdCount": 15
}
```

#### 5. POST `/api/subscriptions/unsubscribe-all`
**Назначение:** Массовая отписка от всех событий или определенной категории.

**Запрос:**
```json
POST /api/subscriptions/unsubscribe-all
{
  "category": "getcourse"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Отписаны от 30 событий",
  "deletedCount": 30
}
```

#### 6. GET `/api/subscriptions/available-events`
**Назначение:** Получение полного списка доступных событий сгруппированных по категориям.

**Ответ:**
```json
{
  "success": true,
  "events": {
    "traffic": {
      "Navigation": [
        {
          "id": "pageview",
          "name": "pageview",
          "title": "Просмотр страницы",
          "description": "Фиксирует каждое посещение страницы пользователем",
          "isSubscribed": true
        }
      ],
      "E-commerce": [...],
      "Media": [...]
    },
    "getcourse": {
      "Orders": [...],
      "Users": [...],
      "Learning": [...]
    }
  }
}
```

## WebSocket для real-time мониторинга

### API для стриминга `/api/events`

#### POST `/api/events/stream`
**Назначение:** Установка WebSocket соединения для стриминга событий в реальном времени.

**Запрос:**
```json
POST /api/events/stream
{
  "sessionKey": "user_session_key"
}
```

**Процесс:**
1. Клиент отправляет запрос на WebSocket соединение
2. Сервер генерирует уникальный socket ID на основе userId
3. Устанавливается постоянное соединение через `@app/socket`
4. Сервер отправляет события в реальном времени при их возникновении

**Структура события в WebSocket:**
```json
{
  "id": "event_uuid",
  "timestamp": "2025-01-07T14:30:00Z",
  "eventType": "traffic|getcourse",
  "eventName": "pageview",
  "eventData": {
    "user_id": "user_12345",
    "page_url": "https://example.com/page",
    "session_id": "session_abc123",
    // ... дополнительные поля события
  },
  "source": "traffic|getcourse",
  "processed": true
}
```

## Реализация Frontend компонент

### SettingsPage.vue - управление подписками

Основные функции компонента:
1. Загрузка доступных событий из `/api/subscriptions/available-events`
2. Проверка текущих подписок из `/api/subscriptions/list`
3. Переключатель состояния подписки (toggle)
4. Массовые операции подписки/отписки
5. Отображение спойлеров с детальной информацией о событиях

**Ключевые методы:**
```typescript
// Переключение подписки на событие
async function toggleSubscription(eventType: string, eventName: string) {
  // Проверка текущего состояния
  const isSubscribed = subscriptions.value.some(sub => 
    sub.eventType === eventType && sub.eventName === eventName && sub.isActive
  );
  
  if (isSubscribed) {
    await apiSubscriptionsUnsubscribeRoute.run(ctx, { eventType, eventName });
  } else {
    await apiSubscriptionsSubscribeRoute.run(ctx, { eventType, eventName });
  }
  
  await loadSubscriptions();
}

// Массовая подписка
async function subscribeAll(category: string) {
  const result = await apiSubscriptionsSubscribeAllRoute.run(ctx, { category });
  await loadSubscriptions();
  return result;
}

// Получение детальной информации о событии
function getEventDetails(eventType: string, eventName: string) {
  if (eventType === 'traffic') {
    return trafficEvents.find(event => event.id === eventName);
  } else if (eventType === 'getcourse') {
    return getCourseEvents.find(event => event.id === eventName);
  }
  return null;
}
```

### MonitorPage.vue - мониторинг событий

Основные функции компонента:
1. Установка WebSocket соединения через `@app/socket`
2. Прием и отображение событий в реальном времени
3. Автоматическая прокрутка списка событий
4. Динамическое отображение деталей события
5. Индикатор статуса соединения

**Ключевые методы:**
```typescript
// Установка WebSocket соединения
async function startEventStream() {
  try {
    const result = await apiEventsStreamRoute.run(ctx, { sessionKey: 'browser_session' });
    socketId.value = result.socketId;
    connectionStatus.value = 'connected';
  } catch (error) {
    connectionStatus.value = 'error';
  }
}

// Обработка входящих событий
function handleEventStream(event: any) {
  if (event.id === socketId.value) {
    events.value.unshift(event.data);
    if (events.value.length > maxEvents.value) {
      events.value.pop();
    }
  }
}

// Получение отображаемого имени события
function getEventDisplayName(eventType: string, eventName: string) {
  const eventDetails = getEventDetails(eventType, eventName);
  return eventDetails?.title || eventName;
}
```

## Интеграция с внешними системами

### Traffic SDK (`@traffic/sdk`)

Для получения событий трафика используется `queryAi`:

```typescript
import { queryAi } from '@traffic/sdk';

async function getTrafficEvents(ctx, fromDate, toDate) {
  const result = await queryAi(ctx, {
    query: `
      SELECT 
        event_type,
        timestamp,
        user_id,
        session_id,
        page_url,
        referer,
        user_agent,
        ip_address,
        country,
        city
      FROM chatium_ai.access_log 
      WHERE timestamp >= '${fromDate}' 
        AND timestamp <= '${toDate}'
      ORDER BY timestamp DESC
      LIMIT 1000
    `
  });
  
  return result.data;
}
```

### GetCourse SDK (`@gc-mcp-server/sdk`)

Для событий GetCourse используется `gcQueryAi`:

```typescript
import { gcQueryAi } from '@gc-mcp-server/sdk';

async function getGetCourseEvents(ctx, eventType, dateFrom, dateTo) {
  const result = await gcQueryAi(ctx, {
    eventType,
    dateFrom,
    dateTo,
    limit: 1000
  });
  
  return result.events;
}
```

### Socket SDK (`@app/socket`)

Для WebSocket стриминга:

```typescript
import { getOrCreateBrowserSocketClient } from '@app/socket';

// На бэкенде
app.use(app.socket('/events')).post('/stream', async (ctx, req) => {
  const socketId = `user_${ctx.user.id}_${Date.now()}`;
  
  // Отправка данных клиенту
  sendDataToSocket(socketId, {
    eventType: 'test-event',
    timestamp: new Date().toISOString()
  });
  
  return { socketId, status: 'connected' };
});

// На фронтенде
const socketClient = await getOrCreateBrowserSocketClient();
socketClient.on('data', (event) => {
  console.log('Received event:', event);
});
```

## Управление состоянием подписок

### Проверка активных подписок

```typescript
// Проверка подписки пользователя на конкретное событие
async function isUserSubscribedToEvent(ctx, userId, eventType, eventName) {
  const subscription = await Subscriptions.findOneBy(ctx, {
    userId: userId,
    eventType: eventType,
    eventName: eventName,
    isActive: true
  });
  
  return subscription !== null;
}

// Получение активных подписок пользователя
async function getUserActiveSubscriptions(ctx, userId) {
  return await Subscriptions.findAll(ctx, {
    where: {
      userId: userId,
      isActive: true
    },
    order: [{ createdAt: 'desc' }]
  });
}
```

### Триггеры отправки событий

```typescript
// Отправка события всем подписанным пользователям
async function sendEventToSubscribers(ctx, eventType, eventName, eventData) {
  const subscribers = await Subscriptions.findAll(ctx, {
    where: {
      eventType: eventType,
      eventName: eventName,
      isActive: true
    }
  });
  
  for (const subscription of subscribers) {
    const socketId = `user_${subscription.userId.id}`;
    sendDataToSocket(socketId, {
      id: generateEventId(),
      timestamp: new Date().toISOString(),
      eventType: eventType,
      eventName: eventName,
      eventData: eventData,
      source: eventType,
      processed: true
    });
  }
}
```

## Оптимизация производительности

### Кэширование подписок

```typescript
// Кэширование списка доступных событий на клиенте
const cachedEvents = ref(null);

async function getCachedAvailableEvents() {
  if (cachedEvents.value) {
    return cachedEvents.value;
  }
  
  const result = await apiSubscriptionsAvailableEventsRoute.run(ctx);
  cachedEvents.value = result.events;
  return cachedEvents.value;
}
```

### Batch операции

```typescript
// Оптимизированная массовая подписка
async function batchSubscribe(ctx, subscriptions) {
  const results = [];
  
  for (const sub of subscriptions) {
    try {
      const result = await apiSubscriptionsSubscribeRoute.run(ctx, sub);
      results.push({ success: true, subscription: result.subscription });
    } catch (error) {
      results.push({ success: false, error: error.message, subscription: sub });
    }
  }
  
  return results;
}
```

### Rate limiting

```typescript
// Ограничение частоты запросов для WebSocket
let lastEventTime = 0;
const MIN_EVENT_INTERVAL = 100; // 100ms

function throttleEvent(event) {
  const now = Date.now();
  if (now - lastEventTime >= MIN_EVENT_INTERVAL) {
    lastEventTime = now;
    return event;
  }
  return null;
}
```

## Безопасность

### Авторизация доступа

```typescript
// Защита API эндпоинтов
app.use(requireRealUser).post('/subscribe', async (ctx, req) => {
  // Проверка что пользователь подписывается на свои же события
  const subscription = await Subscriptions.create(ctx, {
    userId: ctx.user.id,
    eventType: req.body.eventType,
    eventName: req.body.eventName,
    isActive: true
  });
  
  return subscription;
});
```

### Валидация входных данных

```typescript
// Валидация типов событий
function validateEventSubscription(eventType, eventName) {
  const allEvents = [
    ...trafficEvents.map(e => ({ type: 'traffic', name: e.id })),
    ...getCourseEvents.map(e => ({ type: 'getcourse', name: e.id }))
  ];
  
  const existsEvent = allEvents.some(e => 
    e.type === eventType && e.name === eventName
  );
  
  if (!existsEvent) {
    throw new Error(`Неизвестный тип события: ${eventType}/${eventName}`);
  }
}
```

## Мониторинг и логирование

### Логирование операций подписок

```typescript
// Логирование всех действий с подписками
async function logSubscriptionAction(ctx, action, eventType, eventName, result) {
  ctx.account.log('Subscription Action', {
    level: 'info',
    json: {
      userId: ctx.user.id,
      action: action,
      eventType: eventType,
      eventName: eventName,
      result: result,
      timestamp: new Date().toISOString()
    }
  });
}
```

### Метрики производительности

```typescript
// Сбор метрик о WebSocket соединениях
const websocketMetrics = {
  activeConnections: 0,
  eventsSent: 0,
  averageLatency: 0
};

function trackWebSocketEvent(socketId, eventType, latency) {
  websocketMetrics.eventsSent++;
  trackLatency(latency);
}
```

## Тестирование

### Unit тесты

```typescript
// Тестирование переключения подписок
describe('Subscription Toggle', () => {
  it('should create subscription if none exists', async () => {
    const result = await toggleSubscription('traffic', 'pageview');
    expect(result.subscription.isActive).toBe(true);
  });
  
  it('should deactivate subscription if active', async () => {
    await createSubscription('traffic', 'pageview');
    const result = await toggleSubscription('traffic', 'pageview');
    expect(result.success).toBe(true);
  });
});
```

### Интеграционные тесты

```typescript
// Тестирование WebSocket стриминга
describe('Event Streaming', () => {
  it('should receive events in real-time', async () => {
    const socketClient = await createTestSocketClient();
    const eventPromise = waitForEvent(socketClient);
    
    await sendTestEvent('traffic', 'pageview');
    const receivedEvent = await eventPromise;
    
    expect(receivedEvent.eventType).toBe('traffic');
    expect(receivedEvent.eventName).toBe('pageview');
  });
});
```

## Рекомендации по развертыванию

1. **Мониторинг:** Настройте alert на ошибки WebSocket соединений
2. **Масштабирование:** Рассмотрите использование Redis для WebSocket кластера
3. **Безопасность:** Внедрите rate limiting для API запросов
4. **Аналитика:** Собирайте метрики по самым популярным подпискам
5. **Резервирование:** Создайте backup систему для восстановления подписок
6. **Оптимизация:** Используйте lazy loading для больших списков событий
7. **Интеграция:** Предусмотрите возможность добавления новых типов событий
8. **Документация:** Поддерживайте актуальную документацию по API