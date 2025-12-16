// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TGetWebhooksWebhooks = Heap.Table(
  't_get_webhooks_webhooks',
  {
    botToken: Heap.Optional(Heap.String({ customMeta: { title: 'Токен бота' }, searchable: { langs: ['ru', 'en'] } })),
    updateId: Heap.Optional(Heap.Number({ customMeta: { title: 'ID обновления' } })),
    data: Heap.Optional(Heap.Any()),
    receivedAt: Heap.Optional(Heap.DateTime({ customMeta: { title: 'Время получения' } })),
  },
  { customMeta: { title: 'webhooks.table.ts', description: 'webhooks.table.ts' } },
)

export default TGetWebhooksWebhooks

export type TGetWebhooksWebhooksRow = typeof TGetWebhooksWebhooks.T
export type TGetWebhooksWebhooksRowJson = typeof TGetWebhooksWebhooks.JsonT
