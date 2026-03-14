// @shared-route
import { requireRealUser } from '@app/auth'
import * as notebookNotesRepo from '../../repos/notebookNotes.repo'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'api/notebook/save'

/**
 * POST /api/notebook/save — создать или обновить заметку.
 * Body: { id?: string, title: string, contentMarkdown: string }
 */
export const saveNotebookRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { id?: string; title?: string; contentMarkdown?: string }
  const id = typeof body.id === 'string' ? body.id.trim() || undefined : undefined
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const contentMarkdown = typeof body.contentMarkdown === 'string' ? body.contentMarkdown : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос сохранения`,
    payload: { userId: user.id, hasId: !!id }
  })
  if (!title) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Пустой title`,
      payload: {}
    })
    return { success: false, error: 'Заголовок обязателен' }
  }
  try {
    let note
    if (id) {
      note = await notebookNotesRepo.updateForUser(ctx, user.id, id, {
        title,
        contentMarkdown
      })
      if (!note) {
        await loggerLib.writeServerLog(ctx, {
          severity: 5,
          message: `[${LOG_PATH}] Заметка не найдена при обновлении`,
          payload: { userId: user.id, id }
        })
        return { success: false, error: 'Заметка не найдена' }
      }
    } else {
      note = await notebookNotesRepo.createForUser(ctx, user.id, {
        title,
        contentMarkdown
      })
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] Заметка сохранена`,
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
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка сохранения`,
      payload: { error: String(err) }
    })
    return { success: false, error: String(err) }
  }
})
