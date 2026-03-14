import MyDayTasks, { type MyDayTaskRow } from '../tables/my_day_tasks.table'

/**
 * Репозиторий задач «Мой день» (главные, дополнительные, бэклог).
 * Все операции привязаны к userId.
 */

export type TaskSection = 'main' | 'additional' | 'backlog'

export async function listForDay(
  ctx: app.Ctx,
  userId: string,
  date: string,
  section: 'main' | 'additional'
): Promise<MyDayTaskRow[]> {
  return MyDayTasks.findAll(ctx, {
    where: { userId, section, date },
    order: [{ sortOrder: 'asc' }],
    limit: 500
  })
}

export async function listBacklogByUser(
  ctx: app.Ctx,
  userId: string,
  folderId?: string | null
): Promise<MyDayTaskRow[]> {
  const where: Record<string, unknown> = { userId, section: 'backlog' }
  if (folderId !== undefined && folderId !== null) {
    where.folderId = folderId
  } else {
    where.folderId = null
  }
  return MyDayTasks.findAll(ctx, {
    where,
    order: [{ sortOrder: 'asc' }],
    limit: 500
  })
}

export async function listAllBacklogByUser(
  ctx: app.Ctx,
  userId: string
): Promise<MyDayTaskRow[]> {
  return MyDayTasks.findAll(ctx, {
    where: { userId, section: 'backlog' },
    order: [{ sortOrder: 'asc' }],
    limit: 500
  })
}

export async function getMaxSortOrderForContext(
  ctx: app.Ctx,
  userId: string,
  section: TaskSection,
  date?: string | null,
  folderId?: string | null
): Promise<number> {
  const where: Record<string, unknown> = { userId, section }
  if (section === 'backlog') {
    where.folderId = folderId ?? null
  } else {
    where.date = date ?? ''
  }
  const rows = await MyDayTasks.findAll(ctx, {
    where,
    order: [{ sortOrder: 'desc' }],
    limit: 1
  })
  return rows[0]?.sortOrder ?? -1
}

export async function createForUser(
  ctx: app.Ctx,
  userId: string,
  payload: {
    section: TaskSection
    date?: string | null
    folderId?: string | null
    title: string
    sortOrder?: number
  }
): Promise<MyDayTaskRow> {
  let sortOrder = payload.sortOrder
  if (sortOrder === undefined) {
    sortOrder =
      (await getMaxSortOrderForContext(
        ctx,
        userId,
        payload.section,
        payload.date,
        payload.folderId
      )) + 1
  }
  return MyDayTasks.create(ctx, {
    userId,
    section: payload.section,
    date: payload.section === 'backlog' ? undefined : payload.date ?? undefined,
    folderId: payload.section === 'backlog' ? payload.folderId ?? undefined : undefined,
    title: payload.title.trim() || 'Задача',
    sortOrder
  })
}

export async function getByIdForUser(
  ctx: app.Ctx,
  userId: string,
  taskId: string
): Promise<MyDayTaskRow | null> {
  const row = await MyDayTasks.findById(ctx, taskId)
  if (!row || row.userId !== userId) return null
  return row
}

export async function updateForUser(
  ctx: app.Ctx,
  userId: string,
  taskId: string,
  payload: {
    title?: string
    completedAt?: Date | null
    section?: TaskSection
    date?: string | null
    folderId?: string | null
    sortOrder?: number
  }
): Promise<MyDayTaskRow | null> {
  const row = await getByIdForUser(ctx, userId, taskId)
  if (!row) return null
  const updates: Partial<MyDayTaskRow> = {}
  if (payload.title !== undefined) updates.title = payload.title.trim() || 'Задача'
  if (payload.completedAt !== undefined) updates.completedAt = payload.completedAt ?? undefined
  if (payload.section !== undefined) updates.section = payload.section
  if (payload.date !== undefined) updates.date = payload.date ?? undefined
  if (payload.folderId !== undefined) updates.folderId = payload.folderId ?? undefined
  if (payload.sortOrder !== undefined) updates.sortOrder = payload.sortOrder
  if (Object.keys(updates).length === 0) return row
  await MyDayTasks.update(ctx, { id: taskId, ...updates })
  return MyDayTasks.findById(ctx, taskId)
}

export async function deleteForUser(
  ctx: app.Ctx,
  userId: string,
  taskId: string
): Promise<boolean> {
  const row = await getByIdForUser(ctx, userId, taskId)
  if (!row) return false
  await MyDayTasks.delete(ctx, taskId)
  return true
}

/**
 * Переупорядочивание задач: задаёт sortOrder по порядку taskIds (индекс = sortOrder).
 * Все задачи должны принадлежать userId и соответствовать section/date/folderId.
 */
export async function reorderForUser(
  ctx: app.Ctx,
  userId: string,
  section: TaskSection,
  taskIds: string[],
  date?: string | null,
  folderId?: string | null
): Promise<boolean> {
  for (let i = 0; i < taskIds.length; i++) {
    const row = await getByIdForUser(ctx, userId, taskIds[i])
    if (!row) return false
    if (row.section !== section) return false
    if (section !== 'backlog' && row.date !== date) return false
    if (section === 'backlog' && (row.folderId ?? null) !== (folderId ?? null)) return false
    await MyDayTasks.update(ctx, { id: taskIds[i], sortOrder: i })
  }
  return true
}
