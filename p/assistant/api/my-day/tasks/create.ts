// @shared-route
import { requireRealUser } from '@app/auth'
import * as myDayTasksRepo from '../../../repos/myDayTasks.repo'
import type { TaskSection } from '../../../repos/myDayTasks.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/tasks/create'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const SECTIONS: TaskSection[] = ['main', 'additional', 'backlog']

/**
 * POST /api/my-day/tasks/create — создать задачу.
 * Body: { section: 'main'|'additional'|'backlog', date?, folderId?, title }
 */
export const createMyDayTaskRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as {
    section?: string
    date?: string
    folderId?: string | null
    title?: string
  }
  const section = body.section as TaskSection | undefined
  if (!section || !SECTIONS.includes(section)) {
    return { success: false, error: 'Поле section обязательно: main, additional или backlog' }
  }
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return { success: false, error: 'Поле title обязательно' }
  const date =
    section !== 'backlog' && typeof body.date === 'string' && DATE_REGEX.test(body.date.trim())
      ? body.date.trim()
      : undefined
  if (section !== 'backlog' && (!date || !DATE_REGEX.test(date))) {
    return { success: false, error: 'Для main/additional поле date обязательно (YYYY-MM-DD)' }
  }
  const folderId =
    section === 'backlog' && body.folderId !== undefined
      ? typeof body.folderId === 'string'
        ? body.folderId.trim() || null
        : null
      : undefined
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Создание задачи`,
    payload: { userId: user.id, section, title: title.slice(0, 50) }
  })
  try {
    const task = await myDayTasksRepo.createForUser(ctx, user.id, {
      section,
      date: section === 'backlog' ? undefined : date,
      folderId: section === 'backlog' ? folderId : undefined,
      title: title || 'Задача'
    })
    return {
      success: true,
      task: {
        id: task.id,
        section: task.section,
        date: task.date ?? null,
        folderId: task.folderId ?? null,
        title: task.title,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        sortOrder: task.sortOrder
      }
    }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка создания`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
