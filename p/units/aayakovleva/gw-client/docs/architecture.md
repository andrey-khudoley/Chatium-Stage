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
- npm недоступен. QR-код во вкладке «Создать запрос» — через CDN `cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js` (UMD-сборка node-qrcode v1.5.1, выставляет `window.QRCode.toCanvas`). Загрузка при mount; при недоступности UI деградирует к текстовому отображению paymentUrl. QR рисуется только для операций, чей descriptor задаёт `paymentUrlPath`.

## Роли и сценарии

- **Admin** (Андрей-разработчик) — полный доступ ко всем `/api/lp/*`, `/api/access/*`, `/`, `/web/admin`, `/web/tests`. Проходит `requireInternalAccess` без записи в `panel_access`.
- **Сотрудник школы (не-Admin)** — доступ к `/` и `api/lp/*` при наличии активной записи в `panel_access`. Запись создаётся через одноразовую пригласительную ссылку (ADR 0003 / §1.11, реализовано 2026-05-24).
- **Анонимный + token-в-query** — только `POST /web/webhook` (LifePay).
- **Авторизованный без гранта** — попадает на `/web/forbidden` (403); может получить доступ через инвайт-ссылку `/web/access/invite?token=`.

Основные сценарии:

- Открыть `/web/admin`, заполнить настройки LifePay (apikey, login, webhook token, gateway base URL) в карточке «Настройки LifePay»; при необходимости — настройки GetCourse (base URL, school api key, school host, enabled) в карточке «Настройки GetCourse».
- На вкладке «Создать запрос» выбрать операцию из дропдауна (группы — по подключённым гейтвеям LifePay / Lava.Top / GetCourse), заполнить динамическую форму, отправить запрос. Для операций, возвращающих `paymentUrl` (`LifePay.createBill`, `Lava.Top.createInvoice`), на странице сразу отрисуется QR-код. Для GC-операций форма перестраивается из `argsSchema.fields` ответа гейтвея.
- На вкладке «Формат запросов» — контракты `POST /api/lp/invoke` (LifePay createBill, Lava.Top createInvoice) и подписка на socket уведомлений об оплате (`POST /api/lp/payment-socket` + `@app/socket`) в виде атомарных копируемых сниппетов. Источник истины — `shared/requestFormatSamples.ts` (`buildRequestFormatSamples({ invokeUrl, paymentSocketUrl })`); рендер — `components/home/HomeRequestFormatTab.vue` (декларативный, без бизнес-логики).
- Оплатить QR со смартфона, получить webhook от LifePay, увидеть запись в журнале.

## Контур интеграции с payments-gateway

```
[ Admin UI (pages/HomePage.vue → компонент ClientHomePage) ]
            |
            | fetch POST /api/lp/invoke { gatewayId, op, args, httpMethod? }
            v
[ api/lp/invoke.ts (guardInternalApi) ]
            |
            | invokeByGateway(ctx, gatewayId, op, args, meta?)
            | — LifePay:  читает lp_apikey/lp_login/gateway_base_url; X-Lp-Apikey/X-Lp-Login
            | — Lava.Top: читает lava_test_apikey/lava_base_url; X-Lava-Apikey
            | — GC:       читает gc_base_url/gc_test_school_api_key/gc_test_school_host;
            |             X-Gc-School-Api-Key/X-Gc-School-Host; httpMethod обязателен
            v
[ p/saas/gw/lifepay | p/saas/gw/lavatop | p/saas/gw/gc — /api/v1/<op> ]
            |
            v
[ LifePay / Lava.Top / GetCourse HTTP API ]

Ответ gateway (с заголовком X-Gateway-Request-Id) → возвращается клиенту без изменений,
параллельно пишется в Heap-таблицу request_log с gatewayId.
```

## Роутинг

File-based, один файл = один роут с путём `/`:

- `index.tsx` — главная `/` (requireRealUser + requireInternalAccess; аноним → /s/auth/signin, без гранта → /web/forbidden; SSR-пропсы для `pages/HomePage.vue`, компонент `ClientHomePage`). Загружает в т.ч. виджет-настройки (`initialWidgetSettings`), `anchorBaseUrl` и `initialGcEnabled` — для вкладки «Настройки» главной. Инжект CSS: `pagecss/sbpHomeCss1..4.ts` + `pagecss/sbpAdminCss1..4.ts` + `pagecss/sbpWidgetsCss1.ts` + `pagecss/sbpSettingsCss1.ts`. Вкладка «Настройки» переехала на собственный визуальный язык в стиле главной (`.panel-section`, `.prompt`, `.st-*`); `.ap-*` / `.aw-*` оставлены для обратной совместимости форм submit, но новая разметка их больше не использует.
- `web/admin/index.tsx` — системные настройки `/web/admin` (**только Admin** — `requireAccountRole(ctx, 'Admin')`). Загружает только инфра/секреты: `initialSettings` (LifePay), `initialLavatopSettings`, `initialGcSettings`. Operational-настройки (gc_enabled, виджеты) сюда **не** попадают — они на главной. Инжект CSS из `pagecss/sbpAdminCss1..4.ts`.
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
- `api/lp/payment-socket.ts` — POST выдача `encodedSocketId` для подписки на канал уведомлений об оплате (requireRealUser + requireInternalAccess). Имя канала — `gw-client-payment-<correlationId>` (`shared/paymentSocket.ts`); сервер публикует сообщения в канал из webhook-приёмников через `sendDataToSocket`.
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

