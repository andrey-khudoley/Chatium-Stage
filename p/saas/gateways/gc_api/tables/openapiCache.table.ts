import { Heap } from '@app/heap'

/** Кэш OpenAPI GC new API (одна строка на ключ). */
export const OpenapiCache = Heap.Table('t__gc-api-gateway__openapi__1Jv5Ua', {
  key: Heap.String({
    customMeta: { title: 'Ключ кеша (gc-new-openapi)' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  json: Heap.Any({
    customMeta: { title: 'Спецификация OpenAPI (объект)' }
  }),
  version: Heap.Optional(
    Heap.String({
      customMeta: { title: 'openapi.info.version' }
    })
  ),
  fetchedAt: Heap.Number({
    customMeta: { title: 'Загружено (Unix ms)' }
  })
})

export default OpenapiCache

export type OpenapiCacheRow = typeof OpenapiCache.T
export type OpenapiCacheRowJson = typeof OpenapiCache.JsonT
