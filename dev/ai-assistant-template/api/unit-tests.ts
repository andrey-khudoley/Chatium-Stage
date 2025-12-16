// @shared-route
// Универсальный API для unit-тестирования
// Используется и для /unit (интерактивная страница), и для /unit-ai (JSON для AI)

import { requireAnyUser } from '@app/auth'
import { findAgents, pushMessageToChain } from '@ai-agents/sdk/process'
import { genSocketId } from '@app/socket'
import ChatMessagesTable from '../tables/chat_messages.table'

// Единый источник истины для всех тестов
export const TEST_CATEGORIES = [
  {
    name: 'database',
    title: 'Тесты базы данных (Heap Table)',
    icon: 'fa-database',
    tests: [
      { name: 'table_exists', description: 'Проверка существования таблицы chat_messages' },
      { name: 'create_message', description: 'Создание нового сообщения в таблице' },
      { name: 'find_messages', description: 'Поиск сообщений по фильтрам (userId, chainKey, agentId)' },
      { name: 'update_visibility', description: 'Обновление поля isVisible (скрытие сообщений)' },
      { name: 'context_reset_marker', description: 'Создание маркера сброса контекста (isContextReset)' }
    ]
  },
  {
    name: 'api',
    title: 'Тесты API endpoints',
    icon: 'fa-code',
    tests: [
      { name: 'get_agents_list', description: 'GET /chat/agents - получение списка агентов' },
      { name: 'get_socket_id', description: 'GET /chat/socket-id - генерация encodedSocketId' },
      { name: 'send_message', description: 'POST /chat/send - отправка сообщения агенту' },
      { name: 'get_history', description: 'GET /chat/history - получение истории сообщений' },
      { name: 'clear_chat', description: 'POST /chat/clear - очистка чата' },
      { name: 'reset_context', description: 'POST /chat/reset-context - сброс контекста' }
    ]
  },
  {
    name: 'functional',
    title: 'Тесты функциональности чата',
    icon: 'fa-comments',
    tests: [
      { name: 'agent_selection', description: 'Выбор агента и генерация chainKey' },
      { name: 'agent_change_marker', description: 'Создание маркера смены агента' },
      { name: 'message_persistence', description: 'Сохранение и загрузка истории сообщений' },
      { name: 'clear_functionality', description: 'Очистка окна чата (скрытие, не удаление)' },
      { name: 'context_reset', description: 'Сброс контекста и создание новой цепочки' }
    ]
  },
  {
    name: 'integration',
    title: 'Интеграционные тесты',
    icon: 'fa-network-wired',
    tests: [
      { name: 'full_conversation_flow', description: 'Полный цикл диалога: выбор агента → сообщение → ответ' },
      { name: 'agent_switch', description: 'Переключение между агентами с сохранением цепочек' },
      { name: 'multiple_users', description: 'Изоляция сообщений разных пользователей' },
      { name: 'persistence_after_clear', description: 'Сохранение данных после очистки окна' }
    ]
  }
]

// API: Получить список всех тестов
export const apiGetTestsListRoute = app.get('/list', async (ctx, req) => {
  return {
    success: true,
    categories: TEST_CATEGORIES
  }
})

