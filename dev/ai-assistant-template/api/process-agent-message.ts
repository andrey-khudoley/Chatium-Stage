// @shared-route
import { requireAnyUser } from '@app/auth'
import { pushMessageToChain } from '@ai-agents/sdk/process'
import { sendDataToSocket } from '@app/socket'

/**
 * Job для асинхронной обработки сообщений агентом
 * 
 * Этот job:
 * 1. Получает сообщение пользователя из параметров
 * 2. Отправляет на обработку агенту
 * 3. Агент вызывает инструмент sendChatResponsePodolyak
 * 4. Инструмент сохраняет ответ в БД и отправляет через WebSocket
 * 5. Агент останавливается благодаря флагу stop: true
 */
export const processAgentMessageJob = app.job('/process-message', async (ctx, params) => {
  const { userId, chainKey, agentId, messageId, message } = params as any

  try {
    ctx.account.log('🚀 Starting agent message processing', {
      json: { userId, chainKey, agentId, messageId, messageLength: message.length }
    })

    // Получаем socketId для отправки обновлений
    const socketId = `chat-${userId}-${chainKey}-${agentId}`

    // Отправляем событие о том, что агент начал печатать
    await sendDataToSocket(ctx, socketId, {
      type: 'typing',
      data: { isTyping: true }
    })

    // Отправляем сообщение агенту
    // Агент БЕЗ ПРОМЕЖУТОЧНЫХ ЭТАПОВ вызовет инструмент sendChatResponsePodolyak
    // который отправит ответ через WebSocket и в БД, а затем вернёт stop: true
    await pushMessageToChain(ctx, {
      agentId,
      chainKey,
      messageText: message,
      wakeAgent: true,
      createChainIfNotExists: true,
      chainParams: {
        title: ctx.user?.displayName || 'Пользователь',
        userId,
        uid: chainKey,
        userProfile: {
          email: ctx.user?.confirmedEmail || '',
          phone: ctx.user?.confirmedPhone || '',
          clarity_uid: chainKey,
          chainKey,
          agentId  // ✅ Важно: agentId передаём в userProfile для инструмента
        },
        chainMeta: {
          systemUserId: userId,
          socketId,
          chainKey,
          agentId
        }
      }
    })

    ctx.account.log('📤 Message sent to agent', {
      json: { chainKey, agentId }
    })

    // Инструмент сам позаботится об отправке ответа через WebSocket
    // и остановке генерации благодаря флагу stop: true
    // Job просто завершается

    return {
      success: true
    }
  } catch (error: any) {
    ctx.account.log('❌ Error processing agent message', {
      level: 'error',
      err: error,
      json: { params }
    })

    // Отправляем информацию об ошибке через WebSocket
    const socketId = `chat-${params.userId}-${params.chainKey}-${params.agentId}`
    await sendDataToSocket(ctx, socketId, {
      type: 'typing',
      data: { isTyping: false }
    })

    return {
      success: false,
      error: error.message
    }
  }
})

export default processAgentMessageJob