**Уровни логирования в цепочке виджета (`POST /api/widgets/config`):**

- **Info (severity 6):** запись `success` — итог запроса с агрегатными флагами (`positionsCount`, `*OfferOk`, `*AmountOk`). Массив id офферов из соображений приватности и объёма не включается.
- **Debug (severity 7):** полная трассировка цепочки — `positions_parsed` (сырые id офферов), `amount_resolve_start`, `amount_resolved` (кэш/GC), `decision` (решение per-метод: все входные параметры и финальный `enabled`). В `resolveGcDealAmount` (`lib/gateway/gcDealResolver.ts`) — `entry` и `fields_extracted`.
- **Warning (severity 4):** `body_invalid` — невалидный запрос (3 точки вызова: тело не парсится, `dealId` отсутствует, `dealId` невалиден при наличии проверки суммы).

Для диагностики решений о доступности виджета включить `log_level=Debug` в `/web/admin`. При Info поток содержит только `success` и `body_invalid` (warnings).

## Интеграции

- **LifePay gateway** (`p/saas/gw/lifepay`) — контракт: `POST/GET /api/v1/<op>`, заголовки `X-Lp-Apikey`, `X-Lp-Login`, ответ `X-Gateway-Request-Id`. Без ретраев. Таймаут 15 секунд. Webhook от LifePay приходит на `/web/webhook?token=...&correlationId=<uuid>`.
- **Lava.Top gateway** (`p/saas/gw/lavatop`) — контракт: `POST/GET /api/v1/<op>`, заголовок `X-Lava-Apikey`, ответ `X-Gateway-Request-Id`. Без ретраев. Webhook от Lava.Top — на `/web/webhook-lavatop`.
- **GetCourse gateway** (`p/saas/gw/gc`) — контракт: `POST/GET /api/v1/<op>`, заголовки `X-Gc-School-Api-Key`, `X-Gc-School-Host`, ответ `X-Gateway-Request-Id`. Без ретраев. Каталог enabled-операций читается SSR-функцией `fetchGcOperations(ctx)` через `GET /api/v1/operations` с graceful degradation (при недоступности gateway группа GC в UI не отображается). Webhook от GC не реализован (MVP).

## Механизм correlationId-связки и верификации вебхуков (обновлено 2026-06-01)

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

**Guard «legacy-strict» — верификация происхождения вебхука (2026-06-01):**

`correlationId` используется не только для связки записей, но и как механизм верификации: вебхук без известного `correlationId` не обрабатывается. Guard расположен в `web/webhook/index.tsx` после проверки токена, до чтения тела:

```
POST /web/webhook?token=...&correlationId=<id>
  → validateToken (403/401/503 при ошибке)
  → guard «legacy-strict»:
      нет correlationId в query → 200 OK, без записи, reason=correlationId_missing
      есть correlationId → countCreateBillByCorrelationId(ctx, correlationId)
        count = 0 → 200 OK, без записи, reason=correlationId_not_found
        сбой БД  → 200 OK, без записи (строгая политика, severity 2)
        count > 0 → продолжить обработку
  → unwrapWebhookBody / parseWebhookBody / запись в webhook_log / дедупликация / socket
```

Цель: принимать только вебхуки по заказам, явно созданным через панель (`invokeByGateway('lifepay','createBill')` из `intent-by-deal` или `api/lp/invoke`). Осознанный риск: при затяжном сбое Heap вебхук потеряется (guard строгий, не пропускает при неопределённости).

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
- `HomeCreateRequestTab.vue` — универсальная вкладка «Создать запрос». Дропдаун операций сгруппирован `optgroup`'ами по гейтвеям (LifePay / Lava.Top / GetCourse); форма перестраивается из `shared/operationsClientCatalog.ts` (типы + операции) и `shared/operationsClientForm.ts` (валидация, сборка `args`, начальное состояние). Для GC-операций ветка `v-if="isGcOp"` рендерит `<HomeGcRequestForm/>` вместо стандартной формы. QR рендерится только если у операции задан `paymentUrlPath` и в ответе он есть.
- `HomeGcRequestForm.vue` — Options API компонент иерархической формы GC-операций. Принимает пропы `gcFormRows` (`FormRow[]`), `gcRootKind`, `gcArgsValues`, `gcErrors`. Группы (`FormGroup`) рендерятся как `fieldset` с отступом; листья (`FormLeaf`) — как поля `LeafInput`. Корневой не-object тип → единый `__root__` textarea. Не содержит бизнес-логики — только рендер.
- `HomeSettingsTab.vue` — вкладка «Настройки» (доступ — сотрудник + Admin через `requireInternalAccess`, реализовано 2026-05-29). Контейнер для operational/business-настроек. Содержит две карточки:
  1. **GetCourse** (`gc_enabled`) — единственное локальное поле. SSR-проп `initialGcEnabled: boolean`. Сохранение через `saveOperationalSettingRoute.run(ctx, ...)` (whitelist в endpoint-е допускает только operational-ключи, `guardInternalApi`).
  2. **Виджеты оплаты** (`HomeWidgetSettings`) — карточка с 12 виджет-ключами (enabled/domains/min/max/offer-фильтр для LifePay и Lava.Top), перенесена из `/web/admin`. Сохранение через `widgetSettingsSaveRoute.run(ctx, ...)` (whitelist 12 ключей, `guardInternalApi`).
  Стили карточек используют `ap-*` / `aw-*` (admin/widget CSS) — `index.tsx` главной инжектит `sbpAdminCss1..4` + `sbpWidgetsCss1` дополнительно к `sbpHomeCss1..4`.
