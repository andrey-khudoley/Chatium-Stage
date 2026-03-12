// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TSaasRefCampaignMember2Km5Ny = Heap.Table(
  't__saas-ref__campaign_member__2Km5Ny',
  {
    campaignId: Heap.Optional(
      Heap.RefLink('t__saas-ref__campaign__8Hn4Lx', {
        customMeta: { title: 'Кампания' },
        onDelete: 'none',
      }),
    ),
    userId: Heap.Optional(
      Heap.UserRefLink({
        customMeta: { title: 'Пользователь' },
        onDelete: 'none',
      }),
    ),
    role: Heap.Optional(Heap.String({ customMeta: { title: 'Роль' } })),
  },
  { customMeta: { title: 'Участники кампании', description: 'Участники кампании' } },
)

export default TSaasRefCampaignMember2Km5Ny

export type TSaasRefCampaignMember2Km5NyRow = typeof TSaasRefCampaignMember2Km5Ny.T
export type TSaasRefCampaignMember2Km5NyRowJson = typeof TSaasRefCampaignMember2Km5Ny.JsonT
