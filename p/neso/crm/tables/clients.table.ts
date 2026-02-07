import { Heap } from '@app/heap'

export const Clients = Heap.Table('t__neso-crm__client__H3k9Lm', {
  name: Heap.String({
    customMeta: { title: 'Имя' }
  }),
  phone: Heap.String({
    customMeta: { title: 'Телефон' }
  }),
  email: Heap.String({
    customMeta: { title: 'Email' }
  }),
  assignee: Heap.String({
    customMeta: { title: 'Ответственный (id)' }
  }),
  source: Heap.String({
    customMeta: { title: 'Источник' }
  }),
  tags: Heap.Any({
    customMeta: { title: 'Теги (массив строк)' }
  })
})

export default Clients

export type ClientsRow = typeof Clients.T
export type ClientsRowJson = typeof Clients.JsonT