- `HomeWidgetSettings.vue` — карточка виджетов на главной (`<script setup lang="ts">`). Loader офферов — `widgetOffersRoute.run(ctx)` (`guardInternalApi`). Использует `HomeWidgetOfferList.vue` для секции фильтра офферов.
- `HomeWidgetOfferList.vue` — переиспользуемая секция фильтра офферов (whitelist/blacklist + поиск + чекбоксы). Loader передаётся пропом из родителя.
- `HomeAccessTab.vue` — вкладка «Доступ» (Admin: инвайты и гранты).
- `HomeRawModal.vue` — модалка raw-данных.
- `HomeCreateInviteModal.vue` — модалка создания инвайта.

Логика (Options API mixin): `pages/sbpHomePageMixin.ts`. Форматтеры и helpers (чистые, без Heap/ctx): `shared/sbpHomeFormat.ts`. CSS: `pagecss/sbpHomeCss1.ts`..`sbpHomeCss4.ts`.

**Иерархическая форма GC (реализовано 2026-05-29):**

`sbpHomePageMixin.ts` содержит computed-блок для GC-ветки:

- `isGcOp` — true, если выбранная операция принадлежит гейтвею `'gc'`.
- `gcEntry` — `GcOperationEntry` из `shared/operationsClientCatalog.ts`; поле `argsTree?: ArgsTreeNode` добавлено к типу записи.
- `gcFormRows` — `FormRow[]`; вычисляется через `buildFormRows(gcEntry.argsTree)` из `shared/gcArgsForm.ts`. Единственный источник истины для структуры иерархии.
- `gcRootKind` — `'object' | 'scalar'`; определяет, рендерить ли отдельные поля или `__root__` textarea.
- `prepareGcSubmit(gcArgsValues, gcErrors)` — валидация через `buildFieldErrors` (из `shared/gcArgsForm.ts`) и сборка `args` через `buildArgsObject`; для `__root__` — `JSON.parse`. Возвращает `{ args, errors }`.

`shared/gcArgsForm.ts` — реэкспорт типов и хелперов из `p/saas/gw/gc/shared/requestTestForm.ts` (`buildFormRows`, `buildArgsObject`, `buildFieldErrors`, `jsonPlaceholder`, `FormRow`, `FormGroup`, `FormLeaf`, `LeafInput`) плюс wire-типы `ArgsTreeNode` / `ArgsTreeField`. Кросс-проектный реэкспорт через `@app/*`-имплементацию workspace.

`lib/gateway/gcOperationsLoader.ts` — парсит `argsTree` из ответа `GET /v1/operations` GC-гейтвея в `normalizeEntry`. При изменении схемы полей на стороне `p/saas/gw/gc` клиент правок не требует.

### `pages/AdminPage.vue`

Оркестратор системной страницы настроек (**только Admin**, `requireAccountRole('Admin')`). Подкомпоненты в `components/admin/`: `AdminCounters.vue`, `AdminProjectSettings.vue`, `AdminLogLevel.vue`, `AdminLifePaySettings.vue`, `AdminLavatopSettings.vue`, `AdminGcSettings.vue` (карточка настроек GetCourse: 3 поля — base URL, school api key, school host). Здесь живут только секреты, URL/host и инфраструктурные/debug-настройки. Operational/business-настройки (флаг активации GC, виджеты оплаты) переехали на вкладку «Настройки» главной панели — их редактируют сотрудники. Composable WebSocket-потока логов: `shared/useLogsSocket.ts`. CSS: `pagecss/sbpAdminCss1.ts`..`sbpAdminCss4.ts`. SSR-роут `web/admin/index.tsx` читает только LP/Lava/GC настройки.

### Разделение «системные / operational» настройки

Принципиальное разграничение (введено 2026-05-29):

- **Системные** (`/web/admin`, **только Admin**, `requireAccountRole('Admin')`): счётчики дашборда, project_name, log_level, секреты LP (`lp_apikey`, `lp_login`, `lp_webhook_token`, `gateway_base_url`), секреты Lava.Top (`lava_test_apikey`, `lava_base_url`, `lava_webhook_secret`), секреты GC (`gc_base_url`, `gc_test_school_api_key`, `gc_test_school_host`).
- **Operational** (главная панель → вкладка «Настройки», **сотрудник + Admin** через `guardInternalApi`): `gc_enabled` (флаг активации GC), все 12 виджет-ключей (`widget_lifepay_*`, `widget_lavatop_*` — enabled, domains, min/max, offer-фильтр).

