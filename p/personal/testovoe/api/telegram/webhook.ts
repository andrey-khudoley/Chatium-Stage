// @shared-route
// Webhook-эндпоинт для приёма апдейтов от Telegram. Telegram POST'ит сюда при новых сообщениях.
import { sendDataToSocket } from '@app/socket'
import { findByWebhookId, updateAccumulatedChats } from '../../repos/webhookSessions.repo'
import { parseChatFromUpdate } from '../../lib/telegram.lib'

function mergeChats(
  acc: { id: string; title: string; username: string | null; active: boolean; channelId: string | null }[],
  newChat: { id: string; title: string; username: string | null; active: boolean; channelId: string | null }
): typeof acc {
  const byId = new Map(acc.map((c) => [c.id, c]))
  byId.set(newChat.id, newChat)
  return Array.from(byId.values())
}

export const telegramWebhookRoute = app.post('/', async (ctx, req) => {
  const webhookId = typeof req.query?.k === 'string' ? req.query.k.trim() : ''
  if (!webhookId) {
    return ctx.resp.status(400).text('Missing k')
  }

  const session = await findByWebhookId(ctx, webhookId)
  if (!session) {
    return ctx.resp.status(200).text('')
  }

  const update = req.body
  if (!update || typeof update !== 'object') {
    return ctx.resp.status(200).text('')
  }

  const updateType = update.message
    ? 'message'
    : update.edited_message
      ? 'edited_message'
      : update.channel_post
        ? 'channel_post'
        : update.edited_channel_post
          ? 'edited_channel_post'
          : update.callback_query
            ? 'callback_query'
            : update.my_chat_member
              ? 'my_chat_member'
              : 'other'
  const msg = update.message ?? update.edited_message ?? update.channel_post ?? update.edited_channel_post
  const textPreview =
    msg?.text ?? msg?.caption ?? (msg?.photo ? '[фото]' : msg?.document ? '[документ]' : msg?.video ? '[видео]' : null)
  const chat = parseChatFromUpdate(update)

  await sendDataToSocket(ctx, session.socketId, {
    type: 'webhook-incoming',
    data: {
      updateType,
      chatTitle: chat?.title ?? '-',
      chatId: chat?.id ?? '-',
      textPreview: typeof textPreview === 'string' ? textPreview.slice(0, 80) : textPreview ?? '-',
      timestamp: Date.now()
    }
  } as any)

  if (!chat) {
    return ctx.resp.status(200).text('')
  }

  const prev = Array.isArray(session.accumulatedChats) ? session.accumulatedChats : []
  const accumulated = mergeChats(prev, chat)
  await updateAccumulatedChats(ctx, session.id, accumulated)

  await sendDataToSocket(ctx, session.socketId, {
    type: 'groups-update',
    data: { groups: accumulated }
  } as any)

  await sendDataToSocket(ctx, session.socketId, {
    type: 'groups-status',
    data: {
      state: 'ready',
      message: `Найдено чатов: ${accumulated.length}`
    }
  } as any)

  return ctx.resp.status(200).text('')
})
