// @shared-route
/**
 * WebSocket API для реального времени
 * Предоставляет методы для уведомлений, чатов, синхронизации данных
 */

/**
 * WS /ws/notifications
 * WebSocket сервер для рассылки уведомлений
 * Клиенты могут подписываться на различные каналы уведомлений
 */
export const websocketNotificationsRoute = app.ws('/ws/notifications', async (ws, ctx) => {
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Вы подписаны на уведомления',
    timestamp: new Date()
  }))
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      switch (data.type) {
        case 'subscribe':
          ws.userId = data.userId
          ws.channels = data.channels || []
          ws.send(JSON.stringify({
            type: 'subscribed',
            channels: ws.channels,
            timestamp: new Date()
          }))
          break
          
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date()
          }))
          break
      }
    } catch (error) {
      // Silently handle parsing errors
    }
  })
  
  ws.on('close', () => {
    // Connection closed
  })
})

/**
 * Хранилище активных подписок на уведомления
 */
const notifications = new Set()

websocketNotificationsRoute.onConnection((ws) => {
  notifications.add(ws)
})

websocketNotificationsRoute.onClose((ws) => {
  notifications.delete(ws)
})

/**
 * Отправляет уведомление всем подписчикам
 * @param type Тип уведомления
 * @param data Данные уведомления
 * @param channels Каналы для отправки (если пусто - всем)
 */
export function sendNotification(type: string, data: any, channels: string[] = []) {
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date()
  })
  
  notifications.forEach(ws => {
    if (!channels.length || !ws.channels || channels.length === 0 || channels.some(channel => ws.channels?.includes(channel))) {
      if (ws.readyState === ws.OPEN) {
        ws.send(message)
      }
    }
  })
}

/**
 * WS /ws/chat/:roomId
 * WebSocket для многопользовательского чата
 * Клиенты могут отправлять сообщения и видеть индикаторы набора текста
 */
export const websocketChatRoute = app.ws('/ws/chat/:roomId', async (ws, ctx) => {
  const roomId = ctx.req.params.roomId
  
  if (!chatRooms.has(roomId)) {
    chatRooms.set(roomId, new Set())
  }
  chatRooms.get(roomId).add(ws)
  
  const history = chatHistory.get(roomId) || []
  ws.send(JSON.stringify({
    type: 'history',
    messages: history,
    timestamp: new Date()
  }))
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      if (data.type === 'message') {
        const chatMessage = {
          id: Date.now(),
          roomId,
          userId: data.userId,
          username: data.username,
          text: data.text,
          timestamp: new Date()
        }
        
        if (!chatHistory.has(roomId)) {
          chatHistory.set(roomId, [])
        }
        chatHistory.get(roomId).push(chatMessage)
        
        if (chatHistory.get(roomId).length > 100) {
          chatHistory.get(roomId).shift()
        }
        
        broadcastMessage(roomId, {
          type: 'message',
          message: chatMessage,
          timestamp: new Date()
        })
      } else if (data.type === 'typing') {
        broadcastMessage(roomId, {
          type: 'typing',
          userId: data.userId,
          username: data.username,
          isTyping: data.isTyping,
          timestamp: new Date()
        }, ws)
      }
    } catch (error) {
      // Silently handle parsing errors
    }
  })
  
  ws.on('close', () => {
    chatRooms.get(roomId)?.delete(ws)
    
    if (chatRooms.get(roomId)?.size === 0) {
      chatRooms.delete(roomId)
    }
  })
})

/**
 * Хранилища для управления чатами
 */
const chatRooms = new Map<string, Set<any>>()
const chatHistory = new Map<string, any[]>()

/**
 * Отправляет сообщение всем участникам комнаты
 * @param roomId ID комнаты
 * @param message Сообщение для отправки
 * @param excludeWs WebSocket исключить (опционально)
 */
function broadcastMessage(roomId: string, message: any, excludeWs: any = null) {
  const room = chatRooms.get(roomId)
  if (!room) return
  
  room.forEach(ws => {
    if (ws !== excludeWs && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message))
    }
  })
}

/**
 * WS /ws/realtime
 * WebSocket для синхронизации данных в реальном времени
 * Клиенты могут подписываться на обновления конкретных сущностей
 */
export const websocketRealtimeRoute = app.ws('/ws/realtime', async (ws, ctx) => {
  const userId = ctx.user?.id || ctx.session?.id
  
  ws.send(JSON.stringify({
    type: 'connected',
    userId,
    timestamp: new Date()
  }))
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      switch (data.type) {
        case 'subscribe_updates':
          ws.subscriptions = data.entities || []
          sendRealtimeSubscriptions()
          break
          
        case 'get_state':
          await sendCurrentState(ws, data.entity, data.entityId)
          break
          
        case 'action':
          await handleRealtimeAction(ws, data.action, data.payload)
          break
      }
    } catch (error) {
      // Silently handle parsing errors
    }
  })
  
  ws.on('close', () => {
    // Connection closed
  })
})

/**
 * Хранилище подписок реального времени
 */
const realtimeSubscriptions = new Map()

/**
 * Отправляет информацию о подписках
 */
function sendRealtimeSubscriptions() {
  realtimeSubscriptions.forEach((subscribers, entity) => {
    broadcastRealtimeUpdate(entity)
  })
}

