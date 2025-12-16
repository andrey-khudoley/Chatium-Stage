// @shared
/**
 * Пример системы подписок на события с WebSocket мониторингом
 * Показывает, как создать real-time мониторинг событий GetCourse и трафика
 */

import { requireAnyUser } from '@app/auth'
import { sendDataToSocket, genSocketId } from '@app/socket'
import { gcQueryAi } from '@gc-mcp-server/sdk'
import { cancelScheduledJob } from '@app/jobs'

// Примечание: В реальном проекте эти таблицы нужно создать
// См. dev/partnership/tables/ для примеров

// Имитация таблиц (в реальном проекте импортируйте из tables/)
const Subscriptions = {
  async findAll(ctx: any, options: any) { return [] },
  async create(ctx: any, data: any) { return { id: '1', ...data } },
  async update(ctx: any, data: any) { return data },
  async findOneBy(ctx: any, where: any) { return null }
}

const Monitoring = {
  async findOneBy(ctx: any, where: any) { return null },
  async create(ctx: any, data: any) { return { id: '1', ...data } },
  async update(ctx: any, data: any) { return data }
}

// ============== API ДЛЯ ПОДПИСОК ==============

/**
 * POST /api/subscriptions/subscribe
 * Подписаться на событие
 * Body: { eventType: 'getcourse' | 'traffic', eventName: string }
 */
export const apiSubscribeRoute = app.post('/subscribe', async (ctx, req) => {
  requireAnyUser(ctx)
  
  const { eventType, eventName } = req.body
  
  if (!eventType || !eventName) {
    return { 
      success: false, 
      error: 'eventType и eventName обязательны' 
    }
  }
  
  try {
    // Проверяем существующую подписку
    const existing = await Subscriptions.findOneBy(ctx, {
      userId: ctx.user.id,
      eventType,
      eventName
    })
    
    if (existing) {
      // Активируем существующую
      await Subscriptions.update(ctx, {
        id: existing.id,
        isActive: true
      })
    } else {
      // Создаем новую
      await Subscriptions.create(ctx, {
        userId: ctx.user.id,
        eventType,
        eventName,
        isActive: true
      })
    }
    
    return { 
      success: true, 
      message: 'Подписка создана' 
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    }
  }
})

/**
 * POST /api/subscriptions/unsubscribe
 * Отписаться от события
 * Body: { eventType: string, eventName: string }
 */
export const apiUnsubscribeRoute = app.post('/unsubscribe', async (ctx, req) => {
  requireAnyUser(ctx)
  
  const { eventType, eventName } = req.body
  
  try {
    const subscription = await Subscriptions.findOneBy(ctx, {
      userId: ctx.user.id,
      eventType,
      eventName
    })
    
    if (!subscription) {
      return { 
        success: false, 
        error: 'Подписка не найдена' 
      }
    }
    
    await Subscriptions.update(ctx, {
      id: subscription.id,
      isActive: false
    })
    
    return { 
      success: true, 
      message: 'Подписка отменена' 
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    }
  }
})

/**
 * GET /api/subscriptions/list
 * Получить список подписок пользователя
 */
export const apiSubscriptionsListRoute = app.get('/list', async (ctx, req) => {
  requireAnyUser(ctx)
  
  try {
    const subscriptions = await Subscriptions.findAll(ctx, {
      where: { userId: ctx.user.id },
      limit: 100
    })
    
    return {
      success: true,
      subscriptions
    }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      subscriptions: [] 
    }
  }
})

/**
 * GET /api/subscriptions/available-events
 * Получить список доступных событий для подписки
 */
export const apiAvailableEventsRoute = app.get('/available-events', async (ctx, req) => {
  requireAnyUser(ctx)
  
  // Список доступных событий GetCourse
  const getcourseEvents = [
    { name: 'dealCreated', description: 'Создание заказа' },
    { name: 'dealPaid', description: 'Оплата заказа' },
    { name: 'dealStatusChanged', description: 'Изменение статуса заказа' },
    { name: 'user/created', description: 'Регистрация пользователя' },
    { name: 'user/chatbot/telegram_enabled', description: 'Подключение Telegram' },
    { name: 'user/group_added', description: 'Добавление в группу' }
  ]
  
  // Список доступных событий трафика
  const trafficEvents = [
    { name: 'pageview', description: 'Просмотр страницы' },
    { name: 'button_click', description: 'Клик по кнопке' },
    { name: 'link_click', description: 'Клик по ссылке' },
    { name: 'scroll', description: 'Прокрутка страницы' },
    { name: 'form_submit', description: 'Отправка формы' },
    { name: 'video_play', description: 'Воспроизведение видео' },
    { name: 'video_pause', description: 'Пауза видео' },
    { name: 'video_complete', description: 'Просмотр видео до конца' }
  ]
  
  return [
    ...getcourseEvents.map(e => ({ ...e, type: 'getcourse' })),
    ...trafficEvents.map(e => ({ ...e, type: 'traffic' }))
  ]
})

