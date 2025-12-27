import { Heap } from '@app/heap'

/**
 * Таблица для хранения уникальных телеграм-чатов и каналов
 * 
 * Каждая запись содержит:
 * - chatId: уникальный ID чата/канала из Telegram (используется как ключ для createOrUpdateBy)
 * - botId: ID бота, от которого пришёл вебхук с этим чатом
 * - userId: ID пользователя-владельца бота
 * - chatType: тип чата (private, group, supergroup, channel)
 * - chatTitle: название чата/канала (если доступно)
 * - chatUsername: username чата/канала (если доступно)
 * - firstSeenAt: время первого появления чата в вебхуках
 * - lastSeenAt: время последнего появления чата в вебхуках
 */
export const TelegramChats = Heap.Table('t__tg_channel_analytics__chats__b4c5d6e7', {
  chatId: Heap.String({
    customMeta: { title: 'ID чата/канала из Telegram' }
  }),
  botId: Heap.String({
    customMeta: { title: 'ID бота' }
  }),
  userId: Heap.String({
    customMeta: { title: 'ID пользователя-владельца бота' }
  }),
  chatType: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Тип чата' }
    })
  ),
  chatTitle: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Название чата/канала' },
      searchable: { langs: ['ru', 'en'], embeddings: false }
    })
  ),
  chatUsername: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Username чата/канала' },
      searchable: { langs: ['ru', 'en'], embeddings: false }
    })
  ),
  firstSeenAt: Heap.DateTime({
    customMeta: { title: 'Время первого появления' }
  }),
  lastSeenAt: Heap.DateTime({
    customMeta: { title: 'Время последнего появления' }
  })
})

export default TelegramChats



