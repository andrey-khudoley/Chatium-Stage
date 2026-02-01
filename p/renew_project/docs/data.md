# Data

## Heap таблицы

| Table | File | Назначение | Основные поля |
| --- | --- | --- | --- |
| t__renew-project__setting__7Fk2Qw | tables/settings.table.ts | Настройки проекта (key-value) | key (string), value (any) |

## Репозитории (repos/)
- `repos/settings.repo.ts` — findByKey, findAll, upsert, deleteByKey (слой работы с БД).

## Библиотеки (lib/)
- `lib/settings.lib.ts` — getSetting, getAllSettings, setSetting, getLogLevel, getLogsLimit (бизнес-логика, дефолты, валидация).

## Файлы и хранилище
- Не используется.

## Индексы/поиск
- Не используется.
