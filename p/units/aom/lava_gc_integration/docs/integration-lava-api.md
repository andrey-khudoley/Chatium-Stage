# Внешние вызовы Lava API

**Источник истины по путям, телам запросов и схемам:** [reference/lavatop-openapi3.yaml](./reference/lavatop-openapi3.yaml) и человекочитаемая сводка [integration-lava-openapi-reference.md](./integration-lava-openapi-reference.md).

## 10.1. Авторизация

Запросы к Lava выполняются с API-ключом в заголовке **`X-Api-Key`** (схема `ApiKeyAuth` в OpenAPI).

## 10.2. Обновление продукта или оффера

Runtime: **`PATCH /api/v2/products/{productId}`** с телом **`ProductUpdateRequest`**: массив **`offers`** с элементами **`UpdateOfferRequest`** — идентификатор оффера **`id`**, цены **`prices`** (`UpdatePriceRequest`: `amount`, `currency`), при необходимости **`name`**, **`description`**.

**Назначение:**

1. изменить цену оффера перед созданием контракта;
2. при необходимости изменить название/описание оффера (см. открытые вопросы в [integration-readiness-decisions-open-questions.md](./integration-readiness-decisions-open-questions.md)).

**Рабочая гипотеза:**

1. продукт и оффер остаются теми же сущностями;
2. меняется в первую очередь стоимость;
3. изменение делается непосредственно перед созданием контракта.

Реализация в Chatium — через `request()` из `@app/request` (см. `inner/docs/004-request.md`).

## 10.3. Создание контракта

После успешного обновления цены вызывается **`POST /api/v3/invoice`** (актуальный маршрут; `POST /api/v1/invoice` и `POST /api/v2/invoice` в OpenAPI помечены как устаревшие).

Тело — **`CreateInvoiceV3Request`**: минимум `email`, `offerId`, `currency`; опционально `paymentProvider`, `paymentMethod`, `buyerLanguage`, `periodicity`, `clientUtm` — по согласованию с GetCourse.

Ответ **201** — **`InvoicePaymentParamsResponse`**: идентификатор контракта (`id`), **`paymentUrl`**, **`status`** и др. (полный состав — в YAML).

Контракт создаётся **сразу** после обновления цены и **до** снятия блокировки.

## 10.4. Получение списка продуктов

В обычном runtime запрос списка продуктов **не нужен**.

Для служебных сценариев в OpenAPI: **`GET /api/v2/products`** (обновлённая лента продуктов):

1. первичная настройка;
2. диагностика;
3. сверка конфигурации;
4. ручная проверка существования шаблонного продукта.
