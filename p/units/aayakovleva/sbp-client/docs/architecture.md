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
- npm недоступен. QR-код во вкладке «Создать счёт» — через CDN `cdn.jsdelivr.net/npm/qrcode/...` (загрузка при mount; при недоступности UI деградирует к текстовому отображению paymentUrl).

## Роли и сценарии

- **Admin** (Андрей-разработчик) — единственная аутентифицированная роль; имеет доступ ко всем `/api/lp/*`, `/web/panel`, `/web/admin`, `/web/tests`.
- **Анонимный + token-в-query** — только `POST /web/webhook` (LifePay).
- **Школа** — отдельная роль не реализуется (исключено из MVP Прототипа).

Основные сценарии:
- Открыть `/web/panel`, заполнить настройки LifePay (apikey, login, webhook token, gateway base URL).
- На вкладке «Создать счёт вручную» создать тестовый счёт (1 ₽), показать QR.
- Оплатить QR со смартфона, получить webhook от LifePay, увидеть запись в журнале.

## Контур интеграции с payments-gateway

```
[ Admin UI (PanelHomePage.vue) ]
            |
            | fetch POST /api/lp/invoke { op, args }
            v
[ api/lp/invoke.ts (Admin-only) ]
            |
            | invokeGateway(ctx, op, args)
            | читает lp_apikey, lp_login, gateway_base_url из Heap
            | @app/request POST/GET <gateway_base_url>/api/v1/<op>
            | заголовки: X-Lp-Apikey, X-Lp-Login
            v
[ p/saas/gw/lifepay /api/v1/<op> ]
            |
            v
[ LifePay HTTP API ]

Ответ gateway (с заголовком X-Gateway-Request-Id) → возвращается клиенту без изменений,
параллельно пишется в Heap-таблицу request_log (без секретов, с маской email/phone).
```

## Роутинг

File-based, один файл = один роут с путём `/`:

- `index.tsx` — главная (SSR + Vue, шаблон шаблона).
- `web/admin/index.tsx` — админка шаблона (CRT-стиль; без LifePay-настроек).
- `web/profile/index.tsx`, `web/login/index.tsx`, `web/tests/index.tsx` — шаблонные.
- `web/panel/index.tsx` — главная панель LifePay (Admin-only, SSR-пропсы для PanelHomePage.vue).
- `web/webhook/index.tsx` — приёмник webhook LifePay (POST, анонимный + токен).
- `api/lp/invoke.ts` — POST прокладка к gateway (Admin).
- `api/lp/recent-requests.ts`, `api/lp/recent-webhooks.ts` — GET журналы (Admin).
- `api/lp/analytics/summary.ts` — GET карточки аналитики (Admin).
- `api/lp/search-by-request-id.ts` — GET поиск (Admin).
- `api/settings/*`, `api/logger/*`, `api/admin/*`, `api/tests/*` — без изменений (шаблон).

Все ссылки и редиректы — через `withProjectRoot` / `withProjectRootAndSubroute` (хардкод URL запрещён).

## Разделение слоёв

| Слой | Каталог | Ответственность |
| --- | --- | --- |
| **Таблицы** | `tables/` | Схемы Heap (поля, типы) |
| **Репозитории** | `repos/` | Работа с БД (Heap-операции) |
| **Бизнес-логика** | `lib/` | Правила, дефолты, валидации, gateway-клиент, webhook-обработка |
| **API** | `api/`, `web/webhook/` | HTTP-эндпоинты, парсинг, авторизация |
| **Pages** | `pages/` | Vue (SSR + клиент); без импортов tables/repos/lib |
| **Web (SSR)** | `web/` | Файловые роуты страниц |

Поток данных:
`HTTP → API → lib → repos → Heap` (никаких прямых импортов `tables/` из API).

## Стратегия логирования

Без изменений из шаблона: syslog RFC 5424, `lib/logger.lib.ts`, ключ `log_level` (Debug / Info / Warn / Error / Disable). Секреты (`apikey`, `login`, `lp_webhook_token`) **никогда** не пишутся в `writeServerLog.payload`. `argsRedacted` и `rawResponseBody` в `request_log`, а также `rawBody`/`rawQuery`/`email` в `webhook_log` хранятся **сырыми** — клиент является оператором персональных данных по 152-ФЗ и имеет полный доступ к данным платежей. Структурная гигиена (циклы/несериализуемое/усечение по 64KB) — через `shared/prepareRawLog.ts`. Маскирующие утилиты `shared/redact.ts` / `shared/redactRaw.ts` оставлены в коде с их юнит-тестами, но в production-пути не используются.

## Интеграции

- **payments-gateway** (`p/saas/gw/lifepay`) — единственный исходящий собеседник. Контракт: `POST/GET /api/v1/<op>` (префикс `/api/` от file-based роутинга gateway), заголовки `X-Lp-Apikey`, `X-Lp-Login`, ответ `X-Gateway-Request-Id`. Без серверных ретраев. Таймаут 15 секунд (на 5 секунд больше gateway-таймаута).
- **LifePay** — только через gateway. Webhook от LifePay приходит на `/web/webhook?token=...` (URL передаётся в `callbackUrl` каждого `createBill`, не глобально).

## Безопасность

- `requireAccountRole(ctx, 'Admin')` первой строкой всех `/api/lp/*` и `/web/panel`.
- Webhook — анонимный, но с обязательной сверкой токена.
- MD5-подпись webhook **не** проверяется: LifePay её не публикует (нет полей `check`/`signature`/`hash` в теле, нет описания алгоритма на apidoc.life-pay.ru/notification). Если LifePay в будущем добавит подпись — вернуться к этому пункту.
- Дедупликация webhook через `runWithExclusiveLock` из `@app/sync` + `findByField` + create в `webhook_idempotency` (Heap-схема не выражает unique constraint напрямую).
