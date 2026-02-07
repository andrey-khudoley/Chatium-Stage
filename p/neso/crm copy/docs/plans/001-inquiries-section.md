# План разработки раздела «Обращения» (NeSo CRM)

План адаптирован под стек Chatium: file-based роутинг, слои API → lib → repos → Heap, Vue 3 (Composition API), TailwindCSS, FontAwesome. Ссылки на документацию: **000-summ.md**, **001-standards.md**, **002-routing.md**, **003-auth.md**, **004-request.md**, **006-arch.md**, **007-vue.md**, **008-heap.md**, **012-sender.md**, **013-config.md**, **014-socket.md**.

---

## 1. Каркас архитектуры (шаг 0, до фич)

### 1.1 Соответствие слоёв стеку проекта

| Идея плана   | В NeSo CRM (006-arch, 001-standards) |
|-------------|--------------------------------------|
| **domain**  | Типы и нормализация — `shared/` (типы, константы). Правила, валидация, вычисления — `lib/modules/inquiry/`. |
| **data**    | `repos/inquiry.repo.ts` — работа с Heap (CRUD). `api/inquiries/*` — эндпоинты (один файл — один роут, путь `'/'`). Данные с клиента — только через `route.run()` или `fetch()`, Heap только на сервере (007-vue). |
| **ui**      | Роут `web/inquiries/index.tsx`, страница `pages/InquiriesPage.vue`, компоненты в `pages/inquiries/` или `components/` (3 панели, списки, композер). Состояния: loading / empty / error через локальный state (ref/reactive) или composable. |

Отдельного «store» слоя нет: состояние держится в composable (например `useInquiryState`) или в странице и дочерних компонентах (ref/reactive, без Redux).

### 1.2 Рекомендуемая структура каталогов

```
p/neso/crm/
├── config/
│   └── routes.tsx                    # ROUTES.inquiries, withProjectRoot — уже есть
├── web/
│   └── inquiries/
│       └── index.tsx                 # Роут страницы обращений (SSR, передача initialData при необходимости)
├── pages/
│   ├── InquiriesPage.vue             # Корневая страница раздела
│   └── inquiries/                    # Опционально: панели как страницы или крупные компоненты
│       ├── InquiriesLayoutThreePanel.vue
│       ├── InquiryListPanel.vue
│       ├── InquiryThreadPanel.vue
│       └── InquiryDetailsPanel.vue
├── components/                       # Переиспользуемые: бейджи, скелеты, пустые состояния
│   ├── InquiryListItem.vue
│   ├── MessageList.vue
│   ├── MessageItem.vue
│   ├── MessageComposer.vue
│   └── shared/                       # Бейджи, табы, скелеты, empty states
│       ├── UnreadBadge.vue
│       ├── InquiryStatusBadge.vue
│       └── PanelSkeleton.vue
├── api/
│   └── inquiries/
│       ├── list.ts                   # GET список (cursor, limit, filters)
│       ├── get.ts                    # GET одно обращение по id
│       ├── thread.ts                 # GET сообщения треда (id, cursor, direction)
│       ├── sendMessage.ts            # POST отправка сообщения
│       ├── markRead.ts               # POST отметка прочитано (P1)
│       └── actions.ts                # POST взять/передать/закрыть (P1)
├── lib/
│   └── modules/
│       └── inquiry/
│           ├── inquiry.lib.ts        # Нормализация, валидация, правила «прочитано»
│           ├── inquiryNormalize.ts   # normalizeInquiry, normalizeInquiryList, normalizeMessage
│           ├── inquiryCompute.ts    # getLastActivityAt, sortByLastActivity, groupMessages
│           └── salebotClient.ts      # Клиент Salebot API (004-request): get_history, message; ключ из 013-config
├── repos/
│   └── inquiry.repo.ts               # CRUD и запросы к Heap (только вызовы таблиц)
├── tables/
│   ├── clients.table.ts              # Клиенты (имя, телефон, email, ответственный, источник, теги)
│   ├── inquiries.table.ts            # Схема обращений (client — RefLink на clients)
│   └── inquiryMessages.table.ts      # Схема сообщений (inquiry — RefLink на inquiries)
├── shared/
│   └── inquiry/
│       └── types.ts                  # Типы Inquiry, Message, фильтры (если нужны на клиенте)
└── docs/
    └── plans/
        └── 001-inquiries-section.md  # Этот план
```

