# GetCourse Аналитика: Исчерпывающая документация

**Версия**: 1.0  
**Последнее обновление**: 2025-10-26  
**Область применения**: Вся аналитика GetCourse в Chatium

---

## Содержание

1. [Введение](#введение)
2. [Архитектура аналитики](#архитектура-аналитики)
3. [База данных ClickHouse](#база-данных-clickhouse)
4. [Справочник событий](#справочник-событий)
5. [SQL примеры запросов](#sql-примеры-запросов)
6. [TypeScript API примеры](#typescript-api-примеры)
7. [Адаптация для эмбедингов](#адаптация-для-эмбедингов)
8. [Практические примеры реализации](#практические-примеры-реализации)
9. [Оптимизация и лучшие практики](#оптимизация-и-лучшие-практики)

---

## Введение

Система аналитики GetCourse в Chatium позволяет анализировать все события, происходящие в аккаунте GetCourse:
- **Заказы**: создание, изменение статуса, оплаты
- **Пользователи**: регистрация, действия, интеграции
- **Коммуникация**: сообщения, письма, чаты
- **Группы и доступ**: добавление в группы, изменение прав
- **Платежи**: оплаты, возвраты, рефунды

### Ключевые компоненты

| Компонент | Описание |
|-----------|---------|
| `@gc-mcp-server/sdk` | SDK для работы с GetCourse API и аналитикой |
| `gcQueryAi(ctx, query)` | Функция для выполнения SQL запросов к ClickHouse |
| `chatium_ai.access_log` | Основная таблица событий |
| `chatium_ai.behaviour2_log` | Таблица поведения пользователей (view) |
| ClickHouse | База данных хранения событий |

---

## Архитектура аналитики

```
┌─────────────────────────────────────────────────────────┐
│           GetCourse Events                               │
│  (Заказы, Пользователи, Платежи, Коммуникация)         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Chatium Analytics  │
        │    Event Processor   │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │    ClickHouse DB     │
        │  ┌────────────────┐  │
        │  │  access_log    │  │
        │  │  (события)     │  │
        │  └────────────────┘  │
        │  ┌────────────────┐  │
        │  │ behaviour2_log │  │
        │  │  (поведение)   │  │
        │  └────────────────┘  │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   SQL запросы          gcQueryAi()
   (DML/DDL)           (TypeScript SDK)
        │                     │
        └──────────┬──────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Аналитика Данные   │
        │   (для Отчетов)      │
        └──────────────────────┘
```

### Поток данных

1. **Источник**: GetCourse отправляет события через webhook в Chatium
2. **Обработка**: Events Router обрабатывает и нормализует события
3. **Хранение**: События сохраняются в ClickHouse (access_log)
4. **Анализ**: SQL запросы через `gcQueryAi()` для получения insights
5. **Использование**: Данные используются в отчетах, дашбордах, AI агентах

---

## База данных ClickHouse

### Таблица `chatium_ai.access_log`

Основная таблица всех событий системы. Каждое событие в GetCourse создает одну запись.

#### Основные колонки для аналитики GetCourse

```sql
-- Идентификаторы события
ts DateTime              -- Время события в UTC
dt Date                 -- Дата события
ts64 DateTime64(3)      -- Высокоточное время события

-- Параметры события
urlPath String          -- Адрес события (event://getcourse/...)
action_param1 String    -- Основной параметр (ID заказа, ID пользователя)
action_param2 String    -- Вспомогательный параметр 1
action_param3 String    -- Вспомогательный параметр 2
action_param1_float Float32  -- Числовое значение (сумма)
action_param2_float Float32  -- Вспомогательное число
action_param1_int Int32      -- Целое число
action_param1_arrstr Array(String)  -- Массив строк

-- Информация о пользователе
user_id String          -- ID пользователя GetCourse
user_email String       -- Email пользователя
user_phone String       -- Телефон пользователя
user_first_name String  -- Имя пользователя
user_last_name String   -- Фамилия пользователя

-- Метаинформация
title String            -- Название объекта (предложение, группа)
action_params String    -- JSON параметры события

-- Для отладки и фильтрации
clrt_run_id UInt32      -- ID запуска события
```

### Таблица `chatium_ai.behaviour2_log` (View)

Анализирует поведение пользователей на сайте.

```sql
-- Основные поля
uid String              -- Уникальный ID браузера
url String              -- URL страницы
view_focused_duration UInt32    -- Время активной работы на странице (ms)
view_total_duration UInt32      -- Общее время на странице (ms)

-- Действия пользователя
mouse_distance UInt32   -- Расстояние движения мыши
scroll_distance UInt32  -- Расстояние скролла
click_counter UInt32    -- Количество кликов
selection_length UInt32 -- Длина выделенного текста

-- GetCourse интеграция
gc_visit_id Int64       -- ID визита в GetCourse
gc_visitor_id Int64     -- ID посетителя в GetCourse
gc_session_id Int64     -- ID сессии в GetCourse
```

---

## Справочник событий

### 📦 События заказов (Deals)

#### 1. `event://getcourse/dealCreated` - Создание заказа

**Когда срабатывает**: При создании нового заказа в GetCourse

**Поля события**:
```
action_param1 → deal_id (String)              # ID заказа
action_param1_float → order_amount (Float)    # Сумма заказа
action_param2 → currency (String)             # Валюта (RUB, USD и т.д.)
action_param3 → status (String)               # Начальный статус
action_param3_int → order_number (Int)        # Номер заказа
action_param1_arrstr → offer_ids (Array)      # IDs предложений в заказе
title → offer_name (String)                   # Название предложения
dt → creation_date (Date)                     # Дата создания
```

**Примеры статусов**: `new`, `in_work`, `payment_waiting`, `payed`, `cancelled`

**SQL пример - Все заказы за период**:
```sql
SELECT 
  action_param1 as deal_id,
  action_param1_float as order_amount,
  action_param2 as currency,
  action_param3 as status,
  dt as creation_date
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealCreated'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY dt DESC
LIMIT 1000
```

---

#### 2. `event://getcourse/dealStatusChanged` - Изменение статуса заказа

**Когда срабатывает**: При любом изменении статуса заказа

**Поля события**:
```
action_param1 → deal_id (String)              # ID заказа
action_param3 → new_status (String)           # Новый статус
dt → change_date (Date)                       # Дата изменения
ts → change_time (DateTime)                   # Время изменения
```

**SQL пример - История изменений статуса**:
```sql
SELECT 
  action_param1 as deal_id,
  action_param3 as status,
  dt,
  ts,
  ROW_NUMBER() OVER (PARTITION BY action_param1 ORDER BY ts DESC) as change_number
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealStatusChanged'
  AND action_param1 = '12345'  -- ID конкретного заказа
ORDER BY ts DESC
```

---

#### 3. `event://getcourse/dealPaid` - Оплата заказа

**Когда срабатывает**: При получении платежа по заказу

**Поля события**:
```
action_param1 → deal_id (String)              # ID заказа
action_param2_float → payment_amount (Float)  # Размер платежа
action_param2 → currency (String)             # Валюта платежа
title → offer_name (String)                   # Название предложения
dt → payment_date (Date)                      # Дата платежа
```

**SQL пример - Доход за период**:
```sql
SELECT 
  toDate(dt) as payment_date,
  SUM(action_param2_float) as total_revenue,
  COUNT(DISTINCT action_param1) as unique_orders,
  COUNT() as payment_count
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealPaid'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY payment_date
ORDER BY payment_date DESC
```

---

#### 4. `event://getcourse/dealMoneyValuesChanged` - Изменение суммы заказа

**Когда срабатывает**: При изменении стоимости или суммы заказа

**Поля события**:
```
action_param1 → deal_id (String)              # ID заказа
action_param1_float → new_amount (Float)      # Новая сумма
action_param2_float → price_change (Float)    # На какую сумму изменилось
```

---

### 👥 События пользователей (Users)

#### 1. `event://getcourse/user/created` - Регистрация пользователя

**Когда срабатывает**: При создании нового пользователя в GetCourse

**Поля события**:
```
user_id → user_id (String)                    # ID пользователя
user_email → email (String)                   # Email
user_phone → phone (String)                   # Телефон
user_first_name → first_name (String)         # Имя
user_last_name → last_name (String)           # Фамилия
dt → registration_date (Date)                 # Дата регистрации
```

**SQL пример - Регистрации по дням**:
```sql
WITH first_registrations AS (
  SELECT 
    user_id,
    min(dt) as first_registration_date
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/user/created'
  GROUP BY user_id
)
SELECT 
  first_registration_date,
  COUNT(*) as registrations_count,
  uniq(user_id) as unique_users
FROM first_registrations
WHERE first_registration_date BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY first_registration_date
ORDER BY first_registration_date ASC
```

---

#### 2. `event://getcourse/user/chatbot/telegram_enabled` - Подключение Telegram

**Когда срабатывает**: Когда пользователь привязывает Telegram к профилю

**Поля события**:
```
user_id → user_id (String)                    # ID пользователя
dt → connection_date (Date)                   # Дата подключения
```

**SQL пример - Процент пользователей с Telegram**:
```sql
WITH user_registrations AS (
  SELECT 
    user_id,
    min(dt) as registration_date
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/user/created'
  GROUP BY user_id
),
telegram_users AS (
  SELECT DISTINCT user_id
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/user/chatbot/telegram_enabled'
)
SELECT 
  COUNT(DISTINCT ur.user_id) as total_users,
  COUNT(DISTINCT tu.user_id) as telegram_connected,
  ROUND((COUNT(DISTINCT tu.user_id) * 100.0 / COUNT(DISTINCT ur.user_id)), 2) as telegram_percent
FROM user_registrations ur
LEFT JOIN telegram_users tu ON ur.user_id = tu.user_id
WHERE ur.registration_date BETWEEN '2025-01-01' AND '2025-01-31'
```

---

#### 3. `event://getcourse/user/chatbot/telegram_disabled` - Отключение Telegram

**Когда срабатывает**: Когда пользователь отвязывает Telegram

**Поля события**:
```
user_id → user_id (String)                    # ID пользователя
dt → disconnection_date (Date)                # Дата отключения
```

---

#### 4. `event://getcourse/user/chatbot/vk_enabled` - Подключение ВКонтакте

**Когда срабатывает**: Привязка профиля ВКонтакте

**Поля события**:
```
user_id → user_id (String)                    # ID пользователя
```

---

#### 5. `event://getcourse/user/chatbot/vk_disabled` - Отключение ВКонтакте

**Когда срабатывает**: Отвязка профиля ВКонтакте

---

### 👫 События групп (Groups)

#### 1. `event://getcourse/user/group_added` - Добавление в группу

**Когда срабатывает**: Когда пользователь добавлен в группу

**Поля события**:
```
user_id → user_id (String)                    # ID пользователя
action_param1 → group_id (String)             # ID группы
dt → added_date (Date)                        # Дата добавления
```

**SQL пример - Топ групп по количеству пользователей**:
```sql
SELECT 
  action_param1 as group_id,
  COUNT(DISTINCT user_id) as member_count
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/user/group_added'
  AND dt BETWEEN '2025-01-01' AND DATE_ADD(TODAY(), INTERVAL 1 DAY)
GROUP BY group_id
ORDER BY member_count DESC
LIMIT 20
```

---

#### 2. `event://getcourse/user/group_removed` - Удаление из группы

**Когда срабатывает**: Когда пользователь удален из группы

---

### 💬 События коммуникации (Communication)

#### 1. `event://getcourse/message/incoming` - Входящее сообщение

**Когда срабатывает**: Получено сообщение от пользователя

**Поля события**:
```
user_id → user_id (String)                    # ID пользователя
action_param1 → message_id (String)           # ID сообщения
action_param2 → channel (String)              # Канал (telegram, email, sms)
action_param3 → message_text (String)         # Текст сообщения
dt → message_date (Date)                      # Дата сообщения
```

**SQL пример - Сообщения по каналам**:
```sql
SELECT 
  action_param2 as channel,
  COUNT(*) as message_count,
  COUNT(DISTINCT user_id) as unique_users
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/message/incoming'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY channel
ORDER BY message_count DESC
```

---

#### 2. `event://getcourse/message/outgoing` - Исходящее сообщение

**Когда срабатывает**: Отправлено сообщение пользователю

**Поля события**: Аналогично входящему сообщению

---

### 💳 События платежей (Payments)

#### 1. `event://getcourse/payment/initiated` - Инициирован платеж

**Когда срабатывает**: Пользователь начал процесс оплаты

**Поля события**:
```
action_param1 → deal_id (String)              # ID заказа
action_param1_float → amount (Float)          # Размер платежа
action_param2 → payment_method (String)       # Способ оплаты
```

---

#### 2. `event://getcourse/payment/completed` - Платеж завершен

**Когда срабатывает**: Успешный платеж

---

#### 3. `event://getcourse/payment/failed` - Платеж отклонен

**Когда срабатывает**: Ошибка при обработке платежа

---

### 📧 События писем (Emails)

#### 1. `event://getcourse/email/sent` - Письмо отправлено

#### 2. `event://getcourse/email/opened` - Письмо открыто

#### 3. `event://getcourse/email/clicked` - Клик по ссылке в письме

---

## SQL примеры запросов

### Базовые запросы для начинающих

#### 1. Количество заказов за период
```sql
SELECT 
  COUNT(DISTINCT action_param1) as total_orders,
  SUM(action_param1_float) as total_amount
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealCreated'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
```

#### 2. Количество платежей за период
```sql
SELECT 
  COUNT(DISTINCT action_param1) as paid_orders,
  SUM(action_param2_float) as total_revenue
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealPaid'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
```

#### 3. Статистика по статусам заказов
```sql
SELECT 
  action_param3 as status,
  COUNT(DISTINCT action_param1) as order_count,
  SUM(action_param1_float) as total_amount
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealCreated'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY status
ORDER BY order_count DESC
```

### Продвинутые запросы

#### 4. Воронка заказов (от создания к оплате)
```sql
WITH deal_creation AS (
  SELECT 
    action_param1 as deal_id,
    action_param1_float as amount,
    action_param3 as initial_status,
    dt
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealCreated'
    AND dt BETWEEN '2025-01-01' AND '2025-01-31'
),
deal_payments AS (
  SELECT 
    DISTINCT action_param1 as deal_id,
    SUM(action_param2_float) as paid_amount
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealPaid'
    AND dt BETWEEN '2025-01-01' AND '2025-01-31'
  GROUP BY deal_id
)
SELECT 
  COUNT(DISTINCT dc.deal_id) as created_orders,
  COUNT(DISTINCT dp.deal_id) as paid_orders,
  ROUND((COUNT(DISTINCT dp.deal_id) * 100.0 / COUNT(DISTINCT dc.deal_id)), 2) as conversion_percent,
  SUM(dc.amount) as total_order_amount,
  SUM(dp.paid_amount) as total_paid_amount
FROM deal_creation dc
LEFT JOIN deal_payments dp ON dc.deal_id = dp.deal_id
```

#### 5. Средний чек и LTV пользователя
```sql
WITH user_payments AS (
  SELECT 
    user_id,
    action_param1 as deal_id,
    action_param2_float as payment_amount,
    dt
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealPaid'
)
SELECT 
  user_id,
  COUNT(DISTINCT deal_id) as purchases_count,
  SUM(payment_amount) as total_revenue,
  AVG(payment_amount) as average_check,
  MIN(dt) as first_purchase,
  MAX(dt) as last_purchase
FROM user_payments
WHERE dt BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY user_id
ORDER BY total_revenue DESC
LIMIT 100
```

#### 6. Динамика регистраций и активности
```sql
WITH registrations AS (
  SELECT 
    dt as date,
    COUNT(DISTINCT user_id) as new_registrations
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/user/created'
    AND dt BETWEEN '2025-01-01' AND '2025-01-31'
  GROUP BY dt
),
purchases AS (
  SELECT 
    dt as date,
    COUNT(DISTINCT user_id) as active_buyers,
    COUNT(DISTINCT action_param1) as deals_created
  FROM chatium_ai.access_log
  WHERE urlPath = 'event://getcourse/dealCreated'
    AND dt BETWEEN '2025-01-01' AND '2025-01-31'
  GROUP BY dt
)
SELECT 
  r.date,
  r.new_registrations,
  p.active_buyers,
  p.deals_created
FROM registrations r
LEFT JOIN purchases p ON r.date = p.date
ORDER BY r.date DESC
```

---

## TypeScript API примеры

### Подключение SDK

```typescript
import { gcQueryAi } from '@gc-mcp-server/sdk'

// Все функции работают асинхронно и требуют контекст (ctx)
```

### Базовые примеры

#### 1. Получение всех заказов
```typescript
export const apiGetAllOrdersRoute = app.get('/orders', async (ctx, req) => {
  const { dateFrom = '2025-01-01', dateTo = '2025-01-31' } = req.query

  const query = `
    SELECT 
      action_param1 as deal_id,
      action_param1_float as order_amount,
      action_param2 as currency,
      action_param3 as status,
      dt as creation_date,
      title as offer_name
    FROM chatium_ai.access_log
    WHERE urlPath = 'event://getcourse/dealCreated'
      AND dt BETWEEN '${dateFrom}' AND '${dateTo}'
    ORDER BY dt DESC
    LIMIT 1000
  `

  const result = await gcQueryAi(ctx, query)
  return result.rows || []
})
```

#### 2. Получение статистики доходов
```typescript
export const apiRevenueStatsRoute = app.get('/revenue-stats', async (ctx, req) => {
  const { dateFrom = '2025-01-01', dateTo = '2025-01-31' } = req.query

  const query = `
    SELECT 
      toDate(dt) as revenue_date,
      COUNT(DISTINCT action_param1) as orders_paid,
      SUM(action_param2_float) as total_revenue,
      AVG(action_param2_float) as average_payment
    FROM chatium_ai.access_log
    WHERE urlPath = 'event://getcourse/dealPaid'
      AND dt BETWEEN '${dateFrom}' AND '${dateTo}'
    GROUP BY revenue_date
    ORDER BY revenue_date DESC
  `

  const result = await gcQueryAi(ctx, query)
  return result.rows || []
})
```

#### 3. Анализ воронки продаж
```typescript
export const apiFunnelAnalysisRoute = app.get('/funnel-analysis', async (ctx, req) => {
  const { dateFrom = '2025-01-01', dateTo = '2025-01-31' } = req.query

  const query = `
    WITH created_deals AS (
      SELECT COUNT(DISTINCT action_param1) as count, dt FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
        AND dt BETWEEN '${dateFrom}' AND '${dateTo}'
      GROUP BY dt
    ),
    paid_deals AS (
      SELECT COUNT(DISTINCT action_param1) as count, dt FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid'
        AND dt BETWEEN '${dateFrom}' AND '${dateTo}'
      GROUP BY dt
    )
    SELECT 
      'created' as stage,
      SUM(count) as total
    FROM created_deals
    UNION ALL
    SELECT 
      'paid' as stage,
      SUM(count) as total
    FROM paid_deals
  `

  const result = await gcQueryAi(ctx, query)
  const created = result.rows?.find(r => r.stage === 'created')?.total || 0
  const paid = result.rows?.find(r => r.stage === 'paid')?.total || 0
  
  return {
    stages: [
      { name: 'Заказы созданы', count: created },
      { name: 'Заказы оплачены', count: paid },
      { name: 'Конверсия', percent: created > 0 ? Math.round((paid / created) * 100) : 0 }
    ]
  }
})
```

#### 4. Список активных пользователей
```typescript
export const apiActiveUsersRoute = app.get('/active-users', async (ctx, req) => {
  const { dateFrom = '2025-01-01', dateTo = '2025-01-31', limit = '100' } = req.query

  const query = `
    SELECT 
      user_id,
      user_email,
      user_first_name,
      user_last_name,
      COUNT(DISTINCT action_param1) as purchases_count,
      SUM(action_param2_float) as total_spent,
      MAX(dt) as last_purchase
    FROM chatium_ai.access_log
    WHERE urlPath = 'event://getcourse/dealPaid'
      AND dt BETWEEN '${dateFrom}' AND '${dateTo}'
      AND user_id IS NOT NULL
    GROUP BY user_id, user_email, user_first_name, user_last_name
    ORDER BY total_spent DESC
    LIMIT ${limit}
  `

  const result = await gcQueryAi(ctx, query)
  return {
    users: result.rows || [],
    count: result.rows?.length || 0
  }
})
```

#### 5. Отчет по группам
```typescript
export const apiGroupsReportRoute = app.get('/groups-report', async (ctx, req) => {
  const { dateFrom = '2025-01-01', dateTo = '2025-01-31' } = req.query

  const query = `
    SELECT 
      action_param1 as group_id,
      COUNT(DISTINCT user_id) as member_count,
      COUNT(*) as add_events,
      MIN(dt) as first_member_added,
      MAX(dt) as last_member_added
    FROM chatium_ai.access_log
    WHERE urlPath = 'event://getcourse/user/group_added'
      AND dt BETWEEN '${dateFrom}' AND '${dateTo}'
    GROUP BY group_id
    ORDER BY member_count DESC
  `

  const result = await gcQueryAi(ctx, query)
  return result.rows || []
})
```

#### 6. Интеграция с мессенджерами (Telegram, VK)
```typescript
export const apiMessengerStatsRoute = app.get('/messenger-stats', async (ctx, req) => {
  const { dateFrom = '2025-01-01', dateTo = '2025-01-31' } = req.query

  const telega = `
    WITH first_reg AS (
      SELECT user_id, MIN(dt) as reg_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
      GROUP BY user_id
    )
    SELECT 
      COUNT(DISTINCT tg.user_id) as telegram_users,
      COUNT(DISTINCT CASE WHEN tdis.user_id IS NOT NULL THEN tg.user_id END) as telegram_disabled
    FROM (
      SELECT DISTINCT user_id FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/chatbot/telegram_enabled'
    ) tg
    INNER JOIN first_reg fr ON tg.user_id = fr.user_id
    LEFT JOIN (
      SELECT DISTINCT user_id FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/chatbot/telegram_disabled'
    ) tdis ON tg.user_id = tdis.user_id
    WHERE fr.reg_date BETWEEN '${dateFrom}' AND '${dateTo}'
  `

  const result = await gcQueryAi(ctx, telega)
  return result.rows?.[0] || { telegram_users: 0, telegram_disabled: 0 }
})
```

---

## Адаптация для эмбедингов

### Концепция структурирования для RAG/Embeddings

Для использования аналитики в AI агентах с помощью RAG (Retrieval Augmented Generation), данные должны быть структурированы в виде семантических единиц.

### Структура документа для эмбединга

```typescript
interface AnalyticsEmbedding {
  // Уникальный идентификатор
  id: string
  
  // Семантический контент (для поиска)
  content: string
  
  // Метаданные для фильтрации
  metadata: {
    eventType: string           // dealCreated, dealPaid, user/created и т.д.
    dataType: string            // order, user, payment, group
    dateFrom?: string
    dateTo?: string
    aggregationLevel?: string   // daily, monthly, event
    businessMetric?: string     // revenue, users, conversion, retention
  }
  
  // Структурированные данные
  data: Record<string, any>
  
  // Человеческое описание для контекста
  description: string
  
  // Когда актуально
  generatedAt: Date
}
```

### Примеры документов для эмбединга

#### Пример 1: Отчет о доходах
```typescript
{
  id: "analytics-revenue-2025-01",
  content: `
    Отчет о доходах за январь 2025 года.
    Всего создано 450 заказов на сумму 125,500 РУБ.
    Оплачено 380 заказов на сумму 112,000 РУБ.
    Конверсия составила 84.4%.
    Средний чек: 294.74 РУБ.
    Максимальный заказ: 5,000 РУБ.
    Минимальный заказ: 100 РУБ.
  `,
  metadata: {
    eventType: ['dealCreated', 'dealPaid'],
    dataType: 'order',
    dateFrom: '2025-01-01',
    dateTo: '2025-01-31',
    aggregationLevel: 'monthly',
    businessMetric: ['revenue', 'conversion', 'average_check']
  },
  data: {
    period: 'January 2025',
    createdOrders: 450,
    totalAmount: 125500,
    paidOrders: 380,
    revenue: 112000,
    conversion: 84.4,
    averageCheck: 294.74,
    maxOrder: 5000,
    minOrder: 100
  },
  description: 'Ежемесячный отчет о финансовых показателях',
  generatedAt: new Date('2025-02-01')
}
```

#### Пример 2: Профиль клиента
```typescript
{
  id: "user-profile-user123",
  content: `
    Профиль клиента Иван Петров (user@example.com).
    Зарегистрирован 2025-01-15.
    Всего покупок: 5
    Общая сумма: 15,000 РУБ
    Средний чек: 3,000 РУБ
    Последняя покупка: 2025-01-28
    Подключен Telegram: да
    Статус: активный покупатель
  `,
  metadata: {
    eventType: ['user/created', 'dealPaid'],
    dataType: 'user',
    businessMetric: ['ltv', 'purchase_frequency', 'engagement']
  },
  data: {
    userId: 'user123',
    email: 'user@example.com',
    firstName: 'Иван',
    lastName: 'Петров',
    registrationDate: '2025-01-15',
    totalPurchases: 5,
    totalSpent: 15000,
    averageCheck: 3000,
    lastPurchaseDate: '2025-01-28',
    telegramConnected: true,
    vkConnected: false,
    status: 'active'
  },
  description: 'Профиль активного клиента с высокой LTV',
  generatedAt: new Date()
}
```

#### Пример 3: Группа пользователей
```typescript
{
  id: "group-analytics-group789",
  content: `
    Аналитика группы "Премиум подписка".
    ID группы: 789
    Всего членов: 1,250
    Добавлено за январь: 340
    Процент активных: 65%
    Средняя покупка в группе: 2,500 РУБ
    Высокоценные члены: 120 (9.6%)
  `,
  metadata: {
    eventType: 'user/group_added',
    dataType: 'group',
    aggregationLevel: 'monthly',
    businessMetric: ['group_size', 'engagement', 'revenue_per_member']
  },
  data: {
    groupId: 'group789',
    groupName: 'Премиум подписка',
    totalMembers: 1250,
    membersAddedThisMonth: 340,
    activePercentage: 65,
    averagePurchaseValue: 2500,
    highValueMembers: 120
  },
  description: 'Аналитика целевой группы',
  generatedAt: new Date()
}
```

### Использование в AI агенте

```typescript
import { gcQueryAi } from '@gc-mcp-server/sdk'

// Функция для создания эмбедингов из аналитики
async function createAnalyticsEmbeddings(ctx: app.Ctx) {
  const embeddings: AnalyticsEmbedding[] = []
  
  // 1. Получить финансовые метрики
  const revenueQuery = `
    SELECT 
      toDate(dt) as date,
      COUNT(DISTINCT action_param1) as orders,
      SUM(action_param2_float) as revenue
    FROM chatium_ai.access_log
    WHERE urlPath = 'event://getcourse/dealPaid'
      AND dt >= subtractDays(today(), 30)
    GROUP BY date
  `
  
  const revenueData = await gcQueryAi(ctx, revenueQuery)
  
  // 2. Создать документ для эмбединга
  embeddings.push({
    id: `analytics-revenue-${new Date().toISOString()}`,
    content: generateRevenueDescription(revenueData.rows),
    metadata: {
      eventType: 'dealPaid',
      dataType: 'financial',
      businessMetric: 'revenue'
    },
    data: revenueData.rows,
    description: 'Отчет о доходах за последние 30 дней',
    generatedAt: new Date()
  })
  
  return embeddings
}

// Функция для поиска релевантной аналитики
async function findRelevantAnalytics(
  ctx: app.Ctx,
  userQuery: string,
  embeddings: AnalyticsEmbedding[]
) {
  // Семантический поиск - найти самый релевантный документ
  const relevantEmbedding = findMostRelevant(userQuery, embeddings)
  
  return {
    query: userQuery,
    relevantData: relevantEmbedding.data,
    context: relevantEmbedding.content,
    description: relevantEmbedding.description
  }
}
```

### Рекомендуемые типы документов для эмбединга

| Тип | Примеры | Частота обновления |
|-----|---------|-------------------|
| Финансовые отчеты | Доход, расходы, средний чек | Ежедневно |
| Профили клиентов | LTV, история покупок | При действии |
| Группы и сегменты | Размер, активность, доход | Еженедельно |
| Воронки | Конверсия, дропауты | Ежедневно |
| Тренды | Растущие/падающие метрики | Еженедельно |
| Аномалии | Необычные значения | В реальном времени |

---

## Практические примеры реализации

### Пример 1: Система мониторинга продаж

```typescript
// api/sales-monitoring.ts
import { gcQueryAi } from '@gc-mcp-server/sdk'

interface SalesAlert {
  type: 'warning' | 'info' | 'success'
  message: string
  metric: string
  current: number
  threshold: number
  date: Date
}

export const apiSalesMonitorRoute = app.get('/sales-monitor', async (ctx, req) => {
  const alerts: SalesAlert[] = []
  
  // 1. Проверить падение продаж
  const todayQuery = `
    SELECT COUNT(DISTINCT action_param1) as deals_count
    FROM chatium_ai.access_log
    WHERE urlPath = 'event://getcourse/dealCreated'
      AND dt = today()
  `
  const today = await gcQueryAi(ctx, todayQuery)
  const todayDeals = today.rows?.[0]?.deals_count || 0
  
  // 2. Сравнить со средним за последние 7 дней
  const avgQuery = `
    SELECT AVG(daily_count) as avg_deals
    FROM (
      SELECT 
        dt,
        COUNT(DISTINCT action_param1) as daily_count
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
        AND dt BETWEEN subtractDays(today(), 8) AND subtractDays(today(), 1)
      GROUP BY dt
    )
  `
  const avg = await gcQueryAi(ctx, avgQuery)
  const avgDeals = avg.rows?.[0]?.avg_deals || 0
  
  // 3. Если падение > 30%, добавить alert
  if (todayDeals < avgDeals * 0.7) {
    alerts.push({
      type: 'warning',
      message: `Падение продаж на ${Math.round((1 - todayDeals / avgDeals) * 100)}%`,
      metric: 'daily_deals',
      current: todayDeals,
      threshold: Math.round(avgDeals),
      date: new Date()
    })
  }
  
  // 4. Проверить конверсию
  const conversionQuery = `
    WITH created AS (
      SELECT COUNT(DISTINCT action_param1) as count
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
        AND dt = today()
    ),
    paid AS (
      SELECT COUNT(DISTINCT action_param1) as count
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid'
        AND dt = today()
    )
    SELECT 
      c.count as created,
      p.count as paid,
      (p.count * 100.0 / GREATEST(c.count, 1)) as conversion
    FROM created c, paid p
  `
  const conv = await gcQueryAi(ctx, conversionQuery)
  const conversion = conv.rows?.[0]?.conversion || 0
  
  if (conversion < 50) {
    alerts.push({
      type: 'warning',
      message: `Низкая конверсия: ${Math.round(conversion)}%`,
      metric: 'conversion_rate',
      current: Math.round(conversion),
      threshold: 50,
      date: new Date()
    })
  }
  
  return {
    alerts,
    hasIssues: alerts.filter(a => a.type === 'warning').length > 0,
    summary: {
      todayDeals,
      avgDeals: Math.round(avgDeals),
      conversion: Math.round(conversion)
    }
  }
})
```

### Пример 2: Система CRM интеграции

```typescript
// api/crm-integration.ts
export const apiCustomerLifetimeValueRoute = app.get('/customer-ltv/:userId', async (ctx, req) => {
  const { userId } = req.params
  
  const query = `
    WITH user_info AS (
      SELECT DISTINCT
        user_id,
        user_email,
        user_first_name,
        user_last_name,
        MIN(dt) as registration_date
      FROM chatium_ai.access_log
      WHERE user_id = '${userId}'
        AND urlPath IN ('event://getcourse/user/created', 'event://getcourse/dealCreated')
      GROUP BY user_id, user_email, user_first_name, user_last_name
    ),
    purchase_history AS (
      SELECT 
        user_id,
        COUNT(DISTINCT action_param1) as purchase_count,
        SUM(action_param2_float) as total_spent,
        AVG(action_param2_float) as avg_purchase,
        MAX(dt) as last_purchase,
        MIN(dt) as first_purchase
      FROM chatium_ai.access_log
      WHERE user_id = '${userId}'
        AND urlPath = 'event://getcourse/dealPaid'
      GROUP BY user_id
    ),
    engagement AS (
      SELECT 
        user_id,
        CASE WHEN COUNT(*) > 0 THEN true ELSE false END as telegram_connected
      FROM chatium_ai.access_log
      WHERE user_id = '${userId}'
        AND urlPath = 'event://getcourse/user/chatbot/telegram_enabled'
      GROUP BY user_id
    )
    SELECT 
      u.user_id,
      u.user_email,
      u.user_first_name,
      u.user_last_name,
      u.registration_date,
      p.purchase_count,
      p.total_spent as ltv,
      p.avg_purchase,
      p.last_purchase,
      e.telegram_connected,
      dateDiff('day', u.registration_date, today()) as customer_age_days
    FROM user_info u
    LEFT JOIN purchase_history p ON u.user_id = p.user_id
    LEFT JOIN engagement e ON u.user_id = e.user_id
  `
  
  const result = await gcQueryAi(ctx, query)
  return result.rows?.[0] || null
})
```

### Пример 3: Автоматический отчет для рассылки

```typescript
// api/daily-report.ts
export const apiGenerateDailyReportRoute = app.get('/daily-report', async (ctx, req) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  
  const reportQuery = `
    WITH daily_data AS (
      SELECT 
        'Заказы' as metric,
        COUNT(DISTINCT action_param1) as value,
        'штук' as unit
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
        AND dt = '${dateStr}'
      UNION ALL
      SELECT 
        'Доход',
        SUM(action_param2_float),
        'РУБ'
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid'
        AND dt = '${dateStr}'
      UNION ALL
      SELECT 
        'Новые пользователи',
        COUNT(DISTINCT user_id),
        'штук'
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
        AND dt = '${dateStr}'
      UNION ALL
      SELECT 
        'Пользователи с Telegram',
        COUNT(DISTINCT user_id),
        'штук'
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/chatbot/telegram_enabled'
        AND dt = '${dateStr}'
    )
    SELECT * FROM daily_data
  `
  
  const result = await gcQueryAi(ctx, reportQuery)
  
  // Форматируем в читаемый отчет
  const report = {
    date: dateStr,
    title: `Ежедневный отчет за ${dateStr}`,
    metrics: result.rows || [],
    htmlContent: generateHTMLReport(result.rows),
    timestamp: new Date()
  }
  
  return report
})

function generateHTMLReport(data: any[]) {
  return `
    <h1>Ежедневный отчет</h1>
    <table border="1" cellpadding="10">
      <tr><th>Метрика</th><th>Значение</th><th>Единица</th></tr>
      ${data.map(row => `
        <tr>
          <td>${row.metric}</td>
          <td>${row.value}</td>
          <td>${row.unit}</td>
        </tr>
      `).join('')}
    </table>
  `
}
```

---

## Оптимизация и лучшие практики

### 🚀 Оптимизация SQL запросов

#### 1. Используйте CTE для сложных вычислений
```sql
-- ❌ Неправильно: Вложенные подзапросы затрудняют чтение
SELECT * FROM (
  SELECT * FROM (
    SELECT * FROM chatium_ai.access_log WHERE urlPath LIKE 'event://%'
  ) WHERE dt > '2025-01-01'
) WHERE user_id IS NOT NULL

-- ✅ Правильно: Используйте CTE (WITH)
WITH filtered_events AS (
  SELECT *
  FROM chatium_ai.access_log
  WHERE urlPath LIKE 'event://%'
    AND dt > '2025-01-01'
    AND user_id IS NOT NULL
)
SELECT * FROM filtered_events
```

#### 2. Используйте агрегирующие функции вместо GROUP BY
```sql
-- ❌ Неправильно: Медленно
SELECT user_id, dt FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealPaid'
LIMIT 1000000

-- ✅ Правильно: Быстро
SELECT 
  COUNT(DISTINCT user_id) as users,
  SUM(action_param2_float) as revenue
FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealPaid'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
```

#### 3. Фильтруйте по dt (дате) в условии WHERE
```sql
-- ❌ Может быть медленно: Нет предикатов на дату
SELECT COUNT(*) FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealCreated'

-- ✅ Быстро: Используйте дату для партиционирования
SELECT COUNT(*) FROM chatium_ai.access_log
WHERE urlPath = 'event://getcourse/dealCreated'
  AND dt BETWEEN '2025-01-01' AND '2025-01-31'
```

### 📊 Кэширование результатов

```typescript
// Простой кэш для частых запросов
const queryCache = new Map<string, { data: any; timestamp: Date }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

async function cachedGcQuery(ctx: app.Ctx, query: string, cacheTTL = CACHE_TTL) {
  const cached = queryCache.get(query)
  
  // Проверим кэш
  if (cached && Date.now() - cached.timestamp.getTime() < cacheTTL) {
    return cached.data
  }
  
  // Выполним запрос
  const result = await gcQueryAi(ctx, query)
  
  // Кэшируем результат
  queryCache.set(query, {
    data: result,
    timestamp: new Date()
  })
  
  return result
}
```

### 🎯 Лучшие практики

#### 1. Типизируйте результаты
```typescript
interface DealPaid {
  deal_id: string
  payment_amount: number
  currency: string
  payment_date: string
}

const query = `SELECT ... FROM chatium_ai.access_log WHERE ...`
const result = await gcQueryAi(ctx, query) as { rows: DealPaid[] }
const deals: DealPaid[] = result.rows || []
```

#### 2. Обрабатывайте ошибки
```typescript
try {
  const result = await gcQueryAi(ctx, query)
  return result.rows || []
} catch (error) {
  console.error('Query error:', error)
  ctx.account.log('Analytics Query Failed', {
    level: 'error',
    json: { query, error: error.message }
  })
  throw new Error('Failed to fetch analytics data')
}
```

#### 3. Документируйте сложные запросы
```typescript
export const apiComplexAnalyticsRoute = app.get('/complex-analysis', async (ctx, req) => {
  /**
   * Анализ:
   * 1. Собираем всех пользователей с их первой датой регистрации
   * 2. Группируем заказы по дням и пользователям
   * 3. Рассчитываем LTV для каждого пользователя
   * 4. Находим когорту, которая зарегистрировалась в первые 7 дней месяца
   * 5. Анализируем их поведение через 30 дней
   */
  
  const query = `...`
  return await gcQueryAi(ctx, query)
})
```

#### 4. Используйте индексы для часто запрашиваемых полей
```sql
-- Основные индексы для GetCourse аналитики
-- urlPath - очень часто используется в WHERE
-- dt - для дневных фильтраций
-- user_id - для анализа по пользователям
-- action_param1 - для анализа по заказам
```

#### 5. Мониторьте производительность
```typescript
async function monitoredGcQuery(ctx: app.Ctx, query: string) {
  const startTime = performance.now()
  
  try {
    const result = await gcQueryAi(ctx, query)
    const duration = performance.now() - startTime
    
    // Логируем медленные запросы
    if (duration > 5000) {
      ctx.account.log('Slow Analytics Query', {
        level: 'warn',
        json: { query: query.substring(0, 200), duration }
      })
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    ctx.account.log('Analytics Query Error', {
      level: 'error',
      json: { query: query.substring(0, 200), duration, error: error.message }
    })
    throw error
  }
}
```

### 📈 Масштабирование

При растущих объемах данных:

1. **Архивируйте старые данные** - перемещайте события старше года в отдельную таблицу
2. **Используйте материализованные представления** - для часто используемых агрегаций
3. **Реализуйте инкрементальные обновления** - обновляйте только новые данные
4. **Кэшируйте на уровне приложения** - используйте Redis или память для частых запросов

---

## Чек-лист для разработчика

- [ ] Все события GetCourse задокументированы и понятны
- [ ] SQL запросы оптимизированы и используют фильтры по дате
- [ ] Результаты типизированы в TypeScript
- [ ] Ошибки правильно обработаны
- [ ] Медленные запросы залогированы
- [ ] Кэширование реализовано для часто используемых данных
- [ ] Документация обновлена при добавлении новых событий
- [ ] Примеры работают и протестированы
- [ ] Эмбединги структурированы для AI агентов
- [ ] Performance метрики собираются

---

## Ссылки на дополнительные ресурсы

- `014-Traffic.md` - Примеры аналитических запросов
- `010-GetcourseAnalytics.md` - Справочник событий GetCourse
- GetCourse API документация: https://getcourse.ru/api
- ClickHouse документация: https://clickhouse.com/docs
- Chatium фреймворк: документация в проекте

---

**Документ готов к использованию в AI агентах, чат-ботах и системах аналитики.**
