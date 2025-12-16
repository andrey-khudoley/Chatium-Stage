// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevAmocrmConnectorAmocrmConnectorServicesZdy = Heap.Table(
  't_dev_amocrm-connector_amocrm_connector_services_Zdy',
  {
    title: Heap.Optional(
      Heap.String({ customMeta: { title: 'Название сервиса' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    status: Heap.Optional(
      Heap.String({ customMeta: { title: 'Статус' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    type: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Тип (ручной/автоматический)' },
        searchable: { langs: ['ru', 'en'], embeddings: true },
      }),
    ),
    lastRunDate: Heap.Optional(
      Heap.DateTime({
        customMeta: { title: 'Дата последнего запуска' },
        searchable: { langs: ['ru', 'en'], embeddings: true },
      }),
    ),
  },
  { customMeta: { title: 'Сервисы AmoCRM Connector', description: 'Сервисы AmoCRM Connector' } },
)

export default TDevAmocrmConnectorAmocrmConnectorServicesZdy

export type TDevAmocrmConnectorAmocrmConnectorServicesZdyRow = typeof TDevAmocrmConnectorAmocrmConnectorServicesZdy.T
export type TDevAmocrmConnectorAmocrmConnectorServicesZdyRowJson =
  typeof TDevAmocrmConnectorAmocrmConnectorServicesZdy.JsonT
