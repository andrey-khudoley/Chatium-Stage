# Architecture

## Назначение

`p/units/aayakovleva/sbp-client` — клиентская панель LifePay (implementation-plan §1.8). Одно Chatium-приложение совмещает три роли:

1. **Хранилище секретов магазина** (`lp_apikey`, `lp_login`, `lp_webhook_token`, `gateway_base_url`) в Heap-настройках.
2. **Серверная прокладка** `POST /api/lp/invoke` между UI и payments-gateway с журналом запросов в Heap.
3. **Приёмник webhook LifePay** `POST /web/webhook?token=...` с журналом и дедупликацией.

Запросы к gateway идут напрямую по HTTP, без отдельного SDK-приложения (решение §12.1 manual, пересмотр 15-05-2026).

## Ограничения платформы

- Серверная инфраструктура — Chatium.
- Нельзя менять стек и зависимости (`@app/*`, `@pay/sdk` и т.п.).
- Деплой — автоматически при пуше.
- npm недоступен. QR-код во вкладке «Создать запрос» — через CDN `cdn.jsdelivr.net/npm/qrcode/...` (загрузка при mount; при недоступности UI деградирует к текстовому отображению paymentUrl). QR рисуется только для операций, чей descriptor задаёт `paymentUrlPath`.

## Роли и сценарии

- **Admin** (Андрей-разработчик) — полный доступ ко всем `/api/lp/*`, `/api/access/*`, `/`, `/web/admin`, `/web/tests`. Проходит `requireInternalAccess` без записи в `panel_access`.
- **Сотрудник школы (не-Admin)** — доступ к `/` и `api/lp/*` при наличии активной записи в `panel_access`. Запись создаётся через одноразовую пригласительную ссылку (ADR 0003 / §1.11, реализовано 2026-05-24).
- **Анонимный + token-в-query** — только `POST /web/webhook` (LifePay).
- **Авторизованный без гранта** — попадает на `/web/forbidden` (403); может получить доступ через инвайт-ссылку `/web/access/invite?token=`.

Основные сценарии:

- Открыть `/web/admin`, заполнить настройки LifePay (apikey, login, webhook token, gateway base URL) в карточке «Настройки LifePay».
- На вкладке «Создать запрос» выбрать операцию из дропдауна (группы — по подключённым гейтвеям LifePay / Lava.Top), заполнить динамическую форму, отправить запрос. Для операций, возвращающих `paymentUrl` (`LifePay.createBill`, `Lava.Top.createInvoice`), на странице сразу отрисуется QR-код.
- Оплатить QR со смартфона, получить webhook от LifePay, увидеть запись в журнале.

## Контур интеграции с payments-gateway

```
[ Admin UI (pages/HomePage.vue → компонент ClientHomePage) ]
            |
            | fetch POST /api/lp/invoke { op, args }
            v
[ api/lp/invoke.ts (Admin-only) ]
            |
            | invokeGateway(ctx, op, args)
            | читает lp_apikey, lp_login, gateway_base_url из Heap
            | @app/request POST/GET <gateway_base_url>/api/v1/<op>
            | заголовки: X-Lp-Apikey, X-Lp-Login
            v
[ p/saas/gw/lifepay /api/v1/<op> ]
            |
            v
[ LifePay HTTP API ]

Ответ gateway (с заголовком X-Gateway-Request-Id) → возвращается клиенту без изменений,
параллельно пишется в Heap-таблицу request_log (без секретов, с маской email/phone).
```

## Роутинг

File-based, один файл = один роут с путём `/`:

