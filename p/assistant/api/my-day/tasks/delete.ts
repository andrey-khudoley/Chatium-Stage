// @shared-route
import { requireRealUser } from '@app/auth'
import * as myDayTasksRepo from '../../../repos/myDayTasks.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/tasks/delete'

/**
 * POST /api/my-day/tasks/delete — удалить задачу.
 * Body: { id: string }
 */
export const deleteMyDayTaskRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as { id?: string }
  const id = typeof body.id === 'string' ? body.id.trim() : ''
  if (!id) return { success: false, error: 'Поле id обязательно' }
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Удаление задачи`,
    payload: { userId: user.id, taskId: id }
  })
  try {
    const ok = await myDayTasksRepo.deleteForUser(ctx, user.id, id)
    if (!ok) return { success: false, error: 'Задача не найдена или нет доступа' }
    return { success: true }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка удаления`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
