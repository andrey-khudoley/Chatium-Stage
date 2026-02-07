# Промпты по шагам реализации раздела «Обращения»

Промпты согласованы с планом **001-inquiries-section.md**. Каждый промпт предназначен для специализированного агента: скопируй блок под нужным шагом и выдай агенту как задачу. Шаги выполняются строго по порядку: 1 → 2 → 3 → 4 → 5 → 6 (MVP), затем 7 (P1), затем 8 (P2).

Перед выдачей промпта убедись, что агент имеет доступ к проекту **s.chtm.aley.pro** и к документации из 000-summ.md (001-standards, 002-routing, 003-auth, 004-request, 006-arch, 007-vue, 008-heap, 013-config и др.).

---

## Шаг 1: таблицы Heap (данные)

**Контекст:** План `p/neso/crm/docs/plans/001-inquiries-section.md`, разделы 1.2 (структура каталогов), 2.1 (модель данных), 6.1.  
**Зависимости:** нет (первый шаг).  
**Документация:** 008-heap.md, 006-arch.md, 001-standards.md.

**Заметка:** В проекте введена таблица **clients** (`tables/clients.table.ts`). Поле обращений `client` и поле сообщений `inquiry` реализованы как **Heap.RefLink** на соответствующие таблицы (clients, inquiries).

**Задача:**

Реализуй шаг 1 плана раздела «Обращения»: создай таблицы Heap для клиентов, обращений и сообщений.

1. Создай **tables/clients.table.ts** — справочник клиентов: name, phone, email, assignee, source, tags (для ClientTab и связи с обращениями).
2. Создай **tables/inquiries.table.ts** в `p/neso/crm/`. Схема обращений: client (**RefLink** на таблицу clients), channel, **channelExternalId** (идентификатор в канале, например Salebot `client_id`), status, unread, assignee, tags и прочие поля по доменной модели (п. 2.1, 6.1). Именование и регистрация — по 008-heap и 006-arch.
3. Создай **tables/inquiryMessages.table.ts**. Схема сообщений: inquiry (**RefLink** на inquiries), автор, текст, время, тип (входящее/исходящее/системное), при необходимости — состояние отправки. Согласуй типы полей с нормализацией из шага 3 (normalizeMessage).
4. Убедись, что таблицы зарегистрированы в проекте и доступны (008-heap). Без этого шаг 2 невозможен.

Результат: три рабочие таблицы Heap (clients, inquiries, inquiryMessages), по которым репозиторий (шаг 2) сможет выполнять CRUD и запросы.

---

## Шаг 2: репозиторий (доступ к данным)

**Контекст:** План 001-inquiries-section.md, разделы 1.2, 2.2, 6.2.  
**Зависимости:** шаг 1 выполнен (таблицы inquiries, inquiryMessages существуют).  
**Документация:** 008-heap.md, 006-arch.md, 001-standards.md.

**Задача:**

Реализуй шаг 2 плана раздела «Обращения»: репозиторий для работы с Heap.

1. Создай **repos/inquiry.repo.ts** в `p/neso/crm/`. Репозиторий должен содержать только вызовы таблиц Heap, без бизнес-правил (006-arch).
2. Реализуй методы: **findAll** (список обращений с cursor, limit, filters), **findById** (одно обращение), **create**, **update**; запросы сообщений треда по inquiry id с поддержкой cursor и direction для пагинации.
3. Используй только таблицы `inquiries` и `inquiryMessages` из шага 1. Именование файлов и экспортов — по 001-standards и 006-arch.

Результат: inquiry.repo.ts, который вызывается из lib и api на следующих шагах. Lib и API не обращаются к Heap напрямую, только через этот repo.

---

## Шаг 3: доменный слой и клиент Salebot (типы, нормализация, вычисления, вызовы канала)

