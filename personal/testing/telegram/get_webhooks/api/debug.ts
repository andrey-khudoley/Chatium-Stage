import Settings from '../tables/settings.table'
import Webhooks from '../tables/webhooks.table'
import { pollTelegramWebhooksJob } from '../jobs/pollTelegram'
import { request } from '@app/request'
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

// Диагностический роут для проверки состояния системы
export const apiDebugRoute = app.get('/api/debug', async (ctx) => {
  const logLevel = await applyDebugLevel(ctx, 'debug-route')
  Debug.configure({ level: logLevel, prefix: '[debug-route]' })
  
  const debugStartTime = Date.now()
  logWithData(ctx, '[debug-route]', 'Запрос диагностики получен', 'info', {
    timestamp: new Date().toISOString(),
    requestStartTime: debugStartTime
  })
  // Получаем все настройки
  Debug.info(ctx, '[debug-route] Получение настроек')
  const getSettingsStartTime = Date.now()
  const settings = await Settings.findAll(ctx, {})
  const getSettingsDuration = Date.now() - getSettingsStartTime
  
  const settingsMap: Record<string, string> = {}
  settings.forEach(s => {
    settingsMap[s.key] = s.value
  })
  
  logWithData(ctx, '[debug-route]', 'Настройки получены', 'info', {
    settingsCount: settings.length,
    settingsKeys: Object.keys(settingsMap),
    getSettingsDurationMs: getSettingsDuration
  })
  
  // Получаем количество вебхуков
  Debug.info(ctx, '[debug-route] Подсчет вебхуков')
  const countWebhooksStartTime = Date.now()
  const webhooksCount = await Webhooks.countBy(ctx, {})
  const countWebhooksDuration = Date.now() - countWebhooksStartTime
  
  logWithData(ctx, '[debug-route]', 'Количество вебхуков получено', 'info', {
    webhooksCount,
    countWebhooksDurationMs: countWebhooksDuration
  })
  
  // Проверяем последний вебхук
  Debug.info(ctx, '[debug-route] Поиск последнего вебхука')
  const findLastWebhookStartTime = Date.now()
  const lastWebhook = await Webhooks.findAll(ctx, {
    order: [{ receivedAt: 'desc' }],
    limit: 1
  })
  const findLastWebhookDuration = Date.now() - findLastWebhookStartTime
  
  logWithData(ctx, '[debug-route]', 'Последний вебхук найден', 'info', {
    hasLastWebhook: lastWebhook.length > 0,
    lastWebhookId: lastWebhook[0]?.id,
    lastWebhookUpdateId: lastWebhook[0]?.updateId,
    findLastWebhookDurationMs: findLastWebhookDuration
  })
  
  // Проверяем токены
  const tokens = settingsMap.bot_tokens ? 
    settingsMap.bot_tokens.split(/[\n,]/).map(t => t.trim()).filter(t => t.length > 0) : []
  
  logWithData(ctx, '[debug-route]', 'Токены распарсены', 'info', {
    tokensCount: tokens.length,
    tokensPrefixes: tokens.map(t => t.substring(0, 10) + '...')
  })
  
  // Проверяем доступность Telegram API для каждого токена
  Debug.info(ctx, '[debug-route] Проверка доступности Telegram API для токенов')
  const tokenChecks = []
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const tokenPrefix = token.substring(0, 10) + '...'
    const checkTokenStartTime = Date.now()
    
    logWithData(ctx, '[debug-route]', `Проверка токена ${i + 1}/${tokens.length}`, 'info', {
      tokenIndex: i + 1,
      totalTokens: tokens.length,
      tokenPrefix
    })
    
    try {
      const response = await request({
        url: `https://api.telegram.org/bot${token}/getMe`,
        method: 'get',
        responseType: 'json',
        throwHttpErrors: false
      })
      
      const checkTokenDuration = Date.now() - checkTokenStartTime
      
      logWithData(ctx, '[debug-route]', `Ответ от Telegram API для токена ${i + 1}`, 'info', {
        tokenPrefix,
        statusCode: response.statusCode,
        ok: (response.body as any)?.ok,
        botName: (response.body as any)?.result?.username,
        checkTokenDurationMs: checkTokenDuration
      })
      
      tokenChecks.push({
        token: tokenPrefix,
        statusCode: response.statusCode,
        ok: (response.body as any)?.ok,
        botName: (response.body as any)?.result?.username
      })
    } catch (error: any) {
      const checkTokenDuration = Date.now() - checkTokenStartTime
      
      logWithData(ctx, '[debug-route]', `Ошибка проверки токена ${i + 1}`, 'error', {
        tokenPrefix,
        error: String(error),
        errorMessage: error.message,
        errorStack: error.stack,
        checkTokenDurationMs: checkTokenDuration
      })
      
      tokenChecks.push({
        token: tokenPrefix,
        error: String(error)
      })
    }
  }
  
  // Получаем последние логи (если доступны через account.log)
  const recentLogs: any[] = []
  try {
    // Пытаемся получить последние логи через API логирования
    const logs = await ctx.account.getLogs?.({ limit: 20 })
    if (logs) {
      recentLogs.push(...logs)
    }
  } catch (error) {
    // Логи могут быть недоступны
    Debug.warn(ctx, `[debug-route] Не удалось получить логи: ${String(error)}`)
  }
  
  const debugDuration = Date.now() - debugStartTime
  
  logWithData(ctx, '[debug-route]', 'Диагностика завершена', 'info', {
    totalDurationMs: debugDuration,
    webhooksCount,
    tokensCount: tokens.length,
    isActive: settingsMap.is_active === 'true',
    hasActiveJobTaskId: !!settingsMap.active_job_task_id
  })
  
  return {
    settings: settingsMap,
    webhooksCount,
    lastWebhook: lastWebhook[0] ? {
      id: lastWebhook[0].id,
      updateId: lastWebhook[0].updateId,
      receivedAt: lastWebhook[0].receivedAt,
      botToken: lastWebhook[0].botToken.substring(0, 10) + '...'
    } : null,
    tokensCount: tokens.length,
    tokenChecks,
    recentLogs,
    isActive: settingsMap.is_active === 'true',
    hasActiveJobTaskId: !!settingsMap.active_job_task_id,
    note: 'Проверьте логи приложения для детальной информации о выполнении джобов'
  }
})

