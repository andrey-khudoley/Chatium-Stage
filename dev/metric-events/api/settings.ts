import { persistLogLevel, applyDebugLevel, getCachedLogLevel, parseDebugLevel } from '../lib/logging'

/**
 * Получить текущий уровень логирования.
 */
export const apiGetLogLevelRoute = app.get('api/settings/log-level', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'get-log-level')
    const level = getCachedLogLevel()
    return { success: true, level }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Неизвестная ошибка', level: 'info' }
  }
})

/**
 * Установить уровень логирования.
 */
export const apiSetLogLevelRoute = app.post('api/settings/log-level', async (ctx, req) => {
  try {
    // Подробное логирование для диагностики
    ctx.account.log('DEBUG: apiSetLogLevelRoute вызван', {
      json: {
        reqExists: !!req,
        reqType: typeof req,
        reqKeys: req ? Object.keys(req) : [],
        reqBody: req?.body,
        reqBodyType: typeof req?.body,
        ctxRequestExists: !!ctx.request,
        ctxRequestType: typeof ctx.request,
        ctxRequestKeys: ctx.request ? Object.keys(ctx.request) : [],
        ctxRequestBody: ctx.request?.body,
      }
    })
    
    // Пробуем получить level из разных источников
    let level: string | undefined
    
    if (req?.body?.level) {
      level = req.body.level
      ctx.account.log('DEBUG: level из req.body', { json: { level } })
    } else if (ctx.request?.body?.level) {
      level = ctx.request.body.level
      ctx.account.log('DEBUG: level из ctx.request.body', { json: { level } })
    } else if (req && typeof req === 'object' && 'level' in req) {
      level = (req as any).level
      ctx.account.log('DEBUG: level из req напрямую', { json: { level } })
    } else {
      // Пробуем получить из query параметров
      level = req?.query?.level || ctx.request?.query?.level
      ctx.account.log('DEBUG: level из query', { json: { level } })
    }
    
    if (!level) {
      ctx.account.log('ERROR: level не найден', {
        json: {
          req: req,
          ctxRequest: ctx.request,
          allReqKeys: req ? Object.keys(req) : [],
          allCtxRequestKeys: ctx.request ? Object.keys(ctx.request) : [],
        }
      })
      return { success: false, error: 'Параметр level не найден в запросе' }
    }
    
    const normalizedLevel = parseDebugLevel(level)
    ctx.account.log('DEBUG: нормализованный уровень', { json: { normalizedLevel } })
    
    await persistLogLevel(ctx, normalizedLevel)
    return { success: true, level: normalizedLevel, message: 'Уровень логирования обновлён' }
  } catch (error: any) {
    ctx.account.log('Ошибка установки уровня логирования', {
      json: {
        error: error?.message || error,
        stack: error?.stack,
        req: req,
        ctxRequest: ctx.request,
      }
    })
    return { success: false, error: error?.message || 'Неизвестная ошибка' }
  }
})
