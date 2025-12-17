// @shared-route

import { requireRealUser } from '@app/auth'
import { BotTokens } from '../tables/bot-tokens.table'
import { Debug } from '../shared/debug'
import { applyDebugLevel } from '../lib/logging'
import { request } from '@app/request'
import { apiWebhookRoute } from './webhook'

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
    Debug.info(ctx, `[api/bots/add] Тип bot.id: ${typeof bot.id}, значение: ${bot.id}`)
    
    // Проверяем, что bot.id существует
    if (!bot.id) {
      Debug.error(ctx, `[api/bots/add] КРИТИЧЕСКАЯ ОШИБКА: bot.id отсутствует после создания!`, 'E_BOT_ID_MISSING')
      return {
        success: false,
        error: 'Ошибка: ID бота не был создан'
      }
    }
    
    // Регистрируем вебхук в Telegram
    try {
      // Убеждаемся, что bot.id - строка
      Debug.info(ctx, `[api/bots/add] Проверка bot.id: значение=${bot.id}, тип=${typeof bot.id}, JSON=${JSON.stringify(bot.id)}`)
      
      if (!bot.id) {
        Debug.error(ctx, `[api/bots/add] КРИТИЧЕСКАЯ ОШИБКА: bot.id отсутствует!`, 'E_BOT_ID_MISSING')
        return {
          success: false,
          error: 'Ошибка: ID бота не был создан'
        }
      }
      
      const botIdString = String(bot.id).trim()
      Debug.info(ctx, `[api/bots/add] botIdString после преобразования: значение="${botIdString}", длина=${botIdString.length}`)
      
      if (!botIdString || botIdString === '') {
        Debug.error(ctx, `[api/bots/add] КРИТИЧЕСКАЯ ОШИБКА: bot.id пустой после преобразования!`, 'E_BOT_ID_INVALID')
        return {
          success: false,
          error: 'Ошибка: ID бота невалиден'
        }
      }
      
      // Используем правильный способ генерации URL для роутов с параметрами пути
      // Согласно @001-run.md: route({param: val}).url() или route({param: val}).run(ctx)
      const webhookUrl = apiWebhookRoute({ id: botIdString }).url()
      Debug.info(ctx, `[api/bots/add] URL webhook сгенерирован через route({ id }).url(): ${webhookUrl}`)
      
      Debug.info(ctx, `[api/bots/add] Регистрация вебхука для бота ${bot.id}`)
      Debug.info(ctx, `[api/bots/add] Сгенерированный URL вебхука: ${webhookUrl}`)
      Debug.info(ctx, `[api/bots/add] Токен бота (первые 10 символов): ${trimmedToken.substring(0, 10)}...`)
      
      const telegramApiUrl = `https://api.telegram.org/bot${trimmedToken}/setWebhook`
      Debug.info(ctx, `[api/bots/add] URL Telegram API: ${telegramApiUrl}`)
      
      const webhookResponse = await request({
        url: telegramApiUrl,
        method: 'post',
        json: {
          url: webhookUrl
        },
        responseType: 'json',
        throwHttpErrors: false,
        timeout: 10000
      })

      const webhookBody = webhookResponse.body as any

      Debug.info(ctx, `[api/bots/add] Ответ от Telegram API: statusCode=${webhookResponse.statusCode}, body=${JSON.stringify(webhookBody)}`)

      if (webhookResponse.statusCode === 200 && webhookBody?.ok) {
        Debug.info(ctx, `[api/bots/add] Вебхук успешно зарегистрирован для бота ${bot.id}`)
        if (webhookBody.result) {
          Debug.info(ctx, `[api/bots/add] Детали регистрации: ${JSON.stringify(webhookBody.result)}`)
        }
      } else {
        Debug.warn(ctx, `[api/bots/add] Ошибка регистрации вебхука: statusCode=${webhookResponse.statusCode}, body=${JSON.stringify(webhookBody)}`)
        if (webhookBody?.description) {
          Debug.warn(ctx, `[api/bots/add] Описание ошибки от Telegram: ${webhookBody.description}`)
        }
        // Не прерываем выполнение, бот уже добавлен в БД
      }
    } catch (webhookError: any) {
      Debug.error(ctx, `[api/bots/add] Исключение при регистрации вебхука: ${webhookError.message}`, 'E_WEBHOOK_REGISTER')
      Debug.error(ctx, `[api/bots/add] Stack trace: ${webhookError.stack || 'N/A'}`)
      // Не прерываем выполнение, бот уже добавлен в БД
    }
    
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

