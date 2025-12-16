import { requireAnyUser } from '@app/auth'
import { cancelScheduledJob } from '@app/jobs'
import Settings from '../tables/settings.table'
import { pollTelegramWebhooksJob } from '../jobs/pollTelegram'
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

// Получение всех настроек
export const apiGetSettingsRoute = app.get('/api/settings', async (ctx) => {
  requireAnyUser(ctx)
  const logLevel = await applyDebugLevel(ctx, 'get-settings')
  Debug.configure({ level: logLevel, prefix: '[get-settings]' })
  
  Debug.info(ctx, '[get-settings] Запрос получения настроек')
  const getSettingsStartTime = Date.now()
  
  const settings = await Settings.findAll(ctx, {
    where: {}
  })
  
  const settingsMap: Record<string, string> = {}
  settings.forEach(setting => {
    settingsMap[setting.key] = setting.value
  })
  
  const getSettingsDuration = Date.now() - getSettingsStartTime
  
  logWithData(ctx, '[get-settings]', 'Настройки получены', 'info', {
    settingsCount: settings.length,
    settingsKeys: Object.keys(settingsMap),
    getSettingsDurationMs: getSettingsDuration
  })
  
  return {
    success: true,
    settings: settingsMap
  }
})

// Сохранение настроек
export const apiSaveSettingsRoute = app.body(s => ({
  tokens: s.string(),
  isActive: s.boolean().optional(),
  logLevel: s.string().optional()
})).post('/api/settings', async (ctx, req) => {
  requireAnyUser(ctx)
  const appliedLogLevel = await applyDebugLevel(ctx, 'save-settings')
  Debug.configure({ level: appliedLogLevel, prefix: '[save-settings]' })
  
  const saveSettingsStartTime = Date.now()
  
  logWithData(ctx, '[save-settings]', 'Запрос сохранения настроек', 'info', {
    hasTokens: req.body.tokens !== undefined,
    hasIsActive: req.body.isActive !== undefined,
    hasLogLevel: req.body.logLevel !== undefined,
    isActiveValue: req.body.isActive,
    logLevelValue: req.body.logLevel,
    timestamp: new Date().toISOString()
  })
  
  const { tokens, isActive, logLevel } = req.body
  
  // Сохраняем токены
  if (tokens !== undefined) {
    Debug.info(ctx, '[save-settings] Сохранение токенов')
    const saveTokensStartTime = Date.now()
    
    await Settings.createOrUpdateBy(ctx, 'key', {
      key: 'bot_tokens',
      value: tokens
    })
    
    const saveTokensDuration = Date.now() - saveTokensStartTime
    
    logWithData(ctx, '[save-settings]', 'Токены сохранены', 'info', {
      tokensLength: tokens.length,
      tokensPreview: tokens.substring(0, 100) + (tokens.length > 100 ? '...' : ''),
      saveTokensDurationMs: saveTokensDuration
    })
  }
  
  // Сохраняем статус активности
  if (isActive !== undefined) {
    await Settings.createOrUpdateBy(ctx, 'key', {
      key: 'is_active',
      value: isActive ? 'true' : 'false'
    })
    
    // Если включили опрос, проверяем, не запущен ли уже джоб
    if (isActive) {
      Debug.info(ctx, '[save-settings] Включение опроса, проверка существующего джоба')
      const checkJobStartTime = Date.now()
      
      // Проверяем, есть ли уже активный джоб
      const activeJobSetting = await Settings.findOneBy(ctx, {
        key: 'active_job_task_id'
      })
      
      const checkJobDuration = Date.now() - checkJobStartTime
      
      logWithData(ctx, '[save-settings]', 'Результат проверки активного джоба', 'info', {
        activeJobSettingExists: !!activeJobSetting,
        activeJobSettingId: activeJobSetting?.id,
        activeJobSettingValue: activeJobSetting?.value,
        hasValue: !!(activeJobSetting?.value),
        valueLength: activeJobSetting?.value?.length ?? 0,
        checkJobDurationMs: checkJobDuration
      })
      
      if (activeJobSetting && activeJobSetting.value && activeJobSetting.value.trim().length > 0) {
        logWithData(ctx, '[save-settings]', 'Джоб опроса уже запущен, пропускаем повторный запуск', 'info', {
          existingTaskId: activeJobSetting.value,
          existingTaskIdType: typeof activeJobSetting.value
        })
      } else {
        try {
          Debug.info(ctx, '[save-settings] Запуск нового джоба опроса')
          logWithData(ctx, '[save-settings]', 'Попытка запуска джоба через scheduleJobAsap', 'info', {
            jobName: 'pollTelegramWebhooksJob',
            jobPath: '/poll-telegram-webhooks',
            params: {},
            timestamp: new Date().toISOString()
          })
          
          const scheduleJobStartTime = Date.now()
          const taskId = await pollTelegramWebhooksJob.scheduleJobAsap(ctx, {})
          const scheduleJobDuration = Date.now() - scheduleJobStartTime
          
          logWithData(ctx, '[save-settings]', 'Джоб запланирован, получен taskId', 'info', {
            taskId,
            taskIdType: typeof taskId,
            taskIdString: String(taskId),
            isNumber: typeof taskId === 'number',
            isString: typeof taskId === 'string',
            scheduleJobDurationMs: scheduleJobDuration
          })
          
          // Проверяем, что taskId валидный
          if (taskId === null || taskId === undefined || (typeof taskId === 'string' && taskId.trim().length === 0)) {
            logWithData(ctx, '[save-settings]', 'Получен невалидный taskId', 'error', {
              taskId,
              taskIdType: typeof taskId
            })
            return {
              success: false,
              error: 'Не удалось получить валидный taskId от scheduleJobAsap'
            }
          }
          
          // Сохраняем taskId активного джоба
          const saveTaskIdStartTime = Date.now()
          await Settings.createOrUpdateBy(ctx, 'key', {
            key: 'active_job_task_id',
            value: String(taskId)
          })
          const saveTaskIdDuration = Date.now() - saveTaskIdStartTime
          
          logWithData(ctx, '[save-settings]', 'Джоб опроса Telegram успешно запущен и taskId сохранен', 'info', {
            taskId,
            taskIdString: String(taskId),
            saveTaskIdDurationMs: saveTaskIdDuration,
            totalDurationMs: Date.now() - saveSettingsStartTime
          })
        } catch (error: any) {
          logWithData(ctx, '[save-settings]', 'Ошибка запуска джоба опроса', 'error', {
            error: String(error),
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
            errorType: typeof error
          })
          return {
            success: false,
            error: 'Ошибка запуска джоба: ' + String(error)
          }
        }
      }
    } else {
      // При отключении отменяем запланированный джоб и очищаем taskId
      Debug.info(ctx, '[save-settings] Отключение опроса, отмена запланированного джоба')
      const stopPollingStartTime = Date.now()
      
      const activeJobSetting = await Settings.findOneBy(ctx, {
        key: 'active_job_task_id'
      })
      
      if (activeJobSetting && activeJobSetting.value) {
        const taskIdString = activeJobSetting.value.trim()
        
        logWithData(ctx, '[save-settings]', 'Найден активный джоб для отмены', 'info', {
          taskIdString,
          taskIdLength: taskIdString.length
        })
        
        // Пытаемся отменить запланированный джоб
        if (taskIdString.length > 0) {
          try {
            const taskId = parseInt(taskIdString, 10)
            
            if (!isNaN(taskId)) {
              logWithData(ctx, '[save-settings]', 'Попытка отмены джоба', 'info', {
                taskId,
                taskIdType: typeof taskId
              })
              
              await cancelScheduledJob(ctx, taskId)
              
              logWithData(ctx, '[save-settings]', 'Джоб успешно отменен', 'info', {
                cancelledTaskId: taskId,
                cancelDurationMs: Date.now() - stopPollingStartTime
              })
            } else {
              logWithData(ctx, '[save-settings]', 'Некорректный формат taskId, пропускаем отмену', 'warn', {
                taskIdString
              })
            }
          } catch (cancelError: any) {
            logWithData(ctx, '[save-settings]', 'Ошибка при отмене джоба (продолжаем)', 'warn', {
              error: String(cancelError),
              errorMessage: cancelError?.message,
              errorStack: cancelError?.stack,
              taskIdString
            })
          }
        }
        
        // Удаляем taskId из настроек в любом случае
        await Settings.delete(ctx, activeJobSetting.id)
        logWithData(ctx, '[save-settings]', 'active_job_task_id удален из настроек', 'info', {
          deletedId: activeJobSetting.id,
          totalStopDurationMs: Date.now() - stopPollingStartTime
        })
      } else {
        logWithData(ctx, '[save-settings]', 'Активный джоб не найден в настройках', 'info', {
          settingExists: !!activeJobSetting,
          hasValue: !!(activeJobSetting?.value)
        })
      }
      
      Debug.info(ctx, '[save-settings] Опрос Telegram отключен')
    }
  }
  
  // Сохраняем уровень логирования
  if (logLevel !== undefined) {
    const validLevels = ['info', 'warn', 'error']
    if (validLevels.includes(logLevel)) {
      Debug.info(ctx, '[save-settings] Сохранение уровня логирования')
      const saveLogLevelStartTime = Date.now()
      
      await Settings.createOrUpdateBy(ctx, 'key', {
        key: 'log_level',
        value: logLevel
      })
      
      const saveLogLevelDuration = Date.now() - saveLogLevelStartTime
      
      logWithData(ctx, '[save-settings]', 'Уровень логирования сохранен', 'info', {
        logLevel,
        saveLogLevelDurationMs: saveLogLevelDuration
      })
    } else {
      logWithData(ctx, '[save-settings]', 'Недопустимый уровень логирования', 'warn', {
        logLevel,
        validLevels
      })
    }
  }
  
  const saveSettingsDuration = Date.now() - saveSettingsStartTime
  
  logWithData(ctx, '[save-settings]', 'Настройки успешно сохранены', 'info', {
    totalDurationMs: saveSettingsDuration
  })
  
  return {
    success: true
  }
})

