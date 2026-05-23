/**
 * GET /api/lp/recent-webhooks — последние записи webhook_log
 * (implementation-plan §1.8.4). Admin-only.
 */

import * as webhookLogRepo from '../../repos/webhookLog.repo'
import * as loggerLib from '../../lib/logger.lib'
import { RECENT_DEFAULT_LIMIT, RECENT_MAX_LIMIT } from '../../lib/gateway/constants'

const LOG_PATH = 'api/lp/recent-webhooks'

function parseLimit(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n) || n < 1) return RECENT_DEFAULT_LIMIT
  return Math.min(Math.floor(n), RECENT_MAX_LIMIT)
}

export const recentWebhooksRoute = app.get('/', async (ctx, req) => {
  const limit = parseLimit((req.query as Record<string, unknown> | undefined)?.limit)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { limit }
  })

  const rows = await webhookLogRepo.findRecent(ctx, limit)
  const entries = rows.map((r) => ({
    id: r.id,
    number: r.number,
    orderNumber: r.orderNumber,
    tokenValid: r.tokenValid,
    duplicate: r.duplicate,
    type: r.type,
    status: r.status,
    method: r.method,
    amount: r.amount,
    email: r.email ?? '',
    processedAt: r.processedAt
  }))

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] exit`,
    payload: { count: entries.length }
  })

  return { success: true, entries }
})

export default recentWebhooksRoute
