// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TKnowledgeAppSettings7Fk = Heap.Table(
  't_knowledge-app_settings_7Fk',
  {
    key: Heap.Optional(
      Heap.String({ customMeta: { title: 'Setting Key' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    value: Heap.Optional(
      Heap.String({ customMeta: { title: 'Setting Value' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
  },
  { customMeta: { title: 'Settings', description: 'Settings' } },
)

export default TKnowledgeAppSettings7Fk

export type TKnowledgeAppSettings7FkRow = typeof TKnowledgeAppSettings7Fk.T
export type TKnowledgeAppSettings7FkRowJson = typeof TKnowledgeAppSettings7Fk.JsonT
