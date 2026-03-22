import JournalNotes, { type JournalNotesRow } from '../tables/journal-notes.table'

/**
 * Краткое представление заметки для списка (без содержимого в UI).
 */
export type JournalNoteSummary = { id: string; title: string }

export async function findSummariesByUserId(ctx: app.Ctx, userId: string): Promise<JournalNoteSummary[]> {
  const rows = await JournalNotes.findAll(ctx, {
    where: { userId },
    order: [{ createdAt: 'desc' }]
  })
  return rows.map((row) => ({ id: row.id, title: row.title }))
}

export async function createForUser(
  ctx: app.Ctx,
  userId: string,
  data: { title: string; content: string }
): Promise<JournalNotesRow> {
  return JournalNotes.create(ctx, {
    userId,
    title: data.title,
    content: data.content
  })
}

export async function findByIdForUser(
  ctx: app.Ctx,
  userId: string,
  id: string
): Promise<JournalNotesRow | null> {
  const row = await JournalNotes.findById(ctx, id)
  if (!row || row.userId !== userId) {
    return null
  }
  return row
}

export async function updateForUser(
  ctx: app.Ctx,
  userId: string,
  id: string,
  data: { title: string; content: string }
): Promise<JournalNotesRow | null> {
  const existing = await findByIdForUser(ctx, userId, id)
  if (!existing) {
    return null
  }
  return JournalNotes.update(ctx, { id, title: data.title, content: data.content })
}

export async function deleteByIdForUser(ctx: app.Ctx, userId: string, id: string): Promise<boolean> {
  const existing = await findByIdForUser(ctx, userId, id)
  if (!existing) {
    return false
  }
  await JournalNotes.delete(ctx, id)
  return true
}
