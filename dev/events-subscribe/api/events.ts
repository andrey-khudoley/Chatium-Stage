import { requireRealUser } from '@app/auth'
import { sendDataToSocket, genSocketId } from '@app/socket'
import { queryAi } from '@traffic/sdk'
import { gcQueryAi } from '@gc-mcp-server/sdk'
import Subscriptions from '../tables/subscriptions.table'

// Функция для получения последних событий из трафика
async function getTrafficEvents(ctx: app.Ctx, eventName: string, currentUserId: string, lastTimestamp?: string, limit: number = 10) {
  // Логируем для отладки
  ctx.account.log('getTrafficEvents - filtering user', {
    level: 'info',
    json: { currentUserId, eventName }
  })
  
  // Фильтруем только внешние события (не системные страницы)
  // ВАЖНО: action IS NOT NULL - показываем только реальные события
  let whereCondition = "(action IS NOT NULL AND startsWith(urlPath, 'https') AND NOT startsWith(urlPath, 'https://s.chtm') AND NOT startsWith(urlPath, 'https://khudoley-stage.chatium.ru/dev/'))"
  
  if (eventName && eventName !== 'custom_action') {
    whereCondition += ` AND action = '${eventName}'`
  }
  
  // Фильтруем события самого пользователя
  whereCondition += ` AND user_id != '${currentUserId}'`
  
  // Если есть lastTimestamp, получаем только новые события
  if (lastTimestamp) {
    whereCondition += ` AND ts > '${lastTimestamp}'`
  }
  
  const query = `
    SELECT 
      ts,
      dt,
      action,
      urlPath,
      user_id,
      user_email,
      user_phone,
      action_param1,
      action_param2,
      action_param3,
      title
    FROM chatium_ai.access_log
    WHERE ${whereCondition}
      AND dt >= today() - 7
    ORDER BY ts DESC
    LIMIT ${limit}
  `
  
  ctx.account.log('getTrafficEvents - query', {
    level: 'info',
    json: { query }
  })
  
  const result = await queryAi(ctx, query)
  const filteredRows = (result.rows || []).filter(row => row.user_id !== currentUserId)
  
  ctx.account.log('getTrafficEvents - results', {
    level: 'info',
    json: { 
      totalRows: result.rows?.length || 0,
      filteredRows: filteredRows.length,
      sampleUserIds: result.rows?.slice(0, 3).map(r => r.user_id) || []
    }
  })
  
  return filteredRows
}

// Функция для получения событий GetCourse
async function getGetcourseEvents(ctx: app.Ctx, eventName: string, currentUserId: string, lastTimestamp?: string, limit: number = 10) {
  ctx.account.log('getGetcourseEvents - filtering user', {
    level: 'info',
    json: { currentUserId, eventName }
  })
  
  const urlPath = `event://getcourse/${eventName}`
  
  let whereCondition = `urlPath = '${urlPath}' AND dt >= today() - 7`
  
  // Фильтруем события самого пользователя
  whereCondition += ` AND user_id != '${currentUserId}'`
  
  // Если есть lastTimestamp, получаем только новые события
  if (lastTimestamp) {
    whereCondition += ` AND ts > '${lastTimestamp}'`
  }
  
  const query = `
    SELECT 
      ts,
      dt,
      urlPath,
      user_id,
      user_email,
      user_phone,
      action_param1,
      action_param2,
      action_param3,
      action_param1_int,
      action_param2_int,
      action_param3_int,
      action_param1_float,
      action_param2_float,
      action_param1_arrstr,
      title
    FROM chatium_ai.access_log
    WHERE ${whereCondition}
    ORDER BY ts DESC
    LIMIT ${limit}
  `
  
  const result = await gcQueryAi(ctx, query)
  const filteredRows = (result.rows || []).filter(row => row.user_id !== currentUserId)
  
  ctx.account.log('getGetcourseEvents - results', {
    level: 'info',
    json: { 
      totalRows: result.rows?.length || 0,
      filteredRows: filteredRows.length
    }
  })
  
  return filteredRows
}

