// @shared-route
import { requireRealUser } from '@app/auth'
import * as tasksRepo from '../../repos/tasks.repo'

export const getInProgressTasksRoute = app.get('/', async (ctx) => {
  const user = requireRealUser(ctx)
  try {
    const tree = await tasksRepo.getTreeForUser(ctx, user.id)
    const inProgressTasks = tree.tasks.filter(t => t.status === 'in_progress')
    return { success: true, tasks: inProgressTasks }
  } catch (error) {
    ctx.account.log(`tasks.in-progress error`, {
      level: 'error',
      json: { userId: user.id, error: String(error) }
    })
    return { success: false, error: 'Не удалось получить список задач' }
  }
})