Auth-разделение на уровне save-эндпоинтов:

- `api/settings/save.ts` — общий `setSetting`, `requireAccountRole('Admin')` (для LP/Lava/GC карточек админки).
- `api/settings/save-operational.ts` — whitelist `[gc_enabled]`, `guardInternalApi` (для `HomeSettingsTab`).
- `api/widgets/settings-save.ts` — whitelist `WIDGET_SETTING_KEYS` (12 ключей), `guardInternalApi` (для `HomeWidgetSettings`).
- `api/widgets/settings-get.ts`, `api/widgets/offers.ts` — `guardInternalApi`.

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

## Публичные виджеты оплаты (реализовано 2026-05-29)

Каталог `userscripts/` содержит файлы для встраивания на сторонние страницы магазина. Виджеты обращаются к публичным эндпоинтам `api/widgets/` напрямую из браузера покупателя.

### Поток: userscript → config → intent → gateway (offer-поток)

С 2026-06-01 `/api/widgets/config` переведён с GET на POST: виджет передаёт `{ dealId, positions }` в теле, сервер самостоятельно определяет `enabled` для каждого метода.

```
[ Браузер покупателя (страница магазина) ]
            |
            | POST /api/widgets/config  (Content-Type: text/plain, тело — JSON-строка)
            |   { dealId, positions: [{id}] }
            |   Origin: <домен магазина>
            v
[ api/widgets/config.ts — публичный, без авторизации ]
            | CORS-whitelist: checkWidgetOrigin(lifepayDomains + lavatopDomains, origin)
            | 403 при недопустимом Origin
            | 400 WIDGET_BODY_INVALID — dealId невалиден при наличии minAmount/maxAmount
            |
            | Для каждого метода m:
            |   enabled = settings.<m>Enabled
            |           AND areAllOffersAllowed(positions из тела, settings)
            |           AND amountOk (если minAmount>0 || maxAmount>0)
            |
            | amountOk: resolveGcDealAmount(ctx, dealId)
            |   → сначала GcDealCache (TTL=60с, tables/gcDealCache.table.ts)
            |   → при miss: getDealFields через GC-гейтвей → setCachedGcDealAmount
            |       (устаревшие записи кэша удаляются при чтении — lazy eviction)
            |   → конвертация суммы заказа в рубли через convertToRub (lib/rates/):
            |       RUB → без изменений
            |       USD/EUR → ручной курс (widget_lavatop_manual_rate_usd/eur),
            |                  при отсутствии → курс ЦБ РФ (cbr-xml-daily.ru)
            |   → недоступен курс → fail-closed (enabled:false)
            |   → при ошибке резолвинга: enabled=false, ok:true (fail-closed)
            |
            | Ответ: { ok, config: { lifepay: { enabled }, lavatop: { enabled } } }
            |         (WidgetAvailabilityConfig, shared/widgetSettingsTypes.ts)
            v
[ Виджет выбирает gateway по конфигу ]
            |
            | POST /api/widgets/intent-lifepay  (Content-Type: text/plain, тело — JSON-строка)
            | POST /api/widgets/intent-lavatop  (аналогично)
            v
[ api/widgets/intent-lifepay.ts | api/widgets/intent-lavatop.ts ]
            | CORS-whitelist: per-method (lifepayDomains | lavatopDomains)
            | parseBody(req) — ручной разбор text/plain без preflight
            | Серверный hard-limit: WIDGET_INTENT_HARD_LIMIT_RUB = 500_000 ₽
            | (применяется до пользовательского per-user-max из настроек)
            | invokeByGateway('lifepay'|'lavatop', 'createBill'|'createInvoice')
            | Audit-лог через loggerLib.writeServerLog
            v
[ p/saas/gw/lifepay | p/saas/gw/lavatop ]
            v
[ LifePay / Lava.Top HTTP API ]
            |
            v
[ Ответ → виджет → QR-модалка (LifePay) | редирект на форму (Lava.Top) ]
```

### Поток: deal-поток по GetCourse deal id (реализовано 2026-05-31)

Userscript на странице GetCourse извлекает deal id из URL, затем запрашивает сервер, который резолвит сумму/email через GC-гейтвей и создаёт счёт LifePay или инвойс Lava.Top.

