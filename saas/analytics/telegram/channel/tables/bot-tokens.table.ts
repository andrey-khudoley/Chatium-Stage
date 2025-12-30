import { Heap } from '@app/heap'

/**
 * Таблица для хранения токенов Telegram ботов
 * 
 * Каждая запись содержит:
 * - token: токен бота, введённый пользователем
 * - botName: название бота, полученное через API Telegram
 * - botUsername: имя бота (username с суффиксом "_bot")
 * - projectId: ID проекта, к которому привязан бот
 */
export const BotTokens = Heap.Table('t__tg_channel_analytics__bot_tokens__f8e9d2a1', {
  token: Heap.String({
    customMeta: { title: 'Токен бота' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  botName: Heap.String({
    customMeta: { title: 'Название бота' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  botUsername: Heap.String({
    customMeta: { title: 'Имя бота' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  projectId: Heap.String({
    customMeta: { title: 'ID проекта' }
  })
})

export default BotTokens
 