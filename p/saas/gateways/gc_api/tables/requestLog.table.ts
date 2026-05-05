import { Heap } from '@app/heap'

/** Корреляционный лог invoke (без PII по умолчанию). */
export const RequestLog = Heap.Table('t__gc-api-gateway__reqlog__9Kr4Ez', {
  correlationId: Heap.String({
    customMeta: { title: 'Correlation ID' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  schoolId: Heap.String({
    customMeta: { title: 'Школа' }
  }),
  op: Heap.String({
    customMeta: { title: 'Операция' }
  }),
  circuit: Heap.String({
    customMeta: { title: 'Контур' }
  }),
  status: Heap.String({
    customMeta: { title: 'success | error' }
  }),
  gcStatusCode: Heap.Optional(
    Heap.Number({
      customMeta: { title: 'HTTP статус от GC' }
    })
  ),
  latencyMs: Heap.Number({
    customMeta: { title: 'Длительность (мс)' }
  }),
  errorCode: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Код ошибки gateway' }
    })
  ),
  errorMessage: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Краткое сообщение об ошибке' }
    })
  ),
  args: Heap.Optional(
    Heap.Any({
      customMeta: { title: 'Args (только при Debug в логере)' }
    })
  ),
  createdAt: Heap.Number({
    customMeta: { title: 'Время (Unix ms)' }
  })
})

export default RequestLog

export type RequestLogRow = typeof RequestLog.T
export type RequestLogRowJson = typeof RequestLog.JsonT
