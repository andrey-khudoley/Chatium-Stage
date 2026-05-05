import { Heap } from '@app/heap'

/** Кэш записи каталога операций (одна строка на op). */
export const OpCatalog = Heap.Table('t__gc-api-gateway__opcat__8Mq3Wy', {
  op: Heap.String({
    customMeta: { title: 'Идентификатор операции' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  circuit: Heap.String({
    customMeta: { title: 'Контур: new | legacy' }
  }),
  description: Heap.String({
    customMeta: { title: 'Описание (RU)' }
  }),
  argsSchemaJson: Heap.Any({
    customMeta: { title: 'JSON Schema аргументов' }
  }),
  returnsSchemaJson: Heap.Optional(
    Heap.Any({
      customMeta: { title: 'JSON Schema ответа (опц.)' }
    })
  ),
  gcMethod: Heap.Optional(
    Heap.String({
      customMeta: { title: 'HTTP-метод GC (new API)' }
    })
  ),
  gcPath: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Путь GC (new API)' }
    })
  ),
  deprecated: Heap.Boolean({
    customMeta: { title: 'Устарело' }
  }),
  disabled: Heap.Boolean({
    customMeta: { title: 'Отключено на gateway' }
  }),
  source: Heap.String({
    customMeta: { title: 'Источник схемы (openapi|legacy-static)' }
  }),
  sourceVersion: Heap.String({
    customMeta: { title: 'Версия источника / openapi hash' }
  }),
  updatedAt: Heap.Number({
    customMeta: { title: 'Обновлено (Unix ms)' }
  })
})

export default OpCatalog

export type OpCatalogRow = typeof OpCatalog.T
export type OpCatalogRowJson = typeof OpCatalog.JsonT
