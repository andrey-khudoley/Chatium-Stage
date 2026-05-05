# API

## Настройки (api/settings/)

Эндпоинты для управления настройками проекта (key-value в Heap). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/settings/list | api/settings/list.ts | Admin | Список всех настроек (с дефолтами) |
| GET | /api/settings/get?key= | api/settings/get.ts | Admin | Получить одну настройку |
| POST | /api/settings/save | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`). Для `log_level`: допускаются строки (Debug/Info/Warn/Error/Disable) и числа -1–4 (-1,0=Disable, 1=Info, 2=Warn, 3=Error, 4=Debug), нормализация в API. |

`key` должен быть непустой строкой после `trim`. Иначе `{ success: false }` и в серверный лог — severity 6, текст про валидацию key, в payload поля `reason` (`missing` | `not_string` | `empty_after_trim`), `keyType`, `bodyKeys`.

Каждый файл — один эндпоинт с путём `/`.

## Логи (api/logger/, api/admin/logs/)

Эндпоинты для записи и чтения серверных логов (проверка уровня, Heap, WebSocket, вебхук).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/logger/log | api/logger/log.ts | AnyUser | Записать лог (body: `{ message, severity?, payload? }`). message — текст сообщения (имя модуля при необходимости в тексте); severity — 0–7, по умолчанию 6; payload — JSON с контекстом. timestamp и уровень (level) вычисляются в lib. В ctx.log и ctx.account.log выводится строка вида `[DD.MM.YYYY HH:mm:ss.SSS] [LEVEL] message` (пробелы между группами в скобках). Уровень сверяется с настройкой log_level; при прохождении — запись в ctx.log, ctx.account.log, Heap, WebSocket (admin-logs), опционально POST на log_webhook.url. |
| GET | /api/admin/logs/recent | api/admin/logs/recent.ts | Admin | Получить последние N логов (query: `limit`, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }> }`. |
| GET | /api/admin/logs/before | api/admin/logs/before.ts | Admin | Получить N логов старше указанного timestamp (query: `beforeTimestamp` — timestamp последней записи в миллисекундах, `limit` — количество, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }>, hasMore: boolean }`. |

## Дашборд админки (api/admin/dashboard/)

Счётчики ошибок и предупреждений в дашборде; таймштамп сброса хранится в настройках (`dashboard_reset_at`). Дополнительно — метрики **invoke** по таблице `RequestLog`: всего / успех / ошибка, выборочные **p50/p95** задержки и частоты по `op` (до 500 последних записей после сброса). Логика: `lib/admin/dashboard.lib`.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/admin/dashboard/counts | api/admin/dashboard/counts.ts | Admin | `{ success, errorCount, warnCount, resetAt, invokeTotal, invokeSuccess, invokeFailed, invokeLatencyP50Ms, invokeLatencyP95Ms, invokePerOpSample }`. |
| POST | /api/admin/dashboard/reset | api/admin/dashboard/reset.ts | Admin | Сбросить дашборд: записать текущий таймштамп в настройки. Возвращает обнулённые счётчики и те же поля invoke. |

Каждый файл — один эндпоинт с путём `/`.

## Gateway публичный API (api/v1/)

Контракт для тонких клиентов. Файлы: по одному на роут, путь обработчика `'/'`.

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/v1/invoke | api/v1/invoke/index.ts | Bearer + школа | Body: `{ schoolId, op, args }`. Цепочка: Bearer → allowlist → каталог → валидация args → GC. |
| GET | /api/v1/operations | api/v1/operations/index.ts | нет | Каталог операций (JSON + `ETag`, `Cache-Control`). Query `schoolId?` — фильтр по allowlist школы. |
| GET | /api/v1/health | api/v1/health/index.ts | нет | Статус, флаг наличия dev-ключа, возраст кеша OpenAPI. |
| POST | /api/v1/onboard | api/v1/onboard/index.ts | `X-Onboarding-Token` | Регистрация школы (секрет из настроек `onboarding_token`). |
| POST | /api/v1/rotate-token | api/v1/rotate-token/index.ts | Bearer текущего токена | Новый client token (plain один раз в ответе). |

## Gateway админка (api/admin/schools|catalog|gateway_logs|gc-settings)

Только **Admin**. Управление школами, пересборка каталога из OpenAPI + реестра, просмотр последних invoke-логов, сохранение GC dev key и onboarding-токена.

| Method | Path | File | Назначение |
| --- | --- | --- | --- |
| GET | /api/admin/schools/list | schools/list.ts | Список школ (пагинация). |
| POST | /api/admin/schools/add | schools/add.ts | Добавить/обновить школу (как onboard). |
| POST | /api/admin/schools/update | schools/update.ts | Поля школы, allowlist, enabled. |
| POST | /api/admin/schools/rotate | schools/rotate.ts | Ротация Bearer. |
| POST | /api/admin/schools/delete | schools/delete.ts | Удаление школы. |
| GET | /api/admin/catalog/list | catalog/list.ts | Строки каталога op. |
| POST | /api/admin/catalog/refresh | catalog/refresh.ts | Пересборка каталога. |
| GET | /api/admin/gateway_logs/recent | gateway_logs/recent.ts | Последние `RequestLog`. |
| GET | /api/admin/gc-settings/get | gc-settings/get.ts | Чтение маскированных GC-настроек. |
| POST | /api/admin/gc-settings/save | gc-settings/save.ts | Сохранение dev-ключа / onboarding-токена. |

## Тесты (api/tests/)

Набор: юнит без Heap (`lib/tests/templateUnitSuite.ts`) — в т.ч. **pure-проверки gateway** (crypto, opRegistry, errorNormalizer, JSON Schema); интеграция с Heap и `route.run` (`lib/tests/integrationSuite.ts`) — в т.ч. **`api/v1/*`**; HTTP GET страниц на клиенте (`TestsPage.vue`, `fetch` по базовому URL проекта). Каталог — `shared/testCatalog.ts`; страница `/web/tests` — три вкладки (Юнит / Интеграция / HTTP): вкладки **Юнит** и **Интеграция** вызывают `templateUnitTestsRoute.run(ctx)` и `templateIntegrationTestsRoute.run(ctx)` (маршруты `@shared-route`), а не прямой `fetch` к `/api/tests/*`, чтобы запрос не зависал из-за неверного разрешения URL во вложенном приложении. Для `GET /web/tests` фрагменты SSR — `window.__BOOT__` и подстрока `gc-api-gateway-page` из `<meta name="gc-api-gateway-page" content="web-tests">` в `web/tests/index.tsx`.

Проверки с `requireAccountRole(Admin)` в интеграционном прогоне при отсутствии роли Admin помечаются как провал с пояснением «нужна роль Admin» (один `ctx` на запрос).

При любом провале юнит/интеграционного кейса в серверный лог пишется отдельная запись через `lib/tests/logTestRunFailures.ts`: **severity 3** (видно при `log_level = Error`, в отличие от сводок с более высоким severity). Итоговая строка «набор завершён» при `failed > 0` тоже с **severity 3**. Старт прогона остаётся с severity 7 (при строгом уровне логов может не попасть в вывод).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/tests/list | api/tests/list.ts | AnyUser | Каталог: `{ success, categories }`. У категорий есть `blocks[]` и плоский `tests`. |
| GET | /api/tests/unit | api/tests/unit/index.ts | AnyUser | Юнит: `runTemplateUnitChecks()` — routes, project, logLevel script, logger.lib, shared/logger, целостность каталога. `{ success, kind: 'unit', results[], summary, at }`. |
| GET | /api/tests/integration | api/tests/integration/index.ts | AnyUser | Интеграция: Heap, libs, API через `route.run`, e2e-сценарии; в конце добавляется проверка `api_tests_integration_shape`. `{ success, kind: 'integration', results[], summary, at }`. |

## События и webhooks
- Входящие webhook от GetCourse **не** обслуживаются этим приложением ([ADR-0003](ADR/0003-gateway-outgoing-only.md)); регистрация URI — операция `setUri` через `/api/v1/invoke`.
