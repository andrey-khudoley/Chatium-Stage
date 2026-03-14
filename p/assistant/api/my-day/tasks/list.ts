// @shared-route
import { requireRealUser } from '@app/auth'
import * as myDayTasksRepo from '../../../repos/myDayTasks.repo'
import * as backlogFoldersRepo from '../../../repos/backlogFolders.repo'
import type { MyDayTaskRow } from '../../../tables/my_day_tasks.table'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/tasks/list'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function taskToJson(r: MyDayTaskRow) {
  return {
    id: r.id,
    section: r.section,
    date: r.date ?? null,
    folderId: r.folderId ?? null,
    title: r.title,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    sortOrder: r.sortOrder
  }
}

/**
 * GET /api/my-day/tasks/list?date=YYYY-MM-DD — задачи дня (main, additional) и бэклог с папками.
 */
export const listMyDayTasksRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const date = typeof req.query?.date === 'string' ? req.query.date.trim() : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос списка задач`,
    payload: { userId: user.id, date }
  })
  if (!date || !DATE_REGEX.test(date)) {
    return { success: false, error: 'Параметр date обязателен (YYYY-MM-DD)' }
  }
  try {
    const [mainTasks, additionalTasks, backlogTasks, folders] = await Promise.all([
      myDayTasksRepo.listForDay(ctx, user.id, date, 'main'),
      myDayTasksRepo.listForDay(ctx, user.id, date, 'additional'),
      myDayTasksRepo.listAllBacklogByUser(ctx, user.id),
      backlogFoldersRepo.listByUser(ctx, user.id)
    ])
    return {
      success: true,
      mainTasks: mainTasks.map(taskToJson),
      additionalTasks: additionalTasks.map(taskToJson),
      backlogTasks: backlogTasks.map(taskToJson),
      folders: folders.map((f) => ({ id: f.id, name: f.name, sortOrder: f.sortOrder }))
    }
  } catch (err) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
