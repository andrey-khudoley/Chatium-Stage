import { request } from '@app/request'

export const TELEGRAM_MESSAGE_LIMIT = 4096
export const TELEGRAM_MAX_SPLIT_MESSAGES = 3

const BOT_API_BASE = 'https://api.telegram.org/bot'
const BOT_TOKEN_REGEX = /^\d{6,12}:[A-Za-z0-9_-]{20,}$/
const INVALID_CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export type TelegramGroup = {
  id: string
  title: string
  username: string | null
  active: boolean
  channelId: string | null
}

export function normalizeClarityUid(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

export function normalizeBotToken(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : ''
}

export function isValidBotToken(token: string): boolean {
  return BOT_TOKEN_REGEX.test(token)
}

export function validateTextForTelegram(rawText: unknown): { ok: true; text: string } | { ok: false; error: string } {
  const text = typeof rawText === 'string' ? rawText.replace(/\r\n/g, '\n').trim() : ''

  if (!text) {
    return { ok: false, error: 'Введите текст сообщения или загрузите .txt файл' }
  }

  const invalidChars = Array.from(text.matchAll(INVALID_CONTROL_CHARS_REGEX)).slice(0, 5)
  if (invalidChars.length > 0) {
    const preview = invalidChars
      .map((m) => `U+${(m[0].charCodeAt(0) || 0).toString(16).toUpperCase().padStart(4, '0')}`)
      .join(', ')
    return {
      ok: false,
      error: `Текст содержит недопустимые управляющие символы: ${preview}`
    }
  }

  return { ok: true, text }
}

export function splitTelegramText(text: string): { ok: true; parts: string[] } | { ok: false; error: string } {
  if (text.length <= TELEGRAM_MESSAGE_LIMIT) {
    return { ok: true, parts: [text] }
  }

  const parts: string[] = []
  let rest = text

  while (rest.length > 0) {
    if (parts.length >= TELEGRAM_MAX_SPLIT_MESSAGES) {
      return {
        ok: false,
        error: `Текст слишком длинный: максимум ${TELEGRAM_MAX_SPLIT_MESSAGES} сообщения по ${TELEGRAM_MESSAGE_LIMIT} символов`
      }
    }

    if (rest.length <= TELEGRAM_MESSAGE_LIMIT) {
      parts.push(rest)
      break
    }

    const windowText = rest.slice(0, TELEGRAM_MESSAGE_LIMIT)

    let splitAt = Math.max(
      windowText.lastIndexOf('\n\n'),
      windowText.lastIndexOf('\n'),
      windowText.lastIndexOf(' ')
    )

    if (splitAt < Math.floor(TELEGRAM_MESSAGE_LIMIT * 0.25)) {
      splitAt = TELEGRAM_MESSAGE_LIMIT
    }

    if (splitAt <= 0) {
      splitAt = TELEGRAM_MESSAGE_LIMIT
    }

    const rawPart = rest.slice(0, splitAt)
    const part = rawPart.trim()

    if (!part) {
      const fallback = rest.slice(0, TELEGRAM_MESSAGE_LIMIT)
      parts.push(fallback)
      rest = rest.slice(fallback.length)
      continue
    }

    parts.push(part)
    rest = rest.slice(rawPart.length).trimStart()
  }

  if (parts.length > TELEGRAM_MAX_SPLIT_MESSAGES) {
    return {
      ok: false,
      error: `Текст слишком длинный: максимум ${TELEGRAM_MAX_SPLIT_MESSAGES} сообщения по ${TELEGRAM_MESSAGE_LIMIT} символов`
    }
  }

  return { ok: true, parts }
}

/** Проверяет токен через Bot API getMe */
export async function validateBotToken(token: string): Promise<boolean> {
  const url = `${BOT_API_BASE}${encodeURIComponent(token)}/getMe`
  try {
    const raw = await request({ url, responseType: 'json', throwHttpErrors: false }) as any
    const data = raw?.body ?? raw
    return data?.ok === true || !!data?.result
  } catch {
    return false
  }
}

/** Удаляет webhook бота */
export async function deleteBotWebhook(token: string): Promise<void> {
  const url = `${BOT_API_BASE}${encodeURIComponent(token)}/deleteWebhook`
  await request({ url, responseType: 'json', throwHttpErrors: false })
}

/** Устанавливает webhook — Telegram будет POSTить апдейты на указанный URL */
export async function setBotWebhook(token: string, webhookUrl: string): Promise<boolean> {
  const url = `${BOT_API_BASE}${encodeURIComponent(token)}/setWebhook`
  const raw = await request({
    url,
    method: 'POST',
    json: { url: webhookUrl },
    responseType: 'json',
    throwHttpErrors: false
  }) as any
  const data = raw?.body ?? raw
  return data?.ok === true
}

/** Извлекает чат из апдейта Telegram (message, channel_post и т.д.) */
export function parseChatFromUpdate(update: any): TelegramGroup | null {
  const msg = update?.message ?? update?.edited_message ?? update?.channel_post ?? update?.edited_channel_post
  const chat = msg?.chat
  if (!chat || chat.id == null) return null

  const id = String(chat.id)
  const title = chat.title ?? chat.first_name ?? chat.username ?? id
  const username = chat.username ? String(chat.username) : null
  const type = chat.type ?? ''

  return {
    id,
    title: String(title),
    username,
    active: ['group', 'supergroup', 'channel'].includes(type),
    channelId: id
  }
}

/** Извлекает чаты из getUpdates и возвращает следующий offset */
export async function fetchChatsFromUpdates(
  token: string,
  offset: number
): Promise<{ chats: TelegramGroup[]; nextOffset: number }> {
  const params = new URLSearchParams()
  params.set('offset', String(offset))
  params.set('timeout', '3')

  const url = `${BOT_API_BASE}${encodeURIComponent(token)}/getUpdates?${params}`
  const data = (await request({ url, responseType: 'json' })) as { ok?: boolean; result?: any[] }

  const chats: TelegramGroup[] = []
  let nextOffset = offset

  if (!data?.ok || !Array.isArray(data.result)) {
    return { chats, nextOffset }
  }

  for (const update of data.result) {
    if (update.update_id != null) {
      nextOffset = Math.max(nextOffset, update.update_id + 1)
    }

    const msg = update.message ?? update.edited_message ?? update.channel_post ?? update.edited_channel_post
    const chat = msg?.chat
    if (!chat || chat.id == null) continue

    const id = String(chat.id)
    const title = chat.title ?? chat.first_name ?? chat.username ?? id
    const username = chat.username ? String(chat.username) : null
    const type = chat.type ?? ''

    chats.push({
      id,
      title: String(title),
      username,
      active: ['group', 'supergroup', 'channel'].includes(type),
      channelId: id
    })
  }

  return { chats, nextOffset }
}

/** Отправляет сообщение через Bot API */
export async function sendMessageViaBotApi(
  token: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `${BOT_API_BASE}${encodeURIComponent(token)}/sendMessage`

  try {
    const data = (await request({
      url,
      method: 'POST',
      json: { chat_id: chatId, text },
      responseType: 'json'
    })) as { ok?: boolean; description?: string }
    return { ok: data?.ok === true, error: data?.description }
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e) }
  }
}

/** Отправляет части текста в чат с паузой между сообщениями */
export async function sendPartsToTelegramChat(
  token: string,
  chatId: string,
  parts: string[]
): Promise<void> {
  const delay = (globalThis as any).setTimeout

  for (let i = 0; i < parts.length; i++) {
    const result = await sendMessageViaBotApi(token, chatId, parts[i])
    if (!result.ok) {
      throw new Error(result.error ?? 'Ошибка отправки в Telegram')
    }

    if (i < parts.length - 1 && delay) {
      await new Promise((resolve) => delay(resolve, 250))
    }
  }
}
