import { Heap } from '@app/heap'

export const Settings = Heap.Table('t_get_webhooks_settings', {
  key: Heap.String({
    customMeta: { title: 'Ключ настройки' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  value: Heap.String({
    customMeta: { title: 'Значение' },
    searchable: { langs: ['ru', 'en'], embeddings: false },
    defaultValue: ''
  })
})

export default Settings

