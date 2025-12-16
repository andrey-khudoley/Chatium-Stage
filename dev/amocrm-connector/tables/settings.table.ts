// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevAmocrmConnectorAmocrmConnectorSettingsUd1 = Heap.Table(
  't_dev_amocrm-connector_amocrm_connector_settings_ud1',
  {
    key: Heap.Optional(
      Heap.String({ customMeta: { title: 'Ключ настройки' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    value: Heap.Optional(
      Heap.String({ customMeta: { title: 'Значение' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    description: Heap.Optional(
      Heap.String({ customMeta: { title: 'Описание' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
  },
  { customMeta: { title: 'Настройки AmoCRM Connector', description: 'Настройки AmoCRM Connector' } },
)

export default TDevAmocrmConnectorAmocrmConnectorSettingsUd1

export type TDevAmocrmConnectorAmocrmConnectorSettingsUd1Row = typeof TDevAmocrmConnectorAmocrmConnectorSettingsUd1.T
export type TDevAmocrmConnectorAmocrmConnectorSettingsUd1RowJson =
  typeof TDevAmocrmConnectorAmocrmConnectorSettingsUd1.JsonT
