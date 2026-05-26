/**
 * Журнал исходящих вызовов payments-gateway (implementation-plan §1.8.1).
 *
 * Одна запись на каждый `POST /api/lp/invoke`. Поля `requestId`, `orderNumber`
 * — `searchable` для быстрого поиска по UI.
 *
 * Поля `argsRedacted` и `rawResponseBody` хранят **сырые** данные (клиент —
 * оператор ПД, маскировать не требуется). Колонки оставлены под прежними
 * именами для совместимости с существующими записями; структурная гигиена
 * (циклы/несериализуемое/усечение) — через `shared/prepareRawLog.prepareRawLog`.
 */

import { Heap } from '@app/heap'

export const RequestLog = Heap.Table('t__lifepay-sbp-client__reqlog__c7Np4S', {
  requestId: Heap.String({
    customMeta: { title: 'Request ID (X-Gateway-Request-Id)' },
    searchable: { langs: ['en'], embeddings: false }
  }),
  op: Heap.String({
    customMeta: { title: 'Operation (createBill / getBillStatus / cancelBill)' }
  }),
  argsRedacted: Heap.Any({
    customMeta: { title: 'Аргументы запроса (raw, без маскирования)' }
  }),
  orderNumber: Heap.String({
    customMeta: { title: 'orderNumber из args (для связки с webhook)' },
    searchable: { langs: ['en'], embeddings: false }
  }),
  correlationId: Heap.Optional(
    Heap.String({
      customMeta: {
        title: 'correlationId (UUID из callbackUrl/args, для надёжной связки с webhook)'
      }
    })
  ),
  clientHttpStatus: Heap.Number({
    customMeta: { title: 'HTTP-статус ответа gateway' }
  }),
  ok: Heap.Boolean({
    customMeta: { title: 'Успех (ok === true в теле gateway)' }
  }),
  errorCode: Heap.String({
    customMeta: { title: 'error.code из тела (пусто при ok)' }
  }),
  lpHttpStatus: Heap.Number({
    customMeta: { title: 'HTTP-статус LifePay из details.lpHttpStatus (0 если нет)' }
  }),
  lpSemanticRule: Heap.String({
    customMeta: { title: 'details.lpRule семантической ошибки bills_v1_* (пусто если нет)' }
  }),
  lpNumericCode: Heap.Number({
    customMeta: { title: 'details.lpNumericCode (0 если нет)' }
  }),
  durationMs: Heap.Number({
    customMeta: { title: 'Длительность исходящего вызова, мс' }
  }),
  requestedAt: Heap.Number({
    customMeta: { title: 'Unix ms момента исходящего вызова к gateway' }
  }),
  rawResponseBody: Heap.Any({
    customMeta: { title: 'Полное тело ответа gateway (raw, без маскирования)' }
  })
})

export default RequestLog

export type RequestLogRow = typeof RequestLog.T
export type RequestLogRowJson = typeof RequestLog.JsonT
