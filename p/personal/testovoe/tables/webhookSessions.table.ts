import { Heap } from '@app/heap'

export const WebhookSessions = Heap.Table('t__testovoe__webhook_sess__m9K2xL', {
  webhookId: Heap.String({
    customMeta: { title: 'ID сессии webhook' }
  }),
  socketId: Heap.String({
    customMeta: { title: 'Socket ID клиента' }
  }),
  clarityUid: Heap.String({
    customMeta: { title: 'Clarity UID' }
  }),
  token: Heap.String({
    customMeta: { title: 'BotAPI Token (для идентификации)' }
  }),
  accumulatedChats: Heap.Any({
    customMeta: { title: 'Накопленные чаты (JSON)' }
  }),
  createdTs: Heap.Number({
    customMeta: { title: 'Unix timestamp создания' }
  })
})

export default WebhookSessions

export type WebhookSessionsRow = typeof WebhookSessions.T
