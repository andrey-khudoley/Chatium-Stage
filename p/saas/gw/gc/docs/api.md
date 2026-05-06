# API

## Настройки (api/settings/)

Эндпоинты для управления настройками проекта (key-value в Heap). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/settings/list | api/settings/list.ts | Admin | Список всех настроек (с дефолтами) |
| GET | /api/settings/get?key= | api/settings/get.ts | Admin | Получить одну настройку |
| POST | /api/settings/save | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`). Для `log_level`: допускаются строки (Debug/Info/Warn/Error/Disable) и числа -1–4 (-1,0=Disable, 1=Info, 2=Warn, 3=Error, 4=Debug), нормализация в API. |

`key` должен быть непустой строкой после `trim`. Иначе `{ success: false }` и в серверный лог — severity 6, текст про валидацию key, в payload поля `reason` (`missing` | `not_string` | `empty_after_trim`), `keyType`, `bodyKeys`.

Для ключей `gc_developer_api_key` и `gc_test_school_api_key` значение после `trim` должно быть непустой строкой (разд. 5.4–5.5 в `docs/gateway/gateway-operation-manual.md`). Для `gc_test_school_host` — правила имени хоста без схемы (тот же manual, разд. 2.5): `validateGcSchoolHostTrimmed` в `shared/gcSchoolHostValidation.ts`, на сервере при ошибке — `throwLoggedServerError` из `lib/settings.lib.ts`. В логах `save`/`get` значения двух API-ключей не пишутся (подстановка `[redacted]`). Ошибки валидации из `setSetting` сначала пишутся через `throwLoggedServerError` в `lib/logger.lib.ts`; в `catch` этого роута повторная запись severity 3 не делается, если ошибка уже помечена `isServerErrorAlreadyLogged`.

Каждый файл — один эндпоинт с путём `/`.

## Логи (api/logger/, api/admin/logs/)

Эндпоинты для записи и чтения серверных логов (проверка уровня, Heap, WebSocket, вебхук).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /api/logger/log | api/logger/log.ts | AnyUser | Записать лог (body: `{ message, severity?, payload? }`). message — текст сообщения (имя модуля при необходимости в тексте); severity — 0–7, по умолчанию 6; payload — JSON с контекстом. timestamp и уровень (level) вычисляются в lib. В ctx.log и ctx.account.log выводится строка вида `[DD.MM.YYYY HH:mm:ss.SSS] [LEVEL] message` (пробелы между группами в скобках). Уровень сверяется с настройкой log_level; при прохождении — запись в ctx.log, ctx.account.log, Heap, WebSocket (admin-logs), опционально POST на log_webhook.url. |
| GET | /api/admin/logs/recent | api/admin/logs/recent.ts | Admin | Получить последние N логов (query: `limit`, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }> }`. |
| GET | /api/admin/logs/before | api/admin/logs/before.ts | Admin | Получить N логов старше указанного timestamp (query: `beforeTimestamp` — timestamp последней записи в миллисекундах, `limit` — количество, по умолчанию 50, макс. 200). Возвращает `{ success: true, entries: Array<LogEntry & { id: string }>, hasMore: boolean }`. |

## Дашборд админки (api/admin/dashboard/)

Счётчики ошибок и предупреждений в дашборде; таймштамп сброса хранится в настройках (`dashboard_reset_at`). Логика: lib/admin/dashboard.lib, репо — countBy по severity и timestamp (Heap where).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/admin/dashboard/counts | api/admin/dashboard/counts.ts | Admin | Получить счётчики ошибок и предупреждений после таймштампа сброса. Возвращает `{ success: true, errorCount, warnCount, resetAt }`. |
| POST | /api/admin/dashboard/reset | api/admin/dashboard/reset.ts | Admin | Сбросить дашборд: записать текущий таймштамп в настройки. Возвращает `{ success: true, errorCount: 0, warnCount: 0, resetAt }`. |

Каждый файл — один эндпоинт с путём `/`.

## Тесты (api/tests/)

