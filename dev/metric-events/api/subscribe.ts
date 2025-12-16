import { subscribeToMetricEvents, unsubscribeFromMetricEvents } from '@app/metric'

/**
 * Список всех известных событий GetCourse для подписки.
 * Согласно инструкции 021-getcourse-events.md
 */
const ALL_GC_EVENTS = [
  'event://getcourse/conversation/addedMessage',
  'event://getcourse/teach/lesson/answerCreated',
  'event://getcourse/teach/lesson/answerUpdated',
  'event://getcourse/teach/lesson/answerDeleted',
  'event://getcourse/contact/created',
  'event://getcourse/contact/updated',
  'event://getcourse/dealCreated',
  'event://getcourse/dealStatusChanged',
  'event://getcourse/dealPaymentAccepted',
  'event://getcourse/dealPaid',
  'event://getcourse/form/sent',
  'event://getcourse/survey/answerCreated',
  'event://getcourse/user/chatbot/vk_enabled',
  'event://getcourse/user/chatbot/telegram_enabled',
] as const

/**
 * Подписаться на все события GetCourse.
 */
export const apiSubscribeToAllEventsRoute = app.post('api/subscribe/all', async (ctx, req) => {
  try {
    await subscribeToMetricEvents(ctx, [...ALL_GC_EVENTS])
    return { success: true, message: 'Подписка на все события активирована' }
  } catch (error: any) {
    ctx.account.log('Ошибка подписки на события', { json: { error: error?.message || error } })
    return { success: false, error: error?.message || 'Неизвестная ошибка' }
  }
})

/**
 * Отписаться от всех событий GetCourse.
 */
export const apiUnsubscribeFromAllEventsRoute = app.post('api/unsubscribe/all', async (ctx, req) => {
  try {
    // Отписываемся от каждого события по отдельности
    for (const eventType of ALL_GC_EVENTS) {
      try {
        await unsubscribeFromMetricEvents(ctx, eventType)
      } catch (error: any) {
        // Логируем ошибку, но продолжаем отписку от остальных событий
        ctx.account.log(`Ошибка отписки от события ${eventType}`, { 
          json: { error: error?.message || error } 
        })
      }
    }
    return { success: true, message: 'Отписка от всех событий выполнена' }
  } catch (error: any) {
    ctx.account.log('Ошибка отписки от событий', { json: { error: error?.message || error } })
    return { success: false, error: error?.message || 'Неизвестная ошибка' }
  }
})
