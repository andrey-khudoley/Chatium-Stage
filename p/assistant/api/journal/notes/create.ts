// @shared-route
import { requireRealUser } from '@app/auth'
import * as loggerLib from '../../../lib/logger.lib'
import * as journalNotesRepo from '../../../repos/journal-notes.repo'

const LOG_PATH = 'api/journal/notes/create'

const DEFAULT_TITLE = 'Новая заметка'

/**
 * POST /api/journal/notes/create — создать пустую заметку (заголовок по умолчанию, пустое содержимое).
 * Тело опционально: { title?: string, content?: string }
 */
export const createJournalNoteRoute = app
  .body((s) => ({
    title: s.optional(s.string()),
    content: s.optional(s.string())
  }))
  .post('/', async (ctx, req) => {
    const body = req.body as Record<string, unknown> | undefined
    const bodyKeys = body && typeof body === 'object' ? Object.keys(body) : []

    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Запрос создания заметки (после валидации body)`,
      payload: {
        bodyKeys,
        titleType: body?.title !== undefined ? typeof body.title : 'undefined',
        contentType: body?.content !== undefined ? typeof body.content : 'undefined'
      }
    })

    let user: { id: string }
    try {
      user = requireRealUser(ctx)
    } catch (authErr) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] Отказ: не авторизован (requireRealUser)`,
        payload: { error: String(authErr) }
      })
      throw authErr
    }

    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Пользователь определён`,
      payload: { userId: user.id }
    })

    const titleRaw = req.body.title
    const contentRaw = req.body.content
    const title =
      typeof titleRaw === 'string' && titleRaw.trim() !== '' ? titleRaw.trim() : DEFAULT_TITLE
    const content = typeof contentRaw === 'string' ? contentRaw : ''

    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_PATH}] Данные для записи`,
      payload: {
        titleLen: title.length,
        contentLen: content.length
      }
    })

    try {
      const row = await journalNotesRepo.createForUser(ctx, user.id, { title, content })
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] Заметка создана`,
        payload: { id: row.id, title: row.title }
      })
      return {
        success: true,
        note: { id: row.id, title: row.title }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      const errStack = error instanceof Error ? error.stack : undefined
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] Ошибка создания заметки (Heap/repo)`,
        payload: { error: errMsg, stack: errStack }
      })
      return { success: false, error: errMsg }
    }
  })
