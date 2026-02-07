import { Heap } from '@app/heap'

export const BotTokens = Heap.Table('t__testovoe__bot_tokens__a8R2kM', {
  clarityUid: Heap.String({
    customMeta: { title: 'Clarity UID' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  token: Heap.String({
    customMeta: { title: 'Telegram BotAPI Token' }
  }),
  lastUpdated: Heap.Number({
    customMeta: { title: 'Unix timestamp обновления' }
  })
})

export default BotTokens

export type BotTokensRow = typeof BotTokens.T
