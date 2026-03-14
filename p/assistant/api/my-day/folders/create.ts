// @shared-route
import { requireRealUser } from '@app/auth'
import * as backlogFoldersRepo from '../../../repos/backlogFolders.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/folders/create'

/**
 * POST /api/my-day/folders/create — создать папку бэклога.
 * Body: { name: string }
 */
export const createBacklogFolderRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { name?: string }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Создание папки`,
    payload: { userId: user.id, name: name.slice(0, 50) }
  })
  try {
    const folder = await backlogFoldersRepo.createForUser(ctx, user.id, {
      name: name || 'Папка'
    })
    return {
      success: true,
      folder: { id: folder.id, name: folder.name, sortOrder: folder.sortOrder }
    }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка создания`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
