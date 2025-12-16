// @shared-route
import { getPasswordHashWithSalt } from '@app/auth/provider'

/**
 * API endpoint для получения хеша пароля
 * Используется при авторизации по паролю
 * 
 * @param it Identity Type ('Phone' или 'Email')
 * @param ik Identity Key (телефон или email)
 * @param pwd Password (пароль пользователя)
 * @returns Хеш пароля в виде текста
 */
export const apiGetPasswordHashRoute = app.post('/password-hash', async (ctx, req) => {
  try {
    const { it, ik, pwd } = req.body
    
    if (!it || !ik || !pwd) {
      return ctx.text('Missing parameters', 400)
    }
    
    const hash = await getPasswordHashWithSalt(ctx, it, ik, pwd)
    return ctx.text(hash)
  } catch (error: any) {
    ctx.account.log('Failed to get password hash', {
      level: 'error',
      json: { error: error.message }
    })
    return ctx.text('Error', 500)
  }
})

