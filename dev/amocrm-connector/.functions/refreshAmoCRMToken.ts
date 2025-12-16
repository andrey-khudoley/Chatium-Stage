// @shared-route
import { request } from "@app/request"
import SettingsTable from '../tables/settings.table'

// Ключи для хранения OAuth данных
const SETTINGS_KEYS = {
  SUBDOMAIN: 'amocrm_subdomain',
  CLIENT_ID: 'amocrm_client_id',
  CLIENT_SECRET: 'amocrm_client_secret',
  REDIRECT_URI: 'amocrm_redirect_uri',
  ACCESS_TOKEN: 'amocrm_access_token',
  REFRESH_TOKEN: 'amocrm_refresh_token',
  EXPIRES_AT: 'amocrm_expires_at',
  STATUS: 'amocrm_status',
  REFRESH_TASK_ID: 'amocrm_refresh_task_id',
  NEXT_REFRESH_AT: 'amocrm_next_refresh_at'
}

// Джоб для автоматического обновления токена AmoCRM
export const refreshAmoCRMTokenJob = app.job('/refresh-amocrm-token', async (ctx, params) => {
  ctx.account.log('AmoCRM: начинаем автоматическое обновление токена', {
    level: 'info',
    json: { scheduledBy: params?.scheduledBy || 'manual' }
  })

  try {
    // Получаем необходимые данные из настроек
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [
            SETTINGS_KEYS.SUBDOMAIN,
            SETTINGS_KEYS.CLIENT_ID,
            SETTINGS_KEYS.CLIENT_SECRET,
            SETTINGS_KEYS.REDIRECT_URI,
            SETTINGS_KEYS.REFRESH_TOKEN,
            SETTINGS_KEYS.STATUS
          ]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    // Проверяем, что OAuth настроен
    if (!configMap[SETTINGS_KEYS.REFRESH_TOKEN]) {
      ctx.account.log('AmoCRM: нет refresh токена для обновления', {
        level: 'warn',
        json: { status: configMap[SETTINGS_KEYS.STATUS] }
      })
      return { success: false, error: 'Нет refresh токена' }
    }
    
    // Обновляем токен через AmoCRM API
    const response = await request({
      url: `https://${configMap[SETTINGS_KEYS.SUBDOMAIN]}.amocrm.ru/oauth2/access_token`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      json: {
        client_id: configMap[SETTINGS_KEYS.CLIENT_ID],
        client_secret: configMap[SETTINGS_KEYS.CLIENT_SECRET],
        grant_type: 'refresh_token',
        refresh_token: configMap[SETTINGS_KEYS.REFRESH_TOKEN],
        redirect_uri: configMap[SETTINGS_KEYS.REDIRECT_URI]
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      // Если не удалось обновить токен, меняем статус на offline
      const statusSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.STATUS })
      if (statusSetting) {
        await SettingsTable.update(ctx, {
          id: statusSetting.id,
          value: 'offline'
        })
      }
      
      ctx.account.log('AmoCRM: ошибка автоматического обновления токена', {
        level: 'error',
        json: { 
          status: response.statusCode,
          errorBody: response.body
        }
      })
      
      return { success: false, error: 'Не удалось обновить токен' }
    }
    
    const data = response.body
    
    // Обновляем токены в базе данных
    const expiresAt = new Date(Date.now() + data.expires_in * 1000)
    
    const tokensToUpdate = [
      { key: SETTINGS_KEYS.ACCESS_TOKEN, value: data.access_token },
      { key: SETTINGS_KEYS.REFRESH_TOKEN, value: data.refresh_token },
      { key: SETTINGS_KEYS.EXPIRES_AT, value: expiresAt.toISOString() },
      { key: SETTINGS_KEYS.STATUS, value: 'active' }
    ]
    
    for (const token of tokensToUpdate) {
      const existing = await SettingsTable.findOneBy(ctx, { key: token.key })
      
      if (existing) {
        await SettingsTable.update(ctx, {
          id: existing.id,
          value: token.value
        })
      }
    }
    
    ctx.account.log('AmoCRM: токен успешно обновлён автоматически', {
      level: 'info',
      json: { 
        expiresAt: expiresAt.toISOString(),
        nextRefresh: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
      }
    })
    
    // Планируем следующее обновление через 8 часов
    if (params?.recurring !== false) {
      const nextRefreshAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
      
      // scheduleJobAfter возвращает Promise!
      const taskId = await refreshAmoCRMTokenJob.scheduleJobAfter(ctx, 8, 'hours', { 
        scheduledBy: 'auto',
        recurring: true 
      })
      
      // Логируем полученный taskId
      ctx.account.log('AmoCRM: получен taskId от scheduleJobAfter', {
        level: 'info',
        json: { 
          taskId,
          taskIdType: typeof taskId,
          taskIdString: String(taskId)
        }
      })
      
      // Проверяем taskId
      if (!taskId && taskId !== 0) {
        ctx.account.log('AmoCRM: taskId пустой, не сохраняем', {
          level: 'warn',
          json: { taskId }
        })
        return { success: true, expiresAt: expiresAt.toISOString() }
      }
      
      // Преобразуем в строку для хранения (поле value - строка)
      const taskIdForStorage = String(taskId)
      
      ctx.account.log('AmoCRM: сохраняем taskId в настройки из джоба', {
        level: 'info',
        json: { 
          originalTaskId: taskId,
          originalType: typeof taskId,
          savedValue: taskIdForStorage 
        }
      })
      
      // Сохраняем taskId и время следующего запуска
      const taskIdSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.REFRESH_TASK_ID })
      if (taskIdSetting) {
        await SettingsTable.update(ctx, {
          id: taskIdSetting.id,
          value: taskIdForStorage
        })
      } else {
        await SettingsTable.create(ctx, {
          key: SETTINGS_KEYS.REFRESH_TASK_ID,
          value: taskIdForStorage,
          description: 'Task ID для автообновления токена AmoCRM'
        })
      }
      
      const nextRefreshSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.NEXT_REFRESH_AT })
      if (nextRefreshSetting) {
        await SettingsTable.update(ctx, {
          id: nextRefreshSetting.id,
          value: nextRefreshAt.toISOString()
        })
      } else {
        await SettingsTable.create(ctx, {
          key: SETTINGS_KEYS.NEXT_REFRESH_AT,
          value: nextRefreshAt.toISOString(),
          description: 'Время следующего автообновления токена AmoCRM'
        })
      }
      
      ctx.account.log('AmoCRM: запланировано следующее обновление токена', {
        level: 'info',
        json: { nextRunIn: '8 hours', taskId: taskIdForStorage, originalTaskId: taskId, nextRefreshAt: nextRefreshAt.toISOString() }
      })
    }
    
    return { success: true, expiresAt: expiresAt.toISOString() }
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при автоматическом обновлении токена', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return { success: false, error: error.message }
  }
})

