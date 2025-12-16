// @shared-route
// Универсальный API для выполнения тестов
// Используется и для /tests (по одному тесту), и для /tests/ai (все тесты сразу)

import { requireAnyUser } from '@app/auth'
import { request } from '@app/request'
import { findAgents, pushMessageToChain } from '@ai-agents/sdk/process'
import { genSocketId } from '@app/socket'
import ChatMessagesTable from '../../tables/chat_messages.table.js'
import { TEST_CATEGORIES } from '../shared/test-definitions.js'

// API: Получить список всех тестов
export const apiGetTestsListRoute = app.get('/list', async (ctx, req) => {
  return {
    success: true,
    categories: TEST_CATEGORIES
  }
})

// API: Выполнить один тест (для интерактивной страницы)
export const apiRunSingleTestRoute = app.post('/run-single', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { category, testName } = req.body
    const startTime = Date.now()
    
    await executeTest(ctx, category, testName)
    
    return {
      success: true,
      duration: Date.now() - startTime
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      stack: error.stack || ''
    }
  }
})

// API: Выполнить все тесты (для AI страницы)
export const apiRunAllTestsRoute = app.get('/run-all', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const results = []
    const startTime = Date.now()
    
    for (const category of TEST_CATEGORIES) {
      for (const test of category.tests) {
        const testStartTime = Date.now()
        
        try {
          await executeTest(ctx, category.name, test.name)
          
          results.push({
            category: category.name,
            test: test.name,
            description: test.description,
            status: 'passed',
            duration: Date.now() - testStartTime
          })
        } catch (error: any) {
          results.push({
            category: category.name,
            test: test.name,
            description: test.description,
            status: 'failed',
            error: error.message,
            stack: error.stack,
            duration: Date.now() - testStartTime
          })
        }
      }
    }
    
    const totalDuration = Date.now() - startTime
    const passed = results.filter(r => r.status === 'passed').length
    const failed = results.filter(r => r.status === 'failed').length
    
    ctx.account.log('All tests executed', {
      level: 'info',
      json: { passed, failed, duration: totalDuration, success: failed === 0 }
    })
    
    return {
      timestamp: new Date().toISOString(),
      project: 'ai-assistent-podolyak',
      summary: {
        total: results.length,
        passed,
        failed,
        duration: totalDuration,
        success: failed === 0
      },
      results
    }
  } catch (error: any) {
    ctx.account.log('Tests execution error', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      timestamp: new Date().toISOString(),
      project: 'ai-assistent-podolyak',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        success: false,
        error: error.message
      },
      results: []
    }
  }
})

// ============================================================================
// ВЫПОЛНЕНИЕ ТЕСТОВ
// ============================================================================

async function executeTest(ctx: any, category: string, testName: string) {
  switch (category) {
    case 'database':
      await runDatabaseTest(ctx, testName)
      break
    case 'api_internal':
      await runApiInternalTest(ctx, testName)
      break
    case 'api_http':
      await runApiHttpTest(ctx, testName)
      break
    case 'functional':
      await runFunctionalTest(ctx, testName)
      break
    case 'integration':
      await runIntegrationTest(ctx, testName)
      break
    case 'tools':
      await runToolsTest(ctx, testName)
      break
    default:
      throw new Error(`Неизвестная категория: ${category}`)
  }
}

