import { requireAnyUser } from '@app/auth'
import Webhooks from '../tables/webhooks.table'
import { Debug } from '../shared/debug'
import { applyDebugLevel } from '../lib/logging'

// Вспомогательная функция для логирования с JSON данными
function logWithData(ctx: RichUgcCtx, scope: string, message: string, level: 'info' | 'warn' | 'error', data?: Record<string, unknown>): void {
  const suffix = data ? ` ${JSON.stringify(data)}` : ''
  const text = `${scope}: ${message}${suffix}`
  if (level === 'error') {
    Debug.error(ctx, text)
  } else if (level === 'warn') {
    Debug.warn(ctx, text)
  } else {
    Debug.info(ctx, text)
  }
}

// Получение списка вебхуков
export const apiGetWebhooksRoute = app.get('/api/webhooks', async (ctx, req) => {
  requireAnyUser(ctx)
  
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0
  
  try {
    const webhooks = await Webhooks.findAll(ctx, {
      order: [{ receivedAt: 'desc' }],
      limit,
      offset
    })
    
    const total = await Webhooks.countBy(ctx, {})
    
    return {
      success: true,
      webhooks: webhooks.map(w => ({
        id: w.id,
        botToken: w.botToken ? `${w.botToken.substring(0, 10)}...` : '',
        updateId: w.updateId,
        receivedAt: w.receivedAt,
        dataPreview: JSON.stringify(w.data || {}).substring(0, 100) + '...'
      })),
      total,
      limit,
      offset
    }
  } catch (error: any) {
    ctx.account.log('Ошибка получения вебхуков', {
      level: 'error',
      json: { error: String(error), message: error.message }
    })
    return {
      success: false,
      error: String(error),
      webhooks: [],
      total: 0,
      limit,
      offset
    }
  }
})

// Получение одного вебхука
export const apiGetWebhookRoute = app.get('/:id', async (ctx, req) => {
  requireAnyUser(ctx)
  const logLevel = await applyDebugLevel(ctx, 'get-webhook')
  Debug.configure({ level: logLevel, prefix: '[get-webhook]' })
  
  const getWebhookStartTime = Date.now()
  const webhookId = req.params.id
  
  logWithData(ctx, '[get-webhook]', 'Запрос получения вебхука', 'info', {
    webhookId,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  })
  
  if (!webhookId) {
    logWithData(ctx, '[get-webhook]', 'ID вебхука не передан', 'warn', {
      params: req.params
    })
    return {
      success: false,
      error: 'ID вебхука не указан'
    }
  }
  
  try {
    const findWebhookStartTime = Date.now()
    const webhook = await Webhooks.findById(ctx, webhookId)
    const findWebhookDuration = Date.now() - findWebhookStartTime
    
    logWithData(ctx, '[get-webhook]', 'Поиск вебхука завершен', 'info', {
      webhookId,
      found: !!webhook,
      findWebhookDurationMs: findWebhookDuration
    })
    
    if (!webhook) {
      logWithData(ctx, '[get-webhook]', 'Вебхук не найден', 'warn', {
        webhookId
      })
      return {
        success: false,
        error: 'Вебхук не найден'
      }
    }
    
    const getWebhookDuration = Date.now() - getWebhookStartTime
    
    logWithData(ctx, '[get-webhook]', 'Вебхук успешно получен', 'info', {
      webhookId: webhook.id,
      updateId: webhook.updateId,
      hasData: !!webhook.data,
      dataSize: webhook.data ? JSON.stringify(webhook.data).length : 0,
      getWebhookDurationMs: getWebhookDuration
    })
    
    return {
      success: true,
      webhook: {
        id: webhook.id,
        botToken: webhook.botToken ? `${webhook.botToken.substring(0, 10)}...` : '',
        updateId: webhook.updateId,
        receivedAt: webhook.receivedAt,
        data: webhook.data
      }
    }
  } catch (error: any) {
    logWithData(ctx, '[get-webhook]', 'Ошибка при получении вебхука', 'error', {
      webhookId,
      error: String(error),
      errorMessage: error.message,
      errorStack: error.stack
    })
    return {
      success: false,
      error: String(error)
    }
  }
})

