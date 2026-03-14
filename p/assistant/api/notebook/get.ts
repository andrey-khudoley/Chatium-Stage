// @shared-route
import { requireRealUser } from '@app/auth'
import * as notebookNotesRepo from '../../repos/notebookNotes.repo'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'api/notebook/get'

/**
 * GET /api/notebook/get?id= — получить заметку по id.
 * 404 если не найдена или чужая.
 */
export const getNotebookRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const id = typeof req.query?.id === 'string' ? req.query.id.trim() : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос заметки`,
    payload: { userId: user.id, id }
  })
  if (!id) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Отсутствует id`,
      payload: { query: req.query }
    })
    return { success: false, error: 'Параметр id обязателен' }
  }
  const note = await notebookNotesRepo.getByIdForUser(ctx, user.id, id)
  if (!note) {
    await loggerLib.writeServerLog(ctx, {
      severity: 5,
      message: `[${LOG_PATH}] Заметка не найдена или нет доступа`,
      payload: { userId: user.id, id }
    })
    return { success: false, error: 'Заметка не найдена' }
  }
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Заметка получена`,
    payload: { id: note.id }
  })
  return {
    success: true,
    note: {
      id: note.id,
      title: note.title,
      contentMarkdown: note.contentMarkdown,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }
  }
})
