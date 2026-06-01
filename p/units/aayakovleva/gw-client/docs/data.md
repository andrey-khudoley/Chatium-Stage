# Data

## Heap таблицы

| Table                                    | File                               | Назначение                                                                                                                              | Основные поля                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| t**lifepay-sbp-client**setting\_\_a9Hk2P | tables/settings.table.ts           | Настройки проекта (key-value)                                                                                                           | key (string), value (any)                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| t**lifepay-sbp-client**log\_\_b3Lm7R     | tables/logs.table.ts               | Серверные логи (долгосрочное хранение)                                                                                                  | message, payload, severity, level, timestamp                                                                                                                                                                                                                                                                                                                                                                                                                |
| t**lifepay-sbp-client**reqlog\_\_c7Np4S  | tables/requestLog.table.ts         | Журнал исходящих вызовов payments-gateway (§1.8.1)                                                                                      | requestId (searchable), op, argsRedacted (хранится сырым, имя колонки оставлено), orderNumber (searchable), **correlationId** (Heap.Optional String; UUID из args, для надёжной связки с webhook; без searchable — точный where-матч), clientHttpStatus, ok, errorCode, lpHttpStatus, lpSemanticRule, lpNumericCode, durationMs, requestedAt, **rawResponseBody** (Heap.Any, полное тело ответа gateway, raw, без маскирования)                             |
| t**lifepay-sbp-client**whlog\_\_d2Pq8T   | tables/webhookLog.table.ts         | Журнал входящих webhook от LifePay (§1.8.1, записывается только при валидном токене)                                                    | number (searchable), type, status, method, amount, orderNumber (searchable), **correlationId** (Heap.Optional String; из query callbackUrl, для связки с request_log; без searchable — точный where-матч), tokenValid, duplicate, processedAt, **email** (Heap.Optional, сырой email; старое имя `emailMasked` удалено), **rawBody** (Heap.Optional Heap.Any, полное тело webhook, raw), **rawQuery** (Heap.Optional Heap.Any, query параметры с raw token) |
| t**lifepay-sbp-client**whidem\_\_e8Rs1V  | tables/webhookIdempotency.table.ts | Дедупликация webhook по transaction number (§1.8.3)                                                                                     | number (searchable), firstSeenAt                                                                                                                                                                                                                                                                                                                                                                                                                            |
| t**lifepay-sbp-client**paccess\_\_g7Cy3M | tables/panelAccess.table.ts        | Выданные доступы к панели для не-Admin (ADR 0003). **Реализовано 2026-05-24**, используется `repos/panelAccess.repo.ts`, `lib/access/*` | userId (searchable), grantedAt, grantedByUserId, inviteId, revokedAt?, revokedByUserId?                                                                                                                                                                                                                                                                                                                                                                     |
| t**lifepay-sbp-client**pinvite\_\_f4Wb9K | tables/panelInvites.table.ts       | Одноразовые пригласительные токены (ADR 0003). **Реализовано 2026-05-24**, используется `repos/panelInvites.repo.ts`, `lib/access/*`    | token (searchable), createdByUserId, issuedAt, expiresAt, usedAt?, usedByUserId?, revokedAt?, note?                                                                                                                                                                                                                                                                                                                                                         |
| t**lifepay-sbp-client**gcdcache\_\_m7Nq3X | tables/gcDealCache.table.ts      | TTL-кэш суммы GC-сделки для `POST /api/widgets/config`. **Реализовано 2026-06-01.** Снижает нагрузку на GC-гейтвей при повторных вызовах config-эндпоинта. `amount` = рублёвый эквивалент суммы заказа (non-RUB конвертируются через `convertToRub` перед записью). Устаревшие записи (TTL истёк) удаляются при чтении (lazy eviction при cache miss). | dealId (searchable), cachedAt (Unix ms), amount (Number, рубли)                                                                                                                                                                                                                                                                                                                                                                                              |

## Кэш суммы сделки GC

