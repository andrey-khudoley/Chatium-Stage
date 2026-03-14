// @shared-route
import { requireRealUser } from '@app/auth'
import * as backlogFoldersRepo from '../../../repos/backlogFolders.repo'
import * as myDayTasksRepo from '../../../repos/myDayTasks.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/folders/delete'

/**
 * POST /api/my-day/folders/delete — удалить папку.
 * Задачи с этой папкой остаются с folderId=null (без папки).
 * Body: { id: string }
 */
export const deleteBacklogFolderRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { id?: string }
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return { success: false, error: 'Поле id обязательно' }
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Удаление папки`,
    payload: { userId: user.id, folderId: id }
  })
  try {
    const tasksInFolder = await myDayTasksRepo.listBacklogByUser(ctx, user.id, id)
    for (const t of tasksInFolder) {
      await myDayTasksRepo.updateForUser(ctx, user.id, t.id, { folderId: null })
    }
    const ok = await backlogFoldersRepo.deleteForUser(ctx, user.id, id)
    if (!ok) return { success: false, error: 'Папка не найдена или нет доступа' }
    return { success: true }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка удаления`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