```
[ Браузер покупателя (страница GC — /sales/shop/dealPay/id/<id>/... или ?id=<id>&...) ]
            |
            | userscripts/common.js — extractDealIdFromUrl()
            |   парсит оба формата URL; path-формат приоритетнее; null → тихий выход
            v
[ userscripts/lifepay-widget.user.js     | userscripts/lavatop-widget.user.js ]
  postWidgetIntentByDeal({ dealId,          postWidgetIntentByDeal({ dealId,
    method: 'lifepay' })                      method: 'lavatop', currency })
  POST /api/widgets/intent-by-deal            (3 кнопки: RUB / USD / EUR)
            |                                          |
            v                                          v
[ api/widgets/intent-by-deal.ts — ветвление по method ]
            |
            +-- method: 'lifepay' --------------------------+
            |   CORS: widget_lifepay_domains                |
            |   resolveGcDeal → только RUB                  |
            |   invokeByGateway('lifepay','createBill')      |
            |   → { ok, paymentUrl, orderNumber,            |
            |        correlationId, requestId }             |
            |                                               |
            +-- method: 'lavatop' --------------------------+
                CORS: widget_lavatop_domains
                resolveGcDeal → cost (RUB), email
                handleLavatopDealIntent (lib/gateway/lavatopDealIntent.ts):
                  фильтр суммы (hard-limit + widget_lavatop_min/max)
                  convertRubTo(cost, currency)  (lib/rates/currencyConverter.ts)
                    RUB → тождество
                    USD/EUR → ручной курс (widget_lavatop_manual_rate_usd/eur)
                             или курс ЦБ РФ (cbr-xml-daily.ru / @app/request)
                  проверка MIN_AMOUNT по валюте (RUB 10, USD 1, EUR 1)
                  runWithExclusiveLock('lavatop-offer:'+offerId):
                    updateOfferPrice(offerId, productId, amount, currency)
                    createInvoice(offerId, email, currency,
                                  clientOrderId='{dealId}')  // числовой, без префикса
                → { ok, paymentUrl, ... } → редирект браузера

[ Общий инвариант: resolveGcDeal ]
    invokeByGateway(ctx,'gc','getDealFields',{dealId},{httpMethod:'GET'})
    invokeByGateway(ctx,'gc','getUserFields',{userId},{httpMethod:'GET'})
    извлекает из responseBody.data.data: cost, currency, user_id, title, is_payed
    email из getUserFields; email в логи НЕ пишется (PII)
    возвращает { ok, amount, currency, email, title, userId }
              или { ok: false, code: WIDGET_GC_* }
```

**Архитектурные решения deal-потока:**

- **(A1) Единый deal-поток для обоих гейтвеев.** LifePay и Lava.Top работают через один эндпоинт `intent-by-deal`, ветвление по `method`. `intent-lavatop.ts` (offer-поток) помечен deprecated, код не изменён.
- **(A2) LifePay — только RUB.** `createBill` не принимает параметр валюты. При `currency != 'RUB'` в сделке GC — `WIDGET_GC_CURRENCY_UNSUPPORTED`.
- **(A3) Lava.Top — конвертация RUB→валюта оплаты.** `createInvoice` не принимает `amount` (берёт из оффера). Поэтому поток: рублёвый `cost` → конвертация → `updateOfferPrice` → `createInvoice`. Лок `runWithExclusiveLock` защищает от гонок при одновременных заявках на один оффер. `clientOrderId = '{dealId}'` (числовой dealId без префикса) обеспечивает связку webhook → request_log.
- **(A4) Единый продукт Lava.Top.** Один `offerId` + `productId` из настроек (`widget_lavatop_offer_id`, `widget_lavatop_product_id`) для всех заказов. Маппинг GC-оффер → Lava.Top-оффер не нужен. Offer-фильтр (`widget_lavatop_offer_ids`) в deal-потоке Lava.Top **не** применяется.
- **(A5) Данные только из GC.** Сумма, валюта и email берутся из GetCourse, а не из DOM/data-атрибутов страницы.
- **(A6) Предусловие оператора.** Домен GC-страницы должен быть в whitelist соответствующего гейтвея; GC-настройки заполнены, `gc_enabled=true`.

### CORS-стратегия

Chatium не поддерживает `app.options`, поэтому preflight-запросы (`OPTIONS`) невозможны. Виджеты отправляют **simple-request** с `Content-Type: text/plain` и JSON-строкой в теле. Сервер читает и парсит тело вручную через `parseBody(req)`. CORS-заголовки выставляются только при допустимом Origin; Origin проверяется через `shared/widgetCorsCheck.ts` (`parseDomains`, `extractHostname`, `isOriginAllowed`, `checkWidgetOrigin`).

### Per-method whitelist доменов

- `widget_lifepay_domains` — список доменов для `/api/widgets/intent-lifepay` и для ветки LifePay в `/api/widgets/config`.
- `widget_lavatop_domains` — список доменов для `/api/widgets/intent-lavatop` и для ветки Lava.Top в `/api/widgets/config`.
- `/api/widgets/config` — **per-method модель** (с 2026-06-01): `lifepay.enabled` требует Origin в `widget_lifepay_domains` (`checkWidgetOrigin(headers, settings.lifepayDomains)`); `lavatop.enabled` — в `widget_lavatop_domains` (`checkWidgetOrigin(headers, settings.lavatopDomains)`). Условие `enabled` для метода: `<m>Cors.allowed AND settings.<m>Enabled AND offerOk AND amountOk`. HTTP 403 `CORS_ORIGIN_NOT_ALLOWED` выдаётся только если Origin не входит НИ В ОДИН список; при частичном совпадении — `enabled:false` для метода с несовпавшим списком, ответ `ok:true`. Ранее использовалось объединение обоих списков для единой проверки — эта схема приводила к тому, что `lifepay.enabled` выдавалось при Origin, разрешённом только для Lava.Top, и наоборот. HTTP 500 `WIDGET_CONFIG_ERROR` — fail-closed при сбое чтения настроек. ACAO/`Vary: Origin` выставляются только при допустимом Origin.

