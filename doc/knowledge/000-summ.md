# Навигатор по документации Chatium

Централизованный индекс для быстрого поиска информации по разработке в Chatium. Используйте ключевые слова для поиска нужного раздела.

## 📚 Структура документации

### Специализированные инструкции

| Файл | Тема | Ключевые слова |
|------|------|----------------|
| **001-standards.md** | Стандарты кода | TailwindCSS, FontAwesome, форматирование, best practices |
| **002-routing.md** | Входящий роутинг | роутинг, маршруты, app.get, app.post, app.html, HTTP обработчики, URL, file-based, тильда, слеш, параметры пути, query параметры, route.url() |
| **003-auth.md** | Авторизация | авторизация, пользователи, роли, requireAccountRole, requireRealUser, requireAnyUser, ctx.user, проверка прав, кастомная форма входа, LoginPage, PhoneAuthForm, EmailAuthForm, Telegram OAuth |
| **004-request.md** | Исходящий роутинг | HTTP клиент, request, внешние API, GET запросы, POST запросы, headers, @app/request |
| **005-jobs.md** | Отложенные задачи | задачи, джобы, app.job, scheduleJobAfter, scheduleJobAsap, scheduleJobAt, отложенное выполнение |
| **006-arch.md** | Архитектура проекта | структура, директории, организация файлов, именование, best practices, папки |
| **007-vue.md** | Vue компоненты | Vue, компоненты, страницы, рендеринг, `<script setup>`, реактивность, шаблоны, 🚨 КРИТИЧЕСКОЕ: клиент vs сервер, Heap таблицы только на сервере, fetch() на клиенте, SSR, props, tsconfig.json, extends, jsx preserve |
| **008-heap.md** | База данных Heap | Heap, таблицы, CRUD, create, findAll, update, delete, Money, RefLink, поиск, фильтры, транзакции, race condition, runWithExclusiveLock, блокировки |
| **022-getcourse-heap.md** | Heap.Table() TypeScript API | Heap.Table(), TypeScript таблицы, Heap.String, Heap.Number, Heap.Boolean, Heap.DateTime, Heap.Optional, Heap.Any, customMeta, searchable, embeddings, типизация, экспорт типов |
| **009-files.md** | Работа с файлами | файлы, загрузка, изображения, obtainStorageFilePutUrl, getThumbnailUrl, hash, storage, видео, Kinescope |
| **010-agents.md** | AI-агенты | агенты, AI, боты, startCompletion, pushMessageToChain, tools, инструменты, Telegram |
| **011-i18n.md** | Интернационализация | переводы, i18n, ctx.t(), ctx.lang, мультиязычность, плюралы, YAML |
| **012-sender.md** | Модуль @sender | мессенджеры, чаты, Telegram, VK, Email, sendMessageToChat, каналы, Person, теги |
| **013-config.md** | Конфигурация | config.json, readWorkspaceFile, updateWorkspaceFile, настройки |
| **014-socket.md** | WebSocket | real-time, сокеты, sendDataToSocket, обновления, прогресс, чат |
| **015-notifications.md** | Уведомления админов | sendNotificationToAccountOwners, уведомления, HTML, Markdown |
| **016-analytics-workspace.md** | ⭐ События workspace | writeWorkspaceEvent, @start/after-event-write, события workspace, UTM метки, clrtTrack, clrtUid |
| **016-analytics-traffic.md** | ⭐ События трафика | queryAi, Traffic SDK, pageview, клики, видео, scroll, HTTP/HTTPS группировка по action, ClickHouse, 8 базовых + 13 расширенных событий |
| **016-analytics-getcourse.md** | ⭐ GetCourse аналитика | gcQueryAi, GetCourse SDK, dealCreated, dealPaid, user/created, ClickHouse, resolved_user_id, SQL запросы, 34 события, urlPattern, LIKE фильтрация, категории (5), EventDefinition, динамическая фильтрация |
| **016-analytics-subscriptions.md** | ⭐ Подписки на события | subscribeToMetricEvents, metric-event хук, Heap подписки, WebSocket мониторинг, Events Subscribe проект |
| **016-analytics-attribution.md** | ⭐ Атрибуция пользователей | uid → user_id маппинг, first-touch, last-touch, form/sent, session_id, AnalyticsUidMappings, AnalyticsSessionAttribution, parseUrlParams, utm-метки, промокоды, GetCourse регистрация |
| **017-payments.md** | Платежи | runAttemptPayment, attemptAutoCharge, getSavedCards, подписки, автосписание |
| **018-preloader.md** | 🎨 Прелоадеры | boot sequence, системная загрузка, терминальный стиль, Performance API, мониторинг ресурсов, typing animation, geometric background, preloader types, спиннер, классический, инициализация темы |
| **019-design.md** | 🎨 Дизайн-система | UI/UX, темная тема, CSS Variables, Tailwind, карточки, кнопки, формы, иконки, адаптивность, градиенты |
| **020-testing.md** | ⚠️ Unit тестирование | тестирование, unit tests, /tests, /tests/ai, HTTP тесты, автоматизация, покрытие кода, JSON API |
| **021-getcourse-events.md** | ⚠️ Подписка на события GetCourse | subscribeToMetricEvents, metric-event, app.accountHook, app.pluginHook, transformGcEventParams, event://getcourse, metric-event-event://getcourse, realtime события, lesson answers, conversation, deals, contacts, ⚠️ ТОЛЬКО Chatium на стороне GetCourse |

