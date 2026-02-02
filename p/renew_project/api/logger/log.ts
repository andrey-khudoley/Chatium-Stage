// @shared-route
import { requireAnyUser } from '@app/auth'
import * as loggerLib from '../../lib/logger.lib'

/**
 * POST /api/logger/log — записать серверный лог.
 * Body: { message (обязательно), severity? (0–7, по умолчанию 6), payload? (JSON с контекстом) }.
 * timestamp и уровень (level) вычисляются в lib; имя модуля при необходимости указывается в тексте message.
 * Только для авторизованных пользователей.
 *
 * Пример: { "message": "[/p/renew_project/lib] Не удалось загрузить настройки", "severity": 3, "payload": { "key": "log_level" } }
 */
export const logRoute = app.post('/', async (ctx, req) => {
  requireAnyUser(ctx)

  const body = req.body as { severity?: unknown; message?: unknown; payload?: unknown }

  const severity =
    typeof body?.severity === 'number' && Number.isFinite(body.severity)
      ? Math.max(0, Math.min(7, Math.floor(body.severity)))
      : 6
  const message = typeof body?.message === 'string' ? body.message.trim() : String(body?.message ?? '')
  const payload = body?.payload

  if (!message) {
    return { success: false, error: 'Поле message обязательно' }
  }

  try {
    await loggerLib.writeServerLog(ctx, { severity, message, payload })
    return { success: true }
  } catch (error) {
    ctx.account.log('Error writing server log', {
      level: 'error',
      json: { error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})