// Роут для ручного запуска опроса (для тестирования)
export const apiManualPollRoute = app.post('/api/manual-poll', async (ctx) => {
  const logLevel = await applyDebugLevel(ctx, 'manual-poll')
  Debug.configure({ level: logLevel, prefix: '[manual-poll]' })
  
  const manualPollStartTime = Date.now()
  
  try {
    logWithData(ctx, '[manual-poll]', 'Ручной запуск опроса инициирован', 'info', {
      manual: true,
      timestamp: new Date().toISOString(),
      requestStartTime: manualPollStartTime
    })
    
    Debug.info(ctx, '[manual-poll] Получение токенов')
    const getTokensStartTime = Date.now()
    
    // Получаем токены
    const tokensSetting = await Settings.findOneBy(ctx, {
      key: 'bot_tokens'
    })
    
    const getTokensDuration = Date.now() - getTokensStartTime
    
    logWithData(ctx, '[manual-poll]', 'Результат получения токенов', 'info', {
      settingExists: !!tokensSetting,
      hasValue: !!tokensSetting?.value,
      valueLength: tokensSetting?.value?.length ?? 0,
      getTokensDurationMs: getTokensDuration
    })
    
    if (!tokensSetting || !tokensSetting.value) {
      logWithData(ctx, '[manual-poll]', 'Токены не настроены', 'warn', {
        reason: !tokensSetting ? 'настройка не найдена' : 'значение пустое'
      })
      return {
        success: false,
        error: 'Токены не настроены'
      }
    }
    
    const tokens = tokensSetting.value
      .split(/[\n,]/)
      .map(t => t.trim())
      .filter(t => t.length > 0)
    
    logWithData(ctx, '[manual-poll]', 'Токены распарсены', 'info', {
      tokensCount: tokens.length,
      tokensPrefixes: tokens.map(t => t.substring(0, 10) + '...')
    })
    
    let totalUpdates = 0
    const results = []
    
    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
      const token = tokens[tokenIndex]
      const tokenPrefix = token.substring(0, 10) + '...'
      const tokenIterationStartTime = Date.now()
      
      logWithData(ctx, '[manual-poll]', `Начало обработки токена ${tokenIndex + 1}/${tokens.length}`, 'info', {
        tokenIndex: tokenIndex + 1,
        totalTokens: tokens.length,
        tokenPrefix,
        iterationStartTime: tokenIterationStartTime
      })
      
      try {
        // Получаем последний update_id
        Debug.info(ctx, `[manual-poll:${tokenPrefix}] Поиск последнего вебхука`)
        const findLastWebhookStartTime = Date.now()
        const lastWebhook = await Webhooks.findAll(ctx, {
          where: { botToken: token },
          order: [{ updateId: 'desc' }],
          limit: 1
        })
        const findLastWebhookDuration = Date.now() - findLastWebhookStartTime
        
        const lastUpdateId = lastWebhook.length > 0 ? lastWebhook[0].updateId : 0
        
        logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'Последний вебхук найден', 'info', {
          lastUpdateId,
          hasLastWebhook: lastWebhook.length > 0,
          lastWebhookId: lastWebhook.length > 0 ? lastWebhook[0].id : null,
          findLastWebhookDurationMs: findLastWebhookDuration
        })
        
        const getUpdatesUrl = `https://api.telegram.org/bot${token}/getUpdates`
        const requestedOffset = lastUpdateId + 1
        
        logWithData(ctx, `[manual-poll:${tokenPrefix}]`, `Запрос обновлений с offset=${requestedOffset}`, 'info', {
          url: getUpdatesUrl,
          offset: requestedOffset,
          timeout: 10,
          requestStartTime: Date.now()
        })
        
        // Запрос к Telegram
        const getUpdatesStartTime = Date.now()
        const response = await request({
          url: getUpdatesUrl,
          method: 'get',
          searchParams: {
            offset: requestedOffset.toString(),
            timeout: '10'
          },
          responseType: 'json',
          throwHttpErrors: false
        })
        const getUpdatesDuration = Date.now() - getUpdatesStartTime
        
        logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'Ответ от Telegram получен', 'info', {
          statusCode: response.statusCode,
          hasBody: !!response.body,
          bodyOk: (response.body as any)?.ok,
          resultLength: (response.body as any)?.result?.length,
          durationMs: getUpdatesDuration,
          bodyPreview: response.body ? JSON.stringify(response.body).substring(0, 500) : null
        })
        
        if (response.statusCode === 200) {
          const data = response.body as { ok: boolean; result?: Array<{ update_id: number; [key: string]: any }> }
          
          logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'Парсинг ответа от Telegram', 'info', {
            hasData: !!data,
            dataOk: data?.ok,
            hasResult: !!data?.result,
            resultLength: data?.result?.length ?? 0
          })
          
          if (data.ok && data.result) {
            const saveUpdatesStartTime = Date.now()
            let savedCount = 0
            let skippedCount = 0
            
            logWithData(ctx, `[manual-poll:${tokenPrefix}]`, `Начало сохранения ${data.result.length} обновлений`, 'info', {
              updatesCount: data.result.length,
              updateIds: data.result.map((u: any) => u.update_id)
            })
            
            for (let updateIndex = 0; updateIndex < data.result.length; updateIndex++) {
              const update = data.result[updateIndex]
              
              logWithData(ctx, `[manual-poll:${tokenPrefix}]`, `Обработка обновления ${updateIndex + 1}/${data.result.length}`, 'info', {
                updateIndex: updateIndex + 1,
                totalUpdates: data.result.length,
                updateId: update.update_id,
                updateType: Object.keys(update).filter(k => k !== 'update_id')[0] || 'unknown'
              })
              
              const existing = await Webhooks.findAll(ctx, {
                where: {
                  botToken: token,
                  updateId: update.update_id
                },
                limit: 1
              })
              
              if (existing.length === 0) {
                const receivedAt = new Date()
                const webhook = await Webhooks.create(ctx, {
                  botToken: token,
                  updateId: update.update_id,
                  data: update,
                  receivedAt: receivedAt
                })
                totalUpdates++
                savedCount++
                
                logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'Вебхук сохранен', 'info', {
                  updateId: update.update_id,
                  webhookId: webhook.id,
                  receivedAt: receivedAt.toISOString()
                })
              } else {
                skippedCount++
                logWithData(ctx, `[manual-poll:${tokenPrefix}]`, `Вебхук update_id=${update.update_id} уже существует`, 'info', {
                  updateId: update.update_id,
                  existingWebhookId: existing[0].id
                })
              }
            }
            
            const saveUpdatesDuration = Date.now() - saveUpdatesStartTime
            
            logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'Итоги сохранения обновлений', 'info', {
              totalReceived: data.result.length,
              saved: savedCount,
              skipped: skippedCount,
              saveDurationMs: saveUpdatesDuration,
              tokenIterationDurationMs: Date.now() - tokenIterationStartTime
            })
            
            results.push({
              token: tokenPrefix,
              updates: data.result.length,
              saved: savedCount,
              skipped: skippedCount
            })
          } else {
            logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'API вернул не ok или нет result', 'warn', {
              dataOk: data?.ok,
              hasResult: !!data?.result,
              data: data
            })
            results.push({
              token: tokenPrefix,
              error: 'API returned not ok or no result'
            })
          }
        } else {
          logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'Ошибка HTTP при запросе', 'error', {
            statusCode: response.statusCode,
            body: response.body
          })
          results.push({
            token: tokenPrefix,
            error: `HTTP ${response.statusCode}`
          })
        }
      } catch (error: any) {
        logWithData(ctx, `[manual-poll:${tokenPrefix}]`, 'Ошибка при обработке токена', 'error', {
          error: String(error),
          errorMessage: error.message,
          errorStack: error.stack,
          tokenIterationDurationMs: Date.now() - tokenIterationStartTime
        })
        results.push({
          token: tokenPrefix,
          error: String(error)
        })
      }
    }
    
    const manualPollDuration = Date.now() - manualPollStartTime
    
    logWithData(ctx, '[manual-poll]', 'Ручной опрос завершен', 'info', {
      totalUpdates,
      resultsCount: results.length,
      totalDurationMs: manualPollDuration
    })
    
    return {
      success: true,
      message: `Опрос выполнен. Найдено обновлений: ${totalUpdates}`,
      totalUpdates,
      results
    }
  } catch (error: any) {
    logWithData(ctx, '[manual-poll]', 'Критическая ошибка ручного опроса', 'error', {
      error: String(error),
      errorMessage: error.message,
      errorStack: error.stack,
      totalDurationMs: Date.now() - manualPollStartTime
    })
    return {
      success: false,
      error: String(error)
    }
  }
})