// API роут для ручного запуска обновления токена
export const apiStartTokenRefreshRoute = app.post('/start-token-refresh', async (ctx) => {
  try {
    ctx.account.log('AmoCRM: запуск автоматического обновления токенов', {
      level: 'info',
      json: { initiatedBy: 'manual' }
    })
    
    // Запускаем джоб немедленно (scheduleJobAsap возвращает Promise!)
    const taskId = await refreshAmoCRMTokenJob.scheduleJobAsap(ctx, { 
      scheduledBy: 'manual',
      recurring: true 
    })
    
    // Логируем полученный taskId для отладки
    ctx.account.log('AmoCRM: получен taskId от scheduleJobAsap', {
      level: 'info',
      json: { 
        taskId,
        taskIdType: typeof taskId,
        isNumber: typeof taskId === 'number',
        taskIdString: String(taskId)
      }
    })
    
    // Проверяем, что taskId существует
    if (!taskId && taskId !== 0) {
      ctx.account.log('AmoCRM: taskId пустой или undefined', {
        level: 'error',
        json: { taskId }
      })
      return {
        success: false,
        error: 'Не удалось получить taskId от scheduleJobAsap'
      }
    }
    
    // НЕ преобразуем в строку - сохраняем как есть (число)
    // taskId может быть числом, а при преобразовании в строку теряется формат
    
    // Время следующего запуска (джоб сам создаст следующую задачу после выполнения)
    const nextRefreshAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
    
    // Сохраняем taskId как строку (т.к. поле value имеет тип String)
    // Но при отмене преобразуем обратно в число
    const taskIdForStorage = String(taskId)
    
    const taskIdSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.REFRESH_TASK_ID })
    if (taskIdSetting) {
      await SettingsTable.update(ctx, {
        id: taskIdSetting.id,
        value: taskIdForStorage
      })
    } else {
      await SettingsTable.create(ctx, {
        key: SETTINGS_KEYS.REFRESH_TASK_ID,
        value: taskIdForStorage,
        description: 'Task ID для автообновления токена AmoCRM'
      })
    }
    
    ctx.account.log('AmoCRM: taskId сохранён в настройки', {
      level: 'info',
      json: { 
        originalTaskId: taskId,
        originalType: typeof taskId,
        savedValue: taskIdForStorage 
      }
    })
    
    // Сохраняем время следующего запуска
    const nextRefreshSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.NEXT_REFRESH_AT })
    if (nextRefreshSetting) {
      await SettingsTable.update(ctx, {
        id: nextRefreshSetting.id,
        value: nextRefreshAt.toISOString()
      })
    } else {
      await SettingsTable.create(ctx, {
        key: SETTINGS_KEYS.NEXT_REFRESH_AT,
        value: nextRefreshAt.toISOString(),
        description: 'Время следующего автообновления токена AmoCRM'
      })
    }
    
    ctx.account.log('AmoCRM: автообновление успешно запущено', {
      level: 'info',
      json: { taskId: taskIdForStorage, originalTaskId: taskId, nextRefreshAt: nextRefreshAt.toISOString() }
    })
    
    return { 
      success: true, 
      taskId: taskIdForStorage,  // Возвращаем строковое представление для отображения
      nextRefreshAt: nextRefreshAt.toISOString(),
      message: 'Автоматическое обновление токенов запущено. Следующее обновление через 8 часов.' 
    }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при запуске автообновления', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return {
      success: false,
      error: `Ошибка при запуске: ${error.message}`
    }
  }
})

