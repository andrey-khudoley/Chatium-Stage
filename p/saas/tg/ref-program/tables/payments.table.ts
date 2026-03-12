// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TSaasRefPayment7Hi8Jk = Heap.Table(
  't__saas-ref__payment__7Hi8Jk',
  {
    campaignId: Heap.Optional(
      Heap.RefLink('t__saas-ref__campaign__8Hn4Lx', {
        customMeta: { title: 'Кампания' },
        onDelete: 'none',
      }),
    ),
    ref: Heap.Optional(Heap.String({ customMeta: { title: 'Реферальный ID' } })),
    orderId: Heap.Optional(Heap.String({ customMeta: { title: 'ID заказа' } })),
    paymentSum: Heap.Optional(
      Heap.Number({
        customMeta: { title: 'Сумма оплаты в копейках' },
      }),
    ),
    rawPayload: Heap.Optional(Heap.Any({ customMeta: { title: 'Исходные данные' } })),
  },
  { customMeta: { title: 'Оплаты', description: 'События оплат' } },
)

export default TSaasRefPayment7Hi8Jk

export type TSaasRefPayment7Hi8JkRow = typeof TSaasRefPayment7Hi8Jk.T
export type TSaasRefPayment7Hi8JkRowJson = typeof TSaasRefPayment7Hi8Jk.JsonT
