import { Heap } from '@app/heap'

/**
 * Таблица для хранения аналитики переходов по ссылкам
 * 
 * Каждая запись содержит:
 * - linkId: ID ссылки из таблицы ChannelLinks
 * - uid: Уникальный идентификатор анонимного пользователя (из системы трафика)
 * - queryParams: JSON массив с query параметрами из URL
 * - inviteLink: Уникальная ссылка для вступления в Telegram-канал
 * - clickedAt: время перехода
 * - joinedAt: время вступления в канал (если пользователь вступил через invite link)
 * - telegramUserId: ID пользователя Telegram (если вступление в канал произошло)
 * - userAgent: User-Agent браузера (опционально)
 * - ipAddress: IP адрес (опционально)
 * - referer: Referer заголовок (опционально)
 */
export const ChannelLinkAnalytics = Heap.Table('t__tg_channel_analytics__link_analytics__e5f6g7h8', {
  linkId: Heap.String({
    customMeta: { title: 'ID ссылки' }
  }),
  uid: Heap.String({
    customMeta: { title: 'Уникальный идентификатор анонимного пользователя' }
  }),
  queryParams: Heap.String({
    customMeta: { title: 'Query параметры в формате JSON' }
  }),
  inviteLink: Heap.String({
    customMeta: { title: 'Уникальная ссылка для вступления в Telegram-канал' }
  }),
  clickedAt: Heap.DateTime({
    customMeta: { title: 'Время перехода' }
  }),
  joinedAt: Heap.Optional(
    Heap.DateTime({
      customMeta: { title: 'Время вступления в канал' }
    })
  ),
  telegramUserId: Heap.Optional(
    Heap.String({
      customMeta: { title: 'ID пользователя Telegram' }
    })
  ),
  userAgent: Heap.Optional(
    Heap.String({
      customMeta: { title: 'User-Agent' }
    })
  ),
  ipAddress: Heap.Optional(
    Heap.String({
      customMeta: { title: 'IP адрес' }
    })
  ),
  referer: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Referer' }
    })
  )
})

export default ChannelLinkAnalytics

