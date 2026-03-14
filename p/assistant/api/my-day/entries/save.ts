// @shared-route
import { requireRealUser } from '@app/auth'
import * as dayEntriesRepo from '../../../repos/dayEntries.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/my-day/entries/save'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * POST /api/my-day/entries/save — сохранить запись дня.
 * Body: { date: string (YYYY-MM-DD), morningText?, dayText?, eveningText? }
 */
export const saveDayEntryRoute = app.post('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const body = (req.body ?? {}) as {
    date?: string
    morningText?: string
    dayText?: string
    eveningText?: string
  }
  const date = typeof body.date === 'string' ? body.date.trim() : ''
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Сохранение записи дня`,
    payload: { userId: user.id, date }
  })
  if (!date || !DATE_REGEX.test(date)) {
    return { success: false, error: 'Поле date обязательно (YYYY-MM-DD)' }
  }
  try {
    const entry = await dayEntriesRepo.upsertForUser(ctx, user.id, date, {
      morningText: typeof body.morningText === 'string' ? body.morningText : '',
      dayText: typeof body.dayText === 'string' ? body.dayText : '',
      eveningText: typeof body.eveningText === 'string' ? body.eveningText : ''
    })
    return {
      success: true,
      entry: {
        id: entry.id,
        date: entry.date,
        morningText: entry.morningText,
        dayText: entry.dayText,
        eveningText: entry.eveningText,
        updatedAt: entry.updatedAt
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка сохранения: ${errMsg}`,
      payload: { error: String(err) }
    })
    return { success: false, error: 'Внутренняя ошибка' }
  }
})
