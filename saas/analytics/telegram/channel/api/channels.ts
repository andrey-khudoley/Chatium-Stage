// @shared-route

import { requireRealUser } from '@app/auth'
import { TelegramChats } from '../tables/chats.table'
import { BotTokens } from '../tables/bot-tokens.table'
import { Debug } from '../shared/debug'
import { applyDebugLevel } from '../lib/logging'

/**
 * GET /api/channels/list
 * Получение списка каналов текущего пользователя для селекта
 */
export const apiGetChannelsListRoute = app.get('/list', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/channels/list')
    Debug.info(ctx, '[api/channels/list] Начало обработки запроса')
    
    requireRealUser(ctx)
    Debug.info(ctx, `[api/channels/list] Пользователь авторизован: userId=${ctx.user.id}`)
    
    // Получаем только каналы (chatType === 'channel')
    const channels = await TelegramChats.findAll(ctx, {
      where: {
        userId: ctx.user.id,
        chatType: 'channel'
      },
      order: { lastSeenAt: 'desc' },
      limit: 200
    })
    
    Debug.info(ctx, `[api/channels/list] Найдено каналов: ${channels?.length || 0}`)
    
    // Для каждого канала получаем информацию о боте
    const channelsWithBotInfo = []
    if (channels && channels.length > 0) {
      for (const channel of channels) {
        try {
          const bot = await BotTokens.findById(ctx, channel.botId)
          
          channelsWithBotInfo.push({
            chatId: channel.chatId,
            chatTitle: channel.chatTitle || channel.chatUsername || 'Без названия',
            chatUsername: channel.chatUsername || null,
            botId: channel.botId,
            botName: bot?.botName || bot?.botUsername || 'Неизвестный бот'
          })
        } catch (botError: any) {
          Debug.error(ctx, `[api/channels/list] Ошибка получения информации о боте для канала ${channel.chatId}: ${botError.message}`)
          // Добавляем канал без информации о боте
          channelsWithBotInfo.push({
            chatId: channel.chatId,
            chatTitle: channel.chatTitle || channel.chatUsername || 'Без названия',
            chatUsername: channel.chatUsername || null,
            botId: channel.botId,
            botName: 'Ошибка загрузки'
          })
        }
      }
    }
    
    return {
      success: true,
      channels: channelsWithBotInfo
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/channels/list] Ошибка: ${error.message}`, 'E_GET_CHANNELS_LIST')
    Debug.error(ctx, `[api/channels/list] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при получении списка каналов'
    }
  }
})

