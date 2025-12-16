// This file is auto-generated via createOrUpdateHeapTableFile API and should not be edited manually
import { Heap } from '@app/heap'

export const TDevAmocrmConnectorCommentLogsUd1 = Heap.Table(
  't_dev_amocrm-connector_comment_logs_ud1',
  {
    leadId: Heap.Number({
      customMeta: { title: 'ID сделки AmoCRM' }
    }),
    email: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Email клиента' }
      })
    ),
    commentText: Heap.String({
      customMeta: { title: 'Текст комментария' }
    }),
    paymentUrl: Heap.Optional(
      Heap.String({
        customMeta: { title: 'Ссылка на оплату' }
      })
    ),
    amocrmNoteId: Heap.Optional(
      Heap.Number({
        customMeta: { title: 'ID комментария в AmoCRM' }
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
  { customMeta: { title: 'Логи комментариев AmoCRM', description: 'История добавления комментариев в сделки AmoCRM' } }
)

export default TDevAmocrmConnectorCommentLogsUd1

export type TDevAmocrmConnectorCommentLogsUd1Row = typeof TDevAmocrmConnectorCommentLogsUd1.T
export type TDevAmocrmConnectorCommentLogsUd1RowJson = typeof TDevAmocrmConnectorCommentLogsUd1.JsonT


