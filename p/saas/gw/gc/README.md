# GetCourse Gateway (`p/saas/gw/gc`)

## Назначение

Приложение Chatium — экземпляр **gateway** к API GetCourse: публичные маршруты вида `/v1/{op}`, каталог операций, проксирование на школу по заголовкам `X-Gc-School-Host` и `X-Gc-School-Api-Key`, настройки и логи в Heap (каркас унаследован от `p/template_project`).

Полный норматив разработки слоя gateway и машиночитаемые артефакты (`gc-op-http-mapping.json`, OpenAPI JSON, реестр `op` и т.д.) лежат в каталоге **`docs/gateway/`** (точка входа: `docs/gateway/gateway-operation-manual.md`). Код в этом приложении должен согласовываться с этим manual на этапе активной разработки.

## Точка старта разработки

Пошаговый план реализации (Прототип до эфира → MVP → Прод) — **`docs/gateway/implementation-plan.md`**. Закрытие всех чек-боксов = реализация продукта; каждый пункт ссылается на конкретный `§N` manual или файл проекта.

## Платформа и деплой

- Платформа: Chatium; локальный сервер не требуется; зависимости фиксированы платформой.
- Деплой: закоммитить и запушить изменения — Chatium подхватит обновления.
- URL приложения: `https://<домен>/p/saas/gw/gc/` (и подмаршруты из `config/routes.tsx`).

## Текущее состояние

Сохранены возможности шаблона: админка, профиль, логин, страница тестов, API настроек, Heap-таблицы settings/logs (с **отдельными** ключами таблиц для этого проекта), серверные логи, дашборд админки.

Реализованы публичные **`GET`/`POST /v1/{op}`** для всех записей **`config/gc-op-http-mapping.json`** (59 операций): общий обработчик **`lib/gateway/handleV1OpRoute.ts`** (Legacy POST import, Legacy GET export, контур new), **`GET /v1/operations`** (`api/v1/operations.ts`), заголовки школы, **`gc_developer_api_key`**, ответ **`TuneHttpHeadersResponse`** + CORS для браузерных клиентов, события workspace **`gateway_gc.invoke.completed`** / **`gateway_gc.operations.catalog_served`**. Тонкая обёртка **`handleV1AddUserPost`** (`lib/gateway/v1AddUserHandler.ts`) нужна для интеграционных тестов. Генераторы: `scripts/gen-api-v1-routes.cjs`, `scripts/gen-gc-op-http-mapping.cjs`, `scripts/gen-v1-op-args-schemas.cjs`; проверка согласованности `scripts/check-gateway-catalog-consistency.cjs`. Интеграционный кейс **`gateway_v1_addUser_live`** — `lib/tests/integrationSuite.ts`. Детали — **`docs/api.md`**, **`docs/gateway/implementation-plan.md`**.

**Панель (`PanelHomePage.vue`):** главная `/` теперь рендерит панель мониторинга вместо лендинга. Вкладки: Обзор, Вызовы (таблица завершённых `/v1/{op}` с KPI: total/ok/err/avg/p50/p95/topOps), Доступы (Admin: управление грантами и инвайтами). Toolbar фильтра по дате. Страница тестов ограничена только ролью Admin.

**Система доступов к панели:** новые Heap-таблицы `panelAccess` и `panelInvites`; `lib/access/` (requireInternalAccess, guardInternalApi, invites); API `api/access/` (6 эндпоинтов); страницы `/web/forbidden` и `/web/access/invite`. Доступ: Admin или активный грант.

**Фильтр по дате:** настройка `panel_date_filter` в Heap; эндпоинт `api/gateway-analytics/filter-save`; фильтрация in-memory в `invocations.ts`; SSR-проп `initialDateFilter`.

## Документация в репозитории

- Архитектура и отсылка к спеке: `docs/architecture.md`
- API: `docs/api.md`
- Данные и Heap: `docs/data.md`
- Импорты: `docs/imports.md`
- ADR: `docs/ADR/`
- История диалогов: `docs/LLM/`
- Спецификация gateway (SSOT): `docs/gateway/`

> Новые разделы в `docs/architecture.md`: «Система доступов к панели» и «Фильтр по дате». В `docs/api.md`: секции «Доступы к панели» и обновлённая аналитика с `guardInternalApi`. В `docs/data.md`: таблицы `panelAccess`, `panelInvites` и `lib/access/`.

## Changelog

