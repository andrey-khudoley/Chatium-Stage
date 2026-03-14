// @shared-route
import { requireRealUser } from '@app/auth'
import * as notebookNotesRepo from '../../repos/notebookNotes.repo'
import * as notebookMarkdown from '../../lib/notebookMarkdown'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'api/notebook/toggleCheckbox'

/**
 * POST /api/notebook/toggleCheckbox — переключить чекбокс по индексу.
 * Body: { noteId: string, checkboxIndex: number, checked: boolean }
 * Пересохраняет всю заметку после изменения.
 */
export const toggleCheckboxRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as {
    noteId?: string
    checkboxIndex?: number
    checked?: boolean
  }
  const noteId = typeof body.noteId === 'string' ? body.noteId.trim() : ''
  const checkboxIndex =
    typeof body.checkboxIndex === 'number' && Number.isFinite(body.checkboxIndex)
      ? Math.max(0, Math.floor(body.checkboxIndex))
      : -1
  const checked = body.checked === true
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос переключения чекбокса`,
    payload: { userId: user.id, noteId, checkboxIndex, checked }
  })
  if (!noteId) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Отсутствует noteId`,
      payload: {}
    })
    return { success: false, error: 'Параметр noteId обязателен' }
  }
  const note = await notebookNotesRepo.getByIdForUser(ctx, user.id, noteId)
  if (!note) {
    await loggerLib.writeServerLog(ctx, {
      severity: 5,
      message: `[${LOG_PATH}] Заметка не найдена`,
      payload: { userId: user.id, noteId }
    })
    return { success: false, error: 'Заметка не найдена' }
  }
  const total = notebookMarkdown.countCheckboxes(note.contentMarkdown)
  if (checkboxIndex < 0 || checkboxIndex >= total) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] Невалидный checkboxIndex`,
      payload: { checkboxIndex, total }
    })
    return { success: false, error: 'Неверный индекс чекбокса' }
  }
  const newMarkdown = notebookMarkdown.toggleCheckbox(
    note.contentMarkdown,
    checkboxIndex,
    checked
  )
  const updated = await notebookNotesRepo.updateForUser(ctx, user.id, noteId, {
    contentMarkdown: newMarkdown
  })
  if (!updated) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка обновления после toggle`,
      payload: { noteId }
    })
    return { success: false, error: 'Не удалось сохранить' }
  }
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Чекбокс переключён`,
    payload: { noteId, checkboxIndex }
  })
  return {
    success: true,
    note: {
      id: updated.id,
      title: updated.title,
      contentMarkdown: updated.contentMarkdown,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
  }
})