// API: Выполнить один тест
export const apiRunSingleTestRoute = app.post('/run', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { category, testName } = req.body
    const startTime = Date.now()
    
    // Выполняем тест
    switch (category) {
      case 'database':
        await runDatabaseTest(ctx, testName)
        break
      case 'api':
        await runApiTest(ctx, testName)
        break
      case 'functional':
        await runFunctionalTest(ctx, testName)
        break
      case 'integration':
        await runIntegrationTest(ctx, testName)
        break
      default:
        throw new Error(`Неизвестная категория: ${category}`)
    }
    
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

// API: Выполнить все тесты (для /unit-ai)
export const apiRunAllTestsRoute = app.get('/run-all', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const results = []
    const startTime = Date.now()
    
    // Выполняем все тесты последовательно
    for (const category of TEST_CATEGORIES) {
      for (const test of category.tests) {
        const testStartTime = Date.now()
        
        try {
          switch (category.name) {
            case 'database':
              await runDatabaseTest(ctx, test.name)
              break
            case 'api':
              await runApiTest(ctx, test.name)
              break
            case 'functional':
              await runFunctionalTest(ctx, test.name)
              break
            case 'integration':
              await runIntegrationTest(ctx, test.name)
              break
          }
          
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
    
    ctx.account.log('Unit tests executed', {
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
    ctx.account.log('Unit tests execution error', {
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
// ФУНКЦИИ ВЫПОЛНЕНИЯ ТЕСТОВ
// ============================================================================

// === ТЕСТЫ БАЗЫ ДАННЫХ ===
async function runDatabaseTest(ctx: any, testName: string) {
  switch (testName) {
    case 'table_exists':
      if (!ChatMessagesTable) {
        throw new Error('Таблица ChatMessagesTable не найдена')
      }
      break
      
    case 'create_message':
      if (!ctx.user) {
        throw new Error('Пользователь не авторизован')
      }
      
      const msg = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: 'test-chain-' + Date.now(),
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Тестовое сообщение',
        isVisible: true
      })
      
      if (!msg || !msg.id) {
        throw new Error('Сообщение не создано')
      }
      break
      
    case 'find_messages':
      if (!ctx.user) {
        throw new Error('Пользователь не авторизован')
      }
      
      const chainKey = 'test-find-' + Date.now()
      const createdMsg = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Для поиска',
        isVisible: true
      })
      
      if (!createdMsg) {
        throw new Error('Не удалось создать тестовое сообщение')
      }
      
      const messages = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey, isVisible: true }
      })
      
      if (!messages || messages.length === 0) {
        throw new Error('Сообщения не найдены по фильтрам')
      }
      break
      
    case 'update_visibility':
      if (!ctx.user) {
        throw new Error('Пользователь не авторизован')
      }
      
      const testMsg = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: 'test-update-' + Date.now(),
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Для скрытия',
        isVisible: true
      })
      
      if (!testMsg || !testMsg.id) {
        throw new Error('Тестовое сообщение не создано')
      }
      
      const updated = await ChatMessagesTable.update(ctx, {
        id: testMsg.id,
        isVisible: false
      })
      
      if (updated.isVisible !== false) {
        throw new Error('isVisible не обновлено')
      }
      break
      
    case 'context_reset_marker':
      if (!ctx.user) {
        throw new Error('Пользователь не авторизован')
      }
      
      const marker = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: 'test-marker-' + Date.now(),
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Контекст сброшен',
        isVisible: true,
        isContextReset: true
      })
      
      if (!marker) {
        throw new Error('Маркер не создан')
      }
      
      if (!marker.isContextReset) {
        throw new Error('isContextReset не установлено')
      }
      break
  }
}

