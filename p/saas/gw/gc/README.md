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

Сохранены возможности шаблона: главная, админка, профиль, логин, страница тестов, API настроек, Heap-таблицы settings/logs (с **отдельными** ключами таблиц для этого проекта), серверные логи, дашборд админки.

Реализован публичный **`POST /v1/addUser`** (Legacy импорт пользователя): заголовки школы, проверка **`gc_developer_api_key`** в Heap, JSON **`args`** с **`params.user.email`**, исходящий вызов GetCourse через **`@app/request`** (таймаут 10 s, без ретраев), ответ **`TuneHttpHeadersResponse`** и коды ошибок по **`docs/gateway/gateway-operation-manual.md`**. Обработчик: **`lib/gateway/v1AddUserHandler.ts`**; регистрация роута — `api/v1/addUser.ts`. Интеграционный прогон с реальной школой: кейс **`gateway_v1_addUser_live`** в `lib/tests/integrationSuite.ts` (нужен полный Heap уровня A и email **`tester@khudoley.pro`**). Остальные операции **`/v1/{op}`** и **`GET /v1/operations`** — по плану в `docs/gateway/implementation-plan.md`.

## Документация в репозитории

- Архитектура и отсылка к спеке: `docs/architecture.md`
- API: `docs/api.md`
- Данные и Heap: `docs/data.md`
- Импорты: `docs/imports.md`
- ADR: `docs/ADR/`
- История диалогов: `docs/LLM/`
- Спецификация gateway (SSOT): `docs/gateway/`

## Changelog

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