- 2026-05-25: визуальный дизайн приведён к референсу `p/units/aayakovleva/sbp-client` — общий `crtBackgroundStyles` (CRT-фон/vignette/scanlines/glitch) вынесен в `styles.tsx` и подключён в `index.tsx` вместо инлайна (на `body` добавлены `color`/`font-family`/`letter-spacing`); `Header.vue` — `min-width: 0`; на панели `PanelHomePage.vue` 38 общих селекторов выровнены к референсу (clip-path-скосы вместо `border-radius`, полупрозрачные фоны, uppercase-типографика), а проектные `.panel-toolbar`/`.filter-bar`/`.filter-input`/`.badge` переведены на тот же острый bevelled-стиль. Только CSS/визуал, логика и API не затронуты.
- 2026-05-25: внутренняя система доступов к панели (`lib/access/`, `panelAccess`, `panelInvites`, `api/access/*`); фильтр по дате (`panel_date_filter`, `api/gateway-analytics/filter-save`); главная `/` теперь панель `PanelHomePage.vue` (вкладки Обзор/Вызовы/Доступы); доступ `guardInternalApi` на эндпоинты аналитики; страница тестов ограничена ролью Admin; добавлены `/web/forbidden` и `/web/access/invite`.
- 2026-05-06: сьюит `/v1/{op}` — в ответ `POST /api/tests/v1-ops/run` добавлено поле **`gcUpstream`** (сырой HTTP-ответ GetCourse: статус, Content-Type, тело); публичные роуты по-прежнему вызывают только `handleV1OpRoute`, раннер — `handleV1OpRouteWithGcDiagnostic` (`lib/gateway/handleV1OpRoute.ts`). На странице тестов три блока: args, обёртка gateway, сырой ответ школы.
- 2026-05-06: `lib/tests/gateway/v1OpsSuiteRunner.ts` — троттлинг 1 rps без `setTimeout` и без Node `timers`: короткое ожидание по `Date.now()` (в изоляте Chatium глобального таймера может не быть; `@app/jobs` планирует отложенную работу и не заменяет паузу внутри одного `POST /api/tests/v1-ops/run`).
- 2026-05-06: `pages/TestsPage.vue` — в шаблоне секции Gateway `/v1/{op}` убран optional chaining (`row.result?.…`): заменён на `row.result && row.result.…` (UGC может давать пустой `ReferenceError:` при ре-рендере после прогона, в т.ч. для `updateUserCustomFields`).
- 2026-05-06: `pages/TestsPage.vue` — исправлена разметка тэга статуса префлайта: подписи `runStatus` вынесены в функцию `v1OpsPreflightRunStatusShortLabel` вместо объекта внутри `{{ }}` (иначе при рендере UGC возможен пустой `ReferenceError:` из‑за двусмысленности `{` как блока vs объекта).
- 2026-05-06: префлайт сьюита `/v1/{op}` и админский ввод `gc_itest_*` (manual §5.9) — `GET /api/tests/v1-ops/preflight` (Admin) c вычислением `runStatus ∈ {ready, blocked-availability, warn-heap, warn-deps}`, состояния «уровня A» и списка заполненных Heap-ключей. На странице `/web/tests` строки разбиты по фазам 1–4, для `disabled`/`unsupported` кнопка `Run` отключена и фон серый (стратегия §9.1), для строк, ждущих `gc_itest_*` или предшественника — янтарный фон с подсказкой и ссылкой «Открыть админку» (§9.3, §9.4). На странице `/web/admin` добавлена секция «Произвольные настройки Heap» с формой «Ключ — Значение» и удалением (`POST /api/settings/delete`, `GET /api/settings/list-arbitrary`).
- 2026-05-06: интеграционный сьюит **`/v1/{op}` на каждый роут** — `POST /api/tests/v1-ops/run` (Admin) и секция «Gateway /v1/{op}» на вкладке HTTP страницы `/web/tests`. Сценарии в `lib/tests/gateway/v1OpsScenarios.ts` (фазовый порядок 1–4 по стратегии §3.4), раннер с throttle 1 rps в `lib/tests/gateway/v1OpsSuiteRunner.ts`, типы контекста в `v1OpsRunContext.ts`. Список 59 op в `shared/v1OpsList.generated.ts` (генерация дополнена в `scripts/gen-gc-op-http-mapping.cjs`). UI показывает HTTP-статус, длительность, `requestId` и распарсенный ответ GetCourse для каждого op (раскрывающийся блок с JSON `args`/`data`/`error`).
- 2026-05-06: §2 «Жизненный цикл `/v1/{op}`» — порядок проверок в `lib/gateway/handleV1OpRoute.ts` приведён к §2.6: после метода и существования `op` проверка `availability` (`disabled` → 503, `unsupported` → 501) выполняется **до** парсинга заголовков школы и чтения `gc_developer_api_key` из Heap; для `disabled`/`unsupported` исходящий запрос к GC не формируется и не зависит от наличия секретов и хедеров клиента.
- 2026-05-06: §2.5 — `shared/gcSchoolHostValidation.ts` теперь допускает опциональный суффикс `:порт` в диапазоне `1–65535` (manual §2.5: «опционально :порт (1–65535)»); юнит `gcHost_optional_port` покрывает граничные значения порта (1, 443, 65535) и отрицательные кейсы (`70000`, `0`, `:`, `abc`, два двоеточия, пустое имя хоста перед `:`).
- 2026-05-06: §3 «Каталог операций» — единый SSOT каталога **`lib/gateway/operationsCatalog.ts`** (`export const operationsCatalog = { schemaVersion, entries } as const`, manual §3.1–§3.5): в каждой записи маппинг (`op`, `httpMethod`, `contour`, `availability`, `pathTemplate`, `legacyImportAction`) и live-объект `argsSchema`; и `GET /v1/operations`, и обработчик `/v1/{op}` берут запись через `findOperationCatalogEntry`. `INVOKE_OP_UNKNOWN` для существующего файла роута без записи каталога заменён на `INVOKE_INTERNAL_ERROR` с severity 3 (manual §3.5: ошибка конфигурации сборки; INVOKE_OP_UNKNOWN остаётся для платформенного 404). Юниты `gw_operations_catalog_*` и `gw_query_dup_keys_keep_last` (manual §3.5: дубликаты query → последнее значение).
- 2026-05-06: §7 «Наблюдаемость» — единая итоговая запись о завершении `/v1/{op}` (стадия `v1_op_completed`) с минимальным набором полей по manual §7.2 (`requestId`, `op`, `httpMethod`, `contour`, `availability`, `schoolHostPresent`, `clientHttpStatus`, `ok`, `errorCode`, `gcHttpStatus`, `durationMs`); `api/gateway-analytics/invocations.ts` теперь читает завершённые вызовы из Heap-логов и поддерживает фильтры по `requestId`, `op`, `contour`, `errorCode`, `availability`, `durationMsMin/Max`, `ok`, `dateFromMs/dateToMs` + сводную статистику (`okCount`, `errCount`, top-`op`, top-`error.code`, `avg`/`p50`/`p95` `durationMs`); в `pages/AdminPage.vue` добавлена секция «Аналитика вызовов /v1/{op}» с фильтрами, таблицей и копированием `requestId`.
- 2026-05-06: `lib/settings.lib.ts` — `getSettingString` оборонительно маскирует значения секретных ключей (`gc_developer_api_key`, `gc_test_school_api_key`) в логе exit, по аналогии с `loggableSettingPayload` в `setSetting` (manual §5.7).
- 2026-05-06: единый **`handleV1OpRoute`**, 59 файлов **`api/v1/{op}.ts`**, **`GET /v1/operations`**, **`legacyGcExportGet`**, генераторы и **`check-gateway-catalog-consistency.cjs`**, события **`@start/sdk`**, CORS в **`v1TuneResponse`**, ADR **`docs/ADR/0003-unified-handler-and-catalog.md`**.
- 2026-05-06: интеграционный тест **`gateway_v1_addUser_live`** (`lib/tests/integrationSuite.ts`): реальный вызов GetCourse через **`handleV1AddUserPost`**; логика POST `/v1/addUser` вынесена в **`lib/gateway/v1AddUserHandler.ts`**.
- 2026-05-06: Legacy `params` — **`lib/gateway/utf8Base64.ts`** (`utf8StringToBase64` / `base64ToUtf8String`, логика как в `liveahalf/api/register.ts`); `legacyGcFormBody` больше не использует несуществующие глобалы `base64Encode`. Норматив в **`inner/docs/047-base64.md`** (глобалы запрещены к использованию).
- 2026-05-06: **`POST /v1/addUser`**, слой `lib/gateway/` (константы `GW_*`, Legacy form + `@app/request`, семантика ответа GC §2.8, `TuneHttpHeadersResponse`), `shared/gatewayHttpHeaders.ts`, копия `config/gc-op-http-mapping.json` (в SPEC для `addUser` задано `availability: enabled`); юниты `lib/tests/gatewayUnitSuite.ts` в общем прогоне; см. `docs/api.md`.
- 2026-05-06: валидация `gc_test_school_host`: в строке хоста **не** допускается суффикс `:порт` (имя хоста школы без порта); юнит `gcHost_reject_colon_port` вместо сценариев с портом.
- 2026-05-06: `shared/gcSchoolHostValidation.ts` — `validateGcSchoolHostTrimmed` (без цепочки `throw new Error` по правилам); `GcSchoolHostValidationError` в `normalize`/`assertValid`; хост в `setSetting` через `validate` + `throwLoggedServerError`.
- 2026-05-06: `lib/logger.lib.ts` — `throwLoggedServerError(ctx, message, options?)`: перед `throw new Error(message)` пишет запись через `writeServerLog` (Heap, фильтр уровня, сокет, вебхук). Валидация в `lib/settings.lib.ts` переведена на этот helper.
- 2026-05-06: админка (`pages/AdminPage.vue`) — блок «GetCourse — тестовая школа»: поля dev-ключ, тестовый ключ школы (`password` + показ), хост тестовой школы; сохранение через `api/settings/save`. Валидация в `lib/settings.lib.ts` и `shared/gcSchoolHostValidation.ts`; в логах `get`/`save` значения двух ключей маскируются. Пункт **1.2** плана (`docs/gateway/implementation-plan.md`) закрыт.
- 2026-05-06: ключ Heap `gc_test_school_host` — константа `GC_TEST_SCHOOL_HOST` в `shared/gatewaySettingKeys.ts` и в `lib/settings.lib.ts` (`SETTING_KEYS`, дефолт `null`); третий пункт **1.2** плана закрыт в `docs/gateway/implementation-plan.md`.
- 2026-05-06: ключ Heap `gc_test_school_api_key` — константа `GC_TEST_SCHOOL_API_KEY` в `shared/gatewaySettingKeys.ts` и в `lib/settings.lib.ts` (`SETTING_KEYS`, дефолт `null`); второй пункт **1.2** плана закрыт в `docs/gateway/implementation-plan.md`.
- 2026-05-06: `shared/browserRemoteLogger.ts` — приведение `console` при патче методов через `unknown` для совместимости с TypeScript 5 (TS2352).
- 2026-05-06: применены поправки spec-review (`inner/qna/spec_result.md`) к `docs/gateway/gateway-operation-manual.md` — каталог хранится как TS-модуль `lib/gateway/operationsCatalog.ts` (без статического импорта `*.json`); схемы `args` — на платформенном билдере `s` из `@app/schema` (без JSON Schema / AJV); `withProjectRoot`/`PROJECT_ROOT` помечены как утилиты шаблона; `lib/logger.lib` — шаблонная обёртка; `@start/after-event-write`, `queryAi`, `gcQueryAi` помечены как платформенно-документированные/опциональные; роутинг — всегда «один файл — один роут»; ответ роутов — `TuneHttpHeadersResponse`. См. §13 manual.
- 2026-05-06: ключ Heap `gc_developer_api_key` — константа `GC_DEVELOPER_API_KEY` в `shared/gatewaySettingKeys.ts` (`// @shared`) и в `lib/settings.lib.ts` (`SETTING_KEYS`, дефолт `null`); пункт **1.2** плана (первая строка) закрыт в `docs/gateway/implementation-plan.md`.
- 2026-05-06: в `docs/gateway/implementation-plan.md` отмечен выполненным пункт **1.1** «Страница тестов шаблона» (`web/tests/index.tsx`, `pages/TestsPage.vue` — юнит-каталог и HTTP-проверки).
- 2026-05-06: HTTP-тест `GET /` на вкладке тестов: ожидаемый SSR-фрагмент главной заменён с «Шаблон проекта» на подстроку заголовка шапки ` / Главная` (проект gateway, не копия шаблона).
- 2026-05-06: `writeServerLog` — в Heap всегда сохраняется JSON `payload` (если передан), независимо от настройки уровня логов; обогащённый payload в account.log / WebSocket / вебхук по-прежнему только при Debug.
- 2026-05-06: добавлен `docs/gateway/implementation-plan.md` — пошаговый план реализации gateway (Прототип → MVP → Прод); manual отшлифован (новые §12 «Открытые вопросы» и §13 «История изменений»); стратегия тестирования: исправлен порядок подсекций §1, §3.4 явно перечисляет оставшиеся GET-`op` из реестра.
- 2026-05-06: ссылки на норматив gateway ведут в `docs/gateway/` репозитория (ранее указывали путь во Second Brain); в `docs/gateway/*.md` обновлены перекрёстные ссылки на файлы проекта.
- 2026-05-06: проект отвязан от копии `template_project`: `PROJECT_ROOT` `p/saas/gw/gc`, `.dir.json`, дефолтные названия, отдельные ключи Heap settings/logs, обновлена документация; инструкция после копирования шаблона (`docs/run.md`) удалена как выполненная.