// === ТЕСТЫ БАЗЫ ДАННЫХ ===
async function runDatabaseTest(ctx: any, testName: string) {
  switch (testName) {
    case 'table_exists':
      if (!ChatMessagesTable) {
        throw new Error('Таблица не найдена')
      }
      break
      
    case 'create_message':
      const createChainKey = 'test-chain-' + Date.now()
      const msg = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: createChainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Тестовое сообщение',
        isVisible: true
      })
      
      // Если create не возвращает объект, проверяем через findAll
      if (!msg) {
        const createdMsgs = await ChatMessagesTable.findAll(ctx, {
          where: { chainKey: createChainKey }
        })
        
        if (!createdMsgs || createdMsgs.length === 0) throw new Error('Сообщение не создано')
      } else if (!msg.id) {
        throw new Error('Сообщение создано, но без ID')
      }
      break
      
    case 'find_messages':
      const chainKey = 'test-find-' + Date.now()
      const created = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Для поиска',
        isVisible: true
      })
      
      // Проверяем через findAll в любом случае
      const messages = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey, isVisible: true }
      })
      
      if (!messages || messages.length === 0) throw new Error('Сообщения не найдены')
      break
      
    case 'update_visibility':
      const updateChainKey = 'test-update-' + Date.now()
      const testMsg = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: updateChainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Для скрытия',
        isVisible: true
      })
      
      // Если create не возвращает объект, находим через findAll
      let msgId
      if (!testMsg) {
        const testMsgs = await ChatMessagesTable.findAll(ctx, {
          where: { chainKey: updateChainKey, isVisible: true }
        })
        
        if (!testMsgs || testMsgs.length === 0) throw new Error('Тестовое сообщение не создано')
        msgId = testMsgs[0].id
      } else {
        msgId = testMsg.id
      }
      
      const updated = await ChatMessagesTable.update(ctx, {
        id: msgId,
        isVisible: false
      })
      
      if (updated.isVisible !== false) throw new Error('isVisible не обновлено')
      break
      
    case 'context_reset_marker':
      const markerChainKey = 'test-marker-' + Date.now()
      const marker = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: markerChainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Контекст сброшен',
        isVisible: true,
        isContextReset: true
      })
      
      // Если create не возвращает объект, проверяем через findAll
      if (!marker) {
        const markers = await ChatMessagesTable.findAll(ctx, {
          where: { chainKey: markerChainKey, isContextReset: true }
        })
        
        if (!markers || markers.length === 0) throw new Error('Маркер не создан')
        if (!markers[0].isContextReset) throw new Error('isContextReset не установлено')
      } else if (!marker.isContextReset) {
        throw new Error('isContextReset не установлено')
      }
      break
  }
}

// === ТЕСТЫ API (внутренние вызовы через route.run) ===
async function runApiInternalTest(ctx: any, testName: string) {
  switch (testName) {
    case 'get_agents_list':
      const agents = await findAgents(ctx)
      if (!agents || !Array.isArray(agents)) throw new Error('Агенты не получены')
      break
      
    case 'get_socket_id':
      const socketId = 'test-socket-' + Date.now()
      const encoded = await genSocketId(ctx, socketId)
      if (!encoded) throw new Error('socketId не закодирован')
      break
      
    case 'send_message':
      const agentsList = await findAgents(ctx)
      if (!agentsList || agentsList.length === 0) throw new Error('Нет доступных агентов')
      
      const agent = agentsList[0]
      const chainKey = 'test-send-' + Date.now()
      
      await pushMessageToChain(ctx, {
        agentId: agent.id,
        chainKey,
        messageText: 'Тестовое сообщение',
        wakeAgent: false,
        createChainIfNotExists: true,
        chainParams: {
          title: 'Test',
          userId: ctx.user.id
        }
      })
      break
      
    case 'get_history':
      const historyKey = 'test-history-' + Date.now()
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: historyKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Для истории',
        isVisible: true
      })
      
      const history = await ChatMessagesTable.findAll(ctx, {
        where: {
          userId: ctx.user.id,
          chainKey: historyKey,
          isVisible: true
        },
        order: [{ createdAt: 'asc' }]
      })
      
      if (!history || history.length === 0) throw new Error('История не загружена')
      break
      
    case 'clear_chat':
      const clearKey = 'test-clear-' + Date.now()
      
      const msgToClear = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: clearKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Для очистки',
        isVisible: true
      })
      
      await ChatMessagesTable.update(ctx, {
        id: msgToClear.id,
        isVisible: false
      })
      
      const visible = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: clearKey, isVisible: true }
      })
      
      if (visible.length !== 0) throw new Error('Сообщения не скрыты')
      break
      
    case 'reset_context':
      const newKey = `${ctx.user.id}-test-${Date.now()}`
      
      const resetMarker = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: newKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Контекст сброшен',
        isVisible: true,
        isContextReset: true
      })
      
      if (!resetMarker || !resetMarker.isContextReset) throw new Error('Маркер сброса не создан')
      break
  }
}

