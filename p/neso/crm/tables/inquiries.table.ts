import { Heap } from '@app/heap'
import Clients from './clients.table'

export const Inquiries = Heap.Table('t__neso-crm__inquiry__R2w5Yz', {
  client: Heap.RefLink(Clients, { customMeta: { title: 'Клиент' } }),
  channel: Heap.String({
    customMeta: { title: 'Канал коммуникации' }
  }),
  channelExternalId: Heap.String({
    customMeta: { title: 'Идентификатор в канале' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  status: Heap.String({
    customMeta: { title: 'Статус обращения' }
  }),
  unread: Heap.Number({
    customMeta: { title: 'Непрочитано (0/1)' }
  }),
  assignee: Heap.String({
    customMeta: { title: 'Ответственный (id)' }
  }),
  tags: Heap.Any({
    customMeta: { title: 'Теги (массив строк)' }
  })
})

export default Inquiries

export type InquiriesRow = typeof Inquiries.T
export type InquiriesRowJson = typeof Inquiries.JsonT
