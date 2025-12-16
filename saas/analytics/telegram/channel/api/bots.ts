// @shared-route

import { requireRealUser } from '@app/auth'
import { BotTokens } from '../tables/bot-tokens.table'
import { Debug } from '../shared/debug'
import { applyDebugLevel } from '../lib/logging'
import { request } from '@app/request'

/**
 * GET /api/bots/list
 * Получение списка ботов текущего пользователя
 */
export const apiGetBotsListRoute = app.get('/list', async (ctx, req) => {
  try {
    // Применяем уровень логирования из настроек
    await applyDebugLevel(ctx, 'api/bots/list')
    Debug.info(ctx, '[api/bots/list] Начало обработки запроса на получение списка ботов')
    
    // Проверка авторизации
    requireRealUser(ctx)
    Debug.info(ctx, `[api/bots/list] Пользователь авторизован: userId=${ctx.user.id}`)
    
    // Получаем ботов текущего пользователя
    Debug.info(ctx, `[api/bots/list] Запрос списка ботов для userId=${ctx.user.id}`)
    const bots = await BotTokens.findAll(ctx, {
      where: {
        userId: ctx.user.id
      },
      order: { createdAt: 'desc' },
      limit: 100
    })
    
    const botsCount = bots?.length || 0
    Debug.info(ctx, `[api/bots/list] Найдено ботов: ${botsCount}`)
    
    if (botsCount === 0) {
      Debug.warn(ctx, `[api/bots/list] У пользователя userId=${ctx.user.id} нет добавленных ботов`)
    }
    
    return {
      success: true,
      bots: bots || []
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/bots/list] Ошибка при получении списка ботов: ${error.message}`, 'E_GET_BOTS_LIST')
    Debug.error(ctx, `[api/bots/list] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при получении списка ботов'
    }
  }
})

/**
 * POST /api/bots/validate-token
 * Валидация токена Telegram бота через Telegram Bot API
 */
export const apiValidateTokenRoute = app.post('/validate-token', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/bots/validate-token')
    Debug.info(ctx, '[api/bots/validate-token] Начало валидации токена')
    
    requireRealUser(ctx)
    Debug.info(ctx, `[api/bots/validate-token] Пользователь авторизован: userId=${ctx.user.id}`)
    
    const { token } = req.body
    
    if (!token || !token.trim()) {
      Debug.warn(ctx, '[api/bots/validate-token] Токен не предоставлен')
      return {
        success: false,
        error: 'Токен обязателен'
      }
    }
    
    const trimmedToken = token.trim()
    Debug.info(ctx, `[api/bots/validate-token] Проверка токена (первые 10 символов): ${trimmedToken.substring(0, 10)}...`)
    
    // Вызов Telegram Bot API для валидации токена
    const telegramApiUrl = `https://api.telegram.org/bot${trimmedToken}/getMe`
    
    Debug.info(ctx, `[api/bots/validate-token] Запрос к Telegram API: ${telegramApiUrl.replace(trimmedToken, '***')}`)
    
    const response = await request({
      url: telegramApiUrl,
      method: 'get',
      responseType: 'json',
      throwHttpErrors: false,
      timeout: 10000 // 10 секунд таймаут
    })
    
    // Проверяем ответ от Telegram API
    if (response.statusCode !== 200) {
      Debug.warn(ctx, `[api/bots/validate-token] Telegram API вернул ошибку: statusCode=${response.statusCode}`)
      return {
        success: false,
        error: 'Токен недействителен. Проверьте правильность токена.'
      }
    }
    
    const botInfo = response.body as {
      ok?: boolean
      result?: {
        id: number
        username?: string
        first_name?: string
      }
    }
    
    // Проверяем структуру ответа
    if (!botInfo.ok || !botInfo.result) {
      Debug.warn(ctx, `[api/bots/validate-token] Неверный формат ответа от Telegram API`)
      return {
        success: false,
        error: 'Неверный формат ответа от Telegram API'
      }
    }
    
    const { id, username, first_name } = botInfo.result
    
    Debug.info(ctx, `[api/bots/validate-token] Токен валиден: botId=${id}, username=${username}, name=${first_name}`)
    
    return {
      success: true,
      botInfo: {
        id: String(id),
        username: username || null,
        name: first_name || null
      }
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/bots/validate-token] Ошибка при валидации токена: ${error.message}`, 'E_VALIDATE_TOKEN')
    Debug.error(ctx, `[api/bots/validate-token] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при проверке токена'
    }
  }
})

/**
 * POST /api/bots/add
 * Добавление нового бота в таблицу
 */
export const apiAddBotRoute = app.post('/add', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/bots/add')
    Debug.info(ctx, '[api/bots/add] Начало добавления бота')
    
    requireRealUser(ctx)
    Debug.info(ctx, `[api/bots/add] Пользователь авторизован: userId=${ctx.user.id}`)
    
    const { token, botName, botUsername } = req.body
    
    if (!token || !token.trim()) {
      Debug.warn(ctx, '[api/bots/add] Токен не предоставлен')
      return {
        success: false,
        error: 'Токен обязателен'
      }
    }
    
    const trimmedToken = token.trim()
    
    // Проверяем, не существует ли уже такой токен у пользователя
    Debug.info(ctx, `[api/bots/add] Проверка на дубликаты токена для userId=${ctx.user.id}`)
    const existingBot = await BotTokens.findOneBy(ctx, {
      userId: ctx.user.id,
      token: trimmedToken
    })
    
    if (existingBot) {
      Debug.warn(ctx, `[api/bots/add] Токен уже существует у пользователя userId=${ctx.user.id}`)
      return {
        success: false,
        error: 'Этот токен уже добавлен'
      }
    }
    
    // Создаём запись в таблице
    Debug.info(ctx, `[api/bots/add] Создание записи в таблице: token=${trimmedToken.substring(0, 10)}..., botName=${botName || 'null'}, botUsername=${botUsername || 'null'}`)
    const bot = await BotTokens.create(ctx, {
      token: trimmedToken,
      botName: botName || null,
      botUsername: botUsername || null,
      userId: ctx.user.id
    })
    
    Debug.info(ctx, `[api/bots/add] Бот успешно добавлен с ID: ${bot.id}`)
    
    return {
      success: true,
      bot: {
        id: bot.id,
        token: bot.token,
        botName: bot.botName,
        botUsername: bot.botUsername,
        userId: bot.userId
      }
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/bots/add] Ошибка при добавлении бота: ${error.message}`, 'E_ADD_BOT')
    Debug.error(ctx, `[api/bots/add] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при добавлении бота'
    }
  }
})
