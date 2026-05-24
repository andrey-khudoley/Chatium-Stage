/**
 * GET /api/lp/search-by-request-id?requestId=...
 * (implementation-plan §1.8.4).
 *
 * Поиск конкретной записи request_log + связанные webhook_log по orderNumber.
 * Доступ: requireRealUser + requireInternalAccess (§1.11.8). Без полных тел запросов/ответов и секретов.
 */

import * as requestLogRepo from '../../repos/requestLog.repo'
import * as webhookLogRepo from '../../repos/webhookLog.repo'
import { guardInternalApi } from '../../lib/access/apiGuard'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'api/lp/search-by-request-id'

export const searchByRequestIdRoute = app.get('/', async (ctx, req) => {
  const denied = await guardInternalApi(ctx)
  if (denied) return denied

  const q = req.query as Record<string, unknown> | undefined
  const requestId = typeof q?.requestId === 'string' ? q.requestId.trim() : ''

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { requestId }
  })

  if (!requestId) {
    return { success: false, error: 'requestId обязателен' }
  }

  const row = await requestLogRepo.findByRequestId(ctx, requestId)
  let webhooks: unknown[] = []
  if (row && row.orderNumber) {
    const whRows = await webhookLogRepo.findByOrderNumber(ctx, row.orderNumber)
    webhooks = whRows.map((r) => ({
      id: r.id,
      number: r.number,
      orderNumber: r.orderNumber,
      tokenValid: r.tokenValid,
      duplicate: r.duplicate,
      type: r.type,
      status: r.status,
      method: r.method,
      amount: r.amount,
      processedAt: r.processedAt
    }))
  }

  const request = row
    ? {
        id: row.id,
        requestId: row.requestId,
        op: row.op,
        orderNumber: row.orderNumber,
        argsRedacted: row.argsRedacted,
        clientHttpStatus: row.clientHttpStatus,
        ok: row.ok,
        errorCode: row.errorCode,
        lpHttpStatus: row.lpHttpStatus,
        lpSemanticRule: row.lpSemanticRule,
        lpNumericCode: row.lpNumericCode,
        durationMs: row.durationMs,
        requestedAt: row.requestedAt
      }
    : null

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] exit`,
    payload: { requestId, found: !!row, webhookCount: webhooks.length }
  })

  return { success: true, request, webhooks }
})

export default searchByRequestIdRoute