/**
 * POST /api/bots/delete
 * Удаление бота из таблицы
 */
export const apiDeleteBotRoute = app.post('/delete', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/bots/delete')
    Debug.info(ctx, '[api/bots/delete] Начало удаления бота')
    
    requireRealUser(ctx)
    Debug.info(ctx, `[api/bots/delete] Пользователь авторизован: userId=${ctx.user.id}`)
    
    const { botId } = req.body
    
    if (!botId || !botId.trim()) {
      Debug.warn(ctx, '[api/bots/delete] ID бота не предоставлен')
      return {
        success: false,
        error: 'ID бота обязателен'
      }
    }
    
    const trimmedBotId = botId.trim()
    Debug.info(ctx, `[api/bots/delete] Попытка удаления бота с ID: ${trimmedBotId}`)
    
    // Проверяем, существует ли бот и принадлежит ли он текущему пользователю
    const bot = await BotTokens.findById(ctx, trimmedBotId)
    
    if (!bot) {
      Debug.warn(ctx, `[api/bots/delete] Бот с ID ${trimmedBotId} не найден`)
      return {
        success: false,
        error: 'Бот не найден'
      }
    }
    
    // Проверяем, что бот принадлежит текущему пользователю
    if (bot.userId !== ctx.user.id) {
      Debug.warn(ctx, `[api/bots/delete] Попытка удаления чужого бота: bot.userId=${bot.userId}, currentUserId=${ctx.user.id}`)
      return {
        success: false,
        error: 'Нет доступа к этому боту'
      }
    }
    
    // Удаляем вебхук из Telegram перед удалением бота
    try {
      Debug.info(ctx, `[api/bots/delete] Удаление вебхука для бота ${trimmedBotId}`)
      
      const webhookResponse = await request({
        url: `https://api.telegram.org/bot${bot.token}/deleteWebhook`,
        method: 'post',
        json: {
          drop_pending_updates: true
        },
        responseType: 'json',
        throwHttpErrors: false,
        timeout: 10000
      })

      const webhookBody = webhookResponse.body as any

      if (webhookResponse.statusCode === 200 && webhookBody?.ok) {
        Debug.info(ctx, `[api/bots/delete] Вебхук успешно удалён для бота ${trimmedBotId}`)
      } else {
        Debug.warn(ctx, `[api/bots/delete] Ошибка удаления вебхука: statusCode=${webhookResponse.statusCode}, body=${JSON.stringify(webhookBody)}`)
        // Продолжаем удаление бота даже если вебхук не удалось удалить
      }
    } catch (webhookError: any) {
      Debug.error(ctx, `[api/bots/delete] Исключение при удалении вебхука: ${webhookError.message}`, 'E_WEBHOOK_DELETE')
      // Продолжаем удаление бота даже если вебхук не удалось удалить
    }
    
    // Удаляем бота
    Debug.info(ctx, `[api/bots/delete] Удаление бота с ID: ${trimmedBotId}`)
    await BotTokens.delete(ctx, trimmedBotId)
    
    Debug.info(ctx, `[api/bots/delete] Бот успешно удалён с ID: ${trimmedBotId}`)
    
    return {
      success: true,
      message: 'Бот успешно удалён'
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/bots/delete] Ошибка при удалении бота: ${error.message}`, 'E_DELETE_BOT')
    Debug.error(ctx, `[api/bots/delete] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при удалении бота'
    }
  }
})
