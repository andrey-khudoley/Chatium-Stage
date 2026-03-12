// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TSaasRefBot2Kf9Mn = Heap.Table(
  't__saas-ref__bot__2Kf9Mn',
  {
    campaignId: Heap.Optional(
      Heap.RefLink('t__saas-ref__campaign__8Hn4Lx', {
        customMeta: { title: 'Кампания' },
        onDelete: 'none'
      })
    ),
    tokenEncrypted: Heap.Optional(Heap.String({ customMeta: { title: 'Зашифрованный токен' } })),
    tgBotId: Heap.Optional(Heap.String({ customMeta: { title: 'Telegram Bot ID' } })),
    username: Heap.Optional(Heap.String({ customMeta: { title: 'Username бота' } })),
    title: Heap.Optional(Heap.String({ customMeta: { title: 'Название' } })),
    webhookUrl: Heap.Optional(Heap.String({ customMeta: { title: 'URL webhook' } })),
    webhookStatus: Heap.Optional(
      Heap.String({ customMeta: { title: 'Статус webhook', description: 'ok | error | pending' } })
    )
  },
  { customMeta: { title: 'Telegram боты', description: 'Боты кампаний' } }
)

export default TSaasRefBot2Kf9Mn

export type TSaasRefBot2Kf9MnRow = typeof TSaasRefBot2Kf9Mn.T
export type TSaasRefBot2Kf9MnRowJson = typeof TSaasRefBot2Kf9Mn.JsonT
