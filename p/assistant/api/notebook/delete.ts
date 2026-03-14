// @shared-route
import { requireRealUser } from '@app/auth'
import * as notebookNotesRepo from '../../repos/notebookNotes.repo'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'api/notebook/delete'

/**
 * POST /api/notebook/delete — удалить заметку.
 * Body: { id: string }
 */
export const deleteNotebookRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { id?: string }
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос удаления`,
    payload: { userId: user.id, id }
  })
  if (!id) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Отсутствует id`,
      payload: {}
    })
    return { success: false, error: 'Параметр id обязателен' }
  }
  const deleted = await notebookNotesRepo.deleteForUser(ctx, user.id, id)
  if (!deleted) {
    await loggerLib.writeServerLog(ctx, {
      severity: 5,
      message: `[${LOG_PATH}] Заметка не найдена или нет доступа`,
      payload: { userId: user.id, id }
    })
    return { success: false, error: 'Заметка не найдена' }
  }
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Заметка удалена`,
    payload: { id }
  })
  return { success: true }
})
