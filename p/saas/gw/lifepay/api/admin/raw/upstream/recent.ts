/**
 * GET /api/admin/raw/upstream/recent — последние N записей gatewayUpstreamLog
 * (мета-поля, БЕЗ rawLpJson). Admin-only.
 */

import { requireAccountRole } from '@app/auth'

import * as repo from '../../../../repos/gatewayUpstreamLog.repo'
import * as loggerLib from '../../../../lib/logger.lib'

const LOG_PATH = 'api/admin/raw/upstream/recent'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function parseLimit(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT
  return Math.min(Math.floor(n), MAX_LIMIT)
}

export const recentGatewayUpstreamRoute = app.get('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const limit = parseLimit((req.query as Record<string, unknown> | undefined)?.limit)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { limit }
  })

  const rows = await repo.findRecent(ctx, limit)

  const entries = rows.map((r) => ({
    id: r.id,
    requestId: r.requestId,
    op: r.op,
    upstreamKind: r.upstreamKind,
    lpHttpStatus: r.lpHttpStatus,
    semanticRule: r.semanticRule,
    durationMs: r.durationMs,
    sentAt: r.sentAt
  }))

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] exit`,
    payload: { count: entries.length }
  })

  return { success: true, entries }
})

export default recentGatewayUpstreamRoute