**Контекст:** План 001-inquiries-section.md, разделы 1.2, 1.3, 2.1, 2.2, 6.3.  
**Зависимости:** шаг 2 выполнен (repos/inquiry.repo.ts есть).  
**Документация:** 006-arch.md, 001-standards.md, 004-request.md, 013-config.md, [Salebot API](https://docs.salebot.pro/rabota-s-api/api-konstruktora).

**Задача:**

Реализуй шаг 3 плана раздела «Обращения»: типы, нормализация, валидация, вычисления и клиент Salebot API.

1. **shared/inquiry/types.ts** — определи типы Inquiry, Message и при необходимости типы фильтров (для клиента/API). Поля Inquiry: client, channel, channelExternalId, status, unread, assignee, tags и т.д. в соответствии с п. 2.1 и схемой Heap из шага 1.
2. **lib/modules/inquiry/inquiryNormalize.ts** — реализуй normalizeInquiry(apiDto), normalizeInquiryList(dtos), normalizeMessage(dto) с дефолтами и мягким приведением типов (п. 2.1).
3. **lib/modules/inquiry/** — добавь валидацию validateInquiry(inquiry) (обязательные поля, инварианты); при необходимости используй @app/validation (Zod) или согласуй с 001-standards.
4. **lib/modules/inquiry/inquiryCompute.ts** — реализуй getLastActivityAt(inquiry), sortByLastActivity(list), groupMessages(messages) (по дате/пакетам одного автора). П. 2.1.
5. **lib/modules/inquiry/salebotClient.ts** — обёртка над Salebot API (004-request): чтение API-ключа из настроек workspace (013-config), методы get_history (по client_id) и message (отправка). URL запросов: `https://chatter.salebot.pro/api/{api_key}/{action}`. Этот модуль будет использоваться в api/inquiries/thread.ts и sendMessage.ts (шаг 4). Заложь возможность в будущем вынести абстракцию «провайдер канала» (п. 1.3).

Правило архитектуры: API и роуты вызывают lib; lib для доступа к Heap — только через repos (006-arch). Внешние вызовы Salebot — через salebotClient в lib.

Результат: типы в shared, нормализация/валидация/вычисления и salebotClient в lib; готовность к вызову из API (шаг 4).

---

## Шаг 4: API (эндпоинты P0)

**Контекст:** План 001-inquiries-section.md, разделы 1.2, 1.3, 2.2, 6.4.  
**Зависимости:** шаг 3 выполнен (типы, lib, salebotClient есть).  
**Документация:** 002-routing.md, 003-auth.md, 006-arch.md, 001-standards.md.

**Задача:**

Реализуй шаг 4 плана раздела «Обращения»: эндпоинты API для списка, одного обращения, треда сообщений и отправки сообщения.

1. **api/inquiries/list.ts** — GET, query: cursor, limit, filters. Проверка прав (003-auth): requireRealUser или requireAccountRole. Вызов repo и lib для нормализации/сортировки (sortByLastActivity и т.д.). Один файл — один роут, путь `'/'` (002-routing).
2. **api/inquiries/get.ts** — GET по id, одно обращение. Проверка прав. Вызов repo + нормализация.
3. **api/inquiries/thread.ts** — GET сообщения треда (id обращения, cursor, direction). При первом запросе треда без локальной истории в Heap — вызвать lib (salebotClient.get_history по channelExternalId обращения), сохранить сообщения в Heap через repo, затем отдать данные из Heap. Иначе — отдать из Heap с пагинацией.
4. **api/inquiries/sendMessage.ts** — POST, валидация body (.body() или Zod). Отправка через Salebot API (salebotClient.message, ключ из 013-config), запись сообщения в Heap через repo. П. 1.3.

Все эндпоинты в `p/neso/crm/api/inquiries/`. Именование — camelCase (001-standards). Защита API — на сервере (003-auth).

Результат: четыре рабочих эндпоинта, которые использует UI на шагах 5–6.

---

## Шаг 5: состояние UI и роут страницы

**Контекст:** План 001-inquiries-section.md, разделы 1.2, 2.3, 6.5.  
**Зависимости:** шаг 4 выполнен (API list, get, thread, sendMessage работают).  
**Документация:** 007-vue.md, 002-routing.md, 006-arch.md, 001-standards.md.

**Задача:**

Реализуй шаг 5 плана раздела «Обращения»: composable состояния, роут страницы и при необходимости правки конфига роутов.

1. Реализуй composable **useInquiryState** (или эквивалентное состояние в странице). Состояние: selectedInquiryId, list (items, cursor, hasMore, loading, error), thread (byId, loadingById, errorById), ui (viewportMode: desktop|tablet|mobile, panel: list|thread|details), draftsByInquiryId, scrollStateByInquiryId. Действия: selectInquiry(id), loadList(nextCursor?), refreshList(), loadThread(id, direction?), setViewportMode(mode) с правилами переключения панелей. Гарантии: при обновлении списка не сбрасывать selectedInquiryId, если запись есть (п. 2.3). Данные с сервера — только через fetch или route.run() к api/inquiries/* (007-vue).
2. В **config/routes.tsx** убедись, что есть ROUTES.inquiries и withProjectRoot; при необходимости добавь или скорректируй (п. 1.2).
3. Создай **web/inquiries/index.tsx** — роут страницы обращений (SSR, при необходимости передача initialData). File-based роутинг (002-routing), один файл — один роут.

Результат: composable/состояние готово к использованию в InquiriesPage; роут открывает страницу обращений; конфиг роутов согласован.

---

## Шаг 6: каркас страницы и три панели (P0 UI)

**Контекст:** План 001-inquiries-section.md, разделы 1.2, 2.4, 3 (каталог компонентов), 6.6.  
**Зависимости:** шаги 4 и 5 выполнены (API и useInquiryState готовы).  
**Документация:** 007-vue.md, 001-standards.md (TailwindCSS, FontAwesome), при необходимости 019-design.md, 018-preloader.md.

**Задача:**

Реализуй шаг 6 плана раздела «Обращения»: корневая страница, лейаут из трёх панелей и все компоненты P0 для списка обращений, треда сообщений и деталей.

1. **pages/InquiriesPage.vue** — инициализация состояния (useInquiryState), первая загрузка списка, опционально связь с URL (`?id=...`), обработка глобальных ошибок и пустых состояний раздела (п. 2.4).
2. **pages/inquiries/InquiriesLayoutThreePanel.vue** — сетка трёх панелей (list / thread / details), адаптив: desktop — три колонки; tablet — list + thread, details как drawer/slide-over; mobile — одна панель, переключение list ↔ thread ↔ details (п. 2.4, раздел 3).
3. Левая панель: **InquiryListPanel** (шапка с заглушками поиска/фильтров), **InquiryList**, **InquiryListItem** — skeleton, empty, error + retry, клик по элементу → selectInquiry(id). Сохранение выделения и скролла списка.
4. Центральная панель: **InquiryThreadPanel** — **ThreadHeader** (клиент, #inq-..., канал, статусы), **MessageList** (группировка по дням/пакетам, догрузка вверх с сохранением якоря скролла), **MessageItem** (incoming | outgoing | system, sending | sent | failed), **MessageComposer** — ввод, черновики draftsByInquiryId, отправка по кнопке и Ctrl+Enter, optimistic update (temp id → real id), retry при ошибке (п. 2.4, раздел 3).
5. Правая панель: **InquiryDetailsPanel** — каркас вкладок Client | Comments | Deals | Tasks с пустыми состояниями; наполнение в P1 (шаг 7).
6. Стили: TailwindCSS, иконки FontAwesome (001-standards). Логирование — ctx.account.log(), не console.log.

Размещение компонентов: по п. 1.2 (pages/inquiries/*, components/*). Именование Vue-компонентов — PascalCase.

Результат: рабочий MVP раздела «Обращения» — список, выбор обращения, тред с историей и отправкой сообщений, каркас деталей.

---

## Шаг 7: P1 — поиск, фильтры, unread, детали, действия, права

**Контекст:** План 001-inquiries-section.md, разделы 4 (P1), 6.7.  
**Зависимости:** шаг 6 выполнен (MVP UI готов).  
**Документация:** 003-auth.md, 001-standards.md, 007-vue.md.

**Задача:**

Реализуй шаг 7 плана раздела «Обращения»: функциональность P1 — поиск и фильтры, unread/markRead, наполнение правой панели, действия по обращению и права.

1. **InquiryListToolbar**: debounced search, табы/фильтры, счётчики; в состоянии filters (tab, query, mine), setFilters(partial), сброс cursor и refreshList() (п. 4.1). Расширь API list при необходимости (query, filters).
2. **UnreadBadge**, **InquiryStatusBadge** — переиспользуемые компоненты. Правило «прочитано при открытии треда»: при открытии треда (loadThread) вызывать **api/inquiries/markRead.ts** (POST), локально обновлять unread (п. 4.2, 6.7). Создай эндпоинт markRead.ts при его отсутствии.
3. Правая панель: реальные данные клиента (ClientTab), вкладки Comments, Deals, Tasks с empty state и кнопками создания/привязки (п. 4.3).
4. **InquiryActionBar**: взять, передать, закрыть, смена статуса. **api/inquiries/actions.ts** — POST с проверкой прав (003-auth), подтверждения для критичных действий (ConfirmDialog), optimistic update и откат при ошибке (п. 4.4). Создай эндпоинт actions.ts при отсутствии.
5. Права: в lib — canViewInquiry(user, inquiry), can(action, context) (или отдельный модуль); в API — вызов этих проверок перед действиями. На клиенте — условный рендер или AccessGuard, fallback «Нет доступа» (п. 4.5).

Результат: поиск и фильтры работают, unread и markRead — по правилам, правая панель заполнена, действия и права реализованы.

---

## Шаг 8: P2 — real-time, производительность, логи, тесты

**Контекст:** План 001-inquiries-section.md, разделы 5 (P2), 6.8.  
**Зависимости:** шаг 7 выполнен (P1 готов).  
**Документация:** 014-socket.md, 020-testing.md, 001-standards.md.

**Задача:**

Реализуй шаг 8 плана раздела «Обращения»: real-time обновления, виртуализация, логи/аудит и тесты.

1. **014-socket**: на сервере — sendDataToSocket при релевантных событиях; на клиенте — getOrCreateBrowserSocketClient, subscribeToData. Подписка на события message:new, inquiry:updated (status, assignee, unread). При открытом треде — добавление нового сообщения вниз; при другом треде — обновление unread и порядка по активности; при необходимости in-app уведомления и счётчики (п. 5.1).
2. Виртуализация: **VirtualizedInquiryList** для списка обращений; при длинных тредах — **VirtualizedMessageList**. При необходимости кэш/LRU числа хранимых тредов (п. 5.2). Отдельные состояния loading/empty/error по панелям (PanelStateKit).
3. Логи и аудит: на клиенте — без console.log, использовать принятый в проекте механизм; на сервере — аудит действий (кто закрыл/передал, когда, параметры) — запись в таблицу или логгер (п. 5.3).
4. **020-testing**: unit-тесты для нормализации, валидации, правил unread/read, группировки сообщений; интеграционные сценарии (list → select → thread → details, отправка с optimistic и retry); e2e по ключевым действиям и при необходимости появление сообщения по real-time. Расположение и запуск тестов — по правилам проекта (п. 5.4).

Результат: real-time обновления в разделе «Обращения», виртуализация при больших объёмах, аудит и тесты по плану.

---

*Документ согласован с 001-inquiries-section.md (версия 1.3). Дата: 2025-02-06.*
