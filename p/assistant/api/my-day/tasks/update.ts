// @shared-route
import { requireRealUser } from '@app/auth'
import * as myDayTasksRepo from '../../../repos/myDayTasks.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/tasks/update'

/**
 * POST /api/my-day/tasks/update — обновить задачу (title, completedAt).
 * Body: { id: string, title?, completedAt? (ISO string or null) }
 */
export const updateMyDayTaskRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { id?: string; title?: string; completedAt?: string | null }
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return { success: false, error: 'Поле id обязательно' }
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Обновление задачи`,
    payload: { userId: user.id, taskId: id }
  })
  const updates: { title?: string; completedAt?: Date | null } = {}
  if (body.title !== undefined) updates.title = typeof body.title === 'string' ? body.title.trim() : ''
  if (body.completedAt !== undefined) {
    updates.completedAt =
      body.completedAt === null || body.completedAt === ''
        ? null
        : typeof body.completedAt === 'string'
          ? new Date(body.completedAt)
          : undefined
    if (updates.completedAt && isNaN(updates.completedAt.getTime())) updates.completedAt = new Date()
  }
  try {
    const task = await myDayTasksRepo.updateForUser(ctx, user.id, id, updates)
    if (!task) return { success: false, error: 'Задача не найдена или нет доступа' }
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
      message: `[${LOG_PATH}] Ошибка обновления`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
