// @shared-route
import { requireRealUser } from '@app/auth'
import * as loggerLib from '../../../lib/logger.lib'
import * as journalNotesRepo from '../../../repos/journal-notes.repo'

const LOG_PATH = 'api/journal/notes/update'

/**
 * POST /api/journal/notes/update — обновить title и content своей заметки.
 */
export const updateJournalNoteRoute = app
  .body((s) => ({
    id: s.string(),
    title: s.string(),
    content: s.string()
  }))
  .post('/', async (ctx, req) => {
    const user = requireRealUser(ctx)

    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Запрос обновления заметки`,
      payload: {}
    })

    const title = req.body.title.trim() !== '' ? req.body.title.trim() : 'Без названия'
    const content = req.body.content

    try {
      const row = await journalNotesRepo.updateForUser(ctx, user.id, req.body.id, {
        title,
        content
      })
      if (!row) {
        await loggerLib.writeServerLog(ctx, {
          severity: 5,
          message: `[${LOG_PATH}] Заметка не найдена`,
          payload: { id: req.body.id }
        })
        return { success: false, error: 'Заметка не найдена' }
      }
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] Заметка обновлена`,
        payload: { id: row.id }
      })
      return {
        success: true,
        note: { id: row.id, title: row.title }
      }
    } catch (error) {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] Ошибка обновления`,
        payload: { error: String(error) }
      })
      return { success: false, error: String(error) }
    }
  })
