// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TSaasRefCampaign8Hn4Lx = Heap.Table(
  't__saas-ref__campaign__8Hn4Lx',
  {
    title: Heap.Optional(Heap.String({ customMeta: { title: 'Название' } })),
    ownerUserId: Heap.Optional(
      Heap.UserRefLink({
        customMeta: { title: 'Владелец' },
        onDelete: 'none',
      }),
    ),
    webhookSecret: Heap.Optional(Heap.String({ customMeta: { title: 'Секрет webhook' } })),
    settings: Heap.Optional(Heap.Any()),
    isDeleted: Heap.Optional(Heap.Boolean({ customMeta: { title: 'Удалена' } })),
  },
  { customMeta: { title: 'Кампании', description: 'Кампании' } },
)

export default TSaasRefCampaign8Hn4Lx

export type TSaasRefCampaign8Hn4LxRow = typeof TSaasRefCampaign8Hn4Lx.T
export type TSaasRefCampaign8Hn4LxRowJson = typeof TSaasRefCampaign8Hn4Lx.JsonT
