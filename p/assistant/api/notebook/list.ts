// @shared-route
import { requireRealUser } from '@app/auth'
import * as notebookNotesRepo from '../../repos/notebookNotes.repo'
import * as notebookMarkdown from '../../lib/notebookMarkdown'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'api/notebook/list'

/**
 * GET /api/notebook/list — список заметок текущего пользователя.
 */
export const listNotebookRoute = app.get('/', async (ctx) => {
  const user = requireRealUser(ctx)
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос списка заметок`,
    payload: { userId: user.id }
  })
  const rows = await notebookNotesRepo.listByUser(ctx, user.id)
  const notes = rows.map((r) => ({
    id: r.id,
    title: r.title,
    preview: notebookMarkdown.extractPreview(r.contentMarkdown),
    updatedAt: r.updatedAt
  }))
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Список получен`,
    payload: { userId: user.id, count: notes.length }
  })
  return { success: true, notes }
})
