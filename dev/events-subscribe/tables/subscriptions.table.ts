// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevEventsSubscribeSubscriptionsYeG = Heap.Table(
  't_dev_events-subscribe_subscriptions_YeG',
  {
    userId: Heap.Optional(Heap.UserRefLink({ customMeta: { title: 'Пользователь' } })),
    eventType: Heap.Optional(
      Heap.String({ customMeta: { title: 'Тип события' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    eventName: Heap.Optional(
      Heap.String({ customMeta: { title: 'Название события' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    isActive: Heap.Optional(
      Heap.Boolean({ customMeta: { title: 'Активна' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
  },
  { customMeta: { title: 'Подписки на события', description: 'Подписки на события' } },
)

export default TDevEventsSubscribeSubscriptionsYeG

export type TDevEventsSubscribeSubscriptionsYeGRow = typeof TDevEventsSubscribeSubscriptionsYeG.T
export type TDevEventsSubscribeSubscriptionsYeGRowJson = typeof TDevEventsSubscribeSubscriptionsYeG.JsonT
