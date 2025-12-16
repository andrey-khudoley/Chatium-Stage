// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevAmocrmConnectorPaymentOffersUd1 = Heap.Table(
  't_dev_amocrm-connector_payment_offers_ud1',
  {
    productValue: Heap.String({
      customMeta: { title: 'Продукт' }
    }),
    tariffValue: Heap.String({
      customMeta: { title: 'Тариф' }
    }),
    offerId: Heap.String({
      customMeta: { title: 'ID предложения GetCourse' }
    }),
    offerName: Heap.String({
      customMeta: { title: 'Название предложения' }
    }),
    description: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Описание' }
      })
    )
  },
  { customMeta: { title: 'Коды предложений', description: 'Маппинг продуктов и тарифов на ID предложений GetCourse' } }
)

export default TDevAmocrmConnectorPaymentOffersUd1

export type TDevAmocrmConnectorPaymentOffersUd1Row = typeof TDevAmocrmConnectorPaymentOffersUd1.T
export type TDevAmocrmConnectorPaymentOffersUd1RowJson = typeof TDevAmocrmConnectorPaymentOffersUd1.JsonT