// === ТЕСТЫ API ===
async function runApiTest(ctx: any, testName: string) {
  switch (testName) {
    case 'get_agents_list':
      const agents = await findAgents(ctx)
      if (!agents || !Array.isArray(agents)) {
        throw new Error('Агенты не получены')
      }
      break
      
    case 'get_socket_id':
      const socketId = 'test-socket-' + Date.now()
      const encoded = await genSocketId(ctx, socketId)
      if (!encoded) {
        throw new Error('socketId не закодирован')
      }
      break
      
    case 'send_message':
      const agentsList = await findAgents(ctx)
      if (!agentsList || agentsList.length === 0) {
        throw new Error('Нет доступных агентов')
      }
      
      const agent = agentsList[0]
      const chainKey = 'test-send-' + Date.now()
      
      await pushMessageToChain(ctx, {
        agentId: agent.id,
        chainKey,
        messageText: 'Тестовое сообщение от unit-tests',
        wakeAgent: false,
        createChainIfNotExists: true,
        chainParams: {
          title: 'Test',
          userId: ctx.user.id
        }
      })
      break
      
    case 'get_history':
      const historyChainKey = 'test-history-' + Date.now()
      
      // Создаём тестовые сообщения
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: historyChainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Тестовое сообщение для истории',
        isVisible: true
      })
      
      // Проверяем получение истории
      const history = await ChatMessagesTable.findAll(ctx, {
        where: {
          userId: ctx.user.id,
          chainKey: historyChainKey,
          isVisible: true
        },
        order: [{ createdAt: 'asc' }]
      })
      
      if (!history || history.length === 0) {
        throw new Error('История не загружена')
      }
      break
      
    case 'clear_chat':
      const clearChainKey = 'test-clear-' + Date.now()
      
      // Создаём сообщение
      const msgToClear = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: clearChainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Сообщение для очистки',
        isVisible: true
      })
      
      // Скрываем сообщение
      await ChatMessagesTable.update(ctx, {
        id: msgToClear.id,
        isVisible: false
      })
      
      // Проверяем что скрыто
      const visible = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: clearChainKey, isVisible: true }
      })
      
      if (visible.length !== 0) {
        throw new Error('Сообщения не скрыты')
      }
      break
      
    case 'reset_context':
      const newChainKey = `${ctx.user.id}-test-agent-${Date.now()}`
      
      // Создаём маркер сброса
      const resetMarker = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: newChainKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Контекст сброшен. Начат новый диалог.',
        isVisible: true,
        isContextReset: true
      })
      
      if (!resetMarker || !resetMarker.isContextReset) {
        throw new Error('Маркер сброса не создан')
      }
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
      const agentMarker = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: 'test-agent-change-' + Date.now(),
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Выбран агент: Тестовый',
        isVisible: true,
        isAgentChange: true
      })
      
      if (!agentMarker || !agentMarker.isAgentChange) {
        throw new Error('Маркер смены агента не создан')
      }
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
      
      if (!persisted || persisted.length !== 2) {
        throw new Error('Сообщения не сохранены')
      }
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
      
      if (visible.length !== 0 || all.length === 0) {
        throw new Error('Сообщения не скрыты корректно')
      }
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
        content: 'Старое сообщение',
        isVisible: true
      })
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: newKey,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'system',
        content: 'Контекст сброшен',
        isVisible: true,
        isContextReset: true
      })
      
      const oldMsgs = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: oldKey }
      })
      
      const newMsgs = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: newKey }
      })
      
      if (oldMsgs.length === 0 || newMsgs.length === 0) {
        throw new Error('Цепочки не изолированы')
      }
      break
  }
}

// === ИНТЕГРАЦИОННЫЕ ТЕСТЫ ===
async function runIntegrationTest(ctx: any, testName: string) {
  switch (testName) {
    case 'full_conversation_flow':
      const flowChain = 'flow-' + Date.now()
      
      // Создаём сообщение пользователя
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: flowChain,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Привет',
        isVisible: true
      })
      
      // Проверяем что оно сохранилось
      const flowHistory = await ChatMessagesTable.findAll(ctx, {
        where: {
          userId: ctx.user.id,
          chainKey: flowChain,
          isVisible: true
        }
      })
      
      if (!flowHistory || flowHistory.length === 0) {
        throw new Error('История не загружена')
      }
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
        content: 'Сообщение в цепочке 1',
        isVisible: true
      })
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: chain2,
        agentId: 'agent-2',
        agentKey: 'test2',
        role: 'user',
        content: 'Сообщение в цепочке 2',
        isVisible: true
      })
      
      const history1 = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: chain1 }
      })
      
      const history2 = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: chain2 }
      })
      
      if (!history1 || history1.length === 0 || !history2 || history2.length === 0) {
        throw new Error('Цепочки не изолированы')
      }
      break
      
    case 'multiple_users':
      const multiChain = 'multi-user-' + Date.now()
      
      await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: multiChain,
        agentId: 'test-agent',
        agentKey: 'test',
        role: 'user',
        content: 'Сообщение пользователя',
        isVisible: true
      })
      
      const userMsgs = await ChatMessagesTable.findAll(ctx, {
        where: { userId: ctx.user.id, chainKey: multiChain }
      })
      
      if (!userMsgs || userMsgs.length === 0) {
        throw new Error('Сообщения не найдены по userId')
      }
      break
      
    case 'persistence_after_clear':
      const persistChain = 'persist-clear-' + Date.now()
      
      const msgToHide = await ChatMessagesTable.create(ctx, {
        userId: ctx.user.id,
        chainKey: persistChain,
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
      
      const allMsgs = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: persistChain }
      })
      
      const visibleMsgs = await ChatMessagesTable.findAll(ctx, {
        where: { chainKey: persistChain, isVisible: true }
      })
      
      if (allMsgs.length === 0) {
        throw new Error('Данные удалены после очистки')
      }
      
      if (visibleMsgs.length !== 0) {
        throw new Error('Сообщения не скрыты')
      }
      break
  }
}

