# Безопасность, валидация, обработка ошибок

## 17. Безопасность

### 17.1. Секреты

Хранить отдельно (Heap settings / конфиг workspace), **не** логировать:

1. `lava_api_key` (исходящий заголовок **`X-Api-Key`** к API Lava; базовый URL уточнять в кабинете, в примерах OpenAPI встречается `https://gate.lava.top`);
2. учётные данные **входящего** webhook от Lava: по OpenAPI — **HTTP Basic** (`BasicWebhookAuth`) или отдельный **`X-Api-Key`** для webhook (`ApiKeyWebhookAuth`); см. [integration-lava-openapi-reference.md](./integration-lava-openapi-reference.md);
3. сервисный токен для вызовов GetCourse → Chatium;
4. сервисный токен / ключ для callback Chatium → GetCourse.

### 17.2. Аутентификация GetCourse → Chatium

1. сервисный токен в заголовке;
2. опционально IP allowlist;
3. корреляционный `requestId` в теле/логах.

### 17.3. Аутентификация Chatium → GetCourse

1. отдельный endpoint на стороне GetCourse;
2. сервисный секрет в заголовке;
3. при необходимости HMAC тела.

### 17.4. Chatium: формы админки

Если секреты вводятся через браузерные формы, использовать `generateDynamicCsrfToken` / `verifyDynamicCsrfToken` из `@app/security` для POST с клиента.

## 18. Валидация входных данных (payment-link)

Перед критической секцией проверить:

1. `gcOrderId` не пустой;
2. `buyerEmail` валиден;
3. `amount > 0`;
4. `currency` из разрешённого набора;
5. настроены `productId` и `offerId`;
6. заказ не в финальном статусе — если такой контроль доступен по данным запроса или внутреннему состоянию;
7. запрос не является недопустимым дублем (см. [integration-idempotency-statuses-webhooks.md](./integration-idempotency-statuses-webhooks.md)).

Реализация — `@app/schema` и ответы через `@app/errors` где уместно.

## 19. Обработка ошибок

### 19.1. API создания ссылки

| Код | Смысл | Рекомендация для GetCourse |
| --- | --- | --- |
| `VALIDATION_ERROR` | Некорректный ввод | Остановить сценарий, показать ошибку |
| `PAYMENT_TEMPLATE_BUSY` | Секция занята | Retry или временная ошибка |
| `LAVA_UPDATE_ERROR` | Цена не обновилась | Повторить попытку |
| `LAVA_CONTRACT_ERROR` | Контракт не создан | Повторить попытку |
| `CONFIG_ERROR` | Нет шаблона | Убрать способ оплаты, инцидент |
| `INTERNAL_ERROR` | Сбой Chatium | Запасной способ оплаты |

### 19.2. Webhook

Сохранённый webhook при ошибке обработки не терять: возможность повторной обработки оператором/джобой (см. `@app/jobs` при необходимости, `inner/docs/005-jobs.md`).
