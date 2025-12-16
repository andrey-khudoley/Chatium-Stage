// @shared-route

import { requireRealUser } from '@app/auth'
import { BotTokens } from '../tables/bot-tokens.table'
import { Debug } from '../shared/debug'
import { applyDebugLevel } from '../lib/logging'

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
