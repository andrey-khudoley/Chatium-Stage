// @shared-route
import { requireRealUser } from '@app/auth'
import * as backlogFoldersRepo from '../../../repos/backlogFolders.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/folders/reorder'

/**
 * POST /api/my-day/folders/reorder — переупорядочить папки.
 * Body: { folderIds: string[] }
 */
export const reorderBacklogFoldersRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { folderIds?: string[] }
  const folderIds = Array.isArray(body.folderIds)
    ? body.folderIds.filter((id) => typeof id === 'string')
    : []
  if (folderIds.length === 0) return { success: false, error: 'Поле folderIds должно быть непустым массивом' }
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переупорядочивание папок`,
    payload: { userId: user.id, count: folderIds.length }
  })
  try {
    const ok = await backlogFoldersRepo.reorderForUser(ctx, user.id, folderIds)
    if (!ok) return { success: false, error: 'Одна или несколько папок не найдены или нет доступа' }
    return { success: true }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка переупорядочивания`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
