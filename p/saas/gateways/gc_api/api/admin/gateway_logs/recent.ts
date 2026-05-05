// @shared-route
import { requireAccountRole } from '@app/auth'
import * as requestLogRepo from '../../../repos/requestLog.repo'

/** GET — последние записи журнала invoke. Query: limit?, schoolId?, op?, status? */
export const adminGatewayLogsRecentRoute = app.get('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const limit = Math.min(500, Math.max(1, parseInt(String(req.query?.limit ?? '100'), 10) || 100))
  const schoolId = typeof req.query?.schoolId === 'string' ? req.query.schoolId.trim() : undefined
  const op = typeof req.query?.op === 'string' ? req.query.op.trim() : undefined
  const status = typeof req.query?.status === 'string' ? req.query.status.trim() : undefined

  const logs = await requestLogRepo.findRecent(ctx, { limit, schoolId, op, status })
  return { success: true, logs }
})