// ============== WEBSOCKET МОНИТОРИНГ ==============

/**
 * Job для мониторинга событий
 * Выполняется каждые 15 секунд и отправляет новые события через WebSocket
 */
export const monitorEventsJob = app.job('/monitor-events', async (ctx, params: { 
  userId: string
  socketId: string
  lastCheckTime?: string
}) => {
  try {
    // Проверяем, активен ли мониторинг
    const monitoring = await Monitoring.findOneBy(ctx, {
      userId: params.userId,
      isActive: true
    })
    
    if (!monitoring) {
      ctx.account.log('Monitoring stopped', {
        level: 'info',
        json: { userId: params.userId }
      })
      return
    }
    
    // Получаем активные подписки пользователя
    const subscriptions = await Subscriptions.findAll(ctx, {
      where: {
        userId: params.userId,
        isActive: true
      },
      limit: 100
    })
    
    if (subscriptions.length === 0) {
      // Нет подписок - планируем следующую проверку
      const nextTaskId = await monitorEventsJob.scheduleJobAfter(ctx, 15, 'seconds', params)
      
      await Monitoring.update(ctx, {
        id: monitoring.id,
        taskId: String(nextTaskId)
      })
      return
    }
    
    const allEvents = []
    const lastCheckTime = params.lastCheckTime || new Date(Date.now() - 60000).toISOString()
    
    // Для каждой подписки получаем новые события
    for (const sub of subscriptions) {
      if (sub.eventType === 'getcourse') {
        const query = `
          SELECT 
            ts,
            dt,
            urlPath,
            action_param1,
            action_param2,
            action_param3,
            user_id,
            user_email,
            user_first_name,
            user_last_name,
            title
          FROM chatium_ai.access_log
          WHERE urlPath = 'event://getcourse/${sub.eventName}'
            AND ts > '${lastCheckTime}'
            AND dt >= today() - 1
          ORDER BY ts DESC
          LIMIT 10
        `
        
        const result = await gcQueryAi(ctx, query)
        if (result.rows && result.rows.length > 0) {
          allEvents.push(...result.rows.map(row => ({
            ...row,
            eventType: sub.eventType,
            eventName: sub.eventName
          })))
        }
      } else if (sub.eventType === 'traffic') {
        const query = `
          SELECT 
            ts,
            dt,
            urlPath,
            action,
            action_param1,
            action_param2,
            uid,
            session_id,
            title,
            referer
          FROM chatium_ai.access_log
          WHERE action = '${sub.eventName}'
            AND ts > '${lastCheckTime}'
            AND dt >= today() - 1
            AND NOT startsWith(urlPath, 'event://getcourse/')
          ORDER BY ts DESC
          LIMIT 10
        `
        
        const result = await gcQueryAi(ctx, query)
        if (result.rows && result.rows.length > 0) {
          allEvents.push(...result.rows.map(row => ({
            ...row,
            eventType: sub.eventType,
            eventName: sub.eventName
          })))
        }
      }
    }
    
    // Отправляем события через WebSocket
    if (allEvents.length > 0) {
      await sendDataToSocket(ctx, params.socketId, {
        type: 'events-update',
        data: allEvents,
        timestamp: new Date().toISOString()
      })
    }
    
    // Планируем следующую проверку через 15 секунд
    const nextTaskId = await monitorEventsJob.scheduleJobAfter(ctx, 15, 'seconds', {
      ...params,
      lastCheckTime: new Date().toISOString()
    })
    
    // Обновляем taskId в мониторинге
    const updatedMonitoring = await Monitoring.findOneBy(ctx, {
      userId: params.userId,
      isActive: true
    })
    
    if (updatedMonitoring) {
      await Monitoring.update(ctx, {
        id: updatedMonitoring.id,
        taskId: String(nextTaskId)
      })
    }
    
  } catch (error: any) {
    ctx.account.log('Monitor job failed', {
      level: 'error',
      json: { error: error.message, params }
    })
  }
})

