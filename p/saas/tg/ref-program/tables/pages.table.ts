// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TSaasRefPage4Bc8De = Heap.Table(
  't__saas-ref__page__4Bc8De',
  {
    campaignId: Heap.Optional(
      Heap.RefLink('t__saas-ref__campaign__8Hn4Lx', {
        customMeta: { title: 'Кампания' },
        onDelete: 'none',
      }),
    ),
    title: Heap.Optional(Heap.String({ customMeta: { title: 'Название' } })),
    urlTemplate: Heap.Optional(
      Heap.String({
        customMeta: {
          title: 'URL-шаблон',
          description: 'Целевой URL с плейсхолдером {ref}',
        },
      }),
    ),
    webhookSecret: Heap.Optional(Heap.String({ customMeta: { title: 'Секрет webhook' } })),
  },
  { customMeta: { title: 'Страницы', description: 'Целевые страницы для трафика' } },
)

export default TSaasRefPage4Bc8De

export type TSaasRefPage4Bc8DeRow = typeof TSaasRefPage4Bc8De.T
export type TSaasRefPage4Bc8DeRowJson = typeof TSaasRefPage4Bc8De.JsonT
