/**
 * Репозиторий журнала исходящих вызовов gateway → GetCourse
 * (gatewayUpstreamLog.table).
 */

import GatewayUpstreamLog, {
  type GatewayUpstreamLogRow
} from '../tables/gatewayUpstreamLog.table'
import * as loggerLib from '../lib/logger.lib'

const LOG_MODULE = 'repos/gatewayUpstreamLog.repo'

export type GatewayUpstreamLogCreatePayload = {
  requestId: string
  op: string
  upstreamKind: string
  rawGcJson: unknown
  gcHttpStatus: number
  semanticRule: string
  durationMs: number
  sentAt: number
}

export async function create(
  ctx: app.Ctx,
  data: GatewayUpstreamLogCreatePayload
): Promise<GatewayUpstreamLogRow> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create entry`,
    payload: {
      requestId: data.requestId,
      op: data.op,
      upstreamKind: data.upstreamKind,
      gcHttpStatus: data.gcHttpStatus
    }
  })
  const row = await GatewayUpstreamLog.create(ctx, data)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create exit`,
    payload: { requestId: data.requestId }
  })
  return row
}

export async function findRecent(
  ctx: app.Ctx,
  limit: number
): Promise<GatewayUpstreamLogRow[]> {
  return GatewayUpstreamLog.findAll(ctx, {
    order: [{ sentAt: 'desc' }],
    limit
  })
}

/**
 * Последние N записей с опциональным фильтром по `sentAt` (Unix ms).
 * Если ни одна граница не задана — поведение эквивалентно `findRecent`.
 */
export async function findRecentFiltered(
  ctx: app.Ctx,
  limit: number,
  dateFrom?: number,
  dateTo?: number
): Promise<GatewayUpstreamLogRow[]> {
  if (dateFrom === undefined && dateTo === undefined) {
    return findRecent(ctx, limit)
  }
  const sentAt =
    dateFrom !== undefined && dateTo !== undefined
      ? { $gte: dateFrom, $lte: dateTo }
      : dateFrom !== undefined
        ? { $gte: dateFrom }
        : { $lte: dateTo as number }
  return GatewayUpstreamLog.findAll(ctx, {
    where: { sentAt },
    order: [{ sentAt: 'desc' }],
    limit
  })
}

export async function findById(
  ctx: app.Ctx,
  id: string
): Promise<GatewayUpstreamLogRow | null> {
  return GatewayUpstreamLog.findById(ctx, id)
}

export async function findByRequestId(
  ctx: app.Ctx,
  requestId: string
): Promise<GatewayUpstreamLogRow | null> {
  const rows = await GatewayUpstreamLog.findAll(ctx, {
    where: { requestId },
    limit: 1
  })
  return rows[0] ?? null
}

export async function countSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return GatewayUpstreamLog.countBy(ctx, {
    sentAt: { $gte: sinceTimestamp }
  })
}

export async function countOkSince(
  ctx: app.Ctx,
  sinceTimestamp: number
): Promise<number> {
  return GatewayUpstreamLog.countBy(ctx, {
    sentAt: { $gte: sinceTimestamp },
    upstreamKind: 'json_ok',
    semanticRule: ''
  })
}
