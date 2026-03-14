// @shared-route
import { requireRealUser } from '@app/auth'
import * as backlogFoldersRepo from '../../../repos/backlogFolders.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/folders/update'

/**
 * POST /api/my-day/folders/update — переименовать папку.
 * Body: { id: string, name?: string }
 */
export const updateBacklogFolderRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { id?: string; name?: string }
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return { success: false, error: 'Поле id обязательно' }
  const name = typeof body.name === 'string' ? body.name.trim() : undefined
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Обновление папки`,
    payload: { userId: user.id, folderId: id }
  })
  try {
    const folder = await backlogFoldersRepo.updateForUser(ctx, user.id, id, {
      name: name !== undefined ? name || 'Папка' : undefined
    })
    if (!folder) return { success: false, error: 'Папка не найдена или нет доступа' }
    return {
      success: true,
      folder: { id: folder.id, name: folder.name, sortOrder: folder.sortOrder }
    }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка обновления`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
