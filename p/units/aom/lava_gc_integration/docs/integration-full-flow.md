# Сквозная логика интеграции GetCourse + Chatium + Lava

Документ даёт **единый нарратив**: кто с кем взаимодействует, в каком порядке, и где в коде лежит реализация. Детали контрактов, ошибок, блокировок и данных — в связанных файлах ниже (не дублируются здесь).

## Участники


| Участник                 | Роль                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Пользователь**         | Выбирает оплату через Lava на стороне GetCourse, переходит на виджет Lava, оплачивает.                                                                                        |
| **GetCourse (GC)**       | Хранит заказ; **серверно** запрашивает у Chatium ссылку на оплату (сервисный токен); перенаправляет пользователя на Lava; получает итог оплаты через PL API от Chatium.       |
| **Chatium (приложение)** | Промежуточный слой: обновляет «технический» оффер в Lava, создаёт контракт, сохраняет связь заказ GC ↔ контракт Lava, принимает webhook от Lava, обновляет заказ в GetCourse. |
| **Lava**                 | Платёжный провайдер: выставляет счёт по контракту, принимает оплату, шлёт webhook в Chatium.                                                                                  |


Важно: **первый HTTP-вход в Chatium от имени интеграции оплаты** — это не браузер пользователя, а **запрос GetCourse → Chatium** на создание ссылки (см. [integration-http-contracts.md](./integration-http-contracts.md) § 11.1). Пользователь открывает страницу оплаты в GC и выбирает Lava — дальше GC вызывает Chatium.

## 0. Подготовка (админка, один раз)

1. В Heap сохраняются секреты и идентификаторы: ключи Lava, `lava_product_id` / `lava_offer_id` (технический продукт и оффер-шаблон), секрет webhook Lava, домен и ключи GetCourse, `gc_service_token` для входящего `payment-link`.
2. Мастер Lava: загрузка каталога (`POST /api/admin/lava/catalog`), выбор пары продукт/оффер. Проверка доступа к PL API GetCourse: `POST /api/admin/getcourse/verify`.

Подробности: [api.md](./api.md) (разделы Lava, GetCourse), [integration-lava-api.md](./integration-lava-api.md), [architecture.md](./architecture.md).

## 1. Создание ссылки на оплату (основной поток)

**Триггер в продукте:** пользователь на странице оплаты GetCourse выбирает оплату через Lava → **GetCourse отправляет** в Chatium запрос создания ссылки.


| Шаг | Что происходит                                                                                                                                                                                                                                                                         | Где в коде / доках                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | HTTP **POST** `…/api/integrations/lava/payment-link` (полный URL с префиксом приложения — [api.md](./api.md)). Заголовок: `X-Service-Token` или `Authorization: Bearer` = `gc_service_token`. Тело: `gcOrderId`, `buyerEmail`, `amount`, `currency`, опционально `gcUserId`, UTM и др. | `api/integrations/lava/payment-link/index.ts` (`lavaPaymentLinkRoute`), схема `.body`                                     |
| 2   | Валидация тела, вызов `**createPaymentLink`**                                                                                                                                                                                                                                          | `lib/lava-payment.service.ts`                                                                                             |
| 3   | Идемпотентность: при уже существующем активном контракте для заказа — возврат ранее выданной ссылки (без лишнего вызова Lava)                                                                                                                                                          | [integration-idempotency-statuses-webhooks.md](./integration-idempotency-statuses-webhooks.md), `lava-payment.service.ts` |
| 4   | **Критическая секция** по ключу шаблонного оффера: `runWithExclusiveLock`, журнал `lava_lock_log`                                                                                                                                                                                      | [integration-critical-section.md](./integration-critical-section.md), `lib/lava-payment.service.ts`, репо `lava_lock_log` |
| 5   | PATCH цены оффера в Lava, затем POST создание контракта (invoice)                                                                                                                                                                                                                      | `lib/lava-api.client.ts` (`updateOfferPrice`, `createContract`), [integration-lava-api.md](./integration-lava-api.md)     |
| 6   | Сохранение записи контракта и связи с заказом GC в Heap                                                                                                                                                                                                                                | `repos/lava_payment_contract.repo.ts`, [integration-data-model.md](./integration-data-model.md), [data.md](./data.md)     |
| 7   | Ответ GetCourse: `paymentUrl`, `lavaContractId`, статус и др.                                                                                                                                                                                                                          | [integration-http-contracts.md](./integration-http-contracts.md) § 11.1                                                   |
| 8   | GetCourse открывает пользователю **страницу/виджет оплаты Lava** (редирект по `paymentUrl`)                                                                                                                                                                                            | Сценарий: [integration-architecture-flows.md](./integration-architecture-flows.md) § 5.1                                  |