---

## 🔍 Быстрый поиск по темам

### Роутинг и маршруты
**Файл**: `002-routing.md`
- Создание роутов (app.get, app.post, app.html)
- File-based архитектура (/ и ~ в URL)
- Параметры пути (:id, :slug)
- Query параметры (?key=value)
- Генерация ссылок (route.url())
- ⚠️ **КРИТИЧЕСКИ ВАЖНО**: Никогда не используйте хардкод URL!
- Всегда импортируйте роуты и вызывайте .url()
- Форматирование ответов (JSON, HTML, ошибки)
- Контекст (ctx) и запрос (req)

### Авторизация и безопасность
**Файл**: `003-auth.md`
- requireAccountRole(ctx, 'Admin') — проверка роли
- requireRealUser(ctx) — только реальные пользователи
- requireAnyUser(ctx) — гарантия наличия пользователя
- ctx.user — текущий пользователь
- Роли: Admin, Staff, User
- Проверки в роутах и API
- **Кастомная форма входа** — LoginPage.vue, PhoneAuthForm, EmailAuthForm
- Структура формы: поле ввода → пароль → Войти → или → Отправить код → или → Telegram
- Telegram OAuth через getTelegramOauthUrl()

### HTTP запросы к внешним API
**Файл**: `004-request.md`
- import { request } from "@app/request"
- GET, POST, PUT, DELETE запросы
- Headers и авторизация
- Обработка ошибок
- responseType: 'json' | 'text'
- throwHttpErrors: true | false

### Отложенные задачи и планирование
**Файл**: `005-jobs.md`
- app.job() — определение задачи
- scheduleJobAfter(ctx, N, 'unit', params) — через время
- scheduleJobAsap(ctx, params) — асинхронно
- scheduleJobAt(ctx, date, params) — в дату
- cancelScheduledJob(ctx, taskId) — отмена

