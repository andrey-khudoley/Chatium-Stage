# ADR-0006: OpenAPI GetCourse как SSOT для контура new

## Status
Accepted

## Context
Аргументы операций контура **new** должны соответствовать актуальной схеме GetCourse API. Legacy-операции описаны статически (help/SDK).

## Decision
- Источник правды для **new**: JSON OpenAPI по URL `https://getcourse.ru/pl/postback/redoc/schema` (`lib/openapiLoader.lib`).
- Кеш в Heap (`OpenapiCache`), TTL 24 ч; при недоступности сети используется кеш; если кеш пуст — допускается **stub** `paths: {}` и permissive-схемы args для сборки каталога (см. `extractArgsSchemaFromOperation`).
- Статический реестр **`shared/opRegistry.ts`** задаёт список `op`, контур и привязку к path/method (new) или legacy action/path.

## Consequences
- Админ может принудительно обновить каталог (`POST .../admin/catalog/refresh`).
- Расхождения имён legacy `action` с реальным GC возможны — правятся в реестре после проверки на аккаунте.