Пошаговые ветки (ошибка PATCH, ошибка контракта, параллельные запросы): [integration-lifecycle.md](./integration-lifecycle.md) § 12.

## 2. Оплата пользователем

Пользователь платит в интерфейсе Lava. Chatium в этот момент **не** участвует в канале «карта ↔ Lava».

## 3. Webhook от Lava и обновление GetCourse


| Шаг | Что происходит                                                                                                      | Где в коде / доках                                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Lava отправляет **POST** `…/api/integrations/lava/webhook`, заголовок `X-Api-Key` = `lava_webhook_secret`           | `api/integrations/lava/webhook/index.ts` (`lavaWebhookRoute`), [api.md](./api.md)                                                                                                             |
| 2   | Проверка секрета, дедупликация событий, обновление статуса контракта в Heap                                         | `lib/lava-webhook.service.ts` (`processWebhook`), `repos/lava_webhook_event.repo.ts`                                                                                                          |
| 3   | По итоговому статусу — вызов **GetCourse PL API** (`updateDealStatus`): обновление заказа (оплачен / ошибка и т.д.) | `lib/getcourse-api.client.ts`, [reference/getcourse-pl-api-spec.md](./reference/getcourse-pl-api-spec.md), [integration-getcourse-api-reference.md](./integration-getcourse-api-reference.md) |


Логический JSON-колбэк «payment-status» описан в [integration-http-contracts.md](./integration-http-contracts.md) § 11.2 как контракт смысла; **фактическая** доставка в GC в приложении — через PL API (form + Base64 `params`), не отдельный REST JSON-эндпоинт в GC.

Детали статусов, повторов webhook, `contract_not_found`: [integration-idempotency-statuses-webhooks.md](./integration-idempotency-statuses-webhooks.md).

## 4. Безопасность и ошибки

Секреты, коды ответов `payment-link`, реакция GC: [integration-security-validation-errors.md](./integration-security-validation-errors.md).

## 5. Наблюдаемость и эксплуатация

Логи (`ctx.account.log` / проектный logger, Heap `logs`, трассировка репозиториев `lava_`* при Debug): [integration-observability.md](./integration-observability.md), [integration-nfr-edge-operations.md](./integration-nfr-edge-operations.md).

## Сводная таблица «вход → слой»


| Внешний вызов       | Слой API                              | Основная lib                                            |
| ------------------- | ------------------------------------- | ------------------------------------------------------- |
| GC → `payment-link` | `api/integrations/lava/payment-link/` | `lava-payment.service` → `lava-api.client`, репозитории |
| Lava → `webhook`    | `api/integrations/lava/webhook/`      | `lava-webhook.service` → `getcourse-api.client`         |


Полный перечень путей HTTP: [api.md](./api.md). Карта модулей платформы: [integration-implementation-chatium.md](./integration-implementation-chatium.md).

## С чего читать дальше

1. Контекст продукта и границы систем: [integration-overview.md](./integration-overview.md)
2. Целевая схема последовательности (шаги 1–14): [integration-architecture-flows.md](./integration-architecture-flows.md) § 5.1
3. Оглавление всех файлов `integration-*`: [README.md](./README.md) (этот каталог `docs/`)