### Offer-фильтр виджетов (двухуровневая модель, реализовано 2026-06-01)

Фильтр виджетов по позициям заказа работает на двух независимых уровнях.

**Уровень 1 — клиент (показ виджета, `userscripts/common.js`):**

```
[ Страница GC — DOM-блок .deal-positions ]
  <li class="offer-position-{posId}" data-offer-id="{offerId}">
    <span class="position-actual-title">{title}</span>

  extractDealPositions() → [{id}]
  areAllPositionsAllowed(positions, offerListType, offers)
    → true: все разрешены → рендерить виджет
    → false: хотя бы одна запрещена → тихий выход
```

**Уровень 2 — сервер (допуск к intent, `api/widgets/intent-by-deal.ts`):**

```
  lib/gateway/gcDealResolver.ts — getDealFields → positions[]{id} из GC
  shared/widgetSettingsTypes.ts — areAllOffersAllowed(positions, settings)
    → true: продолжить поток (LifePay / Lava.Top)
    → false: 403 WIDGET_OFFER_NOT_ALLOWED
```

**Формат хранения офферов:**

- Новые ключи: `widget_lifepay_offers` / `widget_lavatop_offers` — JSON-массив `{id,title}[]` (`AllowedOffer[]`).
- Legacy fallback: `widget_offer_ids` — старый comma-separated список строк; `parseAllowedOffers` поддерживает оба формата при чтении. `lib/widget/widgetSettings.lib.ts` читает новый ключ с fallback на legacy.

**Семантика проверки** (синхронизирована между `shared/widgetSettingsTypes.ts` и `userscripts/common.js`, помечена якорями «СИНХРОНИЗИРОВАНО»):
- Сверка **только по `id`**. `title` в настройках — лишь подпись для админки, в сравнении не участвует.
- `'off'`: фильтр не применяется — `isOfferAllowed` / `areAllOffersAllowed` возвращают `true` без проверки списка. Это единственный режим, при котором виджет и платёж работают при пустом списке офферов. **Дефолт**: несохранённый ключ `widget_lifepay_offer_list_type` / `widget_lavatop_offer_list_type` интерпретируется как `'off'` (DEFAULTS в `lib/settings.lib.ts`). Применяется одинаково на уровне config-эндпоинта (показ) и intent-эндпоинтов (авторизация платежа) — единый источник правды `areAllOffersAllowed`.
- `'whitelist'`: позиция разрешена, если её `id` есть в списке.
- `'blacklist'`: позиция разрешена, если её `id` нет в списке.
- Режим «Выключен» в веб-панели эмитит `listType='off'`. **Инвариант**: пустой список офферов при сохранении принудительно переводится в `'off'` — нельзя сохранить `whitelist`/`blacklist` без офферов; нормализует и legacy-записи. `areAllPositionsAllowed` в `userscripts/common.js` при `'off'` → `true` (синхронизировано с сервером).

**Удалённый мёртвый код:**
- `isOfferMatched`, `extractOrderAmount`, `isAmountInRange`, `postWidgetIntent` — удалены из `userscripts/common.js`.
- `data-offer-id` на якоре виджета — удалён из сниппетов (`components/home/HomeWidgetSettings.vue`, `HomeWidgetOfferList.vue`).
- Старый серверный offer-фильтр по одному `offerId` — удалён из `intent-by-deal`, `intent-lifepay`, `intent-lavatop` (в `intent-lavatop` `offerId` как продуктовый параметр `createInvoice` сохранён).

### Файлы виджетного слоя

