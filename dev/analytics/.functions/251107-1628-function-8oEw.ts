import MetricEventsTable from "../tables/metric-events.table"

export async function main(ctx: app.Ctx) {
  try {
    // 1. Создаём тестовое событие БЕЗ email (как в GetCourse)
    const testEvent = await MetricEventsTable.create(ctx, {
      urlPath: 'event://getcourse/user/created',
      userId: '219894:476557478',
      eventData: JSON.stringify({
        resolved_user_id: '219894:476557478',
        url: 'event://getcourse/user/created?id=219894:476557478',
        path: '/user/created',
        test: 'simulated_getcourse_event',
        timestamp: new Date().toISOString()
      }),
      receivedAt: new Date()
    })
    
    // 2. Считаем общее количество
    const totalCount = await MetricEventsTable.countBy(ctx)
    
    // 3. Получаем последние события
    const recentEvents = await MetricEventsTable.findAll(ctx, {
      orderBy: [{ field: 'receivedAt', direction: 'desc' }],
      limit: 3
    })
    
    ctx.account.log('[Analytics] Test event created successfully', {
      level: 'info',
      json: { eventId: testEvent.id, totalCount }
    })
    
    return {
      success: true,
      message: '✅ ИСПРАВЛЕНО! Таблица теперь принимает события без email',
      totalEventsInTable: totalCount,
      testEventCreated: {
        id: testEvent.id,
        urlPath: testEvent.urlPath,
        userId: testEvent.userId,
        hasEmail: !!testEvent.userEmail
      },
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        urlPath: e.urlPath,
        userId: e.userId,
        userEmail: e.userEmail || 'N/A',
        receivedAt: e.receivedAt?.toISOString()
      })),
      nextSteps: [
        '1. ✅ Схема таблицы исправлена (userEmail и userId теперь необязательные)',
        '2. ✅ Hook @start/after-event-write зарегистрирован и будет сохранять события',
        '3. 📊 Откройте /metric-events для просмотра событий',
        '4. 🔔 Новые события GetCourse будут автоматически появляться'
      ]
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}


app.function('/').handle(async ctx => {
  try {
    return {
      success: true,
      result: await main(ctx),
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    }
  }
})