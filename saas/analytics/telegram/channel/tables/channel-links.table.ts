import { Heap } from '@app/heap'

/**
 * Таблица для хранения ссылок на каналы
 * 
 * Каждая запись содержит:
 * - name: название ссылки
 * - trackingUrl: URL ссылки для отслеживания (автогенерация, если не указан)
 * - targetUrl: URL, на которую перейдёт пользователь после перехода по trackingUrl
 * - chatId: ID канала из таблицы TelegramChats
 * - botId: ID бота, который контролирует канал
 * - userId: ID пользователя-владельца
 */
export const ChannelLinks = Heap.Table('t__tg_channel_analytics__channel_links__a1b2c3d4', {
  name: Heap.String({
    customMeta: { title: 'Название ссылки' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  trackingUrl: Heap.String({
    customMeta: { title: 'URL для отслеживания' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  targetUrl: Heap.String({
    customMeta: { title: 'Целевой URL' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  chatId: Heap.String({
    customMeta: { title: 'ID канала' }
  }),
  botId: Heap.String({
    customMeta: { title: 'ID бота-контроллера' }
  }),
  userId: Heap.String({
    customMeta: { title: 'ID пользователя' }
  })
})

export default ChannelLinks

