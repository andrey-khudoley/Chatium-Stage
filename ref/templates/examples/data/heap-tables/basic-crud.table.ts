// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TRefTemplatesProductsBit = Heap.Table(
  't_ref_templates_products_Bit',
  {
    title: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Название продукта' },
        searchable: { langs: ['ru', 'en'], embeddings: true },
      }),
    ),
    description: Heap.Optional(
      Heap.String({ customMeta: { title: 'Описание' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    price: Heap.Optional(
      Heap.Money({ customMeta: { title: 'Цена' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    category: Heap.Optional(
      Heap.String({ customMeta: { title: 'Категория' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    inStock: Heap.Optional(
      Heap.Boolean({ customMeta: { title: 'В наличии' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    status: Heap.Optional(
      Heap.String({ customMeta: { title: 'Статус' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
    tags: Heap.Optional(
      Heap.String({ customMeta: { title: 'Теги' }, searchable: { langs: ['ru', 'en'], embeddings: true } }),
    ),
  },
  { customMeta: { title: 'Продукты', description: 'Продукты' } },
)

export default TRefTemplatesProductsBit

export type TRefTemplatesProductsBitRow = typeof TRefTemplatesProductsBit.T
export type TRefTemplatesProductsBitRowJson = typeof TRefTemplatesProductsBit.JsonT