Набор: юнит без Heap (`lib/tests/templateUnitSuite.ts`), интеграция с Heap и `route.run` по API (`lib/tests/integrationSuite.ts`), HTTP GET страниц на клиенте (`TestsPage.vue`, проверка статуса и фрагментов SSR). Каталог — `shared/testCatalog.ts`; страница `/web/tests` — три вкладки (Юнит / Интеграция / HTTP), метрики по активной вкладке, прогон всей вкладки и точечный запуск (play). Блоки категорий на вкладке сворачиваются по клику на заголовок (по умолчанию развёрнута первая категория, остальные свёрнуты; иконка `fa-folder` / `fa-folder-open`). Для `GET /` фрагменты SSR в `TestsPage.vue` — `window.__BOOT__` и подстрока ` / Главная` (шапка `Header`, `projectTitle` из `getHeaderText` в `index.tsx`). Для `GET /web/tests` — `window.__BOOT__` и подстрока `template-project-page` из `<meta name="template-project-page" content="web-tests">` в `web/tests/index.tsx` (текст вкладок в первичном HTML может отсутствовать до гидрации). Интеграционный кейс **`gateway_v1_addUser_live`**: вызов `handleV1AddUserPost` с заголовками школы и телом `params.user.email` = **`tester@khudoley.pro`** при заполненных в Heap **`gc_developer_api_key`**, **`gc_test_school_api_key`**, **`gc_test_school_host`** (`docs/gateway/gateway-testing-strategy.md` §1.1); один реальный исходящий HTTP к GetCourse за прогон.

Проверки с `requireAccountRole(Admin)` в интеграционном прогоне при отсутствии роли Admin помечаются как провал с пояснением «нужна роль Admin» (один `ctx` на запрос).

При любом провале юнит/интеграционного кейса в серверный лог пишется отдельная запись через `lib/tests/logTestRunFailures.ts`: **severity 3** (видно при `log_level = Error`, в отличие от сводок с более высоким severity). Итоговая строка «набор завершён» при `failed > 0` тоже с **severity 3**. Старт прогона остаётся с severity 7 (при строгом уровне логов может не попасть в вывод).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/tests/list | api/tests/list.ts | AnyUser | Каталог: `{ success, categories }`. У категорий есть `blocks[]` и плоский `tests`. |
| GET | /api/tests/unit | api/tests/unit/index.ts | AnyUser | Юнит: `runTemplateUnitChecks()` — routes, project, logLevel script, logger.lib, shared/logger, **lib/gateway** (Legacy form, семантика GC), целостность каталога. `{ success, kind: 'unit', results[], summary, at }`. |
| GET | /api/tests/integration | api/tests/integration/index.ts | AnyUser | Интеграция: Heap, libs, API через `route.run`, e2e-сценарии; в конце добавляется проверка `api_tests_integration_shape`. `{ success, kind: 'integration', results[], summary, at }`. |

## Публичный gateway (`/v1/*`)

Норматив: `docs/gateway/gateway-operation-manual.md` (§2, §9–§10). Ответ — объект **`TuneHttpHeadersResponse`**: `statusCode`, `rawHttpBody` (JSON-строка), `headers` с `Content-Type: application/json` и **`X-Gateway-Request-Id`** = **`requestId`** в JSON. **Без** сессии Chatium: секреты школы только в заголовках; **`gc_developer_api_key`** обязателен в Heap до любого исходящего вызова к GetCourse (§5.3–5.4).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| POST | /v1/addUser | api/v1/addUser.ts | нет | Импорт пользователя (Legacy): заголовки **`X-Gc-School-Host`**, **`X-Gc-School-Api-Key`**; **`Content-Type: application/json`**; тело целиком — объект **`args`** с минимумом **`params.user.email`** (см. `gc-required-fields-by-op.json`, `lib/gateway/operationsCatalog.ts`). Исходящий вызов: `https://{host}/pl/api/users`, form `key` / `action` / `params` (Base64 JSON), таймаут **10 s**, без ретраев (`lib/gateway/legacyGcImportClient.ts`, `@app/request`). Лимит тела входящего POST — **1 MiB** (`GW_MAX_REQUEST_BODY_BYTES`). |

Пример (подставьте базовый URL приложения, хост школы и API-ключ школы; **`gc_developer_api_key`** должен быть задан в Heap через админку):

```bash
curl -sS -D - -X POST 'https://<app-base>/v1/addUser' \
  -H 'Content-Type: application/json' \
  -H 'X-Gc-School-Host: <school-host>' \
  -H 'X-Gc-School-Api-Key: <school-api-key>' \
  --data '{"params":{"user":{"email":"tester@khudoley.pro"}}}'
```

Успех: HTTP **200**, заголовок **`X-Gateway-Request-Id`**, JSON с **`ok: true`**, **`data`**, **`requestId`**. Неверный метод (не POST) — **405** и код **`INVOKE_HTTP_METHOD_NOT_ALLOWED`**. Семантическая ошибка Legacy при 2xx от GC — **502**, **`INVOKE_GC_SEMANTIC_ERROR`**. Пустой или невалидный dev-ключ в Heap — **`GATEWAY_DEV_KEY_NOT_CONFIGURED`** без исходящего HTTP к GetCourse. Полный перечень кодов — **`docs/gateway/gateway-operation-manual.md`** §9–§10.

## События и webhooks
- Не используются.
