import NotebookNotes, { type NotebookNoteRow } from '../tables/notebook_notes.table'

/**
 * Репозиторий заметок блокнота.
 * Все операции привязаны к userId — доступ только к своим заметкам.
 */

export interface CreateNotePayload {
  title: string
  contentMarkdown: string
}

export interface UpdateNotePayload {
  title?: string
  contentMarkdown?: string
}

export async function listByUser(
  ctx: app.Ctx,
  userId: string
): Promise<NotebookNoteRow[]> {
  const rows = await NotebookNotes.findAll(ctx, {
    where: { userId },
    order: [{ updatedAt: 'desc' }],
    limit: 500
  })
  return rows
}

export async function getByIdForUser(
  ctx: app.Ctx,
  userId: string,
  noteId: string
): Promise<NotebookNoteRow | null> {
  const row = await NotebookNotes.findById(ctx, noteId)
  if (!row || row.userId !== userId) return null
  return row
}

export async function createForUser(
  ctx: app.Ctx,
  userId: string,
  payload: CreateNotePayload
): Promise<NotebookNoteRow> {
  return NotebookNotes.create(ctx, {
    userId,
    title: payload.title.trim() || 'Без названия',
    contentMarkdown: payload.contentMarkdown ?? ''
    // createdAt, updatedAt задаёт Heap
  })
}

export async function updateForUser(
  ctx: app.Ctx,
  userId: string,
  noteId: string,
  payload: UpdateNotePayload
): Promise<NotebookNoteRow | null> {
  const row = await getByIdForUser(ctx, userId, noteId)
  if (!row) return null
  const updates: Partial<NotebookNoteRow> = {}
  if (payload.title !== undefined) updates.title = payload.title.trim() || 'Без названия'
  if (payload.contentMarkdown !== undefined) updates.contentMarkdown = payload.contentMarkdown
  await NotebookNotes.update(ctx, noteId, updates)
  // updatedAt обновляет Heap
  return NotebookNotes.findById(ctx, noteId)
}

export async function deleteForUser(
  ctx: app.Ctx,
  userId: string,
  noteId: string
): Promise<boolean> {
  const row = await getByIdForUser(ctx, userId, noteId)
  if (!row) return false
  await NotebookNotes.delete(ctx, noteId)
  return true
}