### Структура проекта
**Файл**: `006-arch.md`
- Организация папок (/api/, /pages/, /tables/)
- Правила именования (camelCase, PascalCase)
- Один файл — один роут
- Shared файлы (// @shared)
- Комментарии // @shared-route

### Vue компоненты и страницы
**Файл**: `007-vue.md`
- `<script setup>` — Composition API
- ⚠️ **КРИТИЧЕСКИ ВАЖНО**: Использование роут-объектов, не хардкода URL!
- Рендеринг на сервере (SSR)
- Глобальный ctx
- Реактивность (ref, reactive, computed)
- Импорт роутов в компонентах
- route.url() в темплейтах

### База данных Heap
**Файл**: `008-heap.md` (JSON-таблицы)
- Heap.Table() — создание таблицы через JSON
- CRUD операции (create, findAll, update, delete)
- Фильтрация (where, операторы)
- Сортировка (order)
- Подсчёт (countBy)
- Полнотекстовый поиск (searchBy)
- Money — работа с деньгами
- RefLink — связи между таблицами
- Транзакции
- ⚠️ **Race condition**: При работе с БД следите за возможностью race condition. Используйте `runWithExclusiveLock` из `@app/sync` для предотвращения проблем при параллельных запросах

**Файл**: `022-getcourse-heap.md` (TypeScript API)
- Heap.Table() — создание таблицы через TypeScript
- Типы полей (Heap.String, Heap.Number, Heap.Boolean, Heap.DateTime, Heap.Any)
- Heap.Optional() — опциональные поля
- customMeta — метаданные полей
- searchable — настройки поиска (embeddings: false по умолчанию)
- Экспорт типов (TableRow, TableRowJson)
- Типизация TypeScript
- Сравнение с JSON-таблицами

### Работа с файлами
**Файл**: `009-files.md`
- obtainStorageFilePutUrl() — получение URL загрузки
- Загрузка с клиента (FormData)
- getThumbnailUrl() — получение изображений
- getVideoInfo() — информация о видео
- Типы файлов (ImageFile, VideoFile, AudioFile)
- Хранение hash в таблицах

### AI-агенты и боты
**Файл**: `010-agents.md`
- getOrCreateAgentForWorkspace() — создание агента
- pushMessageToChain() — отправка сообщений
- startCompletion() — AI генерация
- Создание инструментов (tools)
- Callbacks (onCompletionCompleted, onCompletionFailed)
- Интеграция с Telegram

### Интернационализация (i18n)
**Файл**: `011-i18n.md`
- ctx.lang — текущий язык
- ctx.t() — функция перевода
- YAML файлы переводов (*.lang.yml)
- Плюралы и формы слов
- Переключение языка
- Использование в Vue и API

### Модуль @sender (мессенджеры и чаты)
**Файл**: `012-sender.md`
- getChannels() — список каналов
- sendMessageToChat() — отправка сообщений
- findPersons() — поиск профилей
- Работа с Telegram, VK, Email
- Теги и сегментация
- Бакеты и стартовые параметры

### Конфигурация
**Файл**: `013-config.md`
- readWorkspaceFile() — чтение config.json
- updateWorkspaceFile() — запись config.json
- Типизированная конфигурация
- Валидация и безопасность

### WebSocket
**Файл**: `014-socket.md`
- sendDataToSocket() — отправка с сервера
- getOrCreateBrowserSocketClient() — подключение
- subscribeToData() — подписка на обновления
- Real-time прогресс и уведомления

### Уведомления администраторов
**Файл**: `015-notifications.md`
- sendNotificationToAccountOwners() — отправка уведомлений
- HTML, Markdown, Plain text форматы
- Уведомления о заявках и заказах

### ⭐ Аналитика: События workspace
**Файл**: `016-analytics-workspace.md`
- writeWorkspaceEvent() — запись событий приложения
- getWorkspaceEventUrl() — регистрация типов событий
- Хук @start/after-event-write — автоматическая обработка
- Клиентские события (window.clrtTrack, window.clrtUid)
- UTM метки и параметры
- Примеры: регистрация, формы, заявки, заказы
- **НОВОЕ**: Пагинация событий - `/api/events` POST endpoint
- Режимы: 'list' (пагинация) и 'poll' (real-time)
- Фиксация maxTimestamp для стабильной пагинации
- app.body() для POST, дедупликация только в poll режиме

### ⭐ Аналитика: События трафика (8 базовых + 13 расширенных)
**Файл**: `016-analytics-traffic.md`
- queryAi() — SQL запросы к ClickHouse
- ⚠️ HTTP/HTTPS события группируются по `action`, а не по URL
- События трафика из chatium_ai.access_log
- pageview — просмотры страниц
- Клики (button_click, link_click)
- Видео (video_play, video_pause, video_complete)
- E-commerce (add_to_cart, checkout, purchase)
- Метрики: DAU/MAU, Bounce Rate, Session Duration

### ⭐ Аналитика: GetCourse события (34 типа + 5 категорий)
**Файл**: `016-analytics-getcourse.md`
- gcQueryAi() — SQL запросы к GetCourse событиям
- EventDefinition — TypeScript типизация событий
- urlPattern — паттерны для LIKE фильтрации (event://getcourse/%)
- EVENT_CATEGORIES — гибкие категории для группировки
- dealCreated, dealPaid — заказы и оплаты
- user/created — регистрация пользователей
- user/chatbot/* — привязка мессенджеров
- ВАЖНО: resolved_user_id vs user_id
- SQL примеры: воронки, LTV, когорты

### ⭐ Аналитика: Подписки на события
**Файл**: `016-analytics-subscriptions.md`
- subscribeToMetricEvents() — подписка на события
- Хук metric-event — обработка (⚠️ не работает стабильно)
- Events Subscribe проект — рабочая реализация
- Heap таблица subscriptions
- WebSocket мониторинг через Job
- Real-time события в браузере

### ⭐ Аналитика: Атрибуция пользователей
**Файл**: `016-analytics-attribution.md`
- Связка анонимных uid с реальными user_id GetCourse
- First-touch и last-touch attribution
- Событие-мост: event://getcourse/form/sent
- Таблицы: AnalyticsUidMappings, AnalyticsSessionAttribution
- Флаги isFirst/isLast для оптимизации O(1)
- parseUrlParams() — парсинг utm-меток и промокодов
- processAttributionJob — автоматическая обработка
- API: POST /api/attribution

### ⚠️ Подписка на события GetCourse
**Файл**: `021-getcourse-events.md`
- ⚠️ **ТОЛЬКО для Chatium на стороне GetCourse**
- subscribeToMetricEvents() — подписка на metric-события
- app.accountHook('metric-event', ...) — общий хук для всех подписанных событий
- app.accountHook('metric-event-event://getcourse/...', ...) — хук для конкретного события
- app.pluginHook() — хуки в плагинах GetCourse Store
- transformGcEventParams() — нормализация событий
- Поддерживаемые события: lesson answers, conversation, deals, contacts, forms, surveys, chatbots
- Разница между event:// и metric-event-event://
- ⚠️ **ВАЖНО**: Не использовать без явной ссылки на инструкцию

### Платежи
**Файл**: `017-payments.md`
- runAttemptPayment() — создание платежа
- getSavedCards() — сохранённые карты
- attemptAutoCharge() — автосписание
- Подписки и реккурентные платежи
- Callback функции

### Стандарты кодирования
**Файл**: `001-standards.md`
- TailwindCSS 3.4.16
- FontAwesome 6.7.2
- Форматирование (2 пробела)
- Организация файлов
- Частые ошибки

---

## 📖 Дополнительная документация

### Внешние SDK и API (E-серия)

| Файл | Тема | Ключевые слова |
|------|------|----------------|
| **E01-gc-sdk.md** | GetCourse SDK | GetCourse, SDK, тренинги, уроки, пользователи, заказы, группы, баланс, методы API |
| **E02-gc-analytics-legacy.md** | ⚠️ GetCourse аналитика (старая) | УСТАРЕЛО! См. 016-analytics-getcourse.md |
| **E03-amocrm.md** | AmoCRM интеграция | AmoCRM, Kommo, CRM, OAuth, сделки, контакты, компании, воронки, неразобранное, вебхуки, задачи |
| **E04-notion.md** | Notion интеграция | Notion, страницы, базы данных, блоки, комментарии, вебхуки, Data Source, properties |

---

## 🎯 Типичные задачи

### Создать новую страницу
1. Изучите `002-routing.md` → "Чек-лист создания новой страницы"
2. Изучите `007-vue.md` → "Создание Vue компонента"
3. Изучите `007-vue.md` → "🚨 КРИТИЧЕСКОЕ ПРАВИЛО: Клиент vs Сервер"
4. Изучите `006-arch.md` → "Организация файлов"

### Создать API endpoint
1. Изучите `002-routing.md` → "Чек-лист создания API роута"
2. Изучите `003-auth.md` → "Проверка авторизации в API"
3. Изучите `006-arch.md` → "API роуты в /api/"
4. Изучите `008-heap.md` → "CRUD операции" (если работаете с БД)

### Загрузить данные в Vue компоненте
1. Изучите `007-vue.md` → "🚨 КРИТИЧЕСКОЕ ПРАВИЛО: Клиент vs Сервер"
2. Изучите `007-vue.md` → "Загрузка данных (ПРАВИЛЬНЫЕ ПАТТЕРНЫ)"
3. Изучите `007-vue.md` → "Рендеринг на сервере (SSR)"
4. **ВАЖНО**: Heap таблицы НЕ работают на клиенте - используйте SSR или fetch()

### Сделать запрос к внешнему API
1. Изучите `004-request.md` → "Базовое использование"
2. Изучите `004-request.md` → "Обработка ошибок"

### Запланировать задачу
1. Изучите `005-jobs.md` → "Определение задачи"
2. Изучите `005-jobs.md` → "Планирование выполнения"

### Защитить страницу авторизацией
1. Изучите `003-auth.md` → "Методы авторизации"
2. Изучите `002-routing.md` → "Использование в роутах"

### Работать с базой данных
1. Изучите `008-heap.md` → "Создание таблицы" (JSON-таблицы)
2. Изучите `022-getcourse-heap.md` → "Базовый синтаксис Heap.Table()" (TypeScript API)
3. Изучите `008-heap.md` → "CRUD операции"
4. Изучите `008-heap.md` → "Фильтрация и поиск"
5. ⚠️ **ВАЖНО**: Изучите `008-heap.md` → "Предотвращение race condition" — при работе с параллельными запросами используйте `runWithExclusiveLock`

### Загрузить и сохранить файлы
1. Изучите `009-files.md` → "Загрузка файлов с клиента"
2. Изучите `009-files.md` → "Хранение файлов в таблицах"
3. Изучите `008-heap.md` → "Типы файлов в Heap"

### Работать с GetCourse
1. Изучите `E01-gc-sdk.md` → "GetCourse SDK методы"
2. Изучите `016-analytics-getcourse.md` → "Аналитика и события"
3. Изучите `016-analytics-getcourse.md` → "SQL запросы и gcQueryAi"

### Интегрировать AmoCRM
1. Изучите `E03-amocrm.md` → "Авторизация OAuth 2.0"
2. Изучите `E03-amocrm.md` → "Сделки и контакты"
3. Изучите `E03-amocrm.md` → "Вебхуки и неразобранное"
4. Изучите `004-request.md` → "@app/request для API запросов"

### Интегрировать Notion
1. Изучите `E04-notion.md` → "Авторизация и токены"
2. Изучите `E04-notion.md` → "Страницы и базы данных"
3. Изучите `E04-notion.md` → "Блоки и контент"
4. Изучите `E04-notion.md` → "Вебхуки"

### Создать AI-агента
1. Изучите `010-agents.md` → "Быстрый старт: Telegram агент"
2. Изучите `010-agents.md` → "Создание агента"
3. Изучите `010-agents.md` → "Создание инструментов"
4. Изучите `010-agents.md` → "Отправка сообщений"

### Добавить мультиязычность
1. Изучите `011-i18n.md` → "Создание YAML файлов"
2. Изучите `011-i18n.md` → "Использование ctx.t()"
3. Изучите `011-i18n.md` → "Плюралы и формы слов"
4. Изучите `011-i18n.md` → "Переключение языка"

### Отправить сообщение в мессенджер
1. Изучите `012-sender.md` → "Работа с каналами"
2. Изучите `012-sender.md` → "Отправка сообщений"
3. Изучите `012-sender.md` → "Подписка на обновления"

### Добавить real-time обновления
1. Изучите `014-socket.md` → "Серверная часть"
2. Изучите `014-socket.md` → "Клиентская часть"
3. Изучите `014-socket.md` → "Практические примеры"

### Принять платёж
1. Изучите `017-payments.md` → "Создание платежа"
2. Изучите `017-payments.md` → "Callback функции"
3. Изучите `017-payments.md` → "Обработка ошибок"

### Настроить автосписание
1. Изучите `017-payments.md` → "Работа с сохранёнными картами"
2. Изучите `017-payments.md` → "Реккурентные платежи"
3. Изучите `005-jobs.md` → "Планирование выполнения"

### Записать событие workspace
1. Изучите `016-analytics-workspace.md` → "Запись событий"
2. Изучите `016-analytics-workspace.md` → "Регистрация типов событий"
3. Изучите `016-analytics-workspace.md` → "Хук @start/after-event-write"

### Анализировать трафик
1. Изучите `016-analytics-traffic.md` → "Выполнение запросов queryAi"
2. Изучите `016-analytics-traffic.md` → "Типы событий трафика"
3. Изучите `016-analytics-traffic.md` → "SQL примеры запросов"

### Анализировать GetCourse
1. Изучите `016-analytics-getcourse.md` → "Выполнение запросов gcQueryAi"
2. Изучите `016-analytics-getcourse.md` → "События GetCourse"
3. Изучите `016-analytics-getcourse.md` → "resolved_user_id vs user_id"

### Подписаться на события GetCourse (⚠️ ТОЛЬКО Chatium на стороне GetCourse)
1. Изучите `021-getcourse-events.md` → "Подписка на metric-события"
2. Изучите `021-getcourse-events.md` → "Типы хуков и когда что использовать"
3. Изучите `021-getcourse-events.md` → "Прямые событийные хуки"
4. Изучите `021-getcourse-events.md` → "Рекомендуемый паттерн интеграции"
5. ⚠️ **ВАЖНО**: Используйте только при явной ссылке на инструкцию

### Подписаться на события (общая аналитика)
1. Изучите `016-analytics-subscriptions.md` → "subscribeToMetricEvents"
2. Изучите `016-analytics-subscriptions.md` → "Events Subscribe проект"
3. Изучите `016-analytics-subscriptions.md` → "WebSocket мониторинг"

### Связать анонимных пользователей с GetCourse
1. Изучите `016-analytics-attribution.md` → "Цепочка событий"
2. Изучите `016-analytics-attribution.md` → "Архитектура: две таблицы"
3. Изучите `016-analytics-attribution.md` → "API для получения параметров"
4. Изучите `016-analytics-attribution.md` → "Примеры использования"

### Создать пагинацию для событий
1. Изучите `016-analytics-workspace.md` → "Чтение событий с пагинацией"
2. Изучите `016-analytics-workspace.md` → "Единый API endpoint /api/events"
3. Изучите `016-analytics-workspace.md` → "Важные детали реализации"
4. Изучите `016-analytics-workspace.md` → "Типичные ошибки и решения"

### ⚠️ Создать unit тесты для проекта
1. Изучите `020-testing.md` → "Создание системы тестирования"
2. Изучите `020-testing.md` → "Единый источник истины"
3. Изучите `020-testing.md` → "Тесты API (внутренние и HTTP)"
4. Изучите `020-testing.md` → "Unit-AI: Автоматическое тестирование"
5. Изучите `020-testing.md` → "Требования к покрытию"
6. **ВАЖНО**: Создайте папку `/tests/` с `/tests` и `/tests/ai` для каждого проекта

---

## ⚡ Ключевые слова для поиска

### Роутинг
`app.get`, `app.post`, `app.html`, `route.url()`, `ctx`, `req`, `params`, `query`, `body`, `file-based`, `тильда`, `слеш`, `:id`, `/:slug`

### Авторизация
`requireAccountRole`, `requireRealUser`, `requireAnyUser`, `ctx.user`, `Admin`, `Staff`, `User`, `роли`, `права`

### HTTP клиент
`request`, `@app/request`, `GET`, `POST`, `headers`, `Authorization`, `Bearer`, `responseType`, `throwHttpErrors`

### Задачи
`app.job`, `scheduleJobAfter`, `scheduleJobAsap`, `scheduleJobAt`, `cancelScheduledJob`, `minutes`, `hours`, `days`

### Архитектура
`структура`, `/api/`, `/pages/`, `/tables/`, `index.tsx`, `// @shared`, `// @shared-route`, `именование`

### Vue
`<script setup>`, `ref`, `reactive`, `computed`, `onMounted`, `ctx`, `route.url()`, `SSR`, `fetch()`, `клиент vs сервер`, `Heap таблицы`, `props`, `initialData`, `tsconfig.json`, `extends`, `jsx preserve`, `Module '"vue"' has no exported member`

### База данных
`Heap.Table`, `create`, `findAll`, `findById`, `update`, `delete`, `createOrUpdateBy`, `countBy`, `searchBy`, `Money`, `RefLink`, `where`, `order`, `Heap.String`, `Heap.Number`, `Heap.Boolean`, `Heap.DateTime`, `Heap.Optional`, `Heap.Any`, `customMeta`, `searchable`, `embeddings`, `defaultValue`, `типизация`, `TypeScript таблицы`, `runWithExclusiveLock`, `race condition`, `блокировка`, `параллельные запросы`, `атомарность`

### Файлы
`obtainStorageFilePutUrl`, `getThumbnailUrl`, `getVideoInfo`, `hash`, `upload`, `FormData`, `ImageFile`, `VideoFile`

### GetCourse SDK
`getAvailableTrainings`, `getUserTrainings`, `getDealInfo`, `createDeal`, `updateUserFields`, `addUserToGroup`, `getBalance`, `isUserInSegment`

### GetCourse Аналитика
`gcQueryAi`, `ClickHouse`, `access_log`, `dealCreated`, `dealPaid`, `user/created`, `resolved_user_id`, `SQL`, `события`, `30 типов`, `воронки`, `LTV`, `когорты`

### Traffic Аналитика
`queryAi`, `@traffic/sdk`, `pageview`, `button_click`, `video_play`, `scroll`, `add_to_cart`, `purchase`, `DAU`, `MAU`, `bounce rate`, `21 тип`

### Подписки на события
`subscribeToMetricEvents`, `unsubscribeFromMetricEvents`, `metric-event`, `Heap подписки`, `WebSocket`, `sendDataToSocket`, `real-time`, `Events Subscribe`, `мониторинг`

### Подписка на события GetCourse (⚠️ ТОЛЬКО Chatium на стороне GetCourse)
`subscribeToMetricEvents`, `app.accountHook`, `app.pluginHook`, `metric-event-event://getcourse`, `event://getcourse`, `transformGcEventParams`, `lesson answers`, `conversation/addedMessage`, `dealCreated`, `dealPaid`, `contact/created`, `form/sent`, `survey/answerCreated`, `chatbot/vk_enabled`, `chatbot/telegram_enabled`, `LessonAnswerEvent`, `ConversationAddedMessageEvent`, `realtime события GetCourse`, `⚠️ ТОЛЬКО Chatium на стороне GetCourse`

### Атрибуция пользователей
`атрибуция`, `uid`, `user_id`, `маппинг`, `first-touch`, `last-touch`, `attribution`, `form/sent`, `session_id`, `AnalyticsUidMappings`, `AnalyticsSessionAttribution`, `parseUrlParams`, `utm_source`, `utm_campaign`, `промокоды`, `GetCourse регистрация`, `isFirst`, `isLast`, `gcQueryAi`

### AmoCRM
`AmoCRM`, `OAuth 2.0`, `leads`, `contacts`, `companies`, `pipelines`, `unsorted`, `webhooks`, `tasks`, `access_token`, `refresh_token`

### Notion
`Notion`, `Page`, `Block`, `Database`, `Data Source`, `properties`, `rich_text`, `query`, `filter`, `comments`, `webhooks`

### AI-агенты
`AI`, `агенты`, `боты`, `getOrCreateAgentForWorkspace`, `pushMessageToChain`, `startCompletion`, `tools`, `инструменты`, `chainKey`, `wakeAgent`, `Telegram`

### Интернационализация
`i18n`, `переводы`, `ctx.t()`, `ctx.lang`, `мультиязычность`, `lang.yml`, `YAML`, `плюралы`, `формы слов`, `language`, `локализация`

### Модуль @sender
`мессенджеры`, `чаты`, `Telegram`, `VK`, `Email`, `sendMessageToChat`, `findPersons`, `getChannels`, `Person`, `теги`, `бакеты`, `runTelegramApi`, `sendMessageToUser`

### Конфигурация
`config.json`, `readWorkspaceFile`, `updateWorkspaceFile`, `настройки`, `конфигурация`, `settings`

### WebSocket
`WebSocket`, `real-time`, `socket`, `sendDataToSocket`, `getOrCreateBrowserSocketClient`, `subscribeToData`, `обновления`, `прогресс`, `live`

### Уведомления
`уведомления`, `sendNotificationToAccountOwners`, `@user-notifier/sdk`, `админы`, `HTML`, `Markdown`, `заявки`

### Аналитика workspace
`аналитика`, `события workspace`, `writeWorkspaceEvent`, `getWorkspaceEventUrl`, `@start/after-event-write`, `UTM метки`, `clrtTrack`, `clrtUid`, `tracking`, `метрики`, `пагинация`, `pagination`, `/api/events`, `mode='list'`, `mode='poll'`, `maxTimestamp`, `OFFSET`, `дедупликация`, `deduplicateEvents`

### Платежи
`платежи`, `runAttemptPayment`, `attemptAutoCharge`, `getSavedCards`, `@pay/sdk`, `подписки`, `автосписание`, `реккурентные`, `чек`, `items`

### Стандарты кодирования
`стандарты`, `TailwindCSS`, `FontAwesome`, `форматирование`, `best practices`, `JSX`, `TypeScript`, `стили`

---

## 🚀 Быстрый старт

### Для начинающих
1. **Стандарты**: Начните с `001-standards.md` для понимания подхода
2. **Роутинг**: Прочитайте `002-routing.md` для создания страниц и API
3. **Vue компоненты**: Изучите `007-vue.md` для работы с интерфейсом
4. **Безопасность**: Ознакомьтесь с `003-auth.md` для защиты роутов

### Для интеграций
- **GetCourse**: `E01-gc-sdk.md` + `E02-gc-analytics.md`
- **AmoCRM**: `E03-amocrm.md`
- **Notion**: `E04-notion.md`

---

## 📝 Важные замечания

- ✅ Используйте `ctx.account.log()` вместо `console.log()`
- ✅ Всегда импортируйте методы авторизации из `@app/auth`
- ✅ Используйте `route.url()` вместо хардкода путей
- ✅ Следуйте file-based архитектуре (/ для папок, ~ для явных путей)
- ✅ Один файл = один основной роут
- ✅ Храните Vue компоненты в `/pages/`
- ✅ Храните API роуты в `/api/`
- 🚨 **КРИТИЧЕСКИ ВАЖНО**: В Vue компонентах (клиент) **НЕЛЬЗЯ** импортировать Heap таблицы и использовать `.run()` - нет ctx!
- 🚨 **КРИТИЧЕСКИ ВАЖНО**: Используйте SSR (загрузка данных на сервере → props) или `fetch()` для HTTP запросов на клиенте
- 🚨 **КРИТИЧЕСКИ ВАЖНО**: Heap таблицы и API `.run()` доступны **ТОЛЬКО НА СЕРВЕРЕ** (.tsx файлы)
- ❌ **НИКОГДА**: Не используйте `alert()` для отображения результатов операций - создавайте UI компоненты для уведомлений (success/error сообщения)
- ⚠️ `confirm()` допустим только для простых подтверждений действий (удаление, сброс)
- ⚠️ **ОБЯЗАТЕЛЬНО**: Создавайте папку `/tests/` с `/tests` и `/tests/ai` для каждого проекта
- ⚠️ **ОБЯЗАТЕЛЬНО**: Тестируйте API двумя способами: `route.run()` и HTTP `request()`
- ⚠️ **ОБЯЗАТЕЛЬНО**: Поддерживайте покрытие тестами минимум 80%
- ⚠️ **ОБЯЗАТЕЛЬНО**: Обновляйте тесты при каждом изменении кода
- ⚠️ **Vue модули**: Требуют локальный `tsconfig.json` с `"extends": "путь/к/корню/tsconfig.json"` — при переносе модуля обновите путь (см. `007-vue.md`)
- ⚠️ **Race condition**: При работе с БД следите за возможностью race condition при параллельных запросах. Если между `findOneBy` и `createOrUpdateBy` может произойти другой запрос — используйте `runWithExclusiveLock` из `@app/sync` (см. `008-heap.md` → "Предотвращение race condition")

## 🔄 История миграции документации

Все устаревшие файлы были **удалены** и заменены структурированной документацией:

**Базовая документация** (✅ удалена):
- ~~000-Index.md~~ → Вся информация распределена по специализированным файлам 001-018

**GetCourse** (✅ удалены):
- ~~001-gc-analytics.md~~ → **E02-gc-analytics.md**
- ~~010-GetcourseAnalytics.md~~ → **E02-gc-analytics.md**
- ~~014-Traffic.md~~ → **E02-gc-analytics.md**

**AmoCRM** (✅ удалены):
- Документы по тегу `amocrm` → **E03-amocrm.md**

**Notion** (✅ удалены):
- ~~notion-api.md~~ → **E04-notion.md**
- ~~notion-about.md~~ → **E04-notion.md**

**AI-агенты** (✅ удалены):
- ~~003-SimleAgentTelegram.md~~ → **010-agents.md**
- ~~004-AgentProcess.md~~ → **010-agents.md**
- ~~005-AiGeneration.md~~ → **010-agents.md**
- ~~006-AiGenerationTool.md~~ → **010-agents.md**
- ~~018-CreateAgent.md~~ → **010-agents.md**

**Jobs и файлы** (✅ удалены):
- ~~011-Jobs.md~~ → **005-jobs.md**
- ~~008-FilestorageUpload.md~~ → **009-files.md**
- ~~009-GetcourseFormScript.md~~ → **007-vue.md** (раздел "Интеграция внешних скриптов")

**Интернационализация** (✅ удалена):
- ~~019-i18n.md~~ → **011-i18n.md**

**Sender и мессенджеры** (✅ удалены):
- ~~012-SenderUserByTelegramUsername.md~~ → **012-sender.md**
- ~~017-SenderFullDocs.md~~ → **012-sender.md**

**Видео** (✅ удалены):
- ~~015-Videoplayer.md~~ → **009-files.md** (раздел "Встраивание видеоплеера")
- ~~016-kinescope.md~~ → **009-files.md** (раздел "Интеграция Kinescope")

**Конфигурация** (✅ удалена):
- ~~007-Config.md~~ → **013-config.md**

**WebSocket** (✅ удален):
- ~~013-Socket.md~~ → **014-socket.md**

**Итого удалено**: 27 устаревших файлов (включая 000-Index.md)  
**Создано**: 21 файл (001-017 + E01-E04)  
**Обновлено**: Аналитика разделена на 4 специализированных файла (016-analytics-*)

Все файлы являются **единственными источниками истины** для своих тем.

---

**Версия**: 3.3  
**Дата**: 2025-11-13  
**Последнее обновление**: Добавлено критическое правило в 007-vue.md про разделение клиент/сервер: запрет на использование Heap таблиц и `.run()` в Vue компонентах