### `gc_deal_cache` (`t__lifepay-sbp-client__gcdcache__m7Nq3X`, `tables/gcDealCache.table.ts`)

TTL-кэш суммы GetCourse-сделки в рублях. Нужен, чтобы повторные загрузки страницы виджета (`POST /api/widgets/config`) не инициировали новый запрос к GC-гейтвею на каждый вызов.

| Поле       | Тип                 | Описание                                                                 |
| ---------- | ------------------- | ------------------------------------------------------------------------ |
| `dealId`   | String (searchable) | ID сделки GC. Уникальность — на уровне upsert-логики в `gcDealCache.ts`. |
| `cachedAt` | Number (Unix ms)    | Момент кэширования. TTL = 60 секунд (константа в коде, не в настройках). |
| `amount`   | Number              | Рублёвый эквивалент суммы заказа. Для RUB-сделок — исходная сумма; для USD/EUR — конвертированная через `convertToRub` (ручной курс → ЦБ РФ). |

**Реализация (`lib/gateway/gcDealCache.ts`):**

- `getCachedGcDealAmount(ctx, dealId)` — ищет запись, проверяет `cachedAt + 60_000 > now`. При устаревании — пропуск (miss); устаревшая запись удаляется (lazy eviction).
- `setCachedGcDealAmount(ctx, dealId, amount)` — upsert (create или update по dealId). Без `runWithExclusiveLock` — гонка безвредна: при параллельных запросах один из upsert-ов перезапишет другой той же суммой, двойного учёта нет.
- Таблица накапливается; явной периодической очистки нет — устаревшие записи удаляются при каждом cache miss (known limitation: размер таблицы ограничен только частотой запросов).

**Резолвер суммы (`lib/gateway/gcDealResolver.ts`):**

- `resolveGcDealAmount(ctx, dealId)` — лёгкий резолвер **только суммы**: один вызов `getDealFields` через GC-гейтвей; не запрашивает email/userId. Получает сырую сумму и валюту заказа, затем вызывает `convertToRub(amount, currency)` (`lib/rates/currencyConverter.ts`) для приведения к рублям (RUB — без изменений; USD/EUR — ручной курс панели → курс ЦБ РФ; недоступен → `ok:false`). Уже оплаченная сделка (`is_payed=true`) → `ok:false`. Отличается от `resolveGcDeal` (intent-поток), который дополнительно вызывает `getUserFields` и возвращает полный набор полей. Используется только в `api/widgets/config.ts`.

## Таблицы внутренней авторизации (ADR 0003)

> ✅ **Реализовано 2026-05-24.** Механизм полностью написан: `repos/panelAccess.repo.ts`, `repos/panelInvites.repo.ts`, `lib/access/*` (requireInternalAccess, invites, constants, apiGuard). Все эндпоинты `api/lp/*` и главный роут `/` защищены `requireRealUser` + `requireInternalAccess`. Обоснование модели — [ADR 0003](ADR/0003-internal-access-control.md), полный норматив — [implementation-plan §1.11](../../../../saas/gw/lifepay/docs/gateway/implementation-plan.md).

Типы: `UserRefLink` плана выражен как `Heap.String` (ID пользователя), `DateTime` — как `Heap.Number` (Unix ms). Дедицированных Heap-типов в проекте нет (зеркало `requestLog.table.ts`, `webhookIdempotency.table.ts`).

### `panel_access` (`t__lifepay-sbp-client__paccess__g7Cy3M`, `tables/panelAccess.table.ts`)

Одна запись на пользователя, которому выдан доступ к панели. Admin Chatium-аккаунта проходит проверку `requireInternalAccess` **без** записи здесь.

