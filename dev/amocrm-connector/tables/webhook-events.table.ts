// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevAmocrmConnectorWebhookEventsUd1 = Heap.Table(
  't_dev_amocrm-connector_webhook_events_ud1',
  {
    leadId: Heap.Number({
      customMeta: { title: 'ID сделки' }
    }),
    leadUpdatedAt: Heap.Number({
      customMeta: { title: 'Время обновления сделки (timestamp)' }
    }),
    processedAt: Heap.DateTime({
      customMeta: { title: 'Время обработки' }
    }),
    status: Heap.String({
      customMeta: { title: 'Статус обработки' }
    }), // 'processing', 'processed', 'skipped', 'error'
    errorMessage: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Сообщение об ошибке' }
      })
    ),
    productValue: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Значение продукта' }
      })
    ),
    tariffValue: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Значение тарифа' }
      })
    ),
    price: Heap.Optional(
      Heap.Number({
        customMeta: { title: 'Цена' }
      })
    )
  },
  { customMeta: { title: 'События вебхуков', description: 'Таблица для отслеживания обработанных вебхуков' } }
)

export default TDevAmocrmConnectorWebhookEventsUd1

export type TDevAmocrmConnectorWebhookEventsUd1Row = typeof TDevAmocrmConnectorWebhookEventsUd1.T
export type TDevAmocrmConnectorWebhookEventsUd1RowJson = typeof TDevAmocrmConnectorWebhookEventsUd1.JsonT

