// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TAnalitikaGetkursaCloudSettingsKv8 = Heap.Table(
  't_analitika_getkursa_cloud_settings_kv8',
  {
    key: Heap.String({ 
      customMeta: { title: 'Ключ' }, 
      searchable: { langs: ['ru', 'en'], embeddings: false } 
    }),
    value: Heap.String({ 
      customMeta: { title: 'Значение' }, 
      searchable: { langs: ['ru', 'en'], embeddings: false },
      defaultValue: ''
    }),
  },
  { customMeta: { title: 'Настройки проекта аналитики GetCourse', description: 'Таблица для хранения настроек проекта в формате ключ-значение.' } },
)

export default TAnalitikaGetkursaCloudSettingsKv8

export type TAnalitikaGetkursaCloudSettingsKv8Row = typeof TAnalitikaGetkursaCloudSettingsKv8.T
export type TAnalitikaGetkursaCloudSettingsKv8RowJson = typeof TAnalitikaGetkursaCloudSettingsKv8.JsonT
