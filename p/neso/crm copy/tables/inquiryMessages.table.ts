import { Heap } from '@app/heap'
import Inquiries from './inquiries.table'

export const InquiryMessages = Heap.Table('t__neso-crm__inquiryMessage__X9m3Np', {
  inquiry: Heap.RefLink(Inquiries, { customMeta: { title: 'Обращение' } }),
  author: Heap.String({
    customMeta: { title: 'Автор сообщения (id)' }
  }),
  text: Heap.String({
    customMeta: { title: 'Текст сообщения' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  timestamp: Heap.Number({
    customMeta: { title: 'Время (Unix ms)' }
  }),
  type: Heap.String({
    customMeta: { title: 'Тип: incoming / outgoing / system' }
  }),
  sendState: Heap.String({
    customMeta: { title: 'Состояние отправки' }
  })
})

export default InquiryMessages

export type InquiryMessagesRow = typeof InquiryMessages.T
export type InquiryMessagesRowJson = typeof InquiryMessages.JsonT
