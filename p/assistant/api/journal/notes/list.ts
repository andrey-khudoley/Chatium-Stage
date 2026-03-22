// @shared-route
import { requireRealUser } from '@app/auth'
import * as loggerLib from '../../../lib/logger.lib'
import * as journalNotesRepo from '../../../repos/journal-notes.repo'

const LOG_PATH = 'api/journal/notes/list'

/**
 * GET /api/journal/notes/list — заголовки заметок текущего пользователя (без содержимого).
 */
export const listJournalNotesRoute = app.get('/', async (ctx, _req) => {
  const user = requireRealUser(ctx)

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос списка заметок`,
    payload: {}
  })

  try {
    const notes = await journalNotesRepo.findSummariesByUserId(ctx, user.id)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] Список отдан`,
      payload: { count: notes.length }
    })
    return { success: true, notes }
  } catch (error) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка выборки заметок`,
      payload: { error: String(error) }
    })
    return { success: false, error: String(error), notes: [] }
  }
})