| Поле              | Тип                 | Описание                                                                                                                                                                      |
| ----------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `userId`          | String (searchable) | ID пользователя с доступом. Уникальность — на уровне приложения (`consumeInvite`, не Heap-схема). Searchable: основной путь чтения — поиск по ID при `requireInternalAccess`. |
| `grantedAt`       | Number (Unix ms)    | Момент выдачи доступа.                                                                                                                                                        |
| `grantedByUserId` | String              | ID Admin'а, через инвайт которого выдан доступ.                                                                                                                               |
| `inviteId`        | String              | ID использованного инвайта (`panel_invites.id`, для аудита).                                                                                                                  |
| `revokedAt`       | Optional Number     | Момент отзыва (null = активен). Запись с непустым `revokedAt` недействительна → `requireInternalAccess` отдаёт 403.                                                           |
| `revokedByUserId` | Optional String     | Кто отозвал (null = активен).                                                                                                                                                 |

Повторная выдача доступа тому же пользователю — **обновление** существующей записи (сброс `revokedAt`/`revokedByUserId`, новые `grantedAt`/`grantedByUserId`/`inviteId`).

### `panel_invites` (`t__lifepay-sbp-client__pinvite__f4Wb9K`, `tables/panelInvites.table.ts`)

Одноразовые пригласительные токены. Жизненный цикл: создан Admin → передан получателю → потреблён по `/web/access/invite` (проставлены `usedAt`/`usedByUserId`). До потребления ссылка валидна любое число открытий в пределах TTL и пока Admin не отозвал (см. норматив §1.11.4).

| Поле              | Тип                 | Описание                                                                                                                                                                                 |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`           | String (searchable) | Токен ≥ 32 символа, генерируется `accountNanoid(ctx)`. Уникальность — на уровне приложения (`runWithExclusiveLock` при потреблении). Searchable: путь чтения — поиск по строке из query. |
| `createdByUserId` | String              | ID Admin'а, создавшего инвайт.                                                                                                                                                           |
| `issuedAt`        | Number (Unix ms)    | Момент создания. Имя `createdAt` зарезервировано Heap под системное поле — используем явное `issuedAt` (как `requestedAt` в `request_log`).                                              |
| `expiresAt`       | Number (Unix ms)    | `issuedAt + INVITE_TTL_DAYS` (план — 7 дней, константа в `lib/access/constants.ts`).                                                                                                     |
| `usedAt`          | Optional Number     | Момент потребления (null = не использован).                                                                                                                                              |
| `usedByUserId`    | Optional String     | Кто использовал.                                                                                                                                                                         |
| `revokedAt`       | Optional Number     | Момент отзыва Admin'ом (null = активен).                                                                                                                                                 |
| `note`            | Optional String     | Комментарий Admin'а при создании (например «для Ольги»).                                                                                                                                 |

## Настройки (Heap key-value)

Стандартные:

- `project_name` — отображаемое имя (default: `Payments Client`).
- `project_title` — заголовок (default: `Payments Client`).
- `log_level` (Debug / Info / Warn / Error / Disable).
- `logs_limit`.
- `log_webhook` (`{ enable, url }`).
- `dashboard_reset_at` (Unix ms).

LifePay-настройки (§1.8.1, валидируются в `lib/settings.lib.setSetting`):

- `lp_apikey` — API-ключ магазина LifePay (тип password, непустой после trim).
- `lp_login` — телефон владельца в формате `7XXXXXXXXXX` (11 цифр, первая 7).
- `lp_webhook_token` — случайный токен ≥ 32 символов (тип password, генерируется кнопкой «Сгенерировать» в панели).
- `gateway_base_url` — публичный базовый URL LifePay payments-gateway (http(s)://...).

Lava.Top-настройки (добавлены 2026-05-28, валидируются в `lib/settings.mutations.setSetting`):

- `lava_test_apikey` — API-ключ магазина Lava.Top (тип password, непустой после trim).
- `lava_base_url` — базовый URL Lava.Top gateway (default `https://gate.lava.top`).
- `lava_webhook_secret` — секрет webhook Lava.Top (тип password, ≥ 16 символов; передаётся как `X-Api-Key` или Basic Authorization). Без значения приёмник `/web/webhook-lavatop` возвращает 503.

