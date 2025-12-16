// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevAnalyticsMetricEventsRA4 = Heap.Table(
  't_dev_analytics_metric_events_RA4',
  {
    urlPath: Heap.Optional(
      Heap.String({ customMeta: { title: 'URL Path' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    userEmail: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Email пользователя' },
        searchable: { langs: ['ru', 'en'], embeddings: true },
      }),
    ),
    userId: Heap.Optional(
      Heap.String({ customMeta: { title: 'User ID' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    eventData: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Данные события (JSON)' },
        searchable: { langs: ['ru', 'en'], embeddings: true },
      }),
    ),
    receivedAt: Heap.Optional(
      Heap.DateTime({
        customMeta: { title: 'Время получения' },
        searchable: { langs: ['ru', 'en'], embeddings: true },
      }),
    ),
  },
  { customMeta: { title: 'Metric Events', description: 'Metric Events' } },
)

export default TDevAnalyticsMetricEventsRA4

export type TDevAnalyticsMetricEventsRA4Row = typeof TDevAnalyticsMetricEventsRA4.T
export type TDevAnalyticsMetricEventsRA4RowJson = typeof TDevAnalyticsMetricEventsRA4.JsonT