/**
 * POST /api/monitoring/start
 * Запустить мониторинг событий
 * Возвращает socketId для подключения WebSocket
 */
export const apiStartMonitoringRoute = app.post('/start', async (ctx, req) => {
  requireAnyUser(ctx)
  
  try {
    // Проверяем, есть ли уже активный мониторинг
    const existingMonitoring = await Monitoring.findOneBy(ctx, {
      userId: ctx.user.id,
      isActive: true
    })
    
    if (existingMonitoring) {
      const encodedSocketId = await genSocketId(ctx, `events-monitor-${ctx.user.id}`)
      return {
        success: true,
        socketId: encodedSocketId,
        message: 'Мониторинг уже активен',
        alreadyActive: true
      }
    }
    
    const socketId = `events-monitor-${ctx.user.id}`
    const encodedSocketId = await genSocketId(ctx, socketId)
    
    // Запускаем job для мониторинга
    const taskId = await monitorEventsJob.scheduleJobAsap(ctx, {
      userId: ctx.user.id,
      socketId
    })
    
    // Сохраняем информацию о мониторинге
    await Monitoring.create(ctx, {
      userId: ctx.user.id,
      socketId,
      taskId: String(taskId),
      isActive: true,
      startedAt: new Date()
    })
    
    ctx.account.log('Monitoring started', {
      level: 'info',
      json: { userId: ctx.user.id, taskId }
    })
    
    return {
      success: true,
      socketId: encodedSocketId,
      message: 'Мониторинг запущен'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

/**
 * POST /api/monitoring/stop
 * Остановить мониторинг событий
 */
export const apiStopMonitoringRoute = app.post('/stop', async (ctx, req) => {
  requireAnyUser(ctx)
  
  try {
    const monitoring = await Monitoring.findOneBy(ctx, {
      userId: ctx.user.id,
      isActive: true
    })
    
    if (!monitoring) {
      return {
        success: false,
        message: 'Активный мониторинг не найден'
      }
    }
    
    // Отменяем запланированный job
    if (monitoring.taskId) {
      try {
        await cancelScheduledJob(ctx, monitoring.taskId)
      } catch (error: any) {
        ctx.account.log('Failed to cancel job', {
          level: 'warn',
          json: { taskId: monitoring.taskId, error: error.message }
        })
      }
    }
    
    // Деактивируем мониторинг
    await Monitoring.update(ctx, {
      id: monitoring.id,
      isActive: false,
      taskId: null
    })
    
    return {
      success: true,
      message: 'Мониторинг остановлен'
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

/**
 * GET /api/monitoring/status
 * Получить статус мониторинга
 */
export const apiMonitoringStatusRoute = app.get('/status', async (ctx, req) => {
  requireAnyUser(ctx)
  
  const monitoring = await Monitoring.findOneBy(ctx, {
    userId: ctx.user.id,
    isActive: true
  })
  
  return {
    success: true,
    isActive: !!monitoring,
    monitoring: monitoring || null
  }
})

// ============== ПРИМЕРЫ SQL ЗАПРОСОВ ==============

/**
 * GET /api/events/list
 * Получает последние события из ClickHouse
 * Query: limit, offset, eventType, eventName
 */
export const apiEventsListRoute = app.query(s => ({
  limit: s.number().default(50),
  offset: s.number().default(0),
  eventType: s.string().optional(),
  eventName: s.string().optional()
})).get('/list', async (ctx, req) => {
  requireAnyUser(ctx)
  
  const { limit, offset, eventType, eventName } = req.query
  
  try {
    let whereConditions = []
    
    if (eventType === 'getcourse' && eventName) {
      whereConditions.push(`urlPath = 'event://getcourse/${eventName}'`)
    } else if (eventType === 'traffic' && eventName) {
      whereConditions.push(`action = '${eventName}'`)
      whereConditions.push(`NOT startsWith(urlPath, 'event://getcourse/')`)
    } else {
      // Все события за последние 7 дней
      whereConditions.push(`dt >= today() - 7`)
    }
    
    const query = `
      SELECT 
        ts,
        dt,
        urlPath,
        action,
        action_param1,
        action_param2,
        action_param3,
        uid,
        user_id,
        user_email,
        session_id,
        title,
        referer
      FROM chatium_ai.access_log
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ts DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    
    const result = await gcQueryAi(ctx, query)
    
    return {
      success: true,
      events: result.rows || [],
      total: result.rows?.length || 0
    }
  } catch (error: any) {
    ctx.account.log('Events query failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { 
      success: false, 
      error: error.message, 
      events: [], 
      total: 0 
    }
  }
})

/**
 * GET /api/events/stats
 * Получает общую статистику событий
 */
export const apiEventsStatsRoute = app.get('/stats', async (ctx, req) => {
  requireAnyUser(ctx)
  
  try {
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT action) as unique_actions,
        COUNT(DISTINCT uid) as unique_visitors,
        COUNT(DISTINCT session_id) as unique_sessions,
        MIN(ts) as first_event,
        MAX(ts) as last_event
      FROM chatium_ai.access_log
      WHERE dt >= today() - 7
        AND NOT startsWith(urlPath, 'event://getcourse/')
    `
    
    const result = await gcQueryAi(ctx, query)
    const stats = result.rows?.[0]
    
    return {
      success: true,
      stats: {
        totalEvents: stats?.total_events || 0,
        uniqueActions: stats?.unique_actions || 0,
        uniqueVisitors: stats?.unique_visitors || 0,
        uniqueSessions: stats?.unique_sessions || 0,
        firstEvent: stats?.first_event || null,
        lastEvent: stats?.last_event || null
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============== ПРИМЕР КЛИЕНТА (Vue) ==============

/**
 * Пример Vue компонента для работы с WebSocket мониторингом
 * Сохраните как MonitoringPage.vue
 */
export const vueMonitoringExample = `
<template>
  <div class="monitoring-page">
    <div class="controls">
      <button 
        @click="isMonitoring ? stopMonitoring() : startMonitoring()"
        :disabled="loading"
        class="btn"
      >
        {{ isMonitoring ? 'Остановить' : 'Запустить' }} мониторинг
      </button>
      
      <div v-if="isMonitoring" class="status-indicator">
        <i class="fas fa-circle text-green-500"></i>
        Мониторинг активен
      </div>
    </div>
    
    <div class="events-list">
      <h2>События в реальном времени</h2>
      
      <div v-if="events.length === 0" class="empty-state">
        Нет событий
      </div>
      
      <div v-else>
        <div v-for="event in events" :key="event.ts" class="event-card">
          <div class="event-time">{{ formatTime(event.ts) }}</div>
          <div class="event-type">{{ event.eventType }}: {{ event.eventName }}</div>
          <div class="event-url">{{ event.urlPath }}</div>
          <div v-if="event.user_email" class="event-user">
            <i class="fas fa-user"></i> {{ event.user_email }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import { 
  apiStartMonitoringRoute,
  apiStopMonitoringRoute,
  apiMonitoringStatusRoute
} from '../api/monitoring'

const events = ref([])
const isMonitoring = ref(false)
const loading = ref(false)
let socketClient = null

onMounted(async () => {
  // Проверяем статус мониторинга
  const status = await apiMonitoringStatusRoute.run(ctx)
  isMonitoring.value = status.isActive
  
  if (isMonitoring.value) {
    // Подключаемся к WebSocket
    socketClient = await getOrCreateBrowserSocketClient()
    socketClient.on('data', handleSocketMessage)
  }
})

onUnmounted(() => {
  if (socketClient) {
    socketClient.off('data', handleSocketMessage)
  }
})

async function startMonitoring() {
  loading.value = true
  try {
    const result = await apiStartMonitoringRoute.run(ctx)
    
    if (result.success) {
      isMonitoring.value = true
      
      // Подключаемся к WebSocket
      socketClient = await getOrCreateBrowserSocketClient()
      socketClient.on('data', handleSocketMessage)
    }
  } finally {
    loading.value = false
  }
}

async function stopMonitoring() {
  loading.value = true
  try {
    await apiStopMonitoringRoute.run(ctx)
    isMonitoring.value = false
    
    if (socketClient) {
      socketClient.off('data', handleSocketMessage)
    }
  } finally {
    loading.value = false
  }
}

function handleSocketMessage(message) {
  if (message.type === 'events-update') {
    events.value.unshift(...message.data)
    
    // Ограничиваем количество событий
    if (events.value.length > 100) {
      events.value = events.value.slice(0, 100)
    }
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('ru-RU')
}
</script>
`