GetCourse-настройки (добавлены 2026-05-28, валидируются в `lib/settings.mutations.setSetting`):

- `gc_base_url` — базовый URL GC gateway (http(s)://...).
- `gc_test_school_api_key` — API-ключ школы GetCourse (тип password, непустой после trim; маскируется в exit-логе).
- `gc_test_school_host` — хост школы GetCourse (валидируется `isValidGcSchoolHost`).
- `gc_enabled` — флаг включения гейтвея GC (`'true'` / `'false'`).

Виджет-настройки (добавлены 2026-05-29, типы — `shared/widgetSettingsTypes.ts`, агрегатор — `lib/widget/widgetSettings.lib.ts`, валидация в `lib/settings.mutations.setSetting`):

- `widget_lifepay_enabled` — флаг включения LifePay-виджета (`'true'` / `'false'`). При `false` — `/api/widgets/intent-lifepay` возвращает 403 `WIDGET_DISABLED`.
- `widget_lifepay_domains` — список разрешённых доменов для CORS-проверки LifePay-виджета (newline-separated, валидируется через `parseDomains` в `shared/widgetCorsCheck.ts`).
- `widget_lifepay_max_amount` — максимальная сумма одного платежа через LifePay-виджет (число > 0, ₽); применяется после серверного hard-limit 500 000 ₽.
- `widget_lavatop_enabled` — флаг включения Lava.Top-виджета.
- `widget_lavatop_domains` — список разрешённых доменов Lava.Top-виджета.
- `widget_lavatop_max_amount` — максимальная сумма платежа через Lava.Top-виджет.
- `widget_offer_list_type` — режим фильтрации офферов: `'whitelist'` (только указанные) или `'blacklist'` (все, кроме указанных). Дефолт — `'blacklist'` (= режим «Выключен» в веб-панели). Парсится `parseOfferListType` из `shared/widgetSettingsTypes.ts`.

Offer-ключи (переработаны 2026-06-01 — двухуровневый фильтр позиций заказа):

- `widget_lifepay_offers` — JSON-массив `AllowedOffer[]` (`{id: string, title: string}`) для LifePay-виджета. Новый формат с 2026-06-01. Сверка позиций заказа идёт **только по `id`** (точное совпадение); `title` хранится лишь как подпись для отображения в админке и в сравнении не участвует (с 2026-06-01 нечёткая сверка по названию убрана как хрупкая и избыточная). Читается `lib/widget/widgetSettings.lib.ts` → `parseAllowedOffers`.
- `widget_lavatop_offers` — аналогично для Lava.Top-виджета. JSON `AllowedOffer[]`.
- `widget_offer_ids` (**legacy, только чтение**) — старый comma-separated список строк `offerId`. `parseAllowedOffers` поддерживает этот формат как fallback при отсутствии новых ключей: строки преобразуются в `{id: s, title: ''}`. Новые записи сохраняются в `widget_lifepay_offers`/`widget_lavatop_offers`.

Lava.Top deal-поток (добавлены 2026-05-31, геттеры и `isValidManualRate` — `lib/settings.lib.ts`):

- `widget_lavatop_offer_id` — ID оффера Lava.Top для deal-потока (единственный продукт, общий для всех заказов). Обязателен для `intent-by-deal` при `method:'lavatop'`.
- `widget_lavatop_product_id` — ID продукта Lava.Top (передаётся в `updateOfferPrice`). Обязателен совместно с `widget_lavatop_offer_id`.
- `widget_lavatop_manual_rate_usd` — ручной курс USD к RUB (число > 0). Приоритетнее курса ЦБ РФ. Если не задан — используется курс ЦБ. Валидируется `isValidManualRate`.
- `widget_lavatop_manual_rate_eur` — ручной курс EUR к RUB (число > 0). Аналогично USD.

Фильтр панели:

- `panel_date_filter` — глобальный фильтр вкладки «Обзор» по дате/времени: `{ from?: number, to?: number }` (Unix ms, таймзона браузера). При отсутствии или пустом значении — все данные (до кэпа `ANALYTICS_SCAN_LIMIT`). Читается на сервере через `getPanelDateFilter(ctx)` в `lib/settings.lib.ts`; меняется через `POST /api/lp/analytics/filter-save` (доступен любому пользователю с доступом к панели). Общий для всех пользователей и сессий.

Секреты в логи (`writeServerLog`, `argsRedacted`) **не пишутся**. В Heap значения хранятся как строки.

## Репозитории (repos/)

- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey.
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp, countBySeverityAfter / Errors / Warnings.
- `repos/requestLog.repo.ts` — create, **findInRange** (основной путь; cursor-пагинация ≤ 1000, up to limit), **countInRange**, **countOkInRange**, findByRequestId, **findById**, findByOrderNumber, **findByCorrelationIds** (батч-выборка по списку correlationId через `where: { correlationId: { $in: ids } }`; используется для обогащения orderNumber в `/api/lp/recent-webhooks`). `findRecent`, `findBeforeRequestedAt`, `findRecentSince` — **@deprecated**, заменены на `findInRange`. Поле упорядочения — `requestedAt` (Unix ms, наше явное поле; не системное `createdAt`).
- `repos/webhookLog.repo.ts` — create, **findInRange** (cursor-пагинация), **countInRange**, **countStatusSuccessInRange**, **countTokenValidInRange**, **findByOrderNumberInRange**, **findByCorrelationIdInRange** (основной путь связки: `where: { correlationId, processedAt: { $gte/$lt } }`, лимит 100, без searchable), **findById**. `findRecent`, `findRecentSince` — **@deprecated**, заменены на `findInRange`.
- `repos/webhookIdempotency.repo.ts` — tryRegister (через `runWithExclusiveLock` из `@app/sync`), findByNumber.
- `repos/panelAccess.repo.ts` — findByUserId, findActiveByUserId, upsertGrant (создать или реактивировать), revokeByUserId, findAll, deleteByUserId. (ADR 0003, реализовано 2026-05-24.)
- `repos/panelInvites.repo.ts` — findByToken, findById, create, markUsed, revokeById, findAll, deleteById. (ADR 0003, реализовано 2026-05-24.)

## Библиотеки (lib/)

- `lib/settings.lib.ts` — getSetting/getAllSettings; ключи и дефолты; валидации `isValidLpLogin` (`^7\d{10}$`), `normalizeGatewayBaseUrl`, `isValidGatewayBaseUrl`, `isValidGcSchoolHost`; геттеры getLpApikey / getLpLogin / getLpWebhookToken / getGatewayBaseUrl + GC-геттеры (gc_base_url, gc_test_school_api_key, gc_test_school_host, gc_enabled); `generateWebhookToken(byteCount)`; **`getPanelDateFilter(ctx)`** — читает ключ `panel_date_filter` из Heap, возвращает `{ from?: number, to?: number }` (серверный вызов, только для API-эндпоинтов и SSR).
- `lib/logger.lib.ts` — без изменений: writeServerLog проверяет уровень, пишет в ctx.log, ctx.account.log, Heap, WebSocket, опц. webhook.
- `lib/gateway/constants.ts` — `INVOKE_TIMEOUT_MS = 15_000` (на 5 секунд больше gateway-таймаута 10 с), `RECENT_DEFAULT_LIMIT`, `RECENT_MAX_LIMIT`, `ANALYTICS_SCAN_LIMIT = 5000` (максимум записей, выгружаемых для аналитики через cursor-пагинацию ≤ 1000 на запрос; `ANALYTICS_DEFAULT_WINDOW_HOURS` удалён).
- `lib/gateway/buildInvokeUrl.ts` — чистая функция сборки URL `<base>/api/v1/<op>` + метода по каталогу LifePay (`shared/gatewayContract.findOperationInCatalog`, deprecated). Префикс `/api/` соответствует file-based роутингу gateway (`p/saas/gw/lifepay/api/v1/<op>.ts`). Lava.Top использует собственную сборку URL внутри `lib/gateway/lavatopClient.ts`.
- `lib/gateway/invokeClient.ts` — `invokeGateway(ctx, op, args)` (= `invokeLifepayGateway`): один исходящий вызов LifePay через `@app/request`, без серверных ретраев, без Idempotency-Key; читает секреты из Heap, заголовки `X-Lp-Apikey`/`X-Lp-Login`, тело JSON для POST или query для GET; `requestId` из заголовка `X-Gateway-Request-Id` ответа.
- `lib/gateway/lavatopClient.ts` (новый) — `invokeLavatopGateway(ctx, op, args)`: аналогично LifePay, но заголовок `X-Lava-Apikey`, base = `lava_base_url`, каталог `LAVATOP_OPERATIONS`.
- `lib/gateway/gcClient.ts` (новый) — `invokeGcGateway(ctx, op, args, httpMethod)`: исходящие вызовы к `<gc_base_url>/api/v1/<op>` с заголовками `X-Gc-School-Api-Key` + `X-Gc-School-Host`; `httpMethod` определяет метод HTTP-запроса.
- `lib/gateway/gcOperationsLoader.ts` (новый) — `fetchGcOperations(ctx)`: загружает список enabled-операций GC через `GET /api/v1/operations`; возвращает `GcOperationEntry[]`; при ошибке — пустой массив (graceful degradation).
- `lib/gateway/invokeDispatcher.ts` (расширен) — `invokeByGateway(ctx, gatewayId, op, args, meta?)`: выбирает клиент по `gatewayId` через switch с exhaustiveness-check; для `'gc'` явно проверяет наличие `meta.httpMethod`.
- `lib/gateway/invokeResult.ts` (новый) — общий тип `InvokeResult` + helpers (`buildProxyErrorResult`, `isTimeoutError`, `readResponseRequestId`, `readContentType`), переиспользуемые обоими клиентами.
- `lib/gateway/recordRequestLog.ts` — запись результата invoke в Heap-таблицу `request_log` с обязательным `gatewayId`. `argsRedacted` и `rawResponseBody` хранятся **сырыми** (клиент — оператор ПД), структурная гигиена через `shared/prepareRawLog.prepareRawLog`. Для `rawResponseBody`: предпочтительно из `invoke.responseBody`; иначе пытается `JSON.parse(rawResponseBody)`; иначе пишет `{ __nonJson: true, __preview }`; для пустого ответа — `{ __noBody: true }`.
- `lib/webhook/processWebhook.ts` — `parseWebhookBody` (поля по apidoc.life-pay.ru/notification), `checkWebhookToken` (точное равенство строк).
- `shared/redactRaw.ts` — `redactRawDeep(value)` рекурсивно обходит JSON-дерево, удаляет ключи из SECRET*KEYS_DEEP (apikey/login/token/lp*\*/authorization/cookie), маскирует значения PII_KEYS_DEEP (email/phone/passport/inn/snils/fio/address/...). Лимит `MAX_RAW_BYTES = 64 KB`; при превышении возвращает marker `{ __truncated: true, __originalBytes, __preview }`. Циклы → `__circular`, functions/symbols → `__nonSerializable`.
- `lib/widget/widgetSettings.lib.ts` — `getWidgetSettings(ctx)`: параллельное чтение 12 виджет-ключей через `Promise.all`; возвращает `WidgetSettingsData`. Вызывается в `index.tsx` (SSR главной — для карточки виджетов на вкладке «Настройки»), `api/widgets/settings-get.ts`, `api/widgets/config.ts`, `api/widgets/intent-lifepay.ts`, `api/widgets/intent-lavatop.ts`. Требует серверного контекста (`ctx`).
- `lib/rates/currencyConverter.ts` — `convertRubTo(amount, currency)`: конвертация рублёвой суммы в целевую валюту (RUB → USD/EUR). `convertToRub(amount, currency)`: обратная конвертация валюты в рубли (умножение на курс); используется в `resolveGcDealAmount` для non-RUB заказов. Приватный `getRubForOne(currency)` — единый источник курса для обоих направлений: 1) ручной курс из настроек (`widget_lavatop_manual_rate_usd`/`eur`) если `isValidManualRate`; 2) курс ЦБ РФ из `cbr-xml-daily.ru/scripts/XML_daily.asp` через `@app/request`; 3) ошибка `RATE_UNAVAILABLE`. `roundToCents` — округление к 2 знакам. Результат: `{ok:true, amount, rate, source:'identity'|'manual'|'cbr'}` или `{ok:false, code:'RATE_UNAVAILABLE'}`.
- `lib/gateway/lavatopDealIntent.ts` — `handleLavatopDealIntent(ctx, params)`: оркестратор Lava.Top deal-потока. Параметры: `offerId`, `productId` (из настроек), `gcDeal` (результат `resolveGcDeal`), `currency`. Порядок: фильтр суммы (hard-limit + lavatopMin/Max по рублёвому cost) → `convertRubTo` → проверка MIN\_AMOUNT по валюте → `runWithExclusiveLock('lavatop-offer:'+offerId)` → `updateOfferPrice` → `createInvoice` → `paymentUrl`. Вызывается после серверной проверки `areAllOffersAllowed` в `intent-by-deal` (с 2026-06-01).
- `lib/gateway/gcDealResolver.ts` — `resolveGcDeal(ctx, dealId)`: getDealFields → getUserFields через GC-гейтвей; извлекает из двойной обёртки `responseBody.data.data`. **С 2026-06-01:** дополнительно возвращает `positions: {id: string}[]` из `getDealFields.positions[].offer_id` (сверка офферов только по id). Результат: `{ ok, amount, currency, email, title, userId, positions }` или `{ ok: false, code: WIDGET_GC_* }`. Email в логи не пишется (PII).
- `shared/widgetSettingsTypes.ts` — **С 2026-06-01:** тип `AllowedOffer { id: string; title: string }`; `offers: AllowedOffer[]` в `WidgetSettingsData`/`WidgetPublicConfig` (вместо `offerIds: string[]`); `parseAllowedOffers(raw)` — парсит новый JSON-формат с fallback на legacy comma-separated; `isOfferAllowed(offer, allowed, listType)` и `areAllOffersAllowed(positions, allowed, listType)` — серверные чистые функции (с 2026-06-01 сверка только по `id`); ключи `WIDGET_LIFEPAY_OFFERS = 'widget_lifepay_offers'`, `WIDGET_LAVATOP_OFFERS = 'widget_lavatop_offers'`.
- `lib/access/constants.ts` — `INVITE_TTL_DAYS = 7`, `INVITE_TTL_MS`, константа `INTERNAL_ACCESS_DENIED`, `INVITE_CONSUME_LOCK_PREFIX`. (ADR 0003.)
- `lib/access/requireInternalAccess.ts` — класс `InternalAccessDeniedError`; чистая `decideInternalAccess(isAdmin, hasActiveGrant)`; `requireInternalAccess(ctx)` — Admin проходит всегда, не-Admin — только при активной записи в `panel_access`, иначе `InternalAccessDeniedError`. (ADR 0003.)
- `lib/access/invites.ts` — чистая `classifyInvite(invite, now)` (unknown/used/revoked/expired/valid); `generateInvite` (Admin-only, `accountNanoid` ≥ 32); `consumeInvite` (под `runWithExclusiveLock`, расходует инвайт только при успехе); `revokeInvite`; `revokeGrant`; `getInviteByToken`. (ADR 0003.)
- `lib/access/apiGuard.ts` — `guardInternalApi(ctx)`: `requireRealUser` + `requireInternalAccess`; при отказе возвращает HTTP 403/401 в объектной форме `{statusCode, rawHttpBody, headers}`. (ADR 0003.)

