// @shared-route
import { requireAccountRole } from '@app/auth'
import { getOrCreateAgentForWorkspace, findAgents } from '@ai-agents/sdk/process'
import { readWorkspaceFile } from '@start/sdk'
import { sendChatResponsePodolyakTool } from '../tools/sendChatResponsePodolyak'

// Генерация короткого рандомного хэша
function generateShortHash(): string {
  return Math.random().toString(36).substring(2, 8)
}

// Получить информацию о текущем агенте
export const apiGetAgentRoute = app.get('/info', async (ctx, req) => {
  try {
    ctx.account.log('API /info called', {
      level: 'info',
      json: { timestamp: new Date().toISOString() }
    })
    
    requireAccountRole(ctx, 'Admin')
    
    ctx.account.log('Searching for agents', { level: 'info' })
    
    const agents = await findAgents(ctx)
    
    ctx.account.log('Find agents result', {
      level: 'info',
      json: { total: agents.length }
    })
    
    const agentsList = agents.map(agent => ({
      id: agent.id,
      key: agent.key,
      title: agent.title,
      instructions: agent.instructions,
      url: ctx.account.url(`/app/agent-process/~agent/${agent.id}`)
    }))
    
    return {
      success: true,
      agents: agentsList,
      exists: agents.length > 0
    }
  } catch (error) {
    ctx.account.log('CRITICAL ERROR in /info', {
      level: 'error',
      json: { 
        error: error.message,
        stack: error.stack,
        name: error.name,
        toString: error.toString()
      }
    })
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      errorName: error.name || 'Error',
      errorStack: error.stack || 'No stack trace'
    }
  }
})

// Создать или пересоздать агента
export const apiCreateAgentRoute = app.post('/create', async (ctx, req) => {
  try {
    ctx.account.log('API /create called', {
      level: 'info',
      json: { body: req.body }
    })
    
    requireAccountRole(ctx, 'Admin')
    
    const { title, instructions, promptKey, agentKey } = req.body
    
    ctx.account.log('Reading config file', { level: 'info' })
    const configFile = await readWorkspaceFile(ctx, 'config.json') || '{}'
    
    const config = typeof configFile === 'string' ? JSON.parse(configFile) : configFile
    
    let finalInstructions = instructions
    if (promptKey && config.prompts && config.prompts[promptKey]) {
      finalInstructions = config.prompts[promptKey]
      ctx.account.log('Using prompt from config', {
        level: 'info',
        json: { promptKey }
      })
    }
    
    const baseKey = agentKey || 'assistant'
    const shortHash = generateShortHash()
    const finalKey = `${baseKey}_${shortHash}`
    
    const finalTitle = title || (config.agentSettings && config.agentSettings.name) || 'AI Ассистент'
    const baseInstructions = finalInstructions || (config.agentSettings && config.agentSettings.systemPrompt) || 'Вы - AI ассистент'
    
    // ✅ АРХИТЕКТУРА: Агент с явным добавлением инструмента
    // Инструмент вызывается РОВНО ОДИН РАЗ при отправке каждого ответа
    // Инструмент отправляет сообщение через WebSocket и в БД
    // Флаг stop: true сигнализирует агенту прекратить генерацию
    const finalInst = baseInstructions
    
    ctx.account.log('Creating agent', {
      level: 'info',
      json: { title: finalTitle, key: finalKey }
    })
    
    // ✅ СОЗДАЁМ агента с явным добавлением инструмента
    const agent = await getOrCreateAgentForWorkspace(ctx, finalKey, {
      title: finalTitle,
      instructions: finalInst,
      enabledTools: [sendChatResponsePodolyakTool]  // ✅ Явное добавление - гарантирует один раз
    })
    
    const agentUrl = ctx.account.url(`/app/agent-process/~agent/${agent.id}`)
    
    ctx.account.log('Agent created/updated', {
      level: 'info',
      json: { 
        agentId: agent.id,
        key: finalKey,
        title: finalTitle,
        url: agentUrl,
        enabledTools: 'sendChatResponsePodolyak (явное добавление)'
      }
    })
    
    return {
      success: true,
      agent: {
        id: agent.id,
        key: finalKey,
        title: finalTitle,
        instructions: finalInst,
        url: agentUrl
      }
    }
  } catch (error) {
    ctx.account.log('CRITICAL ERROR in /create', {
      level: 'error',
      json: { 
        error: error.message, 
        stack: error.stack,
        name: error.name,
        toString: error.toString()
      }
    })
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      errorName: error.name || 'Error',
      errorStack: error.stack || 'No stack trace'
    }
  }
})

// Получить конфигурацию из JSON
export const apiGetConfigRoute = app.get('/config', async (ctx, req) => {
  try {
    ctx.account.log('API /config called', {
      level: 'info'
    })
    
    requireAccountRole(ctx, 'Admin')
    
    ctx.account.log('Reading config file', { level: 'info' })
    const configFile = await readWorkspaceFile(ctx, 'config.json') || '{}'
    
    const config = typeof configFile === 'string' ? JSON.parse(configFile) : configFile
    
    ctx.account.log('Config loaded successfully', {
      level: 'info',
      json: { hasPrompts: !!config.prompts }
    })
    
    return {
      success: true,
      config
    }
  } catch (error) {
    ctx.account.log('CRITICAL ERROR in /config', {
      level: 'error',
      json: { 
        error: error.message,
        stack: error.stack,
        name: error.name,
        toString: error.toString()
      }
    })
    
    return {
      success: false,
      error: error.message || 'Unknown error',
      errorName: error.name || 'Error',
      errorStack: error.stack || 'No stack trace'
    }
  }
})
