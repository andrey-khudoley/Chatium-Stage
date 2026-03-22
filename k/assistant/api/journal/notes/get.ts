// @shared-route
import { requireRealUser } from '@app/auth'
import * as loggerLib from '../../../lib/logger.lib'
import * as journalNotesRepo from '../../../repos/journal-notes.repo'

const LOG_PATH = 'api/journal/notes/get'

/**
 * GET /api/journal/notes/get?id= — одна заметка (id, title, content) владельца.
 */
export const getJournalNoteRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос заметки`,
    payload: {}
  })

  const idRaw = req.query.id
  const id = typeof idRaw === 'string' ? idRaw.trim() : ''
  if (!id) {
    return { success: false, error: 'Параметр id обязателен' }
  }

  try {
    const row = await journalNotesRepo.findByIdForUser(ctx, user.id, id)
    if (!row) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] Заметка не найдена или чужая`,
        payload: { id }
      })
      return { success: false, error: 'Заметка не найдена' }
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] Заметка отдана`,
      payload: { id }
    })
    return {
      success: true,
      note: { id: row.id, title: row.title, content: row.content }
    }
  } catch (error) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка чтения заметки`,
      payload: { error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})