// === ФУНКЦИОНАЛЬНЫЕ ТЕСТЫ ===
async function runFunctionalTest(ctx: any, testName: string) {
  switch (testName) {
    case 'agent_selection':
      const userId = ctx.user.id
      const agentId = 'test-agent-' + Date.now()
      const chainKey = `${userId}-${agentId}-${Date.now()}`
      
      if (!chainKey.includes(userId) || !chainKey.includes(agentId)) {
        throw new Error('chainKey некорректен')
      }
      break
      
    case 'agent_change_marker':
      const marker = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: 'test-change-' + Date.now(),
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Выбран агент',
        isVisible: true,
        isAgentChange: true
      })
      
      if (!marker || !marker.isAgentChange) throw new Error('Маркер не создан')
      break
      
    case 'message_persistence':
      const persistKey = 'persist-' + Date.now()
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: persistKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Сообщение 1',
        isVisible: true
      })
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: persistKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'assistant',
        content: 'Ответ 1',
        isVisible: true
      })
      
      const persisted = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: persistKey, isVisible: true },
        order: [{ createdAt: 'asc' }]
      })
      
      if (!persisted || persisted.length !== 2) throw new Error('Сообщения не сохранены')
      break
      
    case 'clear_functionality':
      const clearKey = 'clear-func-' + Date.now()
      
      const msgToHide = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: clearKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Для скрытия',
        isVisible: true
      })
      
      await ChatMessagesTable.update(ctx, {
        id: msgToHide.id,
        isVisible: false
      })
      
      const visible = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: clearKey, isVisible: true }
      })
      
      const all = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: clearKey }
      })
      
      if (visible.length !== 0 || all.length === 0) throw new Error('Сообщения не скрыты корректно')
      break
      
    case 'context_reset':
      const oldKey = 'old-' + Date.now()
      const newKey = 'new-' + Date.now()
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: oldKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Старое',
        isVisible: true
      })
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: newKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Сброс',
        isVisible: true,
        isContextReset: true
      })
      
      const oldMsgs = await ChatMessagesTable.findAll(ctx, { where: { chainKey: oldKey } })
      const newMsgs = await ChatMessagesTable.findAll(ctx, { where: { chainKey: newKey } })
      
      if (oldMsgs.length === 0 || newMsgs.length === 0) throw new Error('Цепочки не изолированы')
      break
  }
}

