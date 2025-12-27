// @shared-route

import { requireRealUser } from '@app/auth'
import { request } from '@app/request'
import { ChannelLinks } from '../tables/channel-links.table'
import { ChannelLinkAnalytics } from '../tables/channel-link-analytics.table'
import { TelegramChats } from '../tables/chats.table'
import { BotTokens } from '../tables/bot-tokens.table'
import { Debug } from '../shared/debug'
import { applyDebugLevel } from '../lib/logging'

/**
 * GET /api/channel-links/list
 * Получение списка ссылок текущего пользователя с подсчётом лидов
 */
export const apiGetChannelLinksListRoute = app.get('/list', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/channel-links/list')
    Debug.info(ctx, '[api/channel-links/list] Начало обработки запроса')
    
    requireRealUser(ctx)
    Debug.info(ctx, `[api/channel-links/list] Пользователь авторизован: userId=${ctx.user.id}`)
    
    // Получаем ссылки текущего пользователя
    const links = await ChannelLinks.findAll(ctx, {
      where: {
        userId: ctx.user.id
      },
      order: { createdAt: 'desc' },
      limit: 100
    })
    
    Debug.info(ctx, `[api/channel-links/list] Найдено ссылок: ${links?.length || 0}`)
    
    // Для каждой ссылки подсчитываем количество лидов и получаем информацию о канале и боте
    const linksWithStats = []
    if (links && links.length > 0) {
      for (const link of links) {
        try {
          // Подсчёт уникальных лидов (по uid)
          const allAnalytics = await ChannelLinkAnalytics.findAll(ctx, {
            where: {
              linkId: link.id
            },
            limit: 10000
          })
          
          // Подсчитываем уникальные uid
          const uniqueUids = new Set<string>()
          if (allAnalytics && allAnalytics.length > 0) {
            for (const record of allAnalytics) {
              if (record.uid) {
                uniqueUids.add(record.uid)
              }
            }
          }
          const leadsCount = uniqueUids.size
          
          // Получаем информацию о канале
          const channel = await TelegramChats.findOneBy(ctx, {
            chatId: link.chatId
          })
          
          // Получаем информацию о боте
          const bot = await BotTokens.findById(ctx, link.botId)
          
          linksWithStats.push({
            id: link.id,
            name: link.name,
            trackingUrl: link.trackingUrl,
            targetUrl: link.targetUrl,
            chatId: link.chatId,
            botId: link.botId,
            channelTitle: channel?.chatTitle || channel?.chatUsername || 'Неизвестный канал',
            botName: bot?.botName || bot?.botUsername || 'Неизвестный бот',
            leadsCount: leadsCount || 0
          })
        } catch (statsError: any) {
          Debug.error(ctx, `[api/channel-links/list] Ошибка подсчёта статистики для ссылки ${link.id}: ${statsError.message}`, 'E_LINK_STATS')
          // В случае ошибки добавляем ссылку со значением 0
          linksWithStats.push({
            id: link.id,
            name: link.name,
            trackingUrl: link.trackingUrl,
            targetUrl: link.targetUrl,
            chatId: link.chatId,
            botId: link.botId,
            channelTitle: 'Ошибка загрузки',
            botName: 'Ошибка загрузки',
            leadsCount: 0
          })
        }
      }
    }
    
    return {
      success: true,
      links: linksWithStats
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/channel-links/list] Ошибка: ${error.message}`, 'E_GET_LINKS_LIST')
    Debug.error(ctx, `[api/channel-links/list] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при получении списка ссылок'
    }
  }
})

/**
 * POST /api/channel-links/add
 * Добавление новой ссылки
 */
