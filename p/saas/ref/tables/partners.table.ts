// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TSaasRefPartner3Ab7Cd = Heap.Table(
  't__saas-ref__partner__3Ab7Cd',
  {
    campaignId: Heap.Optional(
      Heap.RefLink('t__saas-ref__campaign__8Hn4Lx', {
        customMeta: { title: 'Кампания' },
        onDelete: 'none',
      }),
    ),
    tgId: Heap.Optional(Heap.String({ customMeta: { title: 'Telegram ID' } })),
    username: Heap.Optional(Heap.String({ customMeta: { title: 'Username' } })),
    fullName: Heap.Optional(Heap.String({ customMeta: { title: 'Полное имя' } })),
    stats: Heap.Optional(
      Heap.Any({ customMeta: { title: 'Статистика', description: 'Агрегированные показатели' } }),
    ),
  },
  { customMeta: { title: 'Партнёры', description: 'Партнёры кампании (Telegram)' } },
)

export default TSaasRefPartner3Ab7Cd

export type TSaasRefPartner3Ab7CdRow = typeof TSaasRefPartner3Ab7Cd.T
export type TSaasRefPartner3Ab7CdRowJson = typeof TSaasRefPartner3Ab7Cd.JsonT
