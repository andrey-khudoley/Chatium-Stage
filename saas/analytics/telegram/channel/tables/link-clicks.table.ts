import { Heap } from '@app/heap'

/**
 * Таблица для хранения переходов по ссылкам с query-параметрами
 * 
 * Каждая запись содержит:
 * - linkId: ID ссылки из TrackingLinks
 * - queryParams: JSON с query-параметрами перехода
 * - inviteLink: инвайт-линк, на который был редирект
 * - clickedAt: время перехода
 * - subscribedAt: время подписки (опционально)
 * - subscriberTgId: tg_id подписчика (опционально)
 * - subscriberName: имя подписчика (опционально)
 * 
 * Системные поля createdAt и updatedAt добавляются автоматически
 */
export const LinkClicks = Heap.Table('t__tg_channel_analytics__link_clicks__d2e3f4a5', {
  linkId: Heap.String({
    customMeta: { title: 'ID ссылки из TrackingLinks' }
  }),
  queryParams: Heap.String({
    customMeta: { title: 'JSON с query-параметрами перехода' }
  }),
  inviteLink: Heap.String({
    customMeta: { title: 'Инвайт-линк, на который был редирект' }
  }),
  clickedAt: Heap.DateTime({
    customMeta: { title: 'Время перехода' }
  }),
  subscribedAt: Heap.Optional(
    Heap.DateTime({
      customMeta: { title: 'Время подписки' }
    })
  ),
  subscriberTgId: Heap.Optional(
    Heap.String({
      customMeta: { title: 'tg_id подписчика' }
    })
  ),
  subscriberName: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Имя подписчика' },
      searchable: { langs: ['ru', 'en'], embeddings: false }
    })
  )
})

export default LinkClicks

