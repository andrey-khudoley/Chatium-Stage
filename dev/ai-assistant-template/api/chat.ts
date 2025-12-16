// @shared-route
import { requireAnyUser } from '@app/auth'
import { findAgents } from '@ai-agents/sdk/process'
import { genSocketId } from '@app/socket'
import ChatMessagesTable from '../tables/chat_messages.table'
import { processAgentMessageJob } from './process-agent-message'

// Получить историю сообщений для текущего пользователя и агента
export const apiGetChatHistoryRoute = app.get('/history', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { chainKey, agentId } = req.query
    
    if (!chainKey || !agentId) {
      return {
        success: false,
        error: 'chainKey и agentId обязательны'
      }
    }
    
    const messages = await ChatMessagesTable.findAll(ctx, {
      where: {
        userId: ctx.user.id,
        chainKey: chainKey as string,
        agentId: agentId as string,
        isVisible: true
      },
      order: [{ createdAt: 'asc' }],
      limit: 1000
    })
    
    return {
      success: true,
      messages: messages || []
    }
  } catch (error: any) {
    ctx.account.log('Error getting chat history', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Отправить сообщение агенту
export const apiSendMessageRoute = app.post('/send', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { message, chainKey, agentId, agentKey } = req.body
    
    if (!message || !chainKey || !agentId) {
      return {
        success: false,
        error: 'message, chainKey и agentId обязательны'
      }
    }
    
    // Сохраняем сообщение пользователя
    const userMessage = await ChatMessagesTable.create(ctx, {
      userId: ctx.user.id,
      chainKey,
      agentId,
      agentKey: agentKey || '',
      role: 'user',
      content: message,
      isVisible: true
    })
    
    // Генерируем socketId для real-time обновлений
    const socketId = `chat-${ctx.user.id}-${chainKey}-${agentId}`
    const encodedSocketId = await genSocketId(ctx, socketId)
    
    ctx.account.log('📝 User message saved, scheduling agent processing', {
      level: 'info',
      json: { 
        messageId: userMessage.id,
        userId: ctx.user.id,
        chainKey,
        agentId,
        messageLength: message.length
      }
    })
    
    // Ставим задачу на обработку агентом (асинхронно)
    // Job сам отправит ответ через WebSocket когда агент ответит
    try {
      await processAgentMessageJob.scheduleJobAsap(ctx, {
        userId: ctx.user.id,
        chainKey,
        agentId,
        messageId: userMessage.id,
        message
      })
      
      ctx.account.log('✅ Agent processing job scheduled', {
        level: 'info',
        json: { messageId: userMessage.id, agentId, chainKey }
      })
    } catch (jobError: any) {
      ctx.account.log('⚠️ Failed to schedule agent job', {
        level: 'warn',
        json: { error: jobError.message, messageId: userMessage.id }
      })
    }
    
    return {
      success: true,
      messageId: userMessage.id,
      encodedSocketId
    }
  } catch (error: any) {
    ctx.account.log('Error sending message', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Получить список доступных агентов
export const apiGetAgentsListRoute = app.get('/agents', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const agents = await findAgents(ctx)
    
    const agentsList = agents.map(agent => ({
      id: agent.id,
      key: agent.key,
      title: agent.title,
      instructions: agent.instructions
    }))
    
    return {
      success: true,
      agents: agentsList
    }
  } catch (error: any) {
    ctx.account.log('Error getting agents list', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Очистить видимые сообщения (скрыть, но не удалить)
export const apiClearChatRoute = app.post('/clear', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { chainKey, agentId } = req.body
    
    if (!chainKey || !agentId) {
      return {
        success: false,
        error: 'chainKey и agentId обязательны'
      }
    }
    
    const messages = await ChatMessagesTable.findAll(ctx, {
      where: {
        userId: ctx.user.id,
        chainKey,
        agentId,
        isVisible: true
      }
    })
    
    // Скрываем все сообщения
    for (const message of messages || []) {
      await ChatMessagesTable.update(ctx, {
        id: message.id,
        isVisible: false
      })
    }
    
    ctx.account.log('Chat cleared', {
      level: 'info',
      json: { count: messages?.length || 0, chainKey, agentId }
    })
    
    return {
      success: true,
      clearedCount: messages?.length || 0
    }
  } catch (error: any) {
    ctx.account.log('Error clearing chat', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Сбросить контекст (создать новую цепочку)
export const apiResetContextRoute = app.post('/reset-context', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { agentId } = req.body
    
    if (!agentId) {
      return {
        success: false,
        error: 'agentId обязателен'
      }
    }
    
    // Генерируем новый chainKey
    const newChainKey = `${ctx.user.id}-${agentId}-${Date.now()}`
    
    // Создаём маркер сброса контекста
    await ChatMessagesTable.create(ctx, {
      userId: ctx.user.id,
      chainKey: newChainKey,
      agentId,
      agentKey: '',
      role: 'system',
      content: 'Контекст сброшен. Начат новый диалог.',
      isVisible: true,
      isContextReset: true
    })
    
    ctx.account.log('Context reset', {
      level: 'info',
      json: { newChainKey, agentId }
    })
    
    return {
      success: true,
      newChainKey
    }
  } catch (error: any) {
    ctx.account.log('Error resetting context', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Получить encodedSocketId для подписки на обновления
export const apiGetSocketIdRoute = app.get('/socket-id', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { chainKey, agentId } = req.query
    
    if (!chainKey || !agentId) {
      return {
        success: false,
        error: 'chainKey и agentId обязательны'
      }
    }
    
    const socketId = `chat-${ctx.user.id}-${chainKey}-${agentId}`
    const encodedSocketId = await genSocketId(ctx, socketId)
    
    ctx.account.log('🔌 Generated socket ID for client', {
      level: 'info',
      json: { 
        userId: ctx.user.id,
        chainKey,
        agentId,
        socketId,
        encodedSocketId
      }
    })
    
    return {
      success: true,
      encodedSocketId
    }
  } catch (error: any) {
    ctx.account.log('Error getting socket ID', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

export default apiGetAgentsListRoute