/**
 * Отправляет текущее состояние сущности
 * @param ws WebSocket подключение
 * @param entity Тип сущности
 * @param entityId ID сущности
 */
async function sendCurrentState(ws: any, entity: string, entityId: string) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({
      type: 'state',
      entity,
      entityId,
      timestamp: new Date()
    }))
  }
}

/**
 * Обрабатывает действие в реальном времени
 * @param ws WebSocket подключение
 * @param action Действие
 * @param payload Данные действия
 */
async function handleRealtimeAction(ws: any, action: string, payload: any) {
  // Handle action
}

/**
 * Отправляет обновление в реальном времени
 * @param entity Тип сущности
 * @param data Данные обновления
 */
function broadcastRealtimeUpdate(entity: string, data?: any) {
  // Broadcast update
}

/**
 * POST /ws/send-notification
 * API для отправки уведомления через WebSocket
 * @param body.type Тип уведомления
 * @param body.data Данные уведомления
 * @param body.channels Каналы отправки
 * @returns Результат отправки
 */
// @shared-route
export const sendPushNotificationRoute = app.post('/ws/send-notification', async (ctx, req) => {
  const { type, data, channels = [] } = req.body
  
  try {
    sendNotification(type, data, channels)
    
    return {
      success: true,
      message: 'Уведомление отправлено'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при отправке уведомления'
    }
  }
})

/**
 * POST /ws/send-message
 * API для отправки сообщения в чат
 * @param body.roomId ID комнаты
 * @param body.userId ID пользователя
 * @param body.username Имя пользователя
 * @param body.text Текст сообщения
 * @returns Отправленное сообщение
 */
// @shared-route
export const sendChatMessageRoute = app.post('/ws/send-message', async (ctx, req) => {
  const { roomId, userId, username, text } = req.body
  
  try {
    const chatMessage = {
      id: Date.now(),
      roomId,
      userId,
      username,
      text,
      timestamp: new Date()
    }
    
    if (!chatHistory.has(roomId)) {
      chatHistory.set(roomId, [])
    }
    chatHistory.get(roomId).push(chatMessage)
    
    broadcastMessage(roomId, {
      type: 'message',
      message: chatMessage,
      timestamp: new Date()
    })
    
    return {
      success: true,
      message: chatMessage
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при отправке сообщения'
    }
  }
})

/**
 * POST /ws/send-update
 * API для отправки обновления реального времени
 * @param body.entity Тип сущности
 * @param body.entityId ID сущности
 * @param body.data Данные обновления
 * @param body.fieldsUpdated Список обновленных полей
 * @returns Результат отправки
 */
// @shared-route
export const sendRealtimeUpdateRoute = app.post('/ws/send-update', async (ctx, req) => {
  const { entity, entityId, data, fieldsUpdated } = req.body
  
  try {
    broadcastRealtimeUpdate(entity, {
      id: entityId,
      data,
      fieldsUpdated,
      timestamp: new Date()
    })
    
    return {
      success: true,
      message: 'Обновление отправлено'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при отправке обновления'
    }
  }
})

/**
 * WS /ws/monitor
 * WebSocket для мониторинга системы
 * Администраторы могут следить за статистикой и здоровьем системы
 */
export const websocketMonitorRoute = app.ws('/ws/monitor', async (ws, ctx) => {
  ws.send(JSON.stringify({
    type: 'monitor_status',
    data: {
      ws_connections: connections.size,
      active_rooms: chatRooms.size,
      timestamp: new Date()
    }
  }))
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      
      switch (data.type) {
        case 'get_stats':
          ws.send(JSON.stringify({
            type: 'monitor_stats',
            data: getSystemStats(),
            timestamp: new Date()
          }))
          break
          
        case 'clear_history':
          if (data.roomId && chatHistory.has(data.roomId)) {
            chatHistory.set(data.roomId, [])
            broadcastMessage(data.roomId, {
              type: 'history_cleared',
              timestamp: new Date()
            })
          }
          break
      }
    } catch (error) {
      // Silently handle parsing errors
    }
  })
  
  ws.on('close', () => {
    // Connection closed
  })
})

/**
 * Хранилище всех подключений для мониторинга
 */
const connections = new Set()

websocketMonitorRoute.onConnection((ws) => {
  connections.add(ws)
})

websocketMonitorRoute.onClose((ws) => {
  connections.delete(ws)
})

/**
 * Получает статистику системы
 * @returns Статистика систем и подключений
 */
function getSystemStats() {
  return {
    websocket_connections: connections.size,
    chat_rooms: chatRooms.size,
    chat_rooms_detail: Array.from(chatRooms.entries()).map(([roomId, participants]) => ({
      roomId,
      participants: participants.size
    })),
    message_history: Array.from(chatHistory.entries()).map(([roomId, messages]) => ({
      roomId,
      message_count: messages.length
    }))
  }
}

/**
 * GET /ws/stats
 * API для получения статистики WebSocket
 * @returns Текущая статистика системы
 */
// @shared-route
export const getWebSocketStatsRoute = app.get('/ws/stats', async (ctx, req) => {
  return {
    success: true,
    data: getSystemStats()
  }
})
