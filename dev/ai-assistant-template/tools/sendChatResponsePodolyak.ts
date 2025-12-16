import { sendDataToSocket } from '@app/socket'
import ChatMessagesTable from '../tables/chat_messages.table'
import { getChain } from '@ai-agents/sdk/process'

/**
 * Инструмент для агента - отправка ответа пользователю в чат
 */
export const sendChatResponsePodolyakTool = app
  .function('/send-chat-response-podolyak')
  .meta({
    name: 'sendChatResponsePodolyak',
    description: `Используй этот инструмент чтобы отправить ответное сообщение пользователю в веб-чат.

Этот инструмент отправляет твой ответ в чат через WebSocket в реальном времени и сохраняет его в базу данных.

ПАРАМЕТРЫ:
- message (обязательно): Текст твоего ответа пользователю
- chainKey (необязательно): Из context.uid - ключ текущей цепочки диалога
- agentId (необязательно): Из context.userProfile.agentId - ID агента

ПРАВИЛО ИСПОЛЬЗОВАНИЯ:
- Сформируй ОДИН полный ответ на вопрос пользователя
- Вызови этот инструмент ОДИН РАЗ с этим ответом
- После успешного вызова ОСТАНОВИСЬ и жди следующего сообщения
- НЕ вызывай инструмент повторно без нового сообщения от пользователя

КРИТИЧЕСКИ ВАЖНО: Без вызова этого инструмента пользователь НЕ увидит твой ответ!
Один ответ = один вызов инструмента.`
  })
  .body(s =>
    s.object(
      {
        context: s.object(
          {
            userId: s.string().optional(),
            chainId: s.string().optional()
          },
          { additionalProperties: true }
        ),
        input: s.object(
          {
            message: s.string().describe('Текст сообщения для отправки пользователю'),
            chainKey: s.string().optional().describe('Ключ цепочки диалога'),
            agentId: s.string().optional().describe('ID агента')
          },
          { additionalProperties: true }
        )
      },
      { additionalProperties: true }
    )
  )
  .handle(async (ctx, body) => {
    ctx.account.log('🛠️ sendChatResponsePodolyakTool called', { 
      json: { 
        input: body.input,
        contextKeys: Object.keys(body.context || {}),
        fullContext: body.context 
      } 
    })

    const { input, context } = body

    try {
      if (!input.message || !input.message.trim()) {
        ctx.account.log('⚠️ Empty message received, skipping', {
          level: 'warn',
          json: { input, context }
        })
        // ✅ Возвращаем пустую строку вместо объекта
        return ''
      }

      // ПРИОРИТЕТ 1: Агент передал chainKey явно
      let chainKey = input.chainKey
      
      // ПРИОРИТЕТ 2: Извлекаем chainKey из цепочки агента по context.chainId
      if (!chainKey && context.chainId) {
        try {
          const chain = await getChain(ctx, context.chainId)
          
          if (chain && chain.uid) {
            chainKey = chain.uid  // uid содержит наш chainKey!
            ctx.account.log('📦 Извлечён chainKey из цепочки агента', {
              json: { chainId: context.chainId, chainKey }
            })
          }
        } catch (error) {
          ctx.account.log('⚠️ Не удалось извлечь chainKey из цепочки', {
            level: 'warn',
            json: { chainId: context.chainId, error: error.message }
          })
        }
      }
      
      // ПРИОРИТЕТ 3: Fallback варианты
      if (!chainKey) {
        chainKey = 
          (context as any).uid ||
          (context as any).userProfile?.chainKey ||
          (context as any).userProfile?.clarity_uid ||
          (context as any).chainKey || 
          (context as any).chainMeta?.chainKey ||
          `fallback-${Date.now()}`
      }
      
      // Получаем userId сначала
      let userId = context.userId || (context as any).systemUserId
      
      // agentId нужно извлечь из chainKey используя userId
      // chainKey формат: ${userId}-${agentId}-${timestamp}
      let agentId = input.agentId ||  // Агент может передать agentId в input
        (context as any).agentId || 
        (context as any).chainMeta?.agentId || 
        (context as any).userProfile?.agentId
      
      // Если не нашли agentId, пытаемся извлечь из chainKey
      if (!agentId && userId && chainKey && !chainKey.startsWith('fallback')) {
        // chainKey = userId-agentId-timestamp
        // Убираем userId- в начале
        const afterUserId = chainKey.substring(userId.length + 1)
        // Ищем последний дефис (перед timestamp)
        const lastDashIndex = afterUserId.lastIndexOf('-')
        if (lastDashIndex > 0) {
          agentId = afterUserId.substring(0, lastDashIndex)
        }
      }
      
      if (!agentId) {
        agentId = `fallback-agent-${Date.now()}`
      }
      
      // Если всё ещё не нашли userId, это ошибка
      if (!userId) {
        ctx.account.log('❌ Cannot extract userId', {
          level: 'error',
          json: { chainKey, agentId, context }
        })
        // ✅ Возвращаем пустую строку вместо объекта
        return ''
      }

      // Генерируем socketId для WebSocket
      const socketId = `chat-${userId}-${chainKey}-${agentId}`
      
      ctx.account.log('📊 Extracted parameters', {
        json: { userId, chainKey, agentId, socketId }
      })

      // Создаем объект сообщения
      const messageData = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: input.message.trim(),
        createdAt: new Date()
      }

      // Сохраняем сообщение в таблицу
      const savedMessage = await ChatMessagesTable.create(ctx, {
        userId,
        chainKey,
        agentId,
        agentKey: '',
        role: 'assistant',
        content: input.message.trim(),
        isVisible: true
      })

      ctx.account.log('✅ Message saved to database', {
        json: { 
          messageId: savedMessage.id,
          userId,
          chainKey,
          agentId
        }
      })

      // Отправляем через WebSocket
      await sendDataToSocket(ctx, socketId, {
        type: 'assistant-message',
        data: {
          id: savedMessage.id,
          content: input.message.trim(),
          timestamp: new Date()
        }
      })

      ctx.account.log('✅ Message sent via WebSocket', {
        json: { 
          socketId,
          userId,
          messageLength: input.message.length 
        }
      })

      // Также отправляем событие о завершении печати
      await sendDataToSocket(ctx, socketId, {
        type: 'typing',
        data: {
          isTyping: false
        }
      })

      ctx.account.log('✅ Tool execution complete - returning empty result to stop agent generation', {
        json: { userId, chainKey, agentId }
      })

      // ⚠️ КРИТИЧЕСКИ ВАЖНО: Возвращаем ПУСТУЮ СТРОКУ
      // ПОЧЕМУ: Пустой результат - явный сигнал что работа завершена
      // Система НЕ интерпретирует это как новое сообщение
      // Агент понимает что дальше генерировать нечего
      return ''
    } catch (error) {
      ctx.account.log('Error in sendChatResponsePodolyakTool', {
        level: 'error',
        err: error,
        json: { input, context }
      })

      // Также возвращаем пустую строку при ошибке
      ctx.account.log('❌ Returning empty string on error to stop agent generation', {
        level: 'error',
        json: { error: error.message }
      })
      return ''
    }
  })

// ✅ ВАЖНО: Этот инструмент НЕ регистрируется через глобальный хук!
// Вместо этого он добавляется ЯВНО в enabledTools при создании агента (см. api/agent.ts)
// Это гарантирует что инструмент добавляется РОВНО ОДИН РАЗ
// Без глобального хука, без множественных вызовов, без дублирования!
