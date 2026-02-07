// @shared-route
import { nanoid } from '@app/nanoid'
import { sendDataToSocket } from '@app/socket'
import { getFullUrl } from '../../config/routes'
import { findByClarityUid } from '../../repos/botTokens.repo'
import { createSession } from '../../repos/webhookSessions.repo'
import { deleteBotWebhook, normalizeClarityUid, setBotWebhook, validateBotToken } from '../../lib/telegram.lib'

function getOriginFromUrl(url: unknown): string {
  if (typeof url !== 'string' || !url) return ''
  const s = url.trim()
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      return new URL(s).origin
    } catch {
      return ''
    }
  }
  return ''
}

export const watchTelegramGroupsRoute = app.post('/', async (ctx, req) => {
  const clarityUid = normalizeClarityUid(req.body.clarityUid)
  const socketId = typeof req.body.socketId === 'string' ? req.body.socketId.trim() : ''
  const pageUrl = typeof req.body.pageUrl === 'string' ? req.body.pageUrl.trim() : ''

  if (!clarityUid) {
    return { success: false, error: 'Параметр clarityUid обязателен' }
  }

  if (!socketId) {
    return { success: false, error: 'Параметр socketId обязателен' }
  }

  const row = await findByClarityUid(ctx, clarityUid)
  if (!row?.token) {
    await sendDataToSocket(ctx, socketId, {
      type: 'groups-status',
      data: {
        state: 'error',
        message: 'Токен не найден. Сохраните BotAPI токен.'
      }
    } as any)

    return { success: false, error: 'Токен не найден' }
  }

  try {
    const valid = await validateBotToken(row.token)
    if (!valid) {
      await sendDataToSocket(ctx, socketId, {
        type: 'groups-status',
        data: {
          state: 'error',
          message: 'Неверный BotAPI токен. Проверьте токен.'
        }
      } as any)
      return { success: false, error: 'Неверный токен' }
    }

    await deleteBotWebhook(row.token)

    const webhookId = nanoid(16)
    await createSession(ctx, {
      webhookId,
      socketId,
      clarityUid,
      token: row.token
    })

    const origin = getOriginFromUrl(pageUrl) || getOriginFromUrl(req.url)
    if (!origin) {
      await sendDataToSocket(ctx, socketId, {
        type: 'groups-status',
        data: {
          state: 'error',
          message: 'Не удалось определить URL. Передайте pageUrl в запрос.'
        }
      } as any)
      return { success: false, error: 'Не удалось определить origin' }
    }
    const webhookPath = getFullUrl('api/telegram/webhook')
    const webhookUrl = `${origin}${webhookPath}?k=${encodeURIComponent(webhookId)}`

    const set = await setBotWebhook(row.token, webhookUrl)
    if (!set) {
      await sendDataToSocket(ctx, socketId, {
        type: 'groups-status',
        data: {
          state: 'error',
          message: 'Не удалось зарегистрировать webhook. Проверьте доступность URL.'
        }
      } as any)
      return { success: false, error: 'Не удалось установить webhook' }
    }

    await sendDataToSocket(ctx, socketId, {
      type: 'groups-status',
      data: {
        state: 'watching',
        message: 'Ожидаю появление каналов и групп. Отправьте любое сообщение в Telegram-чате, где бот администратор.'
      }
    } as any)

    return {
      success: true,
      found: false
    }
  } catch (error) {
    await sendDataToSocket(ctx, socketId, {
      type: 'groups-status',
      data: {
        state: 'error',
        message: `Ошибка: ${String((error as Error)?.message || error)}`
      }
    } as any)

    return {
      success: false,
      error: String((error as Error)?.message || error)
    }
  }
})
