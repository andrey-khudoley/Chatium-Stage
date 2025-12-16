# Примеры аналитики и событий

## Файлы в этой секции

| Файл | Описание | Ключевые функции |
|------|----------|------------------|
| **event-types-example.ts** | ⭐ **НОВОЕ** Типизация событий и динамическая фильтрация | `EventDefinition`, `buildEventFilter()`, `getAllEvents()`, 47 типов событий |
| **getcourse-mcp-client.ts** | Настраиваемый GetCourse MCP Client | `gcQueryAi()`, `integrationIsEnabled()`, `installSupportedApp()` |
| **developer-account.ts** | Аккаунт разработчика | `queryAi()` для внутренних инструментов |
| **subscriptions-monitoring.ts** | Подписки + WebSocket мониторинг | Heap таблицы, Job, WebSocket real-time |
| **setup-page-example.tsx** | Страница настройки GetCourse | Проверка настройки, установка плагина |
| **events.ts** | Workspace события | `writeWorkspaceEvent()`, `window.clrtTrack()` |

## ⭐ event-types-example.ts - Типизация и фильтрация

**НОВОЕ (2025-11-09)**: Полная система типизации и динамической фильтрации событий.

### Ключевые концепции

1. **EventDefinition** - TypeScript интерфейс для описания событий
2. **urlPattern** - паттерны для LIKE фильтрации (event://getcourse/%)
3. **urlPath** - конкретные пути для точного совпадения
4. **buildEventFilter()** - функция для генерации SQL WHERE условий
5. **Категории событий** - группировка по паттернам для гибкости

### Типы событий (47 total)

- **8 HTTP Events** - через `action` (pageview, button_click, etc.)
- **34 GetCourse Events** - через `urlPath` (event://getcourse/*)
- **5 Event Categories** - через `urlPattern` (event://*/%)

### ⚠️ Важные правила

**HTTP/HTTPS события:**
- Группируются по полю `action`, а не по URL
- SQL: `WHERE action = 'pageview'`

**GetCourse события:**
- Фильтруются по полю `urlPath`
- SQL: `WHERE urlPath = 'event://getcourse/dealCreated'`

**Категории (паттерны):**
- Используют LIKE для гибкой фильтрации
- SQL: `WHERE urlPath LIKE 'event://getcourse/%'`

## Структура файлов

### 1. `getcourse-mcp-client.ts` ⭐ (рекомендуется)

**Назначение**: Работа с настраиваемым GetCourse MCP Client

**Для кого**: SaaS приложения, клиентские решения, мультиаккаунтные системы

**Что включает**:
- ✅ `integrationIsEnabled()` - проверка настройки
- ✅ `installSupportedApp()` - установка плагина
- ✅ `gcQueryAi()` - SQL запросы к настроенному аккаунту
- ✅ API endpoints для заказов GetCourse
- ✅ API endpoints для пользователей GetCourse
- ✅ API endpoints для Telegram статистики
- ✅ API endpoints для трафика

**Преимущества**:
- Каждый пользователь настраивает свой GetCourse аккаунт
- Изоляция данных между пользователями
- Данные из аккаунта пользователя, а не разработчика

**Пример использования**:
```typescript
import { gcQueryAi } from '@gc-mcp-server/sdk'

const result = await gcQueryAi(ctx, `
  SELECT * FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealCreated'
  LIMIT 10
`)
```

---

### 2. `developer-account.ts`

**Назначение**: Работа с фиксированным аккаунтом разработчика

**Для кого**: Внутренние инструменты компании, прототипирование, личные дашборды

**Что включает**:
- ✅ `queryAi()` - SQL запросы к аккаунту разработчика
- ✅ API endpoints для заказов
- ✅ API endpoints для статистики
- ✅ API endpoints для трафика

**Преимущества**:
- Не требует настройки от пользователя
- Быстрый старт разработки
- Подходит для внутренних инструментов

**Недостатки**:
- Все пользователи видят данные одного аккаунта
- Нет изоляции данных

**Пример использования**:
```typescript
import { queryAi } from '@traffic/sdk'

const result = await queryAi(ctx, `
  SELECT * FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealCreated'
  LIMIT 10
`)
```

---

### 3. `events.ts` (Workspace события)

**Назначение**: Запись событий вашего собственного приложения

**Что включает**:
- ✅ `writeWorkspaceEvent()` - запись серверных событий
- ✅ `window.clrtTrack()` - запись клиентских событий
- ✅ Регистрация типов событий через хук
- ✅ Примеры: регистрация, формы, заказы, квизы
- ✅ Работа с UTM метками
- ✅ Vue компонент с клиентским трекингом

**Пример использования**:
```typescript
import { writeWorkspaceEvent } from '@start/sdk'

await writeWorkspaceEvent(ctx, 'registration', {
  user: { email, firstName, lastName },
  action_param1: user.id,
  uid: clrtUid,
  utm_source: utmSource
})
```

---

### 4. `subscriptions-monitoring.ts`

**Назначение**: Система подписок на события с WebSocket мониторингом

**Что включает**:
- ✅ API для подписки/отписки от событий
- ✅ Список доступных событий (GetCourse + Traffic)
- ✅ Job для мониторинга событий (каждые 15 сек)
- ✅ WebSocket для real-time обновлений
- ✅ API для запуска/остановки мониторинга
- ✅ Vue компонент с WebSocket клиентом

**Архитектура**:
```
Пользователь подписывается
    ↓
Heap таблица subscriptions
    ↓
Job монитор (каждые 15 сек)
    ↓
SQL запросы к ClickHouse
    ↓
WebSocket → Браузер
```

**Пример использования**:
```typescript
// Подписка на событие
await apiSubscribeRoute.run(ctx, {
  eventType: 'getcourse',
  eventName: 'dealCreated'
})

// Запуск мониторинга
const result = await apiStartMonitoringRoute.run(ctx)
const socketId = result.socketId

// В Vue компоненте
const socket = await getOrCreateBrowserSocketClient()
socket.on('data', (msg) => {
  if (msg.type === 'events-update') {
    events.value = msg.data
  }
})
```

---

### 5. `setup-page-example.tsx`

**Назначение**: Пример главной страницы с проверкой настройки GetCourse

**Что показывает**:
- ✅ Проверка `integrationIsEnabled()`
- ✅ Форма установки плагина (если не настроен)
- ✅ Главное приложение (если настроен)
- ✅ Красивый дизайн с градиентами
- ✅ Кнопка установки с обработкой ошибок

**Логика работы**:
1. Проверяем `integrationIsEnabled(ctx)`
2. Если `false` - показываем форму установки
3. Пользователь нажимает "Настроить GetCourse"
4. Вызывается `installPluginRoute`
5. Перенаправление на страницу настроек `/app/gc-mcp-server`
6. Пользователь вводит адрес сервера и API ключ
7. После настройки приложение работает с его данными

---

## Сравнение подходов

| Функция | gcQueryAi | queryAi |
|---------|-----------|---------|
| **Источник данных** | Настроенный аккаунт пользователя | Аккаунт разработчика |
| **Изоляция данных** | ✅ Да | ❌ Нет |
| **Настройка** | Требуется | Не требуется |
| **Импорт** | `@gc-mcp-server/sdk` | `@traffic/sdk` |
| **Применение** | SaaS, клиенты | Внутренние инструменты |
| **Пример файла** | `getcourse-mcp-client.ts` | `developer-account.ts` |

---

## Типы событий

### GetCourse События (30 типов)

**Заказы** (5):
- `dealCreated` - Создание заказа
- `dealPaid` - Оплата заказа
- `dealStatusChanged` - Изменение статуса
- `dealRefund` - Возврат
- `dealUpdated` - Обновление

**Пользователи** (3):
- `user/created` - Регистрация
- `user/updated` - Обновление
- `user/deleted` - Удаление

**Чат-боты** (6):
- `user/chatbot/telegram_enabled`
- `user/chatbot/telegram_disabled`
- `user/chatbot/vk_enabled`
- `user/chatbot/vk_disabled`
- `user/chatbot/whatsapp_enabled`
- `user/chatbot/whatsapp_disabled`

**Группы** (2):
- `user/group_added`
- `user/group_removed`

И другие (обучение, вебинары, сертификаты, подписки)

### Traffic События (21 тип)

**Навигация** (1):
- `pageview` - Просмотр страницы

**Взаимодействие** (4):
- `button_click` - Клик по кнопке
- `link_click` - Клик по ссылке
- `form_submit` - Отправка формы
- `registration` - Регистрация

**Медиа** (6):
- `video_play` - Воспроизведение видео
- `video_pause` - Пауза видео
- `video_complete` - Просмотр до конца
- `scroll` - Прокрутка
- `download` - Скачивание
- `search` - Поиск

**E-commerce** (4):
- `add_to_cart` - Добавление в корзину
- `remove_from_cart` - Удаление из корзины
- `checkout` - Оформление заказа
- `purchase` - Покупка

И другие (аутентификация, социальные действия)

### Workspace События

Пользовательские события вашего приложения:
- `registration` - Регистрация пользователя
- `contact_form_submitted` - Форма обратной связи
- `order_created` - Создание заказа
- `answers_filled` - Заполнение формы с ответами
- `lead_submitted` - Отправка заявки
- `quiz_completed` - Прохождение квиза

---

## Быстрый старт

### Вариант 1: С настраиваемым GetCourse (рекомендуется)

1. Скопируйте файлы:
   - `getcourse-mcp-client.ts` → `api/analytics.ts`
   - `setup-page-example.tsx` → `index.tsx`
   - `subscriptions-monitoring.ts` → `api/monitoring.ts`

2. Создайте таблицы (см. `dev/partnership/tables/`):
   - `subscriptions.table.ts`
   - `monitoring.table.ts`

3. Запустите приложение - увидите форму настройки

4. Нажмите "Настроить GetCourse" и введите данные вашего аккаунта

5. Готово! Теперь работаете со своими данными

### Вариант 2: С аккаунтом разработчика (быстрый старт)

1. Скопируйте `developer-account.ts` → `api/analytics.ts`

2. Используйте API endpoints сразу без настройки

3. Все пользователи видят данные одного аккаунта

---

## Необходимые таблицы

Для системы подписок создайте таблицы:

**subscriptions.table.ts**:
```typescript
import { Heap } from "@app/heap"

export default Heap.Table('subscriptions', {
  userId: Heap.UserRefLink({ customMeta: { title: 'Пользователь' } }),
  eventType: Heap.String({ customMeta: { title: 'Тип события' } }),
  eventName: Heap.String({ customMeta: { title: 'Название события' } }),
  isActive: Heap.Boolean({ customMeta: { title: 'Активна' } })
})
```

**monitoring.table.ts**:
```typescript
import { Heap } from "@app/heap"

export default Heap.Table('monitoring', {
  userId: Heap.UserRefLink({ customMeta: { title: 'Пользователь' } }),
  socketId: Heap.String({ customMeta: { title: 'Socket ID' } }),
  taskId: Heap.String({ customMeta: { title: 'Task ID' } }),
  isActive: Heap.Boolean({ customMeta: { title: 'Активен' } }),
  startedAt: Heap.DateTime({ customMeta: { title: 'Запущен' } })
})
```

---

## Примеры SQL запросов

### Статистика заказов

```sql
WITH created AS (
  SELECT 
    COUNT(DISTINCT action_param1) as count,
    SUM(action_param1_float) as amount
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealCreated'
    AND dt BETWEEN '2025-01-01' AND '2025-01-31'
),
paid AS (
  SELECT 
    COUNT(DISTINCT action_param1) as count,
    SUM(action_param2_float) as amount
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealPaid'
    AND dt BETWEEN '2025-01-01' AND '2025-01-31'
)
SELECT 
  c.count as total_orders,
  c.amount as total_amount,
  p.count as paid_orders,
  p.amount as paid_amount,
  ROUND((p.count * 100.0 / GREATEST(c.count, 1)), 2) as conversion
FROM created c, paid p
```

### Регистрации пользователей

```sql
SELECT 
  dt as registration_date,
  COUNT(DISTINCT COALESCE(resolved_user_id, user_id)) as new_users
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/user/created'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY dt
ORDER BY dt DESC
```

### Статистика трафика

```sql
SELECT 
  COUNT(*) as total_pageviews,
  COUNT(DISTINCT uid) as unique_visitors,
  COUNT(DISTINCT session_id) as sessions
FROM chatium_ai.access_log
WHERE action = 'pageview'
  AND NOT startsWith(urlPath, 'event://getcourse/')
  AND dt >= today() - 7
```

---

## Связанная документация

### Основные руководства
- **016-analytics.md** — Главное руководство по аналитике
- **016-analytics-getcourse.md** — События GetCourse
- **016-analytics-traffic.md** — События трафика
- **016-analytics-workspace.md** — Workspace события
- **016-analytics-subscriptions.md** — Система подписок

### Дополнительно
- **E01-gc-sdk.md** — GetCourse SDK
- **E02-gc-analytics.md** — Детальная аналитика GetCourse
- **014-socket.md** — WebSocket
- **008-heap.md** — Heap таблицы

### Проекты-примеры
- **`dev/partnership`** — Партнёрская система (полная реализация)
- **`dev/events-subscribe`** — Система подписок
- **`ref/analitika-getkursa-extended`** — Референс аналитики

---

## Рекомендации

### Используйте gcQueryAi (настраиваемый) если:

✅ Разрабатываете SaaS приложение  
✅ Приложение для клиентов (каждый со своим GetCourse)  
✅ Агентские инструменты  
✅ Нужна изоляция данных  
✅ Мультиаккаунтное решение

**Файл**: `getcourse-mcp-client.ts`

### Используйте queryAi (разработчик) если:

✅ Внутренний инструмент компании  
✅ Дашборд собственного сайта  
✅ Прототипирование  
✅ Все работают с одним аккаунтом  
✅ Не нужна изоляция данных

**Файл**: `developer-account.ts`

---

**Версия**: 1.0  
**Дата**: 2025-11-09  
**Статус**: Примеры работы с аналитикой (gcQueryAi vs queryAi, подписки, мониторинг)