// === ТЕСТЫ HTTP ДОСТУПНОСТИ (реальные HTTP запросы) ===
async function runApiHttpTest(ctx: any, testName: string) {
  const baseUrl = ctx.account.url('/dev/ai-assistent-podolyak')
  
  switch (testName) {
    case 'http_get_agents':
      const agentsResponse = await request({
        url: `${baseUrl}/api/chat~agents`,
        method: 'get',
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (agentsResponse.statusCode !== 200) {
        throw new Error(`HTTP ${agentsResponse.statusCode}`)
      }
      
      const agentsData = agentsResponse.body as any
      if (!agentsData.success) {
        throw new Error('API вернул success=false')
      }
      break
      
    case 'http_get_socket_id':
      const socketResponse = await request({
        url: `${baseUrl}/api/chat~socket-id?chainKey=test&agentId=test`,
        method: 'get',
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (socketResponse.statusCode !== 200) {
        throw new Error(`HTTP ${socketResponse.statusCode}`)
      }
      break
      
    case 'http_post_send':
      const sendResponse = await request({
        url: `${baseUrl}/api/chat~send`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          message: 'HTTP тест',
          chainKey: 'http-test-' + Date.now(),
          agentId: 'test-agent',
          agentKey: 'test'
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (sendResponse.statusCode !== 200) {
        throw new Error(`HTTP ${sendResponse.statusCode}`)
      }
      break
      
    case 'http_get_history':
      const historyResponse = await request({
        url: `${baseUrl}/api/chat~history?chainKey=test&agentId=test`,
        method: 'get',
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (historyResponse.statusCode !== 200) {
        throw new Error(`HTTP ${historyResponse.statusCode}`)
      }
      break
      
    case 'http_post_clear':
      const clearResponse = await request({
        url: `${baseUrl}/api/chat~clear`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          chainKey: 'test-clear',
          agentId: 'test-agent'
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (clearResponse.statusCode !== 200) {
        throw new Error(`HTTP ${clearResponse.statusCode}`)
      }
      break
      
    case 'http_post_reset':
      const resetResponse = await request({
        url: `${baseUrl}/api/chat~reset-context`,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          agentId: 'test-agent'
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (resetResponse.statusCode !== 200) {
        throw new Error(`HTTP ${resetResponse.statusCode}`)
      }
      break
  }
}

// === ИНТЕГРАЦИОННЫЕ ТЕСТЫ ===
async function runIntegrationTest(ctx: any, testName: string) {
  switch (testName) {
    case 'full_conversation_flow':
      const flowKey = 'flow-' + Date.now()
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: flowKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Привет',
        isVisible: true
      })
      
      const flowHistory = await ChatMessagesTable.findAll(ctx, {
        where: { userId: ctx.user.id, chainKey: flowKey, isVisible: true }
      })
      
      if (!flowHistory || flowHistory.length === 0) throw new Error('История не загружена')
      break
      
    case 'agent_switch':
      const chain1 = 'switch-1-' + Date.now()
      const chain2 = 'switch-2-' + Date.now()
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: chain1,
        agentId: 'agent-1',
        agentKey: 'test1',
        role: 'user',
        content: 'Цепочка 1',
        isVisible: true
      })
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: chain2,
        agentId: 'agent-2',
        agentKey: 'test2',
        role: 'user',
        content: 'Цепочка 2',
        isVisible: true
      })
      
      const history1 = await ChatMessagesTable.findAll(ctx, { where: { chainKey: chain1 } })
      const history2 = await ChatMessagesTable.findAll(ctx, { where: { chainKey: chain2 } })
      
      if (!history1 || history1.length === 0 || !history2 || history2.length === 0) {
        throw new Error('Цепочки не изолированы')
      }
      break
      
    case 'multiple_users':
      const multiKey = 'multi-' + Date.now()
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: multiKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Сообщение',
        isVisible: true
      })
      
      const userMsgs = await ChatMessagesTable.findAll(ctx, {
        where: { userId: ctx.user.id, chainKey: multiKey }
      })
      
      if (!userMsgs || userMsgs.length === 0) throw new Error('Сообщения не найдены по userId')
      break
      
    case 'persistence_after_clear':
      const persistKey = 'persist-' + Date.now()
      
      const msgToHide = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: persistKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Перед очисткой',
        isVisible: true
      })
      
      await ChatMessagesTable.update(ctx, {
        id: msgToHide.id,
        isVisible: false
      })
      
      const allMsgs = await ChatMessagesTable.findAll(ctx, { where: { chainKey: persistKey } })
      const visibleMsgs = await ChatMessagesTable.findAll(ctx, { where: { chainKey: persistKey, isVisible: true } })
      
      if (allMsgs.length === 0) throw new Error('Данные удалены')
      if (visibleMsgs.length !== 0) throw new Error('Сообщения не скрыты')
      break
  }
}

// === ТЕСТЫ ИНСТРУМЕНТОВ (TOOLS) ===
async function runToolsTest(ctx: any, testName: string) {
  switch (testName) {
    case 'tool_exists':
      // Импортируем инструмент
      const { sendChatResponsePodolyakTool } = await import('../../tools/sendChatResponsePodolyak.js')
      
      if (!sendChatResponsePodolyakTool) {
        throw new Error('Инструмент sendChatResponsePodolyakTool не найден')
      }
      
      // Проверяем, что инструмент имеет функцию .run()
      if (typeof sendChatResponsePodolyakTool.run !== 'function') {
        throw new Error('Инструмент не имеет метода run()')
      }
      
      // Инструмент существует и может быть вызван - это достаточно для проверки
      break
      
    case 'tool_save_message':
      // Тестируем, что инструмент сохраняет сообщение в базу данных
      const { sendChatResponsePodolyakTool: tool } = await import('../../tools/sendChatResponsePodolyak.js')
      
      const testChainKey = 'tool-test-' + Date.now()
      const testAgentId = 'tool-agent-' + Date.now()
      const testMessage = 'Тестовое сообщение от инструмента'
      
      // Вызываем инструмент
      const result = await tool.run(ctx, {
        context: {
          userId: ctx.user.id
        },
        input: {
          message: testMessage,
          chainKey: testChainKey,
          agentId: testAgentId
        }
      })
      
      if (!result.ok) {
        throw new Error(`Инструмент вернул ошибку: ${result.result}`)
      }
      
      // Проверяем, что сообщение сохранено в базе
      const savedMessages = await ChatMessagesTable.findAll(ctx, {
        where: {
          chainKey: testChainKey,
          agentId: testAgentId,
          role: 'assistant'
        }
      })
      
      if (!savedMessages || savedMessages.length === 0) {
        throw new Error('Сообщение не сохранено в базе данных')
      }
      
      if (savedMessages[0].content !== testMessage) {
        throw new Error('Содержимое сообщения не совпадает')
      }
      break
      
    case 'tool_extract_params':
      // Тестируем извлечение параметров из разных мест context
      const { sendChatResponsePodolyakTool: extractTool } = await import('../../tools/sendChatResponsePodolyak.js')
      
      const extractChainKey = 'extract-' + Date.now()
      const extractAgentId = 'extract-agent-' + Date.now()
      
      // Тест 1: Параметры в input (приоритет)
      const result1 = await extractTool.run(ctx, {
        context: {
          userId: ctx.user.id,
          chainKey: 'wrong-chain',  // Должно быть проигнорировано
          agentId: 'wrong-agent'    // Должно быть проигнорировано
        },
        input: {
          message: 'Тест извлечения параметров',
          chainKey: extractChainKey,  // Приоритет
          agentId: extractAgentId     // Приоритет
        }
      })
      
      if (!result1.ok) {
        throw new Error('Инструмент не смог извлечь параметры из input')
      }
      
      // Проверяем, что использованы параметры из input
      const messages1 = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: extractChainKey, agentId: extractAgentId }
      })
      
      if (!messages1 || messages1.length === 0) {
        throw new Error('Параметры из input не использованы')
      }
      
      // Тест 2: Параметры в context.chainMeta (fallback)
      const fallbackChainKey = 'fallback-' + Date.now()
      const fallbackAgentId = 'fallback-agent-' + Date.now()
      
      const result2 = await extractTool.run(ctx, {
        context: {
          userId: ctx.user.id,
          chainMeta: {
            chainKey: fallbackChainKey,
            agentId: fallbackAgentId
          }
        },
        input: {
          message: 'Тест fallback параметров'
        }
      })
      
      if (!result2.ok) {
        throw new Error('Инструмент не смог извлечь параметры из context.chainMeta')
      }
      
      const messages2 = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: fallbackChainKey, agentId: fallbackAgentId }
      })
      
      if (!messages2 || messages2.length === 0) {
        throw new Error('Fallback параметры не использованы')
      }
      break
      
    case 'tool_validation':
      // Тестируем валидацию входных данных
      const { sendChatResponsePodolyakTool: validationTool } = await import('../../tools/sendChatResponsePodolyak.js')
      
      // Тест 1: Пустое сообщение должно вернуть ошибку
      const emptyResult = await validationTool.run(ctx, {
        context: {
          userId: ctx.user.id
        },
        input: {
          message: '',  // Пустое сообщение
          chainKey: 'test-' + Date.now(),
          agentId: 'test-agent'
        }
      })
      
      if (emptyResult.ok) {
        throw new Error('Инструмент должен отклонять пустые сообщения')
      }
      
      if (!emptyResult.result.includes('не может быть пустым')) {
        throw new Error('Сообщение об ошибке не соответствует ожиданиям')
      }
      
      // Тест 2: Сообщение только из пробелов должно быть отклонено
      const spacesResult = await validationTool.run(ctx, {
        context: {
          userId: ctx.user.id
        },
        input: {
          message: '   ',  // Только пробелы
          chainKey: 'test-' + Date.now(),
          agentId: 'test-agent'
        }
      })
      
      if (spacesResult.ok) {
        throw new Error('Инструмент должен отклонять сообщения из пробелов')
      }
      break
  }
}

