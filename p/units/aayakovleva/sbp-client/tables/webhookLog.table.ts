/**
 * Журнал входящих webhook от LifePay (implementation-plan §1.8.1).
 *
 * Поля по apidoc.life-pay.ru/notification (текущая live-документация).
 * `number` (transaction number LifePay) и `orderNumber` (наш) — searchable.
 *
 * Поле `rawBody` — полное тело webhook (JSON) **без маскирования PII**: клиент
 * (sbp-client) — оператор персональных данных по 152-ФЗ и хранит сырые данные.
 * Структурная гигиена (циклы, несериализуемое, усечение > 64KB) — через
 * `shared/prepareRawLog.prepareRawLog`. Запись делается ТОЛЬКО при валидном
 * токене (см. web/webhook/index.tsx) — при `missing`/`mismatch`/`not_configured`
 * запись намеренно не создаётся.
 *
 * Поле `rawQuery` — query параметры как пришли (token не маскируется).
 *
 * Старое поле `emailMasked` (с маскированным email) переименовано в `email`
 * и теперь хранит сырое значение. Обёрнуто в `Heap.Optional` для совместимости
 * с записями, созданными до этого изменения.
 */

import { Heap } from '@app/heap'

export const WebhookLog = Heap.Table('t__lifepay-sbp-client__whlog__d2Pq8T', {
  number: Heap.String({
    customMeta: { title: 'Transaction number LifePay' },
    searchable: { langs: ['en'], embeddings: false }
  }),
  type: Heap.String({
    customMeta: { title: 'Тип события (payment / refund)' }
  }),
  status: Heap.String({
    customMeta: { title: 'Статус (success / fail / ...)' }
  }),
  method: Heap.String({
    customMeta: { title: 'Метод оплаты (card / internetAcquiring / mobileInternetAcquiring / ...)' }
  }),
  amount: Heap.String({
    customMeta: { title: 'Сумма (строка с двумя знаками)' }
  }),
  orderNumber: Heap.String({
    customMeta: { title: 'order.number из вложенного JSON (наш orderNumber)' },
    searchable: { langs: ['en'], embeddings: false }
  }),
  correlationId: Heap.Optional(Heap.String({
    customMeta: { title: 'correlationId из query callbackUrl (связка с request_log; пусто если нет)' }
  })),
  tokenValid: Heap.Boolean({
    customMeta: { title: 'Был ли токен в query валиден' }
  }),
  duplicate: Heap.Boolean({
    customMeta: { title: 'Дубликат: number уже встречался' }
  }),
  processedAt: Heap.Number({
    customMeta: { title: 'Unix ms момента приёма' }
  }),
  email: Heap.Optional(Heap.String({
    customMeta: { title: 'Email покупателя (raw, без маскирования)' }
  })),
  rawBody: Heap.Optional(Heap.Any({
    customMeta: { title: 'Полное тело webhook (raw, без PII-маски)' }
  })),
  rawQuery: Heap.Optional(Heap.Any({
    customMeta: { title: 'Query параметры (raw, token не маскируется)' }
  }))
})

export default WebhookLog

export type WebhookLogRow = typeof WebhookLog.T
export type WebhookLogRowJson = typeof WebhookLog.JsonT