export const apiAddChannelLinkRoute = app.post('/add', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/channel-links/add')
    Debug.info(ctx, '[api/channel-links/add] Начало добавления ссылки')
    
    requireRealUser(ctx)
    Debug.info(ctx, `[api/channel-links/add] Пользователь авторизован: userId=${ctx.user.id}`)
    
    const { name, chatId, botId } = req.body
    
    if (!name || !name.trim()) {
      Debug.warn(ctx, '[api/channel-links/add] Название не предоставлено')
      return {
        success: false,
        error: 'Название ссылки обязательно'
      }
    }
    
    if (!chatId || !chatId.trim()) {
      Debug.warn(ctx, '[api/channel-links/add] ID канала не предоставлен')
      return {
        success: false,
        error: 'Канал обязателен'
      }
    }
    
    if (!botId || !botId.trim()) {
      Debug.warn(ctx, '[api/channel-links/add] ID бота не предоставлен')
      return {
        success: false,
        error: 'Бот обязателен'
      }
    }
    
    // Проверяем, что канал принадлежит пользователю
    const channel = await TelegramChats.findOneBy(ctx, {
      chatId: chatId.trim(),
      userId: ctx.user.id
    })
    
    if (!channel) {
      Debug.warn(ctx, `[api/channel-links/add] Канал ${chatId} не найден или не принадлежит пользователю`)
      return {
        success: false,
        error: 'Канал не найден или нет доступа'
      }
    }
    
    // Проверяем, что бот принадлежит пользователю
    const bot = await BotTokens.findById(ctx, botId.trim())
    
    if (!bot || bot.userId !== ctx.user.id) {
      Debug.warn(ctx, `[api/channel-links/add] Бот ${botId} не найден или не принадлежит пользователю`)
      return {
        success: false,
        error: 'Бот не найден или нет доступа'
      }
    }
    
    // Получаем ссылку на канал в Telegram
    // Формируем ссылку на канал: если есть username - https://t.me/username, иначе используем chatId
    let targetUrl = ''
    if (channel.chatUsername) {
      // Убираем @ если есть
      const username = channel.chatUsername.replace('@', '')
      targetUrl = `https://t.me/${username}`
    } else {
      // Если username нет, формируем ссылку по chatId
      // Для каналов chatId начинается с -100, убираем это для ссылки
      const chatIdForLink = channel.chatId.replace(/^-100/, '')
      targetUrl = `https://t.me/c/${chatIdForLink}`
    }
    
    // Генерируем базовый URL для trackingUrl
    const baseUrl = ctx.account.url('/saas/analytics/telegram/channel')
    
    // Создаём ссылку с временным trackingUrl (будет обновлён после создания)
    const link = await ChannelLinks.create(ctx, {
      name: name.trim(),
      targetUrl: targetUrl,
      trackingUrl: 'AUTO_GENERATE',
      chatId: chatId.trim(),
      botId: botId.trim(),
      userId: ctx.user.id
    })
    
    // Генерируем уникальную ссылку для отслеживания: /link/{linkId}
    // linkId уже уникален и привязан к пользователю через userId
    const generatedUrl = `${baseUrl}/link/${link.id}`
    
    // Обновляем trackingUrl с реальной ссылкой
    await ChannelLinks.update(ctx, {
      id: link.id,
      trackingUrl: generatedUrl
    })
    
    link.trackingUrl = generatedUrl
    
    Debug.info(ctx, `[api/channel-links/add] Ссылка успешно создана: ${link.id}`)
    
    return {
      success: true,
      link: {
        id: link.id,
        name: link.name,
        trackingUrl: link.trackingUrl,
        targetUrl: link.targetUrl,
        chatId: link.chatId,
        botId: link.botId
      }
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/channel-links/add] Ошибка: ${error.message}`, 'E_ADD_LINK')
    Debug.error(ctx, `[api/channel-links/add] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при добавлении ссылки'
    }
  }
})

/**
 * POST /api/channel-links/delete
 * Удаление ссылки
 */
export const apiDeleteChannelLinkRoute = app.post('/delete', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/channel-links/delete')
    Debug.info(ctx, '[api/channel-links/delete] Начало удаления ссылки')
    
    requireRealUser(ctx)
    Debug.info(ctx, `[api/channel-links/delete] Пользователь авторизован: userId=${ctx.user.id}`)
    
    const { linkId } = req.body
    
    if (!linkId || !linkId.trim()) {
      Debug.warn(ctx, '[api/channel-links/delete] ID ссылки не предоставлен')
      return {
        success: false,
        error: 'ID ссылки обязателен'
      }
    }
    
    // Проверяем, что ссылка принадлежит пользователю
    const link = await ChannelLinks.findById(ctx, linkId.trim())
    
    if (!link) {
      Debug.warn(ctx, `[api/channel-links/delete] Ссылка ${linkId} не найдена`)
      return {
        success: false,
        error: 'Ссылка не найдена'
      }
    }
    
    if (link.userId !== ctx.user.id) {
      Debug.warn(ctx, `[api/channel-links/delete] Попытка удаления чужой ссылки`)
      return {
        success: false,
        error: 'Нет доступа к этой ссылке'
      }
    }
    
    // Удаляем аналитику
    // Найдём все записи аналитики для этой ссылки
    const analytics = await ChannelLinkAnalytics.findAll(ctx, {
      where: {
        linkId: linkId.trim()
      },
      limit: 1000
    })
    
    if (analytics && analytics.length > 0) {
      for (const record of analytics) {
        await ChannelLinkAnalytics.delete(ctx, record.id)
      }
      Debug.info(ctx, `[api/channel-links/delete] Удалено записей аналитики: ${analytics.length}`)
    }
    
    // Удаляем ссылку
    await ChannelLinks.delete(ctx, linkId.trim())
    
    Debug.info(ctx, `[api/channel-links/delete] Ссылка успешно удалена: ${linkId}`)
    
    return {
      success: true,
      message: 'Ссылка успешно удалена'
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/channel-links/delete] Ошибка: ${error.message}`, 'E_DELETE_LINK')
    Debug.error(ctx, `[api/channel-links/delete] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при удалении ссылки'
    }
  }
})

/**
 * POST /api/channel-links/track
 * Отслеживание перехода по ссылке и создание ссылки для вступления в Telegram
 */
