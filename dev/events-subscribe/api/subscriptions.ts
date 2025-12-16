import { requireRealUser } from '@app/auth'
import Subscriptions from '../tables/subscriptions.table'
import { getAllEvents, TRAFFIC_EVENTS, GETCOURSE_EVENTS } from '../shared/eventTypes'

// @shared-route
export const apiSubscriptionsListRoute = app.get('/list', async (ctx, req) => {
  requireRealUser(ctx)
  
  const subscriptions = await Subscriptions.findAll(ctx, {
    where: {
      userId: ctx.user.id
    },
    limit: 1000
  })
  
  return subscriptions
})

// @shared-route
export const apiSubscribeRoute = app.body(s => ({
  eventType: s.string(),
  eventName: s.string()
})).post('/subscribe', async (ctx, req) => {
  requireRealUser(ctx)
  
  const existing = await Subscriptions.findOneBy(ctx, {
    userId: ctx.user.id,
    eventType: req.body.eventType,
    eventName: req.body.eventName
  })
  
  if (existing) {
    await Subscriptions.update(ctx, {
      id: existing.id,
      isActive: true
    })
    return { success: true, message: 'Подписка активирована' }
  }
  
  await Subscriptions.create(ctx, {
    userId: ctx.user.id,
    eventType: req.body.eventType,
    eventName: req.body.eventName,
    isActive: true
  })
  
  return { success: true, message: 'Подписка создана' }
})

// @shared-route
export const apiUnsubscribeRoute = app.body(s => ({
  eventType: s.string(),
  eventName: s.string()
})).post('/unsubscribe', async (ctx, req) => {
  requireRealUser(ctx)
  
  const existing = await Subscriptions.findOneBy(ctx, {
    userId: ctx.user.id,
    eventType: req.body.eventType,
    eventName: req.body.eventName
  })
  
  if (existing) {
    await Subscriptions.update(ctx, {
      id: existing.id,
      isActive: false
    })
    return { success: true, message: 'Подписка отключена' }
  }
  
  return { success: false, message: 'Подписка не найдена' }
})

// @shared-route
export const apiAvailableEventsRoute = app.get('/available-events', async (ctx, req) => {
  requireRealUser(ctx)
  
  return getAllEvents()
})

// @shared-route
export const apiSubscribeAllRoute = app.body(s => ({
  eventType: s.string().optional() // 'traffic', 'getcourse' или undefined для всех
})).post('/subscribe-all', async (ctx, req) => {
  requireRealUser(ctx)
  
  const allEvents = getAllEvents()
  const eventsToSubscribe = req.body.eventType 
    ? allEvents.filter(e => e.type === req.body.eventType)
    : allEvents
  
  let subscribed = 0
  let activated = 0
  
  for (const event of eventsToSubscribe) {
    const existing = await Subscriptions.findOneBy(ctx, {
      userId: ctx.user.id,
      eventType: event.type,
      eventName: event.name
    })
    
    if (existing) {
      if (!existing.isActive) {
        await Subscriptions.update(ctx, {
          id: existing.id,
          isActive: true
        })
        activated++
      }
    } else {
      await Subscriptions.create(ctx, {
        userId: ctx.user.id,
        eventType: event.type,
        eventName: event.name,
        isActive: true
      })
      subscribed++
    }
  }
  
  return { 
    success: true, 
    message: `Подписка создана: ${subscribed}, активировано: ${activated}`,
    total: eventsToSubscribe.length
  }
})

// @shared-route
export const apiUnsubscribeAllRoute = app.body(s => ({
  eventType: s.string().optional() // 'traffic', 'getcourse' или undefined для всех
})).post('/unsubscribe-all', async (ctx, req) => {
  requireRealUser(ctx)
  
  const whereCondition: any = {
    userId: ctx.user.id,
    isActive: true
  }
  
  if (req.body.eventType) {
    whereCondition.eventType = req.body.eventType
  }
  
  const activeSubscriptions = await Subscriptions.findAll(ctx, {
    where: whereCondition,
    limit: 1000
  })
  
  for (const sub of activeSubscriptions) {
    await Subscriptions.update(ctx, {
      id: sub.id,
      isActive: false
    })
  }
  
  return { 
    success: true, 
    message: `Отключено подписок: ${activeSubscriptions.length}`,
    total: activeSubscriptions.length
  }
})
