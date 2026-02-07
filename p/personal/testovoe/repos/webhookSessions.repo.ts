import WebhookSessions, { type WebhookSessionsRow } from '../tables/webhookSessions.table'

export async function createSession(
  ctx: app.Ctx,
  data: {
    webhookId: string
    socketId: string
    clarityUid: string
    token: string
  }
): Promise<WebhookSessionsRow> {
  const row = await WebhookSessions.create(ctx, {
    ...data,
    accumulatedChats: [],
    createdTs: Date.now()
  })
  return row
}

export async function findByWebhookId(
  ctx: app.Ctx,
  webhookId: string
): Promise<WebhookSessionsRow | null> {
  return WebhookSessions.findOneBy(ctx, { webhookId })
}

export async function updateAccumulatedChats(
  ctx: app.Ctx,
  id: string,
  chats: { id: string; title: string; username: string | null; active: boolean; channelId: string | null }[]
): Promise<void> {
  await WebhookSessions.update(ctx, id, { accumulatedChats: chats })
}