export const apiTrackChannelLinkRoute = app.post('/track', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/channel-links/track')
    Debug.info(ctx, '[api/channel-links/track] Начало обработки перехода')
    
    const { linkId, uid, queryParams, userAgent, referer } = req.body
    
    if (!linkId || !linkId.trim()) {
      Debug.warn(ctx, '[api/channel-links/track] ID ссылки не предоставлен')
      return {
        success: false,
        error: 'ID ссылки обязателен'
      }
    }
    
    if (!uid || !uid.trim()) {
      Debug.warn(ctx, '[api/channel-links/track] UID не предоставлен')
      return {
        success: false,
        error: 'UID обязателен'
      }
    }
    
    // Получаем ссылку
    const link = await ChannelLinks.findById(ctx, linkId.trim())
    
    if (!link) {
      Debug.warn(ctx, `[api/channel-links/track] Ссылка ${linkId} не найдена`)
      return {
        success: false,
        error: 'Ссылка не найдена'
      }
    }
    
    // Проверяем, не был ли уже переход с этим uid (уникальные переходы)
    const existingAnalytics = await ChannelLinkAnalytics.findAll(ctx, {
      where: {
        linkId: linkId.trim(),
        uid: uid.trim()
      },
      limit: 1
    })
    
    // Если переход уже был, просто возвращаем существующую ссылку для вступления
    if (existingAnalytics && existingAnalytics.length > 0) {
      Debug.info(ctx, `[api/channel-links/track] Переход с uid ${uid} уже был зарегистрирован`)
      // Всё равно создаём новую ссылку для вступления (Telegram может требовать новую)
    }
    
    // Получаем информацию о боте
    const bot = await BotTokens.findById(ctx, link.botId)
    
    if (!bot) {
      Debug.error(ctx, `[api/channel-links/track] Бот ${link.botId} не найден`, 'E_BOT_NOT_FOUND')
      return {
        success: false,
        error: 'Бот не найден'
      }
    }
    
    // Получаем IP адрес
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    
    // Создаём ссылку для вступления в Telegram через Bot API ПЕРЕД записью в аналитику
    // Используем createChatInviteLink с именем, совпадающим с uid
    const telegramApiUrl = `https://api.telegram.org/bot${bot.token}/createChatInviteLink`
    
    let inviteLink = link.targetUrl // По умолчанию используем целевую ссылку
    
    try {
      const inviteLinkResponse = await request({
        url: telegramApiUrl,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          chat_id: link.chatId,
          name: uid.trim(), // Имя ссылки совпадает с uid
          creates_join_request: false // Прямое вступление без запроса
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (inviteLinkResponse.statusCode === 200 && inviteLinkResponse.body) {
        const inviteLinkData = inviteLinkResponse.body as any
        
        if (inviteLinkData.ok && inviteLinkData.result && inviteLinkData.result.invite_link) {
          inviteLink = inviteLinkData.result.invite_link
          Debug.info(ctx, `[api/channel-links/track] Ссылка для вступления создана: ${inviteLink}`)
        } else {
          Debug.error(ctx, `[api/channel-links/track] Неверный ответ от Telegram API: ${JSON.stringify(inviteLinkData)}`, 'E_TELEGRAM_API')
        }
      } else {
        Debug.error(ctx, `[api/channel-links/track] Ошибка создания ссылки для вступления: статус ${inviteLinkResponse.statusCode}`, 'E_TELEGRAM_API')
      }
    } catch (telegramError: any) {
      Debug.error(ctx, `[api/channel-links/track] Ошибка при запросе к Telegram API: ${telegramError.message}`, 'E_TELEGRAM_API')
      Debug.error(ctx, `[api/channel-links/track] Stack trace: ${telegramError.stack || 'N/A'}`)
    }
    
    // Записываем переход в аналитику ВМЕСТЕ с уникальной ссылкой для вступления
    const queryParamsJson = JSON.stringify(queryParams || {})
    
    await ChannelLinkAnalytics.create(ctx, {
      linkId: linkId.trim(),
      uid: uid.trim(),
      queryParams: queryParamsJson,
      inviteLink: inviteLink.trim(), // Сохраняем уникальную ссылку для вступления (с trim для консистентности)
      clickedAt: new Date(),
      userAgent: userAgent || undefined,
      ipAddress: ipAddress || undefined,
      referer: referer || undefined
    })
    
    Debug.info(ctx, `[api/channel-links/track] Переход записан в аналитику: linkId=${linkId}, uid=${uid}, inviteLink=${inviteLink}`)
    
    // Возвращаем успешный ответ с invite link
    return {
      success: true,
      inviteLink: inviteLink
    }
    
  } catch (error: any) {
    Debug.error(ctx, `[api/channel-links/track] Ошибка: ${error.message}`, 'E_TRACK_LINK')
    Debug.error(ctx, `[api/channel-links/track] Stack trace: ${error.stack || 'N/A'}`)
    
    // В случае ошибки пытаемся вернуть целевую ссылку
    try {
      const { linkId } = req.body
      if (linkId) {
        const link = await ChannelLinks.findById(ctx, linkId.trim())
        if (link) {
          return {
            success: true,
            inviteLink: link.targetUrl
          }
        }
      }
    } catch (e) {
      // Игнорируем ошибку
    }
    
    return {
      success: false,
      error: error.message || 'Ошибка при обработке перехода'
    }
  }
})