| Файл                                       | Назначение                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `userscripts/common.js`                    | Shared-утилиты в `window.GwWidgetCommon`: DOM-ожидание, `fetchWidgetConfig` (**с 2026-06-01: POST** вместо GET, передаёт `{ dealId, positions }` в теле), `postWidgetIntentByDeal`, `extractDealIdFromUrl`, постинг intent, модалка, фильтры суммы/офферов. `extractDealPositions`, `areAllPositionsAllowed` (клиентский DOM-фильтр позиций; **помечена @deprecated** после переноса логики на сервер). Ранний выход `if(!dealId) return` сохранён. |
| `userscripts/lifepay-widget.user.js`       | Виджет LifePay: deal id из URL → `fetchWidgetConfig(dealId, positions)` → если `config.lifepay.enabled` — `postWidgetIntentByDeal` → QR-модалка. Клиентский offer-гейт убран (решение принимает сервер). `data-offer-id` на якоре удалён. |
| `userscripts/lavatop-widget.user.js`       | Виджет Lava.Top: deal id из URL → `fetchWidgetConfig(dealId, positions)` → если `config.lavatop.enabled` — 3 кнопки валют (RUB/USD/EUR) → `postWidgetIntentByDeal({method:'lavatop', currency})` → редирект. Клиентский offer-гейт убран. |
| `lib/rates/currencyConverter.ts`           | `convertRubTo(amount, currency)` — конвертация RUB в RUB (тождество) / USD / EUR. `convertToRub(amount, currency)` — обратная конвертация: валюта → рубли (умножение на курс); используется в `resolveGcDealAmount` для приведения суммы non-RUB заказов к рублям перед сравнением с диапазоном. Приватный `getRubForOne(currency)` — единый источник курса для обоих направлений: ручной курс (`widget_lavatop_manual_rate_*`) → курс ЦБ РФ (cbr-xml-daily.ru / `@app/request`). Результат: `{ok, amount, rate, source:'identity'\|'manual'\|'cbr'}` или `{ok:false, code:'RATE_UNAVAILABLE'}`. `roundToCents` — округление до 2 знаков. |
| `lib/gateway/lavatopDealIntent.ts`         | `handleLavatopDealIntent(ctx, {offerId, productId, gcDeal, currency})` — оркестратор Lava.Top deal-потока. **С 2026-06-01:** вызывается после серверной проверки `areAllOffersAllowed` в `intent-by-deal`. |
| `lib/gateway/gcDealResolver.ts`            | `resolveGcDeal(ctx, dealId)` — резолвинг сделки GC: getDealFields → getUserFields. **С 2026-06-01:** возвращает также `positions: {id}[]` из `getDealFields.positions[].offer_id` — для серверной проверки офферов (сверка только по id). Email в логи не пишется (PII). |
| `api/widgets/intent-by-deal.ts`            | POST /api/widgets/intent-by-deal — ветвление по `method`. **С 2026-06-01:** серверная проверка `areAllOffersAllowed(positions, settings)` до запуска платёжного потока; 403 `WIDGET_OFFER_NOT_ALLOWED` при запрещённой позиции. |
| `api/widgets/intent-lavatop.ts`            | POST /api/widgets/intent-lavatop — **deprecated** (offer-поток Lava.Top). `offerId` как продуктовый параметр `createInvoice` сохранён. |
| `shared/widgetCorsCheck.ts`                | Pure-функции CORS-проверки (`// @shared`)                                                                                                |
| `shared/widgetSettingsTypes.ts`            | **С 2026-06-01:** `AllowedOffer{id,title}`; `offers` вместо `offerIds` в `WidgetSettingsData`/`WidgetPublicConfig`; `parseAllowedOffers` (поддержка нового формата + legacy); `isOfferAllowed`/`areAllOffersAllowed` — серверные чистые функции; ключи `WIDGET_LIFEPAY_OFFERS`, `WIDGET_LAVATOP_OFFERS`. |
| `lib/widget/widgetSettings.lib.ts`         | `getWidgetSettings(ctx)` — параллельное чтение виджет-ключей; с 2026-06-01 читает `widget_lifepay_offers`/`widget_lavatop_offers` с fallback на legacy `widget_offer_ids`. |
| `api/widgets/config.ts`                    | **POST** /api/widgets/config — публичный; с 2026-06-01 метод изменён с GET на POST. Принимает `{ dealId, positions }`, возвращает `WidgetAvailabilityConfig { config: { lifepay: {enabled}, lavatop: {enabled} } }`. Решение о `enabled` принимается на сервере: offer-фильтр + проверка суммы через `resolveGcDealAmount` + `GcDealCache`. |
| `lib/gateway/gcDealResolver.ts` (resolveGcDealAmount) | `resolveGcDealAmount(ctx, dealId)` — лёгкий резолвер **только суммы** (один вызов `getDealFields`, без getUserFields/email/валюты). Оплаченная сделка → `ok:false`. Используется только в config-эндпоинте. В отличие от `resolveGcDeal` (intent-поток), не запрашивает email и не возвращает positions. |
| `lib/gateway/gcDealCache.ts`               | `getCachedGcDealAmount` / `setCachedGcDealAmount` — TTL-кэш суммы GC-сделки (TTL=60с). Таблица `GcDealCache` (`tables/gcDealCache.table.ts`). Без `runWithExclusiveLock` — гонка при параллельных запросах безвредна (перезапись той же суммы). Поле `amount` = рублёвый эквивалент суммы заказа. Устаревшие записи удаляются при чтении (lazy eviction при cache miss). |
| `api/widgets/intent-lifepay.ts`            | POST /api/widgets/intent-lifepay — публичный intent LifePay (offer-поток). Старый одиночный offer-фильтр удалён.                         |
| `api/widgets/settings-get.ts`              | GET настроек виджетов (`guardInternalApi`, `// @shared-route`)                                                                            |
| `api/widgets/settings-save.ts`             | POST сохранения настроек виджетов (`guardInternalApi`, `// @shared-route`, whitelist ключей)                                             |
| `api/widgets/offers.ts`                    | GET офферов GetCourse (`guardInternalApi`, `// @shared-route`, проксирует `getOffers`)                                                   |
| `api/settings/save-operational.ts`         | POST сохранения operational-настроек (`guardInternalApi`, `// @shared-route`, whitelist `gc_enabled`)                                    |
| `components/home/HomeWidgetSettings.vue`   | Карточка настроек виджетов: с 2026-06-01 хранит `{id,title}[]`; режим «Выключен»=blacklist+[]; сниппеты без `data-offer-id`/`data-email`. |
| `components/home/HomeWidgetOfferList.vue`  | Переиспользуемая секция фильтра офферов (whitelist/blacklist + поиск + чекбоксы); с 2026-06-01 оперирует `{id,title}[]`.                 |
| `pagecss/sbpWidgetsCss1.ts`                | CSS виджет-карточки, классы `.aw-*`                                                                                                      |