// API роут для получения детальной информации о сохранённом taskId (для отладки)
export const apiGetTaskIdDebugRoute = app.get('/debug-task-id', async (ctx) => {
  try {
    const taskIdSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.REFRESH_TASK_ID })
    const nextRefreshSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.NEXT_REFRESH_AT })
    
    return {
      success: true,
      taskIdSetting: taskIdSetting ? {
        id: taskIdSetting.id,
        value: taskIdSetting.value,
        valueType: typeof taskIdSetting.value,
        valueLength: taskIdSetting.value?.length,
        isValidFormat: taskIdSetting.value && !taskIdSetting.value.includes('[object Promise]')
      } : null,
      nextRefreshSetting: nextRefreshSetting ? {
        value: nextRefreshSetting.value
      } : null
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

export const apiCancelTokenRefreshRoute = app.post('/cancel-token-refresh', async (ctx) => {
  try {
    ctx.account.log('AmoCRM: отмена автоматического обновления токенов', {
      level: 'info',
      json: { initiatedBy: 'manual' }
    })
    
    // Получаем taskId из настроек
    const taskIdSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.REFRESH_TASK_ID })
    
    if (!taskIdSetting || !taskIdSetting.value) {
      return { 
        success: false, 
        error: 'Автоматическое обновление не запущено или taskId не найден' 
      }
    }
    
    const taskIdString = taskIdSetting.value
    
    // Проверяем, что taskId корректный (не содержит "[object Promise]")
    const isValidTaskId = taskIdString && !taskIdString.includes('[object Promise]') && taskIdString !== 'undefined'
    
    // Преобразуем строку обратно в число (если это число)
    let taskIdForCancel = taskIdString
    if (isValidTaskId && /^\d+$/.test(taskIdString)) {
      // Если это строка из цифр, преобразуем в число
      taskIdForCancel = parseInt(taskIdString, 10)
    }
    
    ctx.account.log('AmoCRM: проверка taskId перед отменой', {
      level: 'info',
      json: { 
        taskIdString, 
        taskIdForCancel,
        taskIdForCancelType: typeof taskIdForCancel,
        isValidTaskId 
      }
    })
    
    // Если taskId корректный, пытаемся отменить задачу
    let cancelSuccess = false
    let cancelErrorMessage = null
    
    if (isValidTaskId) {
      try {
        const { cancelScheduledJob } = await import('@app/jobs')
        
        ctx.account.log('AmoCRM: вызываем cancelScheduledJob', {
          level: 'info',
          json: { 
            taskIdForCancel, 
            taskIdType: typeof taskIdForCancel,
            isNumber: typeof taskIdForCancel === 'number'
          }
        })
        
        await cancelScheduledJob(ctx, taskIdForCancel)
        cancelSuccess = true
        
        ctx.account.log('AmoCRM: задача успешно отменена через cancelScheduledJob', {
          level: 'info',
          json: { cancelledTaskId: taskIdForCancel }
        })
      } catch (cancelError) {
        cancelErrorMessage = cancelError.message
        
        // Если не удалось отменить, это важная ошибка
        ctx.account.log('AmoCRM: ОШИБКА при отмене задачи через cancelScheduledJob', {
          level: 'error',
          json: { 
            taskIdString,
            taskIdForCancel,
            taskIdForCancelType: typeof taskIdForCancel,
            error: cancelError.message,
            stack: cancelError.stack
          }
        })
      }
    } else {
      // Если taskId некорректный, это ошибка в данных
      ctx.account.log('AmoCRM: taskId некорректный, невозможно отменить задачу', {
        level: 'error',
        json: { taskIdString, reason: 'Invalid taskId format' }
      })
      cancelErrorMessage = `Некорректный формат taskId: ${taskIdString}`
    }
    
    // В любом случае удаляем записи из настроек (очистка)
    await SettingsTable.delete(ctx, taskIdSetting.id)
    
    const nextRefreshSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.NEXT_REFRESH_AT })
    if (nextRefreshSetting) {
      await SettingsTable.delete(ctx, nextRefreshSetting.id)
    }
    
    ctx.account.log('AmoCRM: автоматическое обновление токенов - завершение операции', {
      level: 'info',
      json: { 
        wasValidTaskId: isValidTaskId,
        cancelSuccess,
        cancelErrorMessage 
      }
    })
    
    // Возвращаем результат в зависимости от успешности отмены
    if (cancelSuccess) {
      return { 
        success: true, 
        message: 'Автоматическое обновление токенов успешно отменено' 
      }
    } else if (cancelErrorMessage) {
      return {
        success: false,
        error: `Не удалось отменить задачу: ${cancelErrorMessage}. Настройки очищены, но задача может остаться в планировщике.`
      }
    } else {
      return {
        success: true,
        message: 'Настройки автообновления очищены (задача не была запланирована)'
      }
    }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при отмене автообновления токенов', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { 
      success: false, 
      error: `Ошибка при отмене: ${error.message}` 
    }
  }
})

