# Data

Настройки проекта хранятся в Heap (key-value). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__saas-gw-gc__setting__W3r8Ys | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |
| t__saas-gw-gc__log__K7n2Tp | tables/logs.table.ts | Серверные логи (долгосрочное хранение) | message (string), payload (any), severity, level, timestamp |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД; без вызовов logger.lib, т.к. getSetting/getLogLevel вызываются из writeServerLog и используют findByKey — иначе рекурсия).
- `repos/logs.repo.ts` — create, findAll, findById, findBeforeTimestamp (слой работы с БД логов; findBeforeTimestamp использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` для эффективной пагинации).

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit, getLogWebhook (бизнес-логика, дефолты, валидация). Имена ключей gateway для клиента дублируются в `shared/gatewaySettingKeys.ts` (`// @shared`), сервер тянет те же строки в `SETTING_KEYS` (например `GC_DEVELOPER_API_KEY`, `GC_TEST_SCHOOL_API_KEY`, `GC_TEST_SCHOOL_HOST` → `gc_developer_api_key`, `gc_test_school_api_key`, `gc_test_school_host`). Валидация при записи: непустые строки после `trim` для двух ключей; хост — `validateGcSchoolHostTrimmed` в `shared/gcSchoolHostValidation.ts` + `throwLoggedServerError` в `setSetting`. Ввод в админке: `pages/AdminPage.vue` (секреты — `type="password"`, кнопка «показать»).
- `lib/logger.lib.ts` — getAdminLogsSocketId, shouldLogByLevel, writeServerLog, `throwLoggedServerError` (сначала лог по правилам `writeServerLog`, затем `throw`), `isServerErrorAlreadyLogged` (чтобы `api/settings/save` не дублировал severity 3 при той же ошибке). Проверка уровня; Heap всегда получает JSON `payload` при его передаче; обогащённый payload в ctx.account.log / WebSocket / вебхук — только при уровне Debug.

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.