- `index.tsx` — главная `/` (requireRealUser + requireInternalAccess; аноним → /s/auth/signin, без гранта → /web/forbidden; SSR-пропсы для `pages/HomePage.vue`, компонент `ClientHomePage`; инжект CSS из `pagecss/sbpHomeCss1..4.ts`).
- `web/admin/index.tsx` — админка `/web/admin` (Admin-only). Загружает начальные значения настроек LifePay и передаёт пропом `initialSettings` в `pages/AdminPage.vue` (оркестратор с подкомпонентами в `components/admin/`). Инжект CSS из `pagecss/sbpAdminCss1..4.ts`.
- `web/profile/index.tsx`, `web/login/index.tsx`, `web/tests/index.tsx` — шаблонные.
- `web/panel/index.tsx` — редирект на `/` (легаси-совместимость).
- `web/webhook/index.tsx` — приёмник webhook LifePay (POST, анонимный + токен).
- `web/access/invite/index.tsx` — страница инвайта `/web/access/invite?token=` (requireRealUser; не расходует инвайт). (ADR 0003.)
- `web/forbidden/index.tsx` — страница 403 `/web/forbidden` (requireRealUser). (ADR 0003.)
- `api/lp/invoke.ts` — POST прокладка к gateway (requireRealUser + requireInternalAccess).
- `api/lp/recent-requests.ts`, `api/lp/recent-webhooks.ts` — GET журналы (requireRealUser + requireInternalAccess).
- `api/lp/analytics/summary.ts` — GET карточки аналитики (requireRealUser + requireInternalAccess).
- `api/lp/analytics/filter-save.ts` — POST сохранение/сброс глобального фильтра панели (requireRealUser + requireInternalAccess).
- `api/lp/search-by-request-id.ts` — GET поиск (requireRealUser + requireInternalAccess).
- `api/lp/raw-request.ts`, `api/lp/raw-webhook.ts` — GET raw-записи (requireRealUser + requireInternalAccess).
- `api/access/consume-invite.ts` — POST потребление инвайта (requireRealUser). (ADR 0003.)
- `api/access/generate-invite.ts`, `api/access/revoke-invite.ts`, `api/access/revoke-grant.ts` — POST Admin-управление. (ADR 0003.)
- `api/access/invites.ts`, `api/access/grants.ts` — GET списки для Admin. (ADR 0003.)
- `api/settings/*`, `api/logger/*`, `api/admin/*`, `api/tests/*` — без изменений (шаблон).

Все ссылки и редиректы — через `withProjectRoot` / `withProjectRootAndSubroute` (хардкод URL запрещён).

## Разделение слоёв

