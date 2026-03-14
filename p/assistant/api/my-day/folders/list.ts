// @shared-route
import { requireRealUser } from '@app/auth'
import * as backlogFoldersRepo from '../../../repos/backlogFolders.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/folders/list'

/**
 * GET /api/my-day/folders/list — список папок бэклога (отсортированы по sortOrder).
 */
export const listBacklogFoldersRoute = app.get('/', async (ctx) => {
  const user = requireRealUser(ctx)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос списка папок`,
    payload: { userId: user.id }
  })
  try {
    const folders = await backlogFoldersRepo.listByUser(ctx, user.id)
    return {
      success: true,
      folders: folders.map((f) => ({ id: f.id, name: f.name, sortOrder: f.sortOrder }))
    }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
