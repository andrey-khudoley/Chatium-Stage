// @shared-route
import { requireRealUser } from '@app/auth'
import * as myDayTasksRepo from '../../../repos/myDayTasks.repo'
import type { TaskSection } from '../../../repos/myDayTasks.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/tasks/reorder'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const SECTIONS: TaskSection[] = ['main', 'additional', 'backlog']

/**
 * POST /api/my-day/tasks/reorder — переупорядочить задачи.
 * Body: { section, date? (для main/additional), folderId? (для backlog), taskIds: string[] }
 */
export const reorderMyDayTasksRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as {
    section?: string
    date?: string
    folderId?: string | null
    taskIds?: string[]
  }
  const section = body.section as TaskSection | undefined
  if (!section || !SECTIONS.includes(section)) {
    return { success: false, error: 'Поле section обязательно: main, additional или backlog' }
  }
  const taskIds = Array.isArray(body.taskIds) ? body.taskIds.filter((id) => typeof id === 'string') : []
  if (taskIds.length === 0) return { success: false, error: 'Поле taskIds должно быть непустым массивом' }
  let date: string | null = null
  if (section !== 'backlog') {
    const d = typeof body.date === 'string' ? body.date.trim() : ''
    if (!d || !DATE_REGEX.test(d)) return { success: false, error: 'Для main/additional поле date обязательно (YYYY-MM-DD)' }
    date = d
  }
  const folderId =
    section === 'backlog' && body.folderId !== undefined
      ? typeof body.folderId === 'string'
        ? body.folderId.trim() || null
        : null
      : undefined
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переупорядочивание задач`,
    payload: { userId: user.id, section, count: taskIds.length }
  })
  try {
    const ok = await myDayTasksRepo.reorderForUser(
      ctx,
      user.id,
      section,
      taskIds,
      date ?? undefined,
      folderId
    )
    if (!ok) return { success: false, error: 'Одна или несколько задач не найдены или не соответствуют разделу' }
    return { success: true }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка переупорядочивания`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
