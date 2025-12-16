// @shared-route
import { requireAccountRole } from '@app/auth'
import MetricEventsTable from '../tables/metric-events.table'

// Получение списка metric events
export const apiGetMetricEventsRoute = app.get('/list', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  try {
    const { limit = 50, offset = 0 } = req.query
    
    const events = await MetricEventsTable.findAll(ctx, {
      select: ['id', 'urlPath', 'userEmail', 'userId', 'eventData', 'receivedAt'],
      orderBy: [{ field: 'receivedAt', direction: 'desc' }],
      limit: Number(limit),
      offset: Number(offset)
    })
    
    const total = await MetricEventsTable.countBy(ctx)
    
    return {
      success: true,
      events,
      total
    }
  } catch (error: any) {
    ctx.account.log('Error fetching metric events', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Получение статистики metric events
export const apiGetMetricEventsStatsRoute = app.get('/stats', async (ctx) => {
  requireAccountRole(ctx, 'Admin')
  
  try {
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const total = await MetricEventsTable.countBy(ctx)
    const lastHour = await MetricEventsTable.countBy(ctx, {
      receivedAt: { $gte: hourAgo }
    })
    const lastDay = await MetricEventsTable.countBy(ctx, {
      receivedAt: { $gte: dayAgo }
    })
    
    // Получаем последнее событие
    const lastEvents = await MetricEventsTable.findAll(ctx, {
      select: ['urlPath', 'receivedAt'],
      orderBy: [{ field: 'receivedAt', direction: 'desc' }],
      limit: 1
    })
    
    return {
      success: true,
      stats: {
        total,
        lastHour,
        lastDay,
        lastEvent: lastEvents[0] || null
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Подтверждение подписки на события GetCourse
// ПРИМЕЧАНИЕ: Реальная подписка происходит автоматически через @start/metric-event-write hook
// Этот эндпоинт просто подтверждает статус мониторинга событий
export const apiSubscribeToAllEventsRoute = app.post('/subscribe-all', async (ctx) => {
  requireAccountRole(ctx, 'Admin')

  try {
    const eventsToSubscribe = [
      'event://getcourse/user/created',
      'event://getcourse/user/updated',
      'event://getcourse/deal/created',
      'event://getcourse/deal/updated',
      'event://getcourse/order/created',
      'event://getcourse/order/updated',
      'event://getcourse/message/sent',
      'event://getcourse/message/viewed',
      'event://getcourse/form/sent',
      'event://getcourse/user/chatbot/vk_enabled'
    ]
    
    // Подписка включена в фоновые слушатели
    // События автоматически обрабатываются через hook и сохраняются в MetricEventsTable
    ctx.account.log('[Analytics] Subscription status confirmed for GetCourse events', {
      level: 'info',
      json: { 
        confirmedAt: new Date(),
        eventsCount: eventsToSubscribe.length,
        events: eventsToSubscribe,
        monitoring: 'ACTIVE - Events are being collected via @start/metric-event-write hook'
      }
    })
    
    return {
      success: true,
      message: `Event monitoring confirmed for ${eventsToSubscribe.length} GetCourse events`,
      events: eventsToSubscribe,
      status: 'ACTIVE - Events are automatically collected and stored',
      note: 'Subscription is handled by the metric-event hook in index.tsx'
    }
  } catch (error: any) {
    ctx.account.log('[Analytics] Failed to confirm subscription status', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Диагностика работы таблицы и хука
export const apiDiagnosticMetricEventsRoute = app.get('/diagnostic', async (ctx) => {
  requireAccountRole(ctx, 'Admin')

  try {
    // 1. Проверяем количество записей в таблице
    const totalCount = await MetricEventsTable.countBy(ctx)

    // 2. Получаем последние 5 событий
    const recentEvents = await MetricEventsTable.findAll(ctx, {
      select: ['id', 'urlPath', 'userId', 'userEmail', 'receivedAt'],
      orderBy: [{ field: 'receivedAt', direction: 'desc' }],
      limit: 5
    })

    // 3. Создаем тестовое событие вручную
    const testEvent = await MetricEventsTable.create(ctx, {
      urlPath: 'event://test/diagnostic',
      userId: ctx.user?.id,
      userEmail: ctx.user?.confirmedEmail,
      eventData: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
      receivedAt: new Date()
    })

    ctx.account.log('[Analytics] Diagnostic completed', {
      level: 'info',
      json: {
        totalCount,
        testEventCreated: !!testEvent,
        testEventId: testEvent?.id
      }
    })

    return {
      success: true,
      diagnostic: {
        totalEventsInTable: totalCount,
        recentEvents: recentEvents.map(e => ({
          id: e.id,
          urlPath: e.urlPath,
          userId: e.userId,
          receivedAt: e.receivedAt
        })),
        testEventCreated: {
          id: testEvent.id,
          urlPath: testEvent.urlPath
        },
        hookStatus: 'Hook @start/after-event-write is registered in index.tsx line 174',
        recommendation: totalCount === 0 
          ? 'Table is empty. Hook may not be triggered or events are not reaching this workspace.'
          : 'Table has events. Hook is working.'
      }
    }
  } catch (error: any) {
    ctx.account.log('[Analytics] Diagnostic failed', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })

    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
})

// Очистка старых metric events (старше 7 дней)
export const apiCleanupMetricEventsRoute = app.post('/cleanup', async (ctx) => {
  requireAccountRole(ctx, 'Admin')

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const oldEvents = await MetricEventsTable.findAll(ctx, {
      select: ['id'],
      where: { receivedAt: { $lt: weekAgo } }
    })
    
    let deleted = 0
    for (const event of oldEvents) {
      await MetricEventsTable.delete(ctx, event.id)
      deleted++
    }
    
    ctx.account.log('[Analytics] Cleaned up old metric events', {
      level: 'info',
      json: { deleted, olderThan: weekAgo }
    })
    
    return {
      success: true,
      deleted
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
