// @shared-route
import { request } from "@app/request"
import SettingsTable from '../tables/settings.table'
import WebhookEventsTable from '../tables/webhook-events.table'

// Ключи для хранения OAuth данных в таблице настроек
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

// Получение настроек OAuth
export const apiGetOAuthConfigRoute = app.get('/oauth/config', async (ctx) => {
  try {
    const settings = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [
            SETTINGS_KEYS.SUBDOMAIN,
            SETTINGS_KEYS.CLIENT_ID,
            SETTINGS_KEYS.CLIENT_SECRET,
            SETTINGS_KEYS.REDIRECT_URI
          ]
        }
      }
    })
    
    const config = {
      subdomain: '',
      clientId: '',
      clientSecret: '',
      redirectUri: ''
    }
    
    settings.forEach(setting => {
      if (setting.key === SETTINGS_KEYS.SUBDOMAIN) config.subdomain = setting.value
      if (setting.key === SETTINGS_KEYS.CLIENT_ID) config.clientId = setting.value
      if (setting.key === SETTINGS_KEYS.CLIENT_SECRET) config.clientSecret = setting.value
      if (setting.key === SETTINGS_KEYS.REDIRECT_URI) config.redirectUri = setting.value
    })
    
    return { success: true, config }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при получении OAuth конфигурации', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: 'Ошибка при получении настроек' }
  }
})

// Сохранение настроек OAuth
export const apiSaveOAuthConfigRoute = app.post('/oauth/config', async (ctx, req) => {
  const { subdomain, clientId, clientSecret, redirectUri } = req.body
  
  if (!subdomain || !clientId || !clientSecret || !redirectUri) {
    return { success: false, error: 'Необходимо заполнить все поля' }
  }
  
  try {
    const settingsToSave = [
      { key: SETTINGS_KEYS.SUBDOMAIN, value: subdomain, description: 'AmoCRM Subdomain' },
      { key: SETTINGS_KEYS.CLIENT_ID, value: clientId, description: 'AmoCRM Client ID' },
      { key: SETTINGS_KEYS.CLIENT_SECRET, value: clientSecret, description: 'AmoCRM Client Secret' },
      { key: SETTINGS_KEYS.REDIRECT_URI, value: redirectUri, description: 'AmoCRM Redirect URI' }
    ]
    
    for (const setting of settingsToSave) {
      const existing = await SettingsTable.findOneBy(ctx, { key: setting.key })
      
      if (existing) {
        await SettingsTable.update(ctx, {
          id: existing.id,
          value: setting.value,
          description: setting.description
        })
      } else {
        await SettingsTable.create(ctx, {
          key: setting.key,
          value: setting.value,
          description: setting.description
        })
      }
    }
    
    return { success: true }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при сохранении OAuth конфигурации', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: 'Ошибка при сохранении настроек' }
  }
})

// Получение статуса подключения
export const apiGetOAuthStatusRoute = app.get('/oauth/status', async (ctx) => {
  try {
    const statusSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.STATUS })
    const expiresAtSetting = await SettingsTable.findOneBy(ctx, { key: SETTINGS_KEYS.EXPIRES_AT })
    
    let status = statusSetting?.value || 'offline'
    
    // Проверяем, не истек ли токен
    if (status === 'active' && expiresAtSetting?.value) {
      const expiresAt = new Date(expiresAtSetting.value)
      if (expiresAt < new Date()) {
        status = 'expired'
        // Обновляем статус
        if (statusSetting) {
          await SettingsTable.update(ctx, {
            id: statusSetting.id,
            value: 'expired'
          })
        }
      }
    }
    
    return { 
      success: true, 
      status,
      expiresAt: expiresAtSetting?.value || null
    }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при получении статуса', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: 'Ошибка при получении статуса' }
  }
})

