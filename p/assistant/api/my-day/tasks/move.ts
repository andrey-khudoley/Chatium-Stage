// @shared-route
import { requireRealUser } from '@app/auth'
import * as myDayTasksRepo from '../../../repos/myDayTasks.repo'
import type { TaskSection } from '../../../repos/myDayTasks.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/tasks/move'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const SECTIONS: TaskSection[] = ['main', 'additional', 'backlog']

/**
 * POST /api/my-day/tasks/move — переместить задачу (section, folderId, date, sortOrder).
 * Body: { taskId: string, section?, folderId?, date?, sortOrder? }
 */
export const moveMyDayTaskRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as {
    taskId?: string
    section?: string
    folderId?: string | null
    date?: string
    sortOrder?: number
  }
  const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : ''
  if (!taskId) return { success: false, error: 'Поле taskId обязательно' }
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Перемещение задачи`,
    payload: { userId: user.id, taskId }
  })
  const task = await myDayTasksRepo.getByIdForUser(ctx, user.id, taskId)
  if (!task) return { success: false, error: 'Задача не найдена или нет доступа' }
  const updates: {
    section?: TaskSection
    date?: string | null
    folderId?: string | null
    sortOrder?: number
  } = {}
  if (body.section !== undefined) {
    const section = body.section as TaskSection
    if (!SECTIONS.includes(section)) return { success: false, error: 'Недопустимый section' }
    updates.section = section
    if (section === 'backlog') {
      updates.date = undefined
      updates.folderId = body.folderId !== undefined ? (typeof body.folderId === 'string' ? body.folderId : null) : undefined
    } else {
      const date =
        typeof body.date === 'string' && DATE_REGEX.test(body.date.trim()) ? body.date.trim() : null
      updates.date = date
      updates.folderId = null
    }
  }
  if (body.folderId !== undefined && task.section === 'backlog')
    updates.folderId = typeof body.folderId === 'string' ? body.folderId.trim() || null : null
  if (body.date !== undefined && task.section !== 'backlog') {
    const date =
      typeof body.date === 'string' && DATE_REGEX.test(body.date.trim()) ? body.date.trim() : null
    updates.date = date
  }
  if (typeof body.sortOrder === 'number' && body.sortOrder >= 0) updates.sortOrder = body.sortOrder
  try {
    const updated = await myDayTasksRepo.updateForUser(ctx, user.id, taskId, updates)
    if (!updated) return { success: false, error: 'Не удалось обновить задачу' }
    return {
      success: true,
      task: {
        id: updated.id,
        section: updated.section,
        date: updated.date ?? null,
        folderId: updated.folderId ?? null,
        title: updated.title,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        sortOrder: updated.sortOrder
      }
    }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка перемещения`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
