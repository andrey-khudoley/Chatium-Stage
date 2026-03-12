// Таблица приглашений в кампанию (токен, срок действия, принятие).
import { Heap } from '@app/heap'

export const TSaasRefCampaignInvite6Xy9Zk = Heap.Table(
  't__saas-ref__campaign_invite__6Xy9Zk',
  {
    campaignId: Heap.Optional(
      Heap.RefLink('t__saas-ref__campaign__8Hn4Lx', {
        customMeta: { title: 'Кампания' },
        onDelete: 'none',
      }),
    ),
    token: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Токен приглашения', description: 'Уникальный токен для ссылки' },
      }),
    ),
    createdByUserId: Heap.Optional(
      Heap.UserRefLink({
        customMeta: { title: 'Кто создал' },
        onDelete: 'none',
      }),
    ),
    expiresAt: Heap.Optional(
      Heap.DateTime({
        customMeta: { title: 'Истекает' },
      }),
    ),
    acceptedAt: Heap.Optional(
      Heap.DateTime({
        customMeta: { title: 'Принято' },
        description: 'Когда приглашение было принято; null = не использовано',
      }),
    ),
  },
  { customMeta: { title: 'Приглашения в кампанию', description: 'Приглашения по токену' } },
)

export default TSaasRefCampaignInvite6Xy9Zk

export type TSaasRefCampaignInvite6Xy9ZkRow = typeof TSaasRefCampaignInvite6Xy9Zk.T
export type TSaasRefCampaignInvite6Xy9ZkRowJson = typeof TSaasRefCampaignInvite6Xy9Zk.JsonT
