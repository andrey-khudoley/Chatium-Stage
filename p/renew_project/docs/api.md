# API

## Настройки (api/settings/)

Эндпоинты для управления настройками проекта (key-value в Heap). См. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md).

| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| GET | /api/settings/list | api/settings/list.ts | Admin | Список всех настроек (с дефолтами) |
| GET | /api/settings/get?key= | api/settings/get.ts | Admin | Получить одну настройку |
| POST | /api/settings/save | api/settings/save.ts | Admin | Сохранить настройку (body: `{ key, value }`). Для `log_level`: допускаются строки (Info/Warn/Error/Disable) и числа 0–3 (0=Disable, 1=Info, 2=Warn, 3=Error), нормализация в API. |

Каждый файл — один эндпоинт с путём `/`.

## Публичные эндпоинты
| Method | Path | File | Auth | Назначение |
| --- | --- | --- | --- | --- |
| - | - | - | - | - |

## События и webhooks
- Не используются.