// Генерация URL для авторизации
export const apiGetAuthUrlRoute = app.get('/oauth/auth-url', async (ctx) => {
  try {
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [SETTINGS_KEYS.SUBDOMAIN, SETTINGS_KEYS.CLIENT_ID, SETTINGS_KEYS.REDIRECT_URI]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    if (!configMap[SETTINGS_KEYS.SUBDOMAIN] || !configMap[SETTINGS_KEYS.CLIENT_ID] || !configMap[SETTINGS_KEYS.REDIRECT_URI]) {
      return { success: false, error: 'Необходимо настроить OAuth параметры' }
    }
    
    // Используем www.amocrm.ru согласно официальной документации AmoCRM OAuth 2.0
    const authUrl = `https://www.amocrm.ru/oauth?client_id=${configMap[SETTINGS_KEYS.CLIENT_ID]}&state=${Date.now()}&mode=post_message&redirect_uri=${encodeURIComponent(configMap[SETTINGS_KEYS.REDIRECT_URI])}`
    
    return { success: true, authUrl }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при генерации URL авторизации', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: 'Ошибка при генерации URL' }
  }
})

// Обмен кода на токены
export const apiExchangeCodeRoute = app.post('/oauth/exchange', async (ctx, req) => {
  const { code } = req.body
  
  if (!code) {
    return { success: false, error: 'Необходим код авторизации' }
  }
  
  try {
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [
            SETTINGS_KEYS.SUBDOMAIN,
            SETTINGS_KEYS.CLIENT_ID,
            SETTINGS_KEYS.CLIENT_SECRET,
            SETTINGS_KEYS.REDIRECT_URI
          ]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    if (!configMap[SETTINGS_KEYS.SUBDOMAIN] || !configMap[SETTINGS_KEYS.CLIENT_ID] || 
        !configMap[SETTINGS_KEYS.CLIENT_SECRET] || !configMap[SETTINGS_KEYS.REDIRECT_URI]) {
      return { success: false, error: 'Не настроены OAuth параметры' }
    }
    
    // Логируем попытку обмена кода
    ctx.account.log('AmoCRM: начинаем обмен кода на токены', {
      level: 'info',
      json: { 
        subdomain: configMap[SETTINGS_KEYS.SUBDOMAIN],
        hasCode: !!code,
        codeLength: code.length
      }
    })
    
    // Запрос на обмен кода на токены с использованием @app/request
    const response = await request({
      url: `https://${configMap[SETTINGS_KEYS.SUBDOMAIN]}.amocrm.ru/oauth2/access_token`,
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      json: {
        client_id: configMap[SETTINGS_KEYS.CLIENT_ID],
        client_secret: configMap[SETTINGS_KEYS.CLIENT_SECRET],
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: configMap[SETTINGS_KEYS.REDIRECT_URI]
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      const errorText = typeof response.body === 'string' ? response.body : JSON.stringify(response.body)
      
      // Детальное логирование ошибки
      ctx.account.log('AmoCRM: ошибка обмена кода на токены', {
        level: 'error',
        json: { 
          status: response.statusCode,
          errorBody: response.body,
          subdomain: configMap[SETTINGS_KEYS.SUBDOMAIN]
        }
      })
      
      return { 
        success: false, 
        error: `Ошибка при получении токена: ${response.statusCode} - ${errorText.substring(0, 200)}` 
      }
    }
    
    const data = response.body
    
    // Логируем успешный обмен
    ctx.account.log('AmoCRM: токены успешно получены', {
      level: 'info',
      json: { 
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        expiresIn: data.expires_in
      }
    })
    
    // Сохраняем токены
    const expiresAt = new Date(Date.now() + data.expires_in * 1000)
    
    const tokensToSave = [
      { key: SETTINGS_KEYS.ACCESS_TOKEN, value: data.access_token, description: 'AmoCRM Access Token' },
      { key: SETTINGS_KEYS.REFRESH_TOKEN, value: data.refresh_token, description: 'AmoCRM Refresh Token' },
      { key: SETTINGS_KEYS.EXPIRES_AT, value: expiresAt.toISOString(), description: 'Token expiration time' },
      { key: SETTINGS_KEYS.STATUS, value: 'active', description: 'AmoCRM connection status' }
    ]
    
    for (const token of tokensToSave) {
      const existing = await SettingsTable.findOneBy(ctx, { key: token.key })
      
      if (existing) {
        await SettingsTable.update(ctx, {
          id: existing.id,
          value: token.value,
          description: token.description
        })
      } else {
        await SettingsTable.create(ctx, {
          key: token.key,
          value: token.value,
          description: token.description
        })
      }
    }
    
    return { success: true }
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при обмене кода на токены', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: `Ошибка при обмене кода: ${error.message}` }
  }
})

// Обновление токена
export const apiRefreshTokenRoute = app.post('/oauth/refresh', async (ctx) => {
  try {
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [
            SETTINGS_KEYS.SUBDOMAIN,
            SETTINGS_KEYS.CLIENT_ID,
            SETTINGS_KEYS.CLIENT_SECRET,
            SETTINGS_KEYS.REDIRECT_URI,
            SETTINGS_KEYS.REFRESH_TOKEN
          ]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    if (!configMap[SETTINGS_KEYS.REFRESH_TOKEN]) {
      return { success: false, error: 'Нет refresh токена' }
    }
    
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
      
      ctx.account.log('AmoCRM: ошибка обновления токена', {
        level: 'error',
        json: { 
          status: response.statusCode,
          errorBody: response.body
        }
      })
      
      return { success: false, error: 'Не удалось обновить токен' }
    }
    
    const data = response.body
    
    // Обновляем токены
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
    
    return { success: true }
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при обновлении токена', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: 'Ошибка при обновлении токена' }
  }
})

// Получение дополнительных полей
export const apiGetCustomFieldsRoute = app.get('/custom-fields', async (ctx) => {
  try {
    // Получаем токен и subdomain
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [SETTINGS_KEYS.SUBDOMAIN, SETTINGS_KEYS.ACCESS_TOKEN, SETTINGS_KEYS.EXPIRES_AT]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    if (!configMap[SETTINGS_KEYS.ACCESS_TOKEN] || !configMap[SETTINGS_KEYS.SUBDOMAIN]) {
      return { success: false, error: 'Необходима авторизация' }
    }
    
    // Проверяем, не истек ли токен
    if (configMap[SETTINGS_KEYS.EXPIRES_AT]) {
      const expiresAt = new Date(configMap[SETTINGS_KEYS.EXPIRES_AT])
      if (expiresAt < new Date()) {
        return { success: false, error: 'Токен истек', needRefresh: true }
      }
    }
    
    // Запрос к API AmoCRM для получения дополнительных полей
    const response = await request({
      url: `https://${configMap[SETTINGS_KEYS.SUBDOMAIN]}.amocrm.ru/api/v4/leads/custom_fields`,
      method: 'get',
      headers: {
        'Authorization': `Bearer ${configMap[SETTINGS_KEYS.ACCESS_TOKEN]}`,
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      ctx.account.log('AmoCRM: ошибка получения дополнительных полей', {
        level: 'error',
        json: { 
          status: response.statusCode,
          errorBody: response.body
        }
      })
      
      if (response.statusCode === 401) {
        return { success: false, error: 'Токен недействителен', needRefresh: true }
      }
      
      return { success: false, error: 'Ошибка при получении полей' }
    }
    
    const data = response.body
    
    return { 
      success: true, 
      fields: data._embedded?.custom_fields || []
    }
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при получении дополнительных полей', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: 'Ошибка при получении полей' }
  }
})

// Получение информации об автообновлении токена
export const apiGetAutoRefreshInfoRoute = app.get('/oauth/auto-refresh-info', async (ctx) => {
  try {
    const settings = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [SETTINGS_KEYS.REFRESH_TASK_ID, SETTINGS_KEYS.NEXT_REFRESH_AT]
        }
      }
    })
    
    const info: Record<string, string> = {}
    settings.forEach(setting => {
      info[setting.key] = setting.value
    })
    
    const hasAutoRefresh = !!info[SETTINGS_KEYS.REFRESH_TASK_ID]
    const nextRefreshAt = info[SETTINGS_KEYS.NEXT_REFRESH_AT] || null
    
    return {
      success: true,
      hasAutoRefresh,
      taskId: info[SETTINGS_KEYS.REFRESH_TASK_ID] || null,
      nextRefreshAt
    }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при получении информации об автообновлении', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: 'Ошибка при получении информации' }
  }
})

