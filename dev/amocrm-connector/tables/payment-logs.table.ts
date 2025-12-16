// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevAmocrmConnectorPaymentLogsUd1 = Heap.Table(
  't_dev_amocrm-connector_payment_logs_ud1',
  {
    leadId: Heap.Number({
      customMeta: { title: 'ID сделки AmoCRM' }
    }),
    email: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Email клиента' }
      })
    ),
    productValue: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Продукт' }
      })
    ),
    tariffValue: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Тариф' }
      })
    ),
    customPrice: Heap.Optional(
      Heap.Number({
        customMeta: { title: 'Своя цена' }
      })
    ),
    offerId: Heap.Optional(
      Heap.String({
        customMeta: { title: 'ID предложения GetCourse' }
      })
    ),
    dealId: Heap.Optional(
      Heap.String({
        customMeta: { title: 'ID заказа GetCourse' }
      })
    ),
    dealNumber: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Номер заказа GetCourse' }
      })
    ),
    paymentUrl: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Ссылка на оплату' }
      })
    ),
    status: Heap.String({
      customMeta: { title: 'Статус' }
    }), // 'success', 'error', 'pending'
    errorMessage: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Текст ошибки' }
      })
    ),
    requestData: Heap.Optional(
      Heap.Any({
        customMeta: { title: 'Данные запроса' }
      })
    ),
    responseData: Heap.Optional(
      Heap.Any({
        customMeta: { title: 'Данные ответа' }
      })
    )
  },
  { customMeta: { title: 'Логи создания ссылок на оплату', description: 'История запросов к Deal Manager' } }
)

export default TDevAmocrmConnectorPaymentLogsUd1

export type TDevAmocrmConnectorPaymentLogsUd1Row = typeof TDevAmocrmConnectorPaymentLogsUd1.T
export type TDevAmocrmConnectorPaymentLogsUd1RowJson = typeof TDevAmocrmConnectorPaymentLogsUd1.JsonT

