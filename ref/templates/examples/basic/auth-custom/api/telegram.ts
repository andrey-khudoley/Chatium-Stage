import { getTelegramOauthUrl } from '@users/sdk/auth'

// @shared-route
/**
 * API endpoint для получения URL авторизации через Telegram
 * 
 * @param back URL для редиректа после успешной авторизации (опционально)
 * @returns OAuth URL для Telegram
 */
export const getTelegramOauthUrlRoute = app
  .body(s => ({
    back: s.string().optional()
  }))
  .result(s => s.string())
  .post('/get-telegram-oauth-url', async (ctx, req) => {
    const { back } = req.body

    const oauthUrl = await getTelegramOauthUrl(ctx, { back })

    return oauthUrl
  })