## Файлы и хранилище

- Не используется.

## Индексы/поиск

- `requestId`, `orderNumber` в `request_log` — searchable.
- `number`, `orderNumber` в `webhook_log` — searchable.
- `number` в `webhook_idempotency` — searchable; уникальность поддерживается через `runWithExclusiveLock` + `findByField` + create (Heap-схема не выражает unique constraint напрямую).
- `userId` в `panel_access`, `token` в `panel_invites` — searchable (ADR 0003). Уникальность — на уровне приложения (см. план реализации ниже), Heap-схема её не выражает.

## План реализации внутренней авторизации (ADR 0003)

> **Зачем.** Закрыть auth-разрыв (аудит 24-05-2026): `api/lp/*` и `/` принимают запросы без проверки прав. Модель — `requireRealUser(ctx)` + `requireInternalAccess(ctx)`: Admin воркспэйса проходит всегда; не-Admin — только при активной записи в `panel_access`; доступ выдаётся одноразовой пригласительной ссылкой (`panel_invites`). Полный норматив (контракты функций, тексты страниц, тест-сценарии) — [implementation-plan §1.11](../../../../saas/gw/lifepay/docs/gateway/implementation-plan.md); этот раздел — рабочий чек-лист на стороне `sbp-client`.

**Статус на 24-05-2026:** ✅ **Реализовано полностью.** Все 11 шагов выполнены.

