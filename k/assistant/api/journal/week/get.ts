// @shared-route
import { requireRealUser } from '@app/auth'
import * as loggerLib from '../../../lib/logger.lib'
import * as journalWeekRepo from '../../../repos/journal-week-entries.repo'
import {
  computeJournalWeekMondayKeyLocal,
  getWeekMondayKeyForDateKey,
  normalizeWeekMondayKey
} from '../../../lib/journal-week-key'

const LOG_PATH = 'api/journal/week/get'

export const getJournalWeekEntryRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const mondayKeyRaw = normalizeWeekMondayKey(req.query.mondayKey) ?? computeJournalWeekMondayKeyLocal(Date.now())
  const mondayKey = getWeekMondayKeyForDateKey(mondayKeyRaw) ?? computeJournalWeekMondayKeyLocal(Date.now())

  try {
    const week = await journalWeekRepo.getWeekByUserAndMonday(ctx, user.id, mondayKey)
    return { success: true, week }
  } catch (error) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] Ошибка чтения недельного плана`,
      payload: { error: String(error), mondayKey }
    })
    return { success: false, error: String(error) }
  }
})
