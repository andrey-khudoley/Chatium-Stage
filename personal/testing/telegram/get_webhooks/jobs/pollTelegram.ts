import { request } from '@app/request'
import Settings from '../tables/settings.table'
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

// Джоб для опроса Telegram API
export const pollTelegramWebhooksJob = app.job('/poll-telegram-webhooks', async (ctx, params: {
  botToken?: string
}) => {
  // Применяем уровень логирования из настроек
  const appliedLogLevel = await applyDebugLevel(ctx, 'job-start')
  // Настраиваем префикс, сохраняя текущий уровень логирования
  Debug.configure({ level: appliedLogLevel, prefix: '[poll-telegram]' })
  
  const jobStartTime = Date.now()
  const jobStartTimeISO = new Date().toISOString()
  
  logWithData(ctx, '[poll-telegram]', 'Джоб опроса Telegram запущен', 'info', { 
    params,
    timestamp: jobStartTimeISO,
    jobStartTimeMs: jobStartTime,
    appliedLogLevel
  })
  
  // Проверяем, активен ли опрос
  Debug.info(ctx, '[poll-telegram] Проверка статуса опроса')
  const checkActiveStartTime = Date.now()
  
  const isActiveSetting = await Settings.findOneBy(ctx, {
    key: 'is_active'
  })
  
  logWithData(ctx, '[poll-telegram]', 'Результат проверки статуса опроса', 'info', {
    settingExists: !!isActiveSetting,
    settingId: isActiveSetting?.id,
    settingValue: isActiveSetting?.value,
    settingKey: isActiveSetting?.key,
    checkDurationMs: Date.now() - checkActiveStartTime
  })
  
  if (!isActiveSetting || isActiveSetting.value !== 'true') {
    logWithData(ctx, '[poll-telegram]', 'Опрос Telegram выключен, джоб завершен', 'info', { 
      isActive: isActiveSetting?.value,
      settingExists: !!isActiveSetting,
      reason: !isActiveSetting ? 'настройка не найдена' : 'настройка выключена',
      jobDurationMs: Date.now() - jobStartTime
    })
    return
  }
  
  Debug.info(ctx, '[poll-telegram] Опрос активен, получение токенов')
  const getTokensStartTime = Date.now()
  
  // Получаем токены
  const tokensSetting = await Settings.findOneBy(ctx, {
    key: 'bot_tokens'
  })
  
  logWithData(ctx, '[poll-telegram]', 'Результат получения токенов', 'info', {
    settingExists: !!tokensSetting,
    settingId: tokensSetting?.id,
    hasValue: !!tokensSetting?.value,
    valueLength: tokensSetting?.value?.length ?? 0,
    getTokensDurationMs: Date.now() - getTokensStartTime
  })
  
  if (!tokensSetting || !tokensSetting.value) {
    logWithData(ctx, '[poll-telegram]', 'Токены не настроены', 'warn', {
      settingExists: !!tokensSetting,
      hasValue: !!tokensSetting?.value,
      reason: !tokensSetting ? 'настройка не найдена' : 'значение пустое',
      jobDurationMs: Date.now() - jobStartTime
    })
    return
  }
  
  // Парсим токены (разделены переносами строк или запятыми)
  const parseTokensStartTime = Date.now()
  const rawTokensValue = tokensSetting.value
  const tokens = rawTokensValue
    .split(/[\n,]/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
  
  // Если передан конкретный токен, опрашиваем только его
  const tokensToPoll = params.botToken ? [params.botToken] : tokens
  
  logWithData(ctx, '[poll-telegram]', 'Токены получены и распарсены', 'info', {
    rawValueLength: rawTokensValue.length,
    rawValuePreview: rawTokensValue.substring(0, 100) + (rawTokensValue.length > 100 ? '...' : ''),
    totalTokens: tokens.length,
    tokensToPoll: tokensToPoll.length,
    hasSpecificToken: !!params.botToken,
    specificTokenProvided: params.botToken ? params.botToken.substring(0, 10) + '...' : null,
    parseDurationMs: Date.now() - parseTokensStartTime,
    tokenPrefixes: tokensToPoll.map(t => t.substring(0, 10) + '...')
  })
  
  logWithData(ctx, '[poll-telegram]', 'Начало опроса токенов', 'info', {
    tokensCount: tokensToPoll.length,
    tokens: tokensToPoll.map(t => t.substring(0, 10) + '...'),
    iterationStartTime: Date.now(),
    iterationStartTimeISO: new Date().toISOString()
  })
  
  for (let tokenIndex = 0; tokenIndex < tokensToPoll.length; tokenIndex++) {
    const token = tokensToPoll[tokenIndex]
    const tokenPrefix = token.substring(0, 10) + '...'
    const tokenIterationStartTime = Date.now()
    
    logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, `Начало обработки токена (${tokenIndex + 1}/${tokensToPoll.length})`, 'info', {
      tokenIndex: tokenIndex + 1,
      totalTokens: tokensToPoll.length,
      tokenLength: token.length,
      tokenPrefix,
      iterationStartTime: tokenIterationStartTime,
      iterationStartTimeISO: new Date().toISOString()
    })
    
    try {
      Debug.info(ctx, `[poll-telegram:${tokenPrefix}] Поиск последнего вебхука в БД`)
      const findLastWebhookStartTime = Date.now()
      
      // Получаем последний обработанный update_id для этого токена
      const lastWebhook = await Webhooks.findAll(ctx, {
        where: {
          botToken: token
        },
        order: [{ updateId: 'desc' }],
        limit: 1
      })
      
      const findLastWebhookDuration = Date.now() - findLastWebhookStartTime
      
      const countWebhooksStartTime = Date.now()
      const totalWebhooksForToken = await Webhooks.countBy(ctx, {
        botToken: token
      })
      const countWebhooksDuration = Date.now() - countWebhooksStartTime
      
      const lastUpdateId = lastWebhook.length > 0 ? lastWebhook[0].updateId : 0
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Статистика по токену', 'info', {
        lastUpdateId,
        totalWebhooksInDb: totalWebhooksForToken,
        hasLastWebhook: lastWebhook.length > 0,
        lastWebhookId: lastWebhook.length > 0 ? lastWebhook[0].id : null,
        lastWebhookReceivedAt: lastWebhook.length > 0 ? lastWebhook[0].receivedAt : null,
        findLastWebhookDurationMs: findLastWebhookDuration,
        countWebhooksDurationMs: countWebhooksDuration,
        queryDetails: {
          whereCondition: { botToken: token },
          orderBy: [{ updateId: 'desc' }],
          limit: 1
        }
      })
      
      // Удаляем webhook только если это первый запуск (нет сохраненных вебхуков)
      // Это нужно для переключения с webhook на polling режим
      // Если вебхуки уже есть, значит мы уже в polling режиме и webhook не установлен
      if (totalWebhooksForToken === 0) {
        Debug.info(ctx, `[poll-telegram:${tokenPrefix}] Первый запуск для токена, удаление webhook`)
        const deleteWebhookStartTime = Date.now()
        const deleteWebhookUrl = `https://api.telegram.org/bot${token}/deleteWebhook`
        
        try {
          const deleteWebhookResponse = await request({
            url: deleteWebhookUrl,
            method: 'post',
            searchParams: {
              drop_pending_updates: 'false'  // НЕ удаляем ожидающие обновления, чтобы не потерять их
            },
            responseType: 'json',
            throwHttpErrors: false
          })
          
          const deleteWebhookDuration = Date.now() - deleteWebhookStartTime
          
          if (deleteWebhookResponse.statusCode === 200 && deleteWebhookResponse.body?.ok) {
            logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Webhook удален при первом запуске', 'info', {
              response: deleteWebhookResponse.body,
              durationMs: deleteWebhookDuration
            })
          } else {
            logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Webhook не был установлен (это нормально)', 'info', {
              response: deleteWebhookResponse.body,
              durationMs: deleteWebhookDuration
            })
          }
        } catch (error: any) {
          logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Ошибка при удалении webhook (продолжаем)', 'warn', {
            error: String(error),
            errorMessage: error.message
          })
        }
      } else {
        Debug.info(ctx, `[poll-telegram:${tokenPrefix}] Webhook уже удален ранее, пропускаем удаление`)
      }
      
      const getUpdatesUrl = `https://api.telegram.org/bot${token}/getUpdates`
      const requestedOffset = lastUpdateId + 1
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, `Запрос обновлений с offset=${requestedOffset}`, 'info', {
        offset: requestedOffset,
        timeout: 10,
        url: getUpdatesUrl,
        method: 'GET',
        searchParams: {
          offset: requestedOffset.toString(),
          timeout: '10'
        },
        requestStartTime: Date.now()
      })
      
      // Запрашиваем обновления
      const getUpdatesStartTime = Date.now()
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Выполнение запроса getUpdates к Telegram API', 'info', {
        url: getUpdatesUrl,
        offset: requestedOffset,
        timeout: 10,
        requestStartTime: getUpdatesStartTime,
        requestStartTimeISO: new Date().toISOString()
      })
      
      let response: any
      try {
        response = await request({
          url: getUpdatesUrl,
          method: 'get',
          searchParams: {
            offset: requestedOffset.toString(),
            timeout: '10'
          },
          responseType: 'json',
          throwHttpErrors: false
        })
      } catch (requestError: any) {
        logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Ошибка при выполнении запроса getUpdates', 'error', {
          error: String(requestError),
          errorMessage: requestError?.message,
          errorStack: requestError?.stack,
          errorName: requestError?.name,
          requestUrl: getUpdatesUrl,
          requestedOffset
        })
        continue
      }
      
      const getUpdatesDuration = Date.now() - getUpdatesStartTime
      
      if (!response) {
        logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Ответ от Telegram API отсутствует (response is null/undefined)', 'error', {
          requestUrl: getUpdatesUrl,
          requestedOffset,
          durationMs: getUpdatesDuration
        })
        continue
      }
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Ответ от Telegram API получен', 'info', {
        statusCode: response?.statusCode,
        hasResponse: !!response,
        hasBody: !!response?.body,
        bodyKeys: response?.body ? Object.keys(response.body) : [],
        bodyPreview: response?.body ? JSON.stringify(response.body).substring(0, 500) : null,
        bodyFull: response?.body,
        durationMs: getUpdatesDuration,
        requestUrl: getUpdatesUrl,
        requestedOffset,
        responseHeaders: response?.headers ? Object.keys(response.headers) : [],
        responseSize: response?.body ? JSON.stringify(response.body).length : 0
      })
      
      if (!response.statusCode || response.statusCode !== 200) {
        // Обработка ошибки 409 - webhook все еще активен
        if (response.statusCode === 409) {
          logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Webhook все еще активен для токена, пропускаем', 'warn', {
            token: tokenPrefix,
            error: response.body?.description || 'Webhook активен'
          })
        } else {
          logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Ошибка при запросе обновлений Telegram', 'error', {
            token: tokenPrefix,
            statusCode: response.statusCode,
            body: response.body
          })
        }
        continue
      }
      
      const data = response.body as { ok: boolean; result?: Array<{ update_id: number; [key: string]: any }> }
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Парсинг ответа от Telegram API', 'info', {
        hasData: !!data,
        dataOk: data?.ok,
        hasResult: !!data?.result,
        resultLength: data?.result?.length ?? 0,
        resultType: Array.isArray(data?.result) ? 'array' : typeof data?.result
      })
      
      if (!data) {
        logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Пустой ответ от Telegram API', 'warn', { token: tokenPrefix })
        continue
      }
      
      if (!data.ok) {
        logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Telegram API вернул ошибку', 'warn', { token: tokenPrefix, data })
        continue
      }
      
      if (!data.result) {
        logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Нет поля result в ответе Telegram API', 'warn', { 
          data,
          dataKeys: data ? Object.keys(data) : []
        })
        continue
      }
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Получен ответ от Telegram API', 'info', {
        updatesCount: data.result.length,
        updateIds: data.result.map((u: any) => u.update_id),
        firstUpdateId: data.result.length > 0 ? data.result[0].update_id : null,
        lastUpdateId: data.result.length > 0 ? data.result[data.result.length - 1].update_id : null
      })
      
      if (data.result.length === 0) {
        logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Обновлений нет (пустой result)', 'info', {
          lastUpdateIdInDb: lastUpdateId,
          requestedOffset: lastUpdateId + 1
        })
        continue
      }
      
      // Сохраняем каждое обновление
      let savedCount = 0
      let skippedCount = 0
      let errorCount = 0
      let maxSavedUpdateId = lastUpdateId
      const saveUpdatesStartTime = Date.now()
      
      Debug.info(ctx, `[poll-telegram:${tokenPrefix}] Начало сохранения ${data.result.length} обновлений`)
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Детали обновлений для сохранения', 'info', {
        updatesCount: data.result.length,
        updateIds: data.result.map((u: any) => u.update_id),
        updateTypes: data.result.map((u: any) => Object.keys(u).filter(k => k !== 'update_id')[0] || 'unknown'),
        saveStartTime: saveUpdatesStartTime
      })
      
      for (let updateIndex = 0; updateIndex < data.result.length; updateIndex++) {
        const update = data.result[updateIndex]
        const updateProcessStartTime = Date.now()
        
        logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, `Обработка обновления ${updateIndex + 1}/${data.result.length}`, 'info', {
          updateIndex: updateIndex + 1,
          totalUpdates: data.result.length,
          updateId: update.update_id,
          updateType: Object.keys(update).filter(k => k !== 'update_id')[0] || 'unknown',
          updateKeys: Object.keys(update),
          updatePreview: JSON.stringify(update).substring(0, 200)
        })
        
        try {
          // Проверяем, не существует ли уже такой вебхук
          const checkExistingStartTime = Date.now()
          const existing = await Webhooks.findAll(ctx, {
            where: {
              botToken: token,
              updateId: update.update_id
            },
            limit: 1
          })
          const checkExistingDuration = Date.now() - checkExistingStartTime
          
          logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, `Проверка существования вебхука update_id=${update.update_id}`, 'info', {
            updateId: update.update_id,
            existingFound: existing.length > 0,
            existingId: existing.length > 0 ? existing[0].id : null,
            checkDurationMs: checkExistingDuration
          })
          
          if (existing.length > 0) {
            skippedCount++
            logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, `Вебхук update_id=${update.update_id} уже существует, пропускаем`, 'info', {
              existingWebhookId: existing[0].id,
              updateId: update.update_id,
              existingReceivedAt: existing[0].receivedAt,
              processDurationMs: Date.now() - updateProcessStartTime
            })
            continue
          }
          
          const createWebhookStartTime = Date.now()
          const receivedAt = new Date()
          const webhook = await Webhooks.create(ctx, {
            botToken: token,
            updateId: update.update_id,
            data: update,
            receivedAt: receivedAt
          })
          const createWebhookDuration = Date.now() - createWebhookStartTime
          
          savedCount++
          if (update.update_id > maxSavedUpdateId) {
            maxSavedUpdateId = update.update_id
          }
          
          logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Вебхук сохранен', 'info', {
            updateId: update.update_id,
            webhookId: webhook.id,
            updateType: Object.keys(update).filter(k => k !== 'update_id')[0] || 'unknown',
            receivedAt: receivedAt.toISOString(),
            createDurationMs: createWebhookDuration,
            processDurationMs: Date.now() - updateProcessStartTime,
            dataSize: JSON.stringify(update).length
          })
        } catch (error: any) {
          errorCount++
          logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Ошибка при сохранении вебхука', 'error', {
            updateId: update.update_id,
            updateIndex: updateIndex + 1,
            error: String(error),
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
            updateKeys: Object.keys(update),
            processDurationMs: Date.now() - updateProcessStartTime
          })
        }
      }
      
      const saveUpdatesDuration = Date.now() - saveUpdatesStartTime
      
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Итоги обработки обновлений', 'info', {
        totalReceived: data.result.length,
        saved: savedCount,
        skipped: skippedCount,
        errors: errorCount,
        previousLastUpdateId: lastUpdateId,
        newLastUpdateId: maxSavedUpdateId,
        progress: savedCount > 0 ? `+${savedCount} новых вебхуков` : 'нет новых',
        saveDurationMs: saveUpdatesDuration,
        avgTimePerUpdate: data.result.length > 0 ? Math.round(saveUpdatesDuration / data.result.length) : 0,
        tokenIterationDurationMs: Date.now() - tokenIterationStartTime
      })
    } catch (error: any) {
      logWithData(ctx, `[poll-telegram:${tokenPrefix}]`, 'Критическая ошибка при опросе токена', 'error', {
        error: String(error),
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        tokenIndex: tokenIndex + 1,
        totalTokens: tokensToPoll.length,
        tokenIterationDurationMs: Date.now() - tokenIterationStartTime
      })
    }
  }
  
  logWithData(ctx, '[poll-telegram]', 'Завершение опроса всех токенов', 'info', {
    processedTokens: tokensToPoll.length
  })
  
  // Планируем следующий опрос через 15 секунд
  const jobDuration = Date.now() - jobStartTime
  
  logWithData(ctx, '[poll-telegram]', 'Проверка статуса для планирования следующего опроса', 'info', {
    jobDurationMs: jobDuration
  })
  
  const isActive = await Settings.findOneBy(ctx, {
    key: 'is_active'
  })
  
  if (isActive && isActive.value === 'true') {
    try {
      Debug.info(ctx, '[poll-telegram] Планирование следующего опроса через 15 секунд')
      
      const nextTaskId = await pollTelegramWebhooksJob.scheduleJobAfter(ctx, 15, 'seconds', {})
      
      // Обновляем taskId активного джоба
      await Settings.createOrUpdateBy(ctx, 'key', {
        key: 'active_job_task_id',
        value: String(nextTaskId)
      })
      
      logWithData(ctx, '[poll-telegram]', 'Следующий опрос успешно запланирован', 'info', { 
        nextTaskId,
        nextRunIn: '15 секунд',
        currentTime: new Date().toISOString()
      })
    } catch (error: any) {
      logWithData(ctx, '[poll-telegram]', 'Ошибка планирования следующего опроса', 'error', { 
        error: String(error),
        errorMessage: error.message,
        errorStack: error.stack
      })
      
      // Очищаем taskId при ошибке
      const activeJobSetting = await Settings.findOneBy(ctx, {
        key: 'active_job_task_id'
      })
      if (activeJobSetting) {
        await Settings.delete(ctx, activeJobSetting.id)
        Debug.info(ctx, '[poll-telegram] active_job_task_id очищен из-за ошибки')
      }
    }
  } else {
    // Очищаем taskId при остановке
    logWithData(ctx, '[poll-telegram]', 'Опрос остановлен, очистка active_job_task_id', 'info', {
      isActive: isActive?.value
    })
    
    const activeJobSetting = await Settings.findOneBy(ctx, {
      key: 'active_job_task_id'
    })
    if (activeJobSetting) {
      await Settings.delete(ctx, activeJobSetting.id)
      Debug.info(ctx, '[poll-telegram] active_job_task_id удален')
    }
    
    logWithData(ctx, '[poll-telegram]', 'Опрос Telegram остановлен, следующий опрос не планируется', 'info', {
      jobDurationMs: jobDuration
    })
  }
  
  logWithData(ctx, '[poll-telegram]', 'Джоб завершен', 'info', {
    totalDurationMs: Date.now() - jobStartTime,
    timestamp: new Date().toISOString()
  })
})

