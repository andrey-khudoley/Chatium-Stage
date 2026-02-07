// @shared-route
import { findByClarityUid } from '../../repos/botTokens.repo'
import {
  normalizeClarityUid,
  sendPartsToTelegramChat,
  splitTelegramText,
  validateBotToken,
  validateTextForTelegram
} from '../../lib/telegram.lib'

export const sendTelegramTextRoute = app.post('/', async (ctx, req) => {
  const clarityUid = normalizeClarityUid(req.body.clarityUid)
  const chatId = typeof req.body.chatId === 'string' ? req.body.chatId.trim() : ''

  if (!clarityUid) {
    return { success: false, error: 'Параметр clarityUid обязателен' }
  }

  if (!chatId) {
    return { success: false, error: 'Выберите канал или группу для отправки' }
  }

  const row = await findByClarityUid(ctx, clarityUid)
  if (!row?.token) {
    return { success: false, error: 'Токен не найден. Сохраните BotAPI токен.' }
  }

  const textCheck = validateTextForTelegram(req.body.text)
  if (!textCheck.ok) {
    return { success: false, error: textCheck.error }
  }

  const splitCheck = splitTelegramText(textCheck.text)
  if (!splitCheck.ok) {
    return { success: false, error: splitCheck.error }
  }

  try {
    const valid = await validateBotToken(row.token)
    if (!valid) {
      return { success: false, error: 'Неверный BotAPI токен. Проверьте токен.' }
    }

    await sendPartsToTelegramChat(row.token, chatId, splitCheck.parts)

    return {
      success: true,
      sentCount: splitCheck.parts.length,
      targetTitle: chatId
    }
  } catch (error) {
    return {
      success: false,
      error: String((error as Error)?.message || error)
    }
  }
})