// @shared-route
export const apiGetEventsRoute = app.get('/get', async (ctx, req) => {
  requireRealUser(ctx)
  
  const subscriptions = await Subscriptions.findAll(ctx, {
    where: {
      userId: ctx.user.id,
      isActive: true
    },
    limit: 100
  })
  
  const events = []
  
  for (const sub of subscriptions) {
    if (sub.eventType === 'traffic') {
      const trafficEvents = await getTrafficEvents(ctx, sub.eventName, ctx.user.id, undefined, 5)
      events.push(...trafficEvents.map(e => ({ ...e, subscriptionType: 'traffic', subscriptionName: sub.eventName })))
    } else if (sub.eventType === 'getcourse') {
      const gcEvents = await getGetcourseEvents(ctx, sub.eventName, ctx.user.id, undefined, 5)
      events.push(...gcEvents.map(e => ({ ...e, subscriptionType: 'getcourse', subscriptionName: sub.eventName })))
    }
  }
  
  return events
})

// Job для мониторинга событий в реальном времени
export const monitorEventsJob = app.job('/monitor-events', async (ctx, params: { userId: string, socketId: string, lastTimestamp?: string }) => {
  const subscriptions = await Subscriptions.findAll(ctx, {
    where: {
      userId: params.userId,
      isActive: true
    },
    limit: 100
  })
  
  const events = []
  let maxTimestamp = params.lastTimestamp
  
  for (const sub of subscriptions) {
    try {
      if (sub.eventType === 'traffic') {
        const trafficEvents = await getTrafficEvents(ctx, sub.eventName, params.userId, params.lastTimestamp, 3)
        const mappedEvents = trafficEvents.map(e => ({ 
          ...e, 
          subscriptionType: 'traffic', 
          subscriptionName: sub.eventName 
        }))
        events.push(...mappedEvents)
        
        // Обновляем максимальный timestamp
        for (const e of mappedEvents) {
          if (!maxTimestamp || e.ts > maxTimestamp) {
            maxTimestamp = e.ts
          }
        }
      } else if (sub.eventType === 'getcourse') {
        const gcEvents = await getGetcourseEvents(ctx, sub.eventName, params.userId, params.lastTimestamp, 3)
        const mappedEvents = gcEvents.map(e => ({ 
          ...e, 
          subscriptionType: 'getcourse', 
          subscriptionName: sub.eventName 
        }))
        events.push(...mappedEvents)
        
        // Обновляем максимальный timestamp
        for (const e of mappedEvents) {
          if (!maxTimestamp || e.ts > maxTimestamp) {
            maxTimestamp = e.ts
          }
        }
      }
    } catch (error) {
      ctx.account.log('Error fetching events', {
        level: 'warn',
        json: { error: String(error), subscription: sub }
      })
    }
  }
  
  if (events.length > 0) {
    await sendDataToSocket(ctx, params.socketId, {
      type: 'events-update',
      data: events,
      lastTimestamp: maxTimestamp,
      timestamp: new Date().toISOString()
    })
  }
  
  // Запланировать следующую проверку через 5 секунд с обновленным timestamp
  await monitorEventsJob.scheduleJobAfter(ctx, 5, 'seconds', {
    ...params,
    lastTimestamp: maxTimestamp || params.lastTimestamp
  })
})

// @shared-route
export const apiStartMonitoringRoute = app.post('/start-monitoring', async (ctx, req) => {
  requireRealUser(ctx)
  
  const socketId = `events-monitor-${ctx.user.id}`
  const encodedSocketId = await genSocketId(ctx, socketId)
  
  // Получить текущий timestamp для начала мониторинга
  const currentTimestamp = new Date().toISOString()
  
  // Запустить job для мониторинга
  await monitorEventsJob.scheduleJobAsap(ctx, { 
    userId: ctx.user.id, 
    socketId,
    lastTimestamp: currentTimestamp 
  })
  
  return { 
    success: true, 
    socketId: encodedSocketId 
  }
})