### Роутинг виджетных эндпоинтов (config/routes.tsx)

7 записей в `ROUTES` и `ROUTE_PATHS`: `widgetConfig`, `widgetIntentLifepay`, `widgetIntentLavatop`, `widgetIntentByDeal`, `widgetSettingsGet`, `widgetSettingsSave`, `widgetOffers`.

## Downstream-вызов GC createDeal из webhook LifePay (реализовано 2026-06-01)

При успешной оплате LifePay webhook-приёмник вызывает downstream-операцию `createDeal` в GetCourse-гейтвее — обновляет заказ (статус `payed`, признак оплаты `deal_is_paid='1'`).

### Поток шага 5a в `web/webhook/index.tsx`

```
POST /web/webhook?token=...&correlationId=<id>
  → validateToken                        (шаги 1–2: токен)
  → guard «legacy-strict»                (шаг 3: correlationId + request_log lookup)
  → unwrapWebhookBody / parseWebhookBody (шаг 4: разбор тела)
  → запись в webhook_log + дедупликация  (шаг 5: dedupeResult = 'first' | 'duplicate')
  → socket-публикация                    (если не дубль)
  → шаг 5a: downstream createDeal        ← НОВЫЙ
      только при dedupeResult === 'first'
         AND isSuccessfulPayment         (type='payment', status='success')
         AND orderNumber непустой
         AND email непустой
      → updateGcDealOnPayment(ctx, input)
          buildCreateDealArgs({ email, orderNumber, amount? })
          invokeByGateway(ctx,'gc','createDeal',{params:{user:{email},deal:{...}}},{httpMethod:'POST'})
          success → severity 6 (info)
          ошибка  → severity 3 (error), не бросает
      → обёрнут в try/catch, гарантирует 200 при любом исходе
  → ответ 200 OK
```

### Ключевые файлы

| Файл | Роль |
|------|------|
| `lib/webhook/gcDealUpdate.ts` | `buildCreateDealArgs` (pure) + `updateGcDealOnPayment` (вызов gateway) |
| `web/webhook/index.tsx` | Врезка шага 5a после дедупликации |
| `lib/tests/lifepayUnitPhase4Webhook.ts` | Юнит-тесты `buildCreateDealArgs` (чистая функция) |

### Идемпотентность и ограничения

- Downstream выполняется **только при `dedupeResult==='first'`** — дедупликация на стороне `webhook_idempotency` гарантирует однократность при повторных ретраях LifePay.
- **Нет авто-ретрая при сбое createDeal.** Если gateway GC ответил ошибкой, вторичный ретрай LifePay придёт как `duplicate` → downstream не повторится. Осознанное ограничение MVP.
- PII (email) логируется только через `hasEmail: true/false`; в тело запроса к GC-гейтвею email передаётся без логирования.
- `deal_is_paid='1'` — строка (требование валидатора gateway GC); `deal_cost` — число или отсутствует.

### Внешняя зависимость

Контракт операции `createDeal` (поля `deal_number`, `deal_status`, `deal_is_paid`, `deal_cost`) определён в `p/saas/gw/gc/lib/gateway/operationsCatalogLegacy.ts`. Base64-кодирование `params` выполняет сам gateway, клиент передаёт только `{params}`. Изменение контракта на стороне gateway сломает downstream-вызов здесь — синхронизация ответственности изменяющего gateway.

## Безопасность

- `requireRealUser(ctx)` + `requireInternalAccess(ctx)` (через `guardInternalApi`) — все `/api/lp/*` и главный роут `/`. Реализовано 2026-05-24 (закрыт auth-разрыв аудита).
- Webhook — анонимный, но с обязательной сверкой токена.
- MD5-подпись webhook **не** проверяется: LifePay её не публикует (нет полей `check`/`signature`/`hash` в теле, нет описания алгоритма на apidoc.life-pay.ru/notification). Если LifePay в будущем добавит подпись — вернуться к этому пункту.
- Дедупликация webhook через `runWithExclusiveLock` из `@app/sync` + `findByField` + create в `webhook_idempotency` (Heap-схема не выражает unique constraint напрямую).
- Уникальность токена инвайта и userId гранта — на уровне приложения (`accountNanoid` + `runWithExclusiveLock`), Heap-схема unique constraint не выражает.