// Подписка на вебхуки
export const apiSubscribeWebhookRoute = app.post('/webhooks/subscribe', async (ctx, req) => {
  const { webhookUrl } = req.body
  
  if (!webhookUrl) {
    return { success: false, error: 'Необходим URL вебхука' }
  }
  
  try {
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [SETTINGS_KEYS.SUBDOMAIN, SETTINGS_KEYS.ACCESS_TOKEN, SETTINGS_KEYS.EXPIRES_AT]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    if (!configMap[SETTINGS_KEYS.ACCESS_TOKEN] || !configMap[SETTINGS_KEYS.SUBDOMAIN]) {
      return { success: false, error: 'Необходима авторизация' }
    }
    
    // Проверяем срок действия токена
    if (configMap[SETTINGS_KEYS.EXPIRES_AT]) {
      const expiresAt = new Date(configMap[SETTINGS_KEYS.EXPIRES_AT])
      if (expiresAt < new Date()) {
        return { success: false, error: 'Токен истек', needRefresh: true }
      }
    }
    
    // Подписываемся на события update_lead и status_lead
    const response = await request({
      url: `https://${configMap[SETTINGS_KEYS.SUBDOMAIN]}.amocrm.ru/api/v4/webhooks`,
      method: 'post',
      headers: {
        'Authorization': `Bearer ${configMap[SETTINGS_KEYS.ACCESS_TOKEN]}`,
        'Content-Type': 'application/json'
      },
      json: {
        destination: webhookUrl,
        settings: ['update_lead', 'status_lead']
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      ctx.account.log('AmoCRM: ошибка подписки на вебхук', {
        level: 'error',
        json: { 
          status: response.statusCode,
          errorBody: response.body
        }
      })
      
      if (response.statusCode === 401) {
        return { success: false, error: 'Токен недействителен', needRefresh: true }
      }
      
      return { success: false, error: response.body?.title || 'Ошибка при подписке на вебхук' }
    }
    
    const data = response.body
    
    // Сохраняем информацию о подписке
    const settingsToSave = [
      { key: 'webhook_destination', value: webhookUrl, description: 'URL вебхука' },
      { key: 'webhook_status', value: 'subscribed', description: 'Статус подписки' }
    ]
    
    for (const setting of settingsToSave) {
      const existing = await SettingsTable.findOneBy(ctx, { key: setting.key })
      
      if (existing) {
        await SettingsTable.update(ctx, {
          id: existing.id,
          value: setting.value,
          description: setting.description
        })
      } else {
        await SettingsTable.create(ctx, {
          key: setting.key,
          value: setting.value,
          description: setting.description
        })
      }
    }
    
    ctx.account.log('AmoCRM: успешная подписка на вебхук', {
      level: 'info',
      json: { 
        destination: webhookUrl,
        events: ['update_lead', 'status_lead']
      }
    })
    
    return { 
      success: true, 
      message: 'Подписка на вебхук успешно создана'
    }
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при подписке на вебхук', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: 'Ошибка при подписке на вебхук' }
  }
})

// Получение списка вебхуков
export const apiGetWebhooksRoute = app.get('/webhooks/list', async (ctx) => {
  try {
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [SETTINGS_KEYS.SUBDOMAIN, SETTINGS_KEYS.ACCESS_TOKEN, SETTINGS_KEYS.EXPIRES_AT]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    if (!configMap[SETTINGS_KEYS.ACCESS_TOKEN] || !configMap[SETTINGS_KEYS.SUBDOMAIN]) {
      return { success: false, error: 'Необходима авторизация' }
    }
    
    // Проверяем срок действия токена
    if (configMap[SETTINGS_KEYS.EXPIRES_AT]) {
      const expiresAt = new Date(configMap[SETTINGS_KEYS.EXPIRES_AT])
      if (expiresAt < new Date()) {
        return { success: false, error: 'Токен истек', needRefresh: true }
      }
    }
    
    // Получаем список вебхуков
    const response = await request({
      url: `https://${configMap[SETTINGS_KEYS.SUBDOMAIN]}.amocrm.ru/api/v4/webhooks`,
      method: 'get',
      headers: {
        'Authorization': `Bearer ${configMap[SETTINGS_KEYS.ACCESS_TOKEN]}`,
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      ctx.account.log('AmoCRM: ошибка получения списка вебхуков', {
        level: 'error',
        json: { 
          status: response.statusCode,
          errorBody: response.body
        }
      })
      
      if (response.statusCode === 401) {
        return { success: false, error: 'Токен недействителен', needRefresh: true }
      }
      
      return { success: false, error: 'Ошибка при получении списка вебхуков' }
    }
    
    const data = response.body
    const webhooks = data._embedded?.webhooks || []
    
    // Синхронизируем статус вебхука в БД с реальным статусом в AmoCRM
    try {
      // Получаем сохраненный URL вебхука
      const webhookDestSetting = await SettingsTable.findOneBy(ctx, { key: 'webhook_destination' })
      const savedWebhookUrl = webhookDestSetting?.value
      
      // Ищем наш вебхук в списке (по сохраненному URL или по паттерну)
      const ourWebhook = webhooks.find(w => {
        if (savedWebhookUrl && w.destination === savedWebhookUrl) {
          return true
        }
        // Если URL не сохранен, ищем по паттерну нашего домена и пути
        return w.destination && w.destination.includes('/dev/amocrm-connector/api/webhook')
      })
      
      if (ourWebhook) {
        const webhookStatusSetting = await SettingsTable.findOneBy(ctx, { key: 'webhook_status' })
        
        // Если нашли вебхук, но URL не сохранен - сохраняем
        if (!savedWebhookUrl || savedWebhookUrl !== ourWebhook.destination) {
          await SettingsTable.createOrUpdateBy(ctx, 'key', {
            key: 'webhook_destination',
            value: ourWebhook.destination,
            description: 'URL вебхука'
          })
        }
        
        // Если статус не subscribed - исправляем
        if (webhookStatusSetting?.value !== 'subscribed') {
          await SettingsTable.createOrUpdateBy(ctx, 'key', {
            key: 'webhook_status',
            value: 'subscribed',
            description: 'Статус подписки'
          })
          
          ctx.account.log('AmoCRM: синхронизация статуса вебхука - установлен в subscribed', {
            level: 'info',
            json: { webhookUrl: ourWebhook.destination }
          })
        }
      } else {
        // Вебхука нет в AmoCRM
        const webhookStatusSetting = await SettingsTable.findOneBy(ctx, { key: 'webhook_status' })
        if (webhookStatusSetting?.value === 'subscribed') {
          // В БД отмечен как subscribed, но его нет - исправляем
          await SettingsTable.createOrUpdateBy(ctx, 'key', {
            key: 'webhook_status',
            value: 'unsubscribed',
            description: 'Статус подписки'
          })
          
          ctx.account.log('AmoCRM: синхронизация статуса вебхука - установлен в unsubscribed', {
            level: 'info',
            json: { webhookUrl: savedWebhookUrl || 'не найден' }
          })
        }
      }
    } catch (syncError) {
      // Ошибка синхронизации не критична, просто логируем
      ctx.account.log('AmoCRM: ошибка синхронизации статуса вебхука', {
        level: 'warn',
        json: { error: syncError.message }
      })
    }
    
    return { 
      success: true, 
      webhooks
    }
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при получении списка вебхуков', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: 'Ошибка при получении списка вебхуков' }
  }
})

// Отписка от вебхуков
export const apiUnsubscribeWebhookRoute = app.post('/webhooks/unsubscribe', async (ctx, req) => {
  const { webhookUrl } = req.body
  
  if (!webhookUrl) {
    return { success: false, error: 'Необходим URL вебхука' }
  }
  
  try {
    const config = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [SETTINGS_KEYS.SUBDOMAIN, SETTINGS_KEYS.ACCESS_TOKEN, SETTINGS_KEYS.EXPIRES_AT]
        }
      }
    })
    
    const configMap: Record<string, string> = {}
    config.forEach(setting => {
      configMap[setting.key] = setting.value
    })
    
    if (!configMap[SETTINGS_KEYS.ACCESS_TOKEN] || !configMap[SETTINGS_KEYS.SUBDOMAIN]) {
      return { success: false, error: 'Необходима авторизация' }
    }
    
    // Проверяем срок действия токена
    if (configMap[SETTINGS_KEYS.EXPIRES_AT]) {
      const expiresAt = new Date(configMap[SETTINGS_KEYS.EXPIRES_AT])
      if (expiresAt < new Date()) {
        return { success: false, error: 'Токен истек', needRefresh: true }
      }
    }
    
    // Отписываемся от вебхука
    const response = await request({
      url: `https://${configMap[SETTINGS_KEYS.SUBDOMAIN]}.amocrm.ru/api/v4/webhooks`,
      method: 'delete',
      headers: {
        'Authorization': `Bearer ${configMap[SETTINGS_KEYS.ACCESS_TOKEN]}`,
        'Content-Type': 'application/json'
      },
      json: {
        destination: webhookUrl
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200 && response.statusCode !== 204) {
      ctx.account.log('AmoCRM: ошибка отписки от вебхука', {
        level: 'error',
        json: { 
          status: response.statusCode,
          errorBody: response.body
        }
      })
      
      if (response.statusCode === 401) {
        return { success: false, error: 'Токен недействителен', needRefresh: true }
      }
      
      return { success: false, error: 'Ошибка при отписке от вебхука' }
    }
    
    // Обновляем статус подписки
    const statusSetting = await SettingsTable.findOneBy(ctx, { key: 'webhook_status' })
    if (statusSetting) {
      await SettingsTable.update(ctx, {
        id: statusSetting.id,
        value: 'unsubscribed'
      })
    }
    
    ctx.account.log('AmoCRM: успешная отписка от вебхука', {
      level: 'info',
      json: { destination: webhookUrl }
    })
    
    return { 
      success: true, 
      message: 'Отписка от вебхука успешно выполнена'
    }
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при отписке от вебхука', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: 'Ошибка при отписке от вебхука' }
  }
})

// Сохранение настроек полей вебхука
export const apiSaveWebhookSettingsRoute = app.post('/webhook-settings/save', async (ctx, req) => {
  const { field_check, field_product, field_tariff, field_price } = req.body
  
  if (!field_check || !field_product || !field_tariff || !field_price) {
    return { success: false, error: 'Необходимо указать все поля' }
  }
  
  try {
    const settingsToSave = [
      { key: 'webhook_field_check', value: field_check, description: 'Field ID чекбокса "Сформировать?"' },
      { key: 'webhook_field_product', value: field_product, description: 'Field ID поля "Продукт"' },
      { key: 'webhook_field_tariff', value: field_tariff, description: 'Field ID поля "Тариф"' },
      { key: 'webhook_field_price', value: field_price, description: 'Field ID поля "Своя цена"' }
    ]
    
    for (const setting of settingsToSave) {
      const existing = await SettingsTable.findOneBy(ctx, { key: setting.key })
      
      if (existing) {
        await SettingsTable.update(ctx, {
          id: existing.id,
          value: setting.value,
          description: setting.description
        })
      } else {
        await SettingsTable.create(ctx, {
          key: setting.key,
          value: setting.value,
          description: setting.description
        })
      }
    }
    
    ctx.account.log('AmoCRM: настройки полей вебхука сохранены', {
      level: 'info',
      json: { field_check, field_product, field_tariff, field_price }
    })
    
    return { success: true, message: 'Настройки полей успешно сохранены' }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при сохранении настроек полей вебхука', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: 'Ошибка при сохранении настроек' }
  }
})

// Получение настроек полей вебхука
export const apiGetWebhookSettingsRoute = app.get('/webhook-settings', async (ctx) => {
  try {
    const settings = await SettingsTable.findAll(ctx, {
      where: {
        key: {
          $in: [
            'webhook_field_check',
            'webhook_field_product',
            'webhook_field_tariff',
            'webhook_field_price',
            'webhook_status',
            'webhook_destination'
          ]
        }
      }
    })
    
    const config: Record<string, string> = {}
    settings.forEach(setting => {
      config[setting.key] = setting.value
    })
    
    return {
      success: true,
      settings: {
        field_check: config['webhook_field_check'] || '',
        field_product: config['webhook_field_product'] || '',
        field_tariff: config['webhook_field_tariff'] || '',
        field_price: config['webhook_field_price'] || '',
        webhook_status: config['webhook_status'] || 'unsubscribed',
        webhook_destination: config['webhook_destination'] || ''
      }
    }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при получении настроек полей вебхука', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: 'Ошибка при получении настроек' }
  }
})

// Тестирование обработки вебхука
export const apiTestWebhookProcessingRoute = app.post('/webhook-settings/test', async (ctx, req) => {
  const { leadId } = req.body
  
  if (!leadId) {
    return { success: false, error: 'Необходимо указать ID сделки' }
  }
  
  try {
    // Импортируем функцию тестирования из webhook.ts
    const { testWebhookProcessing } = await import('./webhook')
    
    ctx.account.log('AmoCRM: запуск тестирования обработки вебхука', {
      level: 'info',
      json: { leadId }
    })
    
    const result = await testWebhookProcessing(ctx, parseInt(leadId))
    
    return result
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при тестировании обработки вебхука', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    return { success: false, error: error.message || 'Ошибка при тестировании' }
  }
})

// Получение списка входящих вебхуков
export const apiGetWebhookEventsRoute = app.get('/webhook-events/list', async (ctx) => {
  try {
    const events = await WebhookEventsTable.findAll(ctx, {
      order: { createdAt: 'desc' },
      limit: 50
    })
    
    return {
      success: true,
      events: events.map(event => ({
        id: event.id,
        leadId: event.leadId,
        leadUpdatedAt: event.leadUpdatedAt,
        processedAt: event.processedAt,
        status: event.status,
        errorMessage: event.errorMessage,
        createdAt: event.createdAt
      }))
    }
  } catch (error: any) {
    ctx.account.log('AmoCRM: ошибка при получении списка входящих вебхуков', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: 'Ошибка при получении списка' }
  }
})

// POST /api/amocrm/webhook-events/clear-all
export const apiClearAllWebhookEventsRoute = app.post('/webhook-events/clear-all', async (ctx, req) => {
  try {
    // Получаем все события
    const events = await WebhookEventsTable.findAll(ctx)
    
    // Удаляем все записи
    for (const event of events) {
      await WebhookEventsTable.delete(ctx, event.id)
    }
    
    ctx.account.log('AmoCRM: все события вебхуков удалены', {
      level: 'info',
      json: { deletedCount: events.length }
    })
    
    return {
      success: true,
      deletedCount: events.length
    }
  } catch (error: any) {
    ctx.account.log('AmoCRM: ошибка при удалении событий вебхуков', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка удаления событий вебхуков'
    }
  }
})
