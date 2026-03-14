import BacklogFolders, { type BacklogFolderRow } from '../tables/backlog_folders.table'

/**
 * Репозиторий папок бэклога.
 * Все операции привязаны к userId.
 */

export async function listByUser(
  ctx: app.Ctx,
  userId: string
): Promise<BacklogFolderRow[]> {
  return BacklogFolders.findAll(ctx, {
    where: { userId },
    order: [{ sortOrder: 'asc' }],
    limit: 200
  })
}

export async function getMaxSortOrder(ctx: app.Ctx, userId: string): Promise<number> {
  const rows = await BacklogFolders.findAll(ctx, {
    where: { userId },
    order: [{ sortOrder: 'desc' }],
    limit: 1
  })
  return rows[0]?.sortOrder ?? -1
}

export async function createForUser(
  ctx: app.Ctx,
  userId: string,
  payload: { name: string }
): Promise<BacklogFolderRow> {
  const nextOrder = (await getMaxSortOrder(ctx, userId)) + 1
  return BacklogFolders.create(ctx, {
    userId,
    name: payload.name.trim() || 'Папка',
    sortOrder: nextOrder
  })
}

export async function getByIdForUser(
  ctx: app.Ctx,
  userId: string,
  folderId: string
): Promise<BacklogFolderRow | null> {
  const row = await BacklogFolders.findById(ctx, folderId)
  if (!row || row.userId !== userId) return null
  return row
}

export async function updateForUser(
  ctx: app.Ctx,
  userId: string,
  folderId: string,
  payload: { name?: string; sortOrder?: number }
): Promise<BacklogFolderRow | null> {
  const row = await getByIdForUser(ctx, userId, folderId)
  if (!row) return null
  const updates: Partial<BacklogFolderRow> = {}
  if (payload.name !== undefined) updates.name = payload.name.trim() || 'Папка'
  if (payload.sortOrder !== undefined) updates.sortOrder = payload.sortOrder
  if (Object.keys(updates).length === 0) return row
  await BacklogFolders.update(ctx, { id: folderId, ...updates })
  return BacklogFolders.findById(ctx, folderId)
}

export async function deleteForUser(
  ctx: app.Ctx,
  userId: string,
  folderId: string
): Promise<boolean> {
  const row = await getByIdForUser(ctx, userId, folderId)
  if (!row) return false
  await BacklogFolders.delete(ctx, folderId)
  return true
}

/**
 * Переупорядочивание папок: задаёт sortOrder по порядку folderIds (индекс = sortOrder).
 */
export async function reorderForUser(
  ctx: app.Ctx,
  userId: string,
  folderIds: string[]
): Promise<boolean> {
  for (let i = 0; i < folderIds.length; i++) {
    const row = await getByIdForUser(ctx, userId, folderIds[i])
    if (!row) return false
    await BacklogFolders.update(ctx, { id: folderIds[i], sortOrder: i })
  }
  return true
}
