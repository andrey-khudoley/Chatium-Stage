// @shared-route
import { requireRealUser } from '@app/auth'
import * as dayEntriesRepo from '../../../repos/dayEntries.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/entries/get'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * GET /api/my-day/entries/get?date=YYYY-MM-DD — запись дня для даты.
 */
export const getDayEntryRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const date = typeof req.query?.date === 'string' ? req.query.date.trim() : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос записи дня`,
    payload: { userId: user.id, date }
  })
  if (!date || !DATE_REGEX.test(date)) {
    return { success: false, error: 'Параметр date обязателен (YYYY-MM-DD)' }
  }
  try {
    const entry = await dayEntriesRepo.getByUserAndDate(ctx, user.id, date)
    return {
      success: true,
      entry: entry
        ? {
            id: entry.id,
            date: entry.date,
            morningText: entry.morningText,
            dayText: entry.dayText,
            eveningText: entry.eveningText,
            updatedAt: entry.updatedAt
          }
        : null
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