| Слой              | Каталог                | Ответственность                                                                                                                               |
| ----------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Таблицы**       | `tables/`              | Схемы Heap (поля, типы)                                                                                                                       |
| **Репозитории**   | `repos/`               | Работа с БД (Heap-операции)                                                                                                                   |
| **Бизнес-логика** | `lib/`                 | Правила, дефолты, валидации, gateway-клиент, webhook-обработка, SSR-хелперы                                                                   |
| **API**           | `api/`, `web/webhook/` | HTTP-эндпоинты, парсинг, авторизация                                                                                                          |
| **Pages**         | `pages/`               | Vue (SSR + клиент); без импортов tables/repos/lib. Страницы — оркестраторы над подкомпонентами                                                |
| **Components**    | `components/`          | Переиспользуемые Vue-компоненты. Подкаталоги: `home/`, `admin/`, `tests/`; корень: Header, LogStreamPanel, AppFooter и др.                    |
| **pagecss/**      | `pagecss/`             | CSS-модули (строковые константы), импортируются только в TSX-роутах через `<style>{...}</style>`. Vue-компоненты не содержат `<style scoped>` |
| **Web (SSR)**     | `web/`                 | Файловые роуты страниц                                                                                                                        |

Поток данных:
`HTTP → API → lib → repos → Heap` (никаких прямых импортов `tables/` из API).

**Перенос SSR-хелперов в `lib/` (2026-05-26):** `shared/preloader.ts` и `shared/logLevel.ts` перенесены в `lib/preloader.ts` и `lib/logLevel.ts`. Оба являются серверными SSR-вспомогательными модулями (используются только в TSX-роутах), импорт из `.vue` запрещён. Перенос устранил нарушение слоёв: серверный код не должен лежать в `shared/`.

**Общий компонент `components/LogStreamPanel.vue` (2026-05-26):** визуальная лог-панель с загрузкой, фильтрами, отображением и разворачиванием записей. Используется в `pages/AdminPage.vue` (expand-all выключен) и `pages/TestsPage.vue` (expand-all включён). Socket-lifecycle, счётчики, sink и дедупликация остаются на страницах; записи форвардятся в панель через `pushEntry`, первая загрузка — `loadRecent` (контракт через `defineExpose`).

## Стратегия логирования

Без изменений из шаблона: syslog RFC 5424, `lib/logger.lib.ts`, ключ `log_level` (Debug / Info / Warn / Error / Disable). Секреты (`apikey`, `login`, `lp_webhook_token`) **никогда** не пишутся в `writeServerLog.payload`. `argsRedacted` и `rawResponseBody` в `request_log`, а также `rawBody`/`rawQuery`/`email` в `webhook_log` хранятся **сырыми** — клиент является оператором персональных данных по 152-ФЗ и имеет полный доступ к данным платежей. Структурная гигиена (циклы/несериализуемое/усечение по 64KB) — через `shared/prepareRawLog.ts`. Маскирующие утилиты `shared/redact.ts` / `shared/redactRaw.ts` оставлены в коде с их юнит-тестами, но в production-пути не используются.

## Интеграции

- **payments-gateway** (`p/saas/gw/lifepay`) — единственный исходящий собеседник. Контракт: `POST/GET /api/v1/<op>` (префикс `/api/` от file-based роутинга gateway), заголовки `X-Lp-Apikey`, `X-Lp-Login`, ответ `X-Gateway-Request-Id`. Без серверных ретраев. Таймаут 15 секунд (на 5 секунд больше gateway-таймаута).
- **LifePay** — только через gateway. Webhook от LifePay приходит на `/web/webhook?token=...&correlationId=<uuid>` (URL формируется клиентом в `createBill`: `callbackUrl` с token + correlationId как query-параметры, не глобально).

## Механизм correlationId-связки (реализовано 2026-05-25)

**Проблема:** LifePay в SBP-webhook возвращает `order.number = null`, `orderNumber = ""`, поэтому связать входящий webhook с исходным `createBill` по `orderNumber` невозможно.

**Решение — сквозной correlationId:**

```
[ pages/HomePage.vue (submitRequest, компонент HomeCreateRequestTab) ]
  1. generateCorrelationId()  →  uuid
  2. callbackUrl += ?correlationId=<uuid>   (shared/correlation.appendCorrelationId)
  3. args.correlationId = uuid
  4. POST /api/lp/invoke { op, args }
                |
[ api/lp/invoke.ts ]
  5. extractCorrelationId(args) → сохраняет в request_log.correlationId
  6. удаляет correlationId из args перед invokeGateway (gateway его не ждёт)
                |
[ LifePay → webhook → /web/webhook?token=...&correlationId=<uuid> ]
  7. extractCorrelationId(req.query) → пишет в webhook_log.correlationId

[ api/lp/search-by-request-id ]
  8. Параллельный поиск: findByOrderNumberInRange + findByCorrelationIdInRange
  9. mergeWebhooksById — объединение без дублей (id-ключ), сортировка по processedAt desc
```

Модуль `shared/correlation.ts` (`// @shared`) — чистые функции без Heap/ctx: доступны на клиенте (Vue), сервере (api/lp) и в юнит-наборе. Поле `correlationId` в обеих таблицах — `Heap.Optional String` без `searchable` (точный `where`-матч не требует searchable, ср. фильтры по `status`/`tokenValid`).

## Внутренняя авторизация (ADR 0003 / §1.11, реализовано 2026-05-24)

Двухуровневая модель доступа для всех защищённых роутов (`/`, `api/lp/*`):

```
requireRealUser(ctx)           — реальный авторизованный пользователь
guardInternalApi(ctx)          — requireRealUser + requireInternalAccess:
                                   Admin → проход всегда
                                   не-Admin → активная запись в panel_access, иначе HTTP 403
```

Поток выдачи доступа:

1. Admin генерирует инвайт (`api/access/generate-invite`) → получает одноразовый URL `/web/access/invite?token=`.
2. Сотрудник переходит по ссылке → страница подтверждения (`pages/InviteAcceptPage.vue`).
3. Сотрудник нажимает «Подтвердить» → `POST /api/access/consume-invite` под `runWithExclusiveLock` → запись в `panel_access`, инвайт помечается `usedAt`.
4. На последующих заходах сотрудник проходит `requireInternalAccess` через `repos/panelAccess.repo.ts`.

Admin может отозвать инвайт (`revoke-invite`) или грант (`revoke-grant`). Ключевой инвариант: переход по URL инвайта не расходует его — расход только при нажатии «Подтвердить».

## Декомпозиция страниц (реализовано 2026-05-28)

Страницы переведены в паттерн «оркестратор + подкомпоненты». Вся CSS вынесена в `pagecss/`.

### `pages/HomePage.vue` (компонент `ClientHomePage`)

Оркестратор главной панели. Подкомпоненты в `components/home/`:

- `HomeStatusStrip.vue` — полоска статуса конфигурации (read-only).
- `HomeToolbar.vue` — двухрядный sticky-тулбар (вкладки + фильтр дат + LIVE + поиск).
- `HomeSearchResult.vue` — результат поиска по requestId.
- `HomeOverviewTab.vue` — вкладка «Обзор» (аналитические карточки).
- `HomeRequestsTab.vue` — вкладка «Запросы» (журнал `request_log`).
- `HomeWebhooksTab.vue` — вкладка «Webhook» (журнал `webhook_log`).
- `HomeCreateRequestTab.vue` — универсальная вкладка «Создать запрос». Дропдаун операций сгруппирован `optgroup`'ами по гейтвеям (LifePay / Lava.Top); форма перестраивается из `shared/operationsClientCatalog.ts` (типы + операции) и `shared/operationsClientForm.ts` (валидация, сборка `args`, начальное состояние). QR рендерится только если у операции задан `paymentUrlPath` и в ответе он есть.
- `HomeAccessTab.vue` — вкладка «Доступ» (Admin: инвайты и гранты).
- `HomeRawModal.vue` — модалка raw-данных.
- `HomeCreateInviteModal.vue` — модалка создания инвайта.

Логика (Options API mixin): `pages/sbpHomePageMixin.ts`. Форматтеры и helpers (чистые, без Heap/ctx): `shared/sbpHomeFormat.ts`. CSS: `pagecss/sbpHomeCss1.ts`..`sbpHomeCss4.ts`.

### `pages/AdminPage.vue`

Оркестратор. Подкомпоненты в `components/admin/`: `AdminCounters.vue`, `AdminProjectSettings.vue`, `AdminLogLevel.vue`, `AdminLifePaySettings.vue`. Composable WebSocket-потока логов: `shared/useLogsSocket.ts`. CSS: `pagecss/sbpAdminCss1.ts`..`sbpAdminCss4.ts`.

### `pages/TestsPage.vue`

Оркестратор. Подкомпоненты в `components/tests/`: `TestsToolbar.vue`, `TestsMetrics.vue`, `TestSuiteTab.vue`. Composable управления наборами тестов: `shared/useTestSuites.ts`. Чистые хелперы: `shared/testSuiteHelpers.ts`. CSS: `pagecss/sbpTestsCss1.ts`..`sbpTestsCss3.ts`.

### Прочие CSS-модули

- `pagecss/sbpProfileCss1.ts` — ProfilePage.
- `pagecss/sbpHeaderCss1.ts`, `sbpHeaderCss2.ts` — Header.vue.
- `pagecss/sbpLogStreamCss1.ts`, `sbpLogStreamCss2.ts` — LogStreamPanel.vue.

CSS-файлы содержат именованные строковые константы с уже неймспейснутыми классами (`home-`, `ap-`, `tp-`, `lsp-`). Импортировать только в TSX-роутах; в `.vue`-файлы запрещено.

## Раскладка главной страницы (pages/HomePage.vue)

Тулбар главной страницы реализован в `components/home/HomeToolbar.vue` как двухрядная sticky-полоска (`.panel-toolbar`, `flex-direction: column`):

- **Строка A** (`.toolbar-row--tabs`): навигационные вкладки `.panel-tabs` на всю ширину — приоритетны визуально.
- **Строка B** (`.toolbar-row--tools`): фильтр дат (`.date-filter`), LIVE-переключатель (`.live-toggle`), поиск по requestId (`.quick-search`). Отделена от строки вкладок разделителем `border-top: 1px solid var(--color-border-light)`.

Адаптивность:

- На ≤760px тулбар переходит из `position: sticky` в `position: static` (не фиксируется при прокрутке).
- На ≤480px фильтр дат раскладывается вертикально (`flex-direction: column`), поля занимают полную ширину, разделитель «—» скрыт.
- `.quick-search` — `flex: 1 1 200px`, `max-width: 480px`, не сжимается ниже 0. `.live-toggle` — `flex-shrink: 0`.

CRT/терминальная эстетика (clip-path-углы, monospace, uppercase, акцент `#d3234b`, анимации live-pulse) сохранена без изменений. Логика, API, таблицы, роутинг — не затронуты.

CSS-стили тулбара и всей главной страницы: `pagecss/sbpHomeCss1.ts`..`sbpHomeCss4.ts`.

## Глобальный фильтр панели (panel_date_filter)

Вкладка «Обзор» `PanelHomePage.vue` поддерживает персистентный фильтр по дате/времени `[from?, to?]` (Unix ms). Граница клиент/сервер:

- **Сервер**: `getPanelDateFilter(ctx)` в `lib/settings.lib.ts` читает ключ `panel_date_filter` из Heap. Вызывается в каждом из эндпоинтов (`summary`, `recent-requests`, `recent-webhooks`, `search-by-request-id`) и при SSR в `index.tsx` (проп `initialDateFilter` → `PanelHomePage.vue`).
- **Клиент**: Vue получает фильтр пропсом при первой загрузке, хранит состояние локально. Изменение фильтра → `POST /api/lp/analytics/filter-save`; ответ сервера подтверждает сохранённое значение.
- Фильтр глобальный: общий для всех пользователей и сессий. Менять может любой пользователь с активным доступом к панели (guardInternalApi).
- При отсутствии фильтра показываются все данные (до кэпа `ANALYTICS_SCAN_LIMIT = 5000` через cursor-пагинацию ≤ 1000 записей на запрос).

## Безопасность

- `requireRealUser(ctx)` + `requireInternalAccess(ctx)` (через `guardInternalApi`) — все `/api/lp/*` и главный роут `/`. Реализовано 2026-05-24 (закрыт auth-разрыв аудита).
- Webhook — анонимный, но с обязательной сверкой токена.
- MD5-подпись webhook **не** проверяется: LifePay её не публикует (нет полей `check`/`signature`/`hash` в теле, нет описания алгоритма на apidoc.life-pay.ru/notification). Если LifePay в будущем добавит подпись — вернуться к этому пункту.
- Дедупликация webhook через `runWithExclusiveLock` из `@app/sync` + `findByField` + create в `webhook_idempotency` (Heap-схема не выражает unique constraint напрямую).
- Уникальность токена инвайта и userId гранта — на уровне приложения (`accountNanoid` + `runWithExclusiveLock`), Heap-схема unique constraint не выражает.
