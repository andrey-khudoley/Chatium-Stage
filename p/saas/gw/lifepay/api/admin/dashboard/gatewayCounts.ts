/**
 * GET /api/admin/dashboard/gatewayCounts — KPI за 24ч для gateway-панели.
 * Admin-only.
 */

import { requireAccountRole } from '@app/auth'

import * as gatewayRequestLogRepo from '../../../repos/gatewayRequestLog.repo'
import * as gatewayUpstreamLogRepo from '../../../repos/gatewayUpstreamLog.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG_PATH = 'api/admin/dashboard/gatewayCounts'
const WINDOW_MS = 24 * 60 * 60 * 1000

export const gatewayCountsRoute = app.get('/', async (ctx, _req) => {
  requireAccountRole(ctx, 'Admin')

  const since = Date.now() - WINDOW_MS

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { since }
  })

  const [
    totalRequests,
    totalErrors,
    upstreamTotal,
    upstreamOk
  ] = await Promise.all([
    gatewayRequestLogRepo.countSince(ctx, since),
    gatewayRequestLogRepo.countErrorsSince(ctx, since),
    gatewayUpstreamLogRepo.countSince(ctx, since),
    gatewayUpstreamLogRepo.countOkSince(ctx, since)
  ])

  const totalOk = Math.max(0, totalRequests - totalErrors)
  const upstreamErrors = Math.max(0, upstreamTotal - upstreamOk)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] exit`,
    payload: { totalRequests, totalOk, totalErrors, upstreamTotal, upstreamOk, upstreamErrors }
  })

  return {
    success: true,
    counts: {
      totalRequests,
      totalOk,
      totalErrors,
      upstreamTotal,
      upstreamOk,
      upstreamErrors
    },
    windowMs: WINDOW_MS,
    since
  }
})

export default gatewayCountsRoute