Именование (001-standards, 006-arch): файлы роутов и API — camelCase; Vue — PascalCase; таблицы — `*.table.ts`, импорт без `.ts`; константы роутов — суффикс `Route`. Не хардкодить URL: только `route.url()` и `withProjectRoot()` / `getFullUrl()` из `config/routes.tsx`.

### 1.3 Источник сообщений и каналы коммуникации

**Логика поступления и обновления сообщений:**

- Сообщения приходят из Telegram по вебхуку на внешний сервис **Salebot**. Salebot имеет собственный внешний API ([документация](https://docs.salebot.pro/rabota-s-api/api-konstruktora)).
- Запросы к Salebot выполняются по URL вида `https://chatter.salebot.pro/api/{api_key}/{action}` (POST/GET). API-ключ выдаётся в настройках проекта Salebot и используется для всех операций: получение истории сообщений (`get_history`), отправка сообщения клиенту (`message`), запуск бота (`callback`), работа с клиентами и переменными и др.
- **В этом проекте (NeSo CRM):** API-ключ Salebot настраивается **один раз** в настройках workspace (например, через **013-config**: `readWorkspaceFile` / `updateWorkspaceFile` или отдельный экран настроек раздела «Обращения»). Этот ключ используется для реализации всех функций раздела «Обращения» (общение): запрос истории, отправка сообщений, при необходимости — синхронизация клиентов/обращений с Salebot.
- **Расширяемость:** Текущая реализация — только канал через провайдера Salebot. Архитектуру нужно заложить так, чтобы в будущем можно было добавить другие каналы: прямой Telegram-бот, WhatsApp через других провайдеров, телефония с расшифровкой звонков в чат и т.д. (например, абстракция «провайдер канала» или маппинг `channel → provider`, единый слой отправки/получения в lib). На данном этапе реализуется **только Salebot**.
- **Первое обращение / первое входящее сообщение:** При первом входящем сообщении от клиента или при первом запросе со стороны сотрудника (открытие диалога) необходимо выполнить запрос к Salebot (например, `get_history` по `client_id`), подтянуть историю сообщений и **сохранить её на стороне этого сервиса** (Heap: таблицы `inquiries` / `inquiryMessages`). Дальнейшая работа в разделе «Обращения» идёт с локальными данными; синхронизация с Salebot — по правилам (при новом сообщении из вебхука — обновление/добавление в Heap; исходящие — отправка через Salebot API и запись в Heap). Детали вебхука от Salebot в этот проект (если будет приём событий сюда) и момент вызова `get_history` уточняются при реализации (например, джоба или вызов при первом открытии треда).

---

## 2. P0: минимально рабочий «диалоговый» MVP

### 2.1 Domain: модель данных и правила (P0)

**Компонент:** логика в `lib/modules/inquiry/` + типы в `shared/inquiry/types.ts`.

- **Таблица клиентов:** в проекте есть **tables/clients.table.ts** (name, phone, email, assignee, source, tags). Обращения ссылаются на клиента через поле client (RefLink на clients). См. п. 6.1, docs/data.md.
- **Единый тип обращения (Inquiry):** client (RefLink на клиента), channel, channelExternalId (id в канале, например Salebot client_id), status, unread, assignee, tags, messages, comments, deals, tasks (поля уточняются по схеме Heap). См. п. 1.3, 6.1.
- **Нормализация:**
  - `normalizeInquiry(apiDto) → Inquiry` — дефолты для пустых/битых значений, мягкое приведение типов (строка/число/null).
  - `normalizeInquiryList(dtos)`, `normalizeMessage(dto)` в `inquiryNormalize.ts`.
- **Валидация:** `validateInquiry(inquiry) → { ok, errors[] }` в lib (обязательные поля, минимальные инварианты). По необходимости использовать `@app/validation` (Zod) или `.body()` в API (001-standards).
- **Доменные вычисления** в `inquiryCompute.ts`:
  - `getLastActivityAt(inquiry)`
  - `sortByLastActivity(list)`
  - `groupMessages(messages)` — по дате/пакетам одного автора.

API и роуты вызывают lib; lib вызывает только repos (006-arch).

### 2.2 Data: репозиторий и API (P0)

- **repos/inquiry.repo.ts:** только работа с Heap (findAll, findById, create, update, запросы сообщений). Без бизнес-правил.
- **api/inquiries/list.ts:** GET, query: cursor, limit, filters. Проверка прав (003-auth): `requireRealUser` или `requireAccountRole`. Вызов lib для нормализации/сортировки при необходимости; lib вызывает repo.
- **api/inquiries/get.ts:** GET по id (одно обращение).
- **api/inquiries/thread.ts:** GET сообщения треда (id, cursor, direction). При первом запросе треда без локальной истории — вызов Salebot API (get_history), сохранение в Heap, затем отдача из Heap (см. п. 1.3).
- **api/inquiries/sendMessage.ts:** POST, body валидация через `.body()` или Zod. Отправка через Salebot API (ключ из настроек, 013-config), запись сообщения в Heap. См. п. 1.3 (каналы коммуникации).

Политика обновления на клиенте: загрузка по открытию, ручной refresh; при обновлении списка сохранять выбранный `selectedInquiryId`, если элемент ещё есть в списке. Кэш/дедупликация — на клиенте (composable или простая map по id), отмена устаревших запросов по необходимости (AbortController).

### 2.3 Состояние UI (P0): выбор обращения и 3 панели

Без отдельного store-слоя: composable `useInquiryState` (или состояние в `InquiriesPage.vue`):

- **Состояние:**  
  `selectedInquiryId`, `list: { items, cursor, hasMore, loading, error }`, `thread: { byId, loadingById, errorById }`, `ui: { viewportMode: desktop|tablet|mobile, panel: list|thread|details }`, `draftsByInquiryId`, `scrollStateByInquiryId` (якоря для скролла).
- **Действия:**  
  `selectInquiry(id)`, `loadList(nextCursor?)`, `refreshList()`, `loadThread(id, direction?)`, `setViewportMode(mode)` с правилами переключения панелей.
- **Гарантии:** при обновлении списка не сбрасывать `selectedInquiryId`, если запись есть; стабильный скролл при догрузке истории (якорь после вставки старых сообщений).

Данные с сервера — только через вызовы API (fetch или `route.run()`), см. 007-vue.

### 2.4 UI: основные компоненты P0

- **InquiriesPage.vue:** инициализация состояния (composable), загрузка первого экрана, при необходимости связь с URL (`?id=...` через `route.url()` и query). Обработка глобальных ошибок и пустых состояний раздела.
- **InquiriesLayoutThreePanel.vue:** сетка из 3 панелей (list / thread / details). Адаптив: desktop — три колонки; tablet — list + thread, details как drawer/slide-over; mobile — одна панель, переключение list ↔ thread ↔ details. Сохранение ширин/ресайз — по дизайну.
- **InquiryListPanel:** шапка (поиск + фильтры-табы — в P0 можно заглушки), список без виртуализации, «загрузить ещё» или infinite scroll, сохранение выделения и скролла списка.
- **InquiryListToolbar:** SearchInput (в P0 без debounce), FilterTabs (заглушка при необходимости), SortIndicator при наличии.
- **InquiryList:** рендер элементов; состояния skeleton / empty / error + retry.
- **InquiryListItem:** аватар/инициалы, имя/ID, превью последнего сообщения, канал, статус, unread badge; по клику — `selectInquiry(id)`.
- **InquiryThreadPanel:** заголовок треда (клиент, id, канал, статусы), MessageList, снизу MessageComposer.
- **ThreadHeader:** клиент, #inq-..., канал, плашки статуса/приоритета.
- **MessageList:** входящие/исходящие/системные; группировка по дням (и при необходимости по «пакетам» одного автора); догрузка вверх с сохранением якоря скролла.
- **MessageItem:** тип (incoming | outgoing | system), состояние (sending | sent | failed), таймстемпы и мета.
- **MessageComposer:** поле ввода (multiline), trim и запрет пустого, лимит длины при необходимости, отправка по кнопке и Ctrl+Enter; disabled при пустом или во время отправки; черновики в `draftsByInquiryId[id]`.
- **Отправка (SendMessageController / хук):** optimistic update (tempMessageId, sending), при ошибке — failed + retry; при ответе сервера — маппинг temp → real id.

Стили: TailwindCSS 3.4.16, иконки FontAwesome 6.7.2 (001-standards). Логирование — `ctx.account.log()`, не `console.log`.

---

## 3. Каталог UI-компонентов (ответственности)

### A) Страница и компоновка

| Компонент | Ответственность |
|-----------|-----------------|
| **InquiriesPage** | Инициализация состояния, первая загрузка, опционально `?id=`, глобальные ошибки/пустые состояния. |
| **InquiriesLayoutThreePanel** | Сетка 3 панелей, адаптив (desktop/tablet/mobile), ширина/ресайз по дизайну. |

### B) Левая панель — список обращений

| Компонент | Ответственность |
|-----------|-----------------|
| **InquiryListPanel** | Шапка (поиск + табы), список, пагинация, сохранение выделения и скролла. |
| **InquiryListToolbar** | SearchInput, FilterTabs (P1 — счётчики), SortIndicator. |
| **InquiryList** | Рендер списка; skeleton / empty / error + retry. |
| **InquiryListItem** | Карточка: аватар, имя/ID, превью, канал, статус, unread; клик → selectInquiry. |

### C) Центральная панель — тред

| Компонент | Ответственность |
|-----------|-----------------|
| **InquiryThreadPanel** | Заголовок треда, MessageList, MessageComposer. |
| **ThreadHeader** | Клиент, #inq-..., канал, статусы. |
| **MessageList** | Группировка по дням/пакетам, догрузка вверх, якорь скролла. |
| **MessageItem** | Тип, состояние, время, мета. |

### D) Отправка сообщения

| Компонент | Ответственность |
|-----------|-----------------|
| **MessageComposer** | Ввод, валидация, черновики, отправка; SendMessageController — optimistic, retry, маппинг temp → real id. |

### E) Правая панель — детали (каркас в P0, наполнение в P1)

| Компонент | Ответственность |
|-----------|-----------------|
| **InquiryDetailsPanel** | Вкладки: Client | Comments | Deals | Tasks; пустые состояния; зона действий сверху при наличии. |
| **ClientTab** | Атрибуты клиента (телефон, email, ответственный, источник, теги); read-only в P1. |
| **CommentsTab, DealsTab, TasksTab** | Списки сущностей, empty state, кнопки создания/привязки при наличии. |

---

## 4. P1: поиск, фильтры, статусы, действия, права

### 4.1 Поиск и фильтры списка (P1)

- **InquiryListToolbar:** debounced search, комбинация фильтров (табы + поиск + «Мои»), счётчики по фильтрам (API или вычисление).
- В состоянии: `filters: { tab, query, mine }`, `setFilters(partial)`, сброс cursor и `refreshList()`.

### 4.2 Статусы и unread (P1)

- **UnreadBadge, InquiryStatusBadge** — переиспользуемые компоненты.
- Правило «прочитано при открытии треда»: при открытии треда (вызов `loadThread(id)` / показ центральной панели с тредом) вызывать `markRead(id)` (локально сразу, затем API `api/inquiries/markRead.ts`). Список и тред — один источник правды (состояние в composable/странице).

### 4.3 Правая карточка деталей (P1)

- Реальные данные клиента; при необходимости редактирование: EditableField, валидация, optimistic update; пустые состояния вкладок.

### 4.4 Действия по обращению/клиенту (P1)

- **InquiryActionBar:** взять, передать, закрыть, смена статуса. Проверки прав — скрыть или disabled + tooltip. Подтверждения для критичных (ConfirmDialog). Optimistic update, откат при ошибке, точечный рефреш списка/деталей.
- API: `api/inquiries/actions.ts` с проверкой прав (003-auth: `requireAccountRole`, `requireRealUser`). Защита на сервере обязательна; UI только скрывает/блокирует.

### 4.5 Роли и права (P1)

- В lib: `canViewInquiry(user, inquiry)`, `can(action, context)` (или отдельный модуль прав). В API — вызов этих проверок перед действиями.
- На клиенте: AccessGuard или условный рендер с fallback «Нет доступа».

---

## 5. P2: real-time, надёжность, производительность, логи, тесты

### 5.1 Real-time (P2)

- **014-socket:** `sendDataToSocket` (сервер), `getOrCreateBrowserSocketClient` + `subscribeToData` (клиент). Подписка на события: `message:new`, `inquiry:updated` (status, assignee, unread). При открытом треде — добавление сообщения вниз; при другом треде — увеличение unread и обновление порядка по активности; in-app уведомления и счётчики.

### 5.2 Надёжность и производительность (P2)

- Отдельные состояния loading/empty/error по панелям (PanelStateKit).
- Виртуализация: VirtualizedInquiryList, при длинных тредах — VirtualizedMessageList.
- Кэш: опционально prefetch при hover; ограничение числа хранимых тредов (LRU). Контроль длинных слов/кода в сообщениях (перенос, overflow).

### 5.3 Логи, мониторинг, аудит (P2)

- Клиент: обработка ошибок API и рендера, при необходимости отправка в лог (без `console.log` — через принятый в проекте механизм).
- Сервер: аудит действий (кто закрыл/передал, когда, параметры) — запись в таблицу или через существующий логгер. Метрики: first response time, SLA, нагрузки на оператора — по возможностям платформы.

### 5.4 Тестирование (P2)

- **020-testing:** unit-тесты для нормализации/валидации, правил unread/read, группировки сообщений; интеграционные сценарии: list → select → thread → details, отправка с optimistic и retry; e2e (адаптив, ключевые действия, появление сообщения по real-time). Расположение тестов и запуск — по правилам проекта (`/web/tests`, `/api/tests/run-tests` и т.д.).

---

## 6. Порядок реализации

Ниже — пошаговая последовательность: что делать первым, вторым и далее. Каждый шаг опирается на предыдущие.

### 6.1 Шаг 1: таблицы Heap (данные)

- Создать **tables/clients.table.ts** — справочник клиентов: name, phone, email, assignee, source, tags (для правой панели ClientTab и связи с обращениями).
- Создать **tables/inquiries.table.ts** — схема обращений: client (**RefLink** на таблицу clients), channel, **channelExternalId** (идентификатор в канале, например Salebot `client_id`), status, unread, assignee, tags и прочие поля по доменной модели.
- Создать **tables/inquiryMessages.table.ts** — схема сообщений: inquiry (**RefLink** на inquiries), автор, текст, время, тип (входящее/исходящее/системное), состояние отправки при необходимости.
- Убедиться, что таблицы зарегистрированы и доступны (008-heap). Без этого следующий шаг невозможен.

### 6.2 Шаг 2: репозиторий (доступ к данным)

- Создать **repos/inquiry.repo.ts**: только работа с Heap — findAll (список с cursor/limit/filters), findById, create, update; запросы сообщений треда (по inquiry id, cursor, direction). Без бизнес-правил, только вызовы таблиц.

### 6.3 Шаг 3: доменный слой и клиент Salebot (типы, нормализация, вычисления, вызовы канала)

- **shared/inquiry/types.ts** — типы Inquiry, Message, фильтры (если нужны на клиенте).
- **lib/modules/inquiry/** — inquiryNormalize.ts (normalizeInquiry, normalizeInquiryList, normalizeMessage), валидация (validateInquiry), inquiryCompute.ts (getLastActivityAt, sortByLastActivity, groupMessages). API и роуты вызывают lib; lib для Heap — только через repos (006-arch).
- **lib/modules/inquiry/salebotClient.ts** (или аналог): обёртка над Salebot API (004-request) — чтение API-ключа из настроек (013-config), методы get_history (по client_id), message (отправка). Используется в api/inquiries/thread.ts и sendMessage.ts; при расширении каналов — вынести в абстракцию «провайдер канала» (п. 1.3).

### 6.4 Шаг 4: API (эндпоинты P0)

- **api/inquiries/list.ts** — GET, cursor, limit, filters; проверка прав (003-auth); вызов lib/repo, нормализация и сортировка.
- **api/inquiries/get.ts** — GET по id, одно обращение.
- **api/inquiries/thread.ts** — GET сообщения треда (id, cursor, direction). При первом запросе треда (или при открытии обращения без локальной истории) — вызов lib для подтягивания истории из Salebot (get_history) и сохранение в Heap, затем отдача из Heap.
- **api/inquiries/sendMessage.ts** — POST, валидация body; отправка через Salebot API (ключ из настроек проекта, 013-config) и запись сообщения в Heap. См. п. 1.3 (источник сообщений, ключ Salebot).

### 6.5 Шаг 5: состояние UI и роут страницы

- Composable **useInquiryState** (или состояние в странице): selectedInquiryId, list (items, cursor, hasMore, loading, error), thread (byId, loadingById, errorById), ui (viewportMode, panel), draftsByInquiryId, scrollStateByInquiryId. Действия: selectInquiry, loadList, refreshList, loadThread, setViewportMode.
- **config/routes.tsx** — при необходимости убедиться, что есть ROUTES.inquiries, withProjectRoot.
- **web/inquiries/index.tsx** — роут страницы обращений (SSR, initialData по необходимости).

### 6.6 Шаг 6: каркас страницы и три панели (P0)

- **pages/InquiriesPage.vue** — инициализация состояния, первая загрузка, опционально ?id=, глобальные ошибки/пустые состояния.
- **pages/inquiries/InquiriesLayoutThreePanel.vue** — сетка трёх панелей, адаптив (desktop / tablet / mobile).
- **InquiryListPanel** — шапка (поиск/фильтры — заглушки), **InquiryList** + **InquiryListItem** (skeleton, empty, error, клик → selectInquiry).
- **InquiryThreadPanel** — **ThreadHeader**, **MessageList**, **MessageComposer**; догрузка вверх с сохранением якоря скролла.
- **InquiryDetailsPanel** — каркас вкладок (Client | Comments | Deals | Tasks), пустые состояния (наполнение в P1).
- Компоненты сообщений: **MessageList**, **MessageItem**; **MessageComposer** с черновиками (draftsByInquiryId), отправка с optimistic update (temp id → real id), retry при ошибке.

### 6.7 Шаг 7: P1 — поиск, фильтры, unread, детали, действия

- **InquiryListToolbar**: debounced search, табы/фильтры, счётчики; состояние filters, setFilters, сброс cursor и refreshList.
- **UnreadBadge**, **InquiryStatusBadge**; правило «прочитано при открытии треда» — markRead при открытии треда (loadThread), API **api/inquiries/markRead.ts** (см. п. 4.2).
- Правая панель: реальные данные клиента, вкладки Comments/Deals/Tasks с empty state и кнопками.
- **InquiryActionBar**: взять, передать, закрыть, смена статуса; **api/inquiries/actions.ts** с проверкой прав; подтверждения для критичных действий, optimistic update и откат при ошибке.
- Права: в lib — canViewInquiry, can(action, context); на клиенте — условный рендер / AccessGuard.

### 6.8 Шаг 8: P2 — real-time, производительность, логи, тесты

- **014-socket**: подписка на message:new, inquiry:updated; обновление треда и списка, счётчики unread.
- Виртуализация: VirtualizedInquiryList, при длинных тредах — VirtualizedMessageList; при необходимости кэш/LRU тредов.
- Логи и аудит: клиент — без console.log, сервер — аудит действий (кто/когда/параметры).
- **020-testing**: unit (нормализация, валидация, группировка), интеграция (list → select → thread → send), e2e по ключевым сценариям.

---

**Краткая цепочка:** 1 → 2 → 3 → 4 → 5 → 6 (MVP), затем 7 (P1), затем 8 (P2).

Промпты для специализированного агента по каждому шагу (согласованные друг с другом) собраны в **002-inquiries-step-prompts.md**.

---

## 7. Ссылки на документацию

- **000-summ.md** — навигатор по документации, ключевые правила (клиент/сервер, Heap, роуты).
- **001-standards.md** — TailwindCSS, FontAwesome, форматирование, организация файлов, валидация.
- **002-routing.md** — app.get/app.post/app.html, file-based, один файл — один роут, `route.url()`, withProjectRoot.
- **003-auth.md** — requireAccountRole, requireRealUser, ctx.user, защита API.
- **004-request.md** — исходящие HTTP-запросы (вызовы Salebot API из lib).
- **006-arch.md** — таблицы, repos, lib, api, pages, components, именование, избегание циклов.
- **007-vue.md** — script setup, SSR, fetch/route.run(), запрет Heap на клиенте, события ($event).
- **008-heap.md** — CRUD, where, order, runWithExclusiveLock при гонках.
- **012-sender.md** — sendMessageToChat, каналы; при добавлении других каналов (п. 1.3). Текущая реализация P0 — Salebot API.
- **013-config.md** — настройки workspace, хранение API-ключа Salebot (п. 1.3).
- **014-socket.md** — real-time обновления.
- **020-testing.md** — unit и интеграционные тесты, структура тестов в проекте.
- [Salebot API (конструктор)](https://docs.salebot.pro/rabota-s-api/api-konstruktora) — внешний API провайдера канала (история, отправка, клиенты и т.д.). Ключ настраивается в проекте один раз (п. 1.3).

---

*Версия: 1.3. Дата: 2025-02-06. Согласование плана: добавлены 004-request, 013-config в ссылки; в структуру и шаги — salebotClient, channelExternalId в схеме; уточнены 012-sender, openThread/loadThread, версия шага 3 (клиент Salebot).*