### Шаги (выполнено 2026-05-24)

1. ✅ **`lib/access/constants.ts`** — `INVITE_TTL_DAYS = 7`, `INVITE_TTL_MS`, `INTERNAL_ACCESS_DENIED`, `INVITE_CONSUME_LOCK_PREFIX`.
2. ✅ **`repos/panelAccess.repo.ts`** — findByUserId, findActiveByUserId, upsertGrant, revokeByUserId, findAll, deleteByUserId.
3. ✅ **`repos/panelInvites.repo.ts`** — findByToken, findById, create, markUsed, revokeById, findAll, deleteById.
4. ✅ **`lib/access/requireInternalAccess.ts`** — `InternalAccessDeniedError`, `decideInternalAccess`, `requireInternalAccess(ctx)`.
5. ✅ **`lib/access/invites.ts`** — `classifyInvite`, `generateInvite`, `consumeInvite` (под `runWithExclusiveLock`), `revokeInvite`, `revokeGrant`, `getInviteByToken`.
6. ✅ **`web/access/invite/index.tsx`** — страница `/web/access/invite?token=`, только `requireRealUser`. Переход не расходует инвайт; расход — только POST `/api/access/consume-invite`.
7. ✅ **`web/forbidden/index.tsx`** — страница 403 с понятным текстом.
8. ✅ **`api/access/*`** — consume-invite (requireRealUser), generate-invite / revoke-invite / revoke-grant / invites / grants (Admin).
9. ✅ **Миграция эндпоинтов** — `guardInternalApi(ctx)` вписан в начало всех 7 эндпоинтов `api/lp/*` и в `index.tsx`; ложные комментарии «Admin-only» удалены.
10. ✅ **UI «Доступ»** — вкладка в `pages/PanelHomePage.vue`, видна только при `isAdmin`; создание/отзыв инвайтов, список грантов.
11. ✅ **Не защищены (§1.11.9):** `POST /web/webhook`, `/web/access/invite`, `/web/forbidden`, `/web/login`, `/api/logger/*`.

### Критерий завершения — выполнен

- Анонимный на `/` и `api/lp/*` → редирект на вход; авторизованный без гранта → `/web/forbidden` (403); Admin или активный грант → доступ.
- Инвайт расходуется только по «Подтвердить»; повторное потребление заблокировано `runWithExclusiveLock`.
- Юниты (9 чистых в `lifepayUnitSuite.ts`) и интеграционные тесты (8 Heap-тестов в `integrationSuite.ts`) добавлены в блоки `unit-access` / `int-access` каталога (`shared/testCatalog.ts`).
