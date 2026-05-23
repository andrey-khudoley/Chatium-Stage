// @shared-route
import { requireAccountRole } from '@app/auth'
import * as logsRepo from '../../repos/logs.repo'
import * as loggerLib from '../../lib/logger.lib'
import type { LogsRow } from '../../tables/logs.table'

const LOG_PATH = 'api/gateway-analytics/invocations'

/** Машинное имя стадии итоговой записи о завершении /v1/{op} (manual §7.2). */
const COMPLETION_LOG_STAGE = 'v1_op_completed'

/** Безопасные пределы выборки. */
const DEFAULT_SCAN_LIMIT = 1000
const MAX_SCAN_LIMIT = 5000
const DEFAULT_LIST_LIMIT = 100
const MAX_LIST_LIMIT = 500

export type GatewayAnalyticsFilters = {
  dateFromMs?: number
  dateToMs?: number
  op?: string
  errorCode?: string
  contour?: 'legacy' | 'new'
  availability?: string
  durationMsMin?: number
  durationMsMax?: number
  ok?: boolean
  /** Подстрока поиска по requestId (manual §7.4.1.3). */
  requestId?: string
}

export type GatewayAnalyticsBody = {
  mode?: 'list' | 'poll'
  filters?: GatewayAnalyticsFilters
  limit?: number
  scanLimit?: number
  /** Для режима poll: вернуть события строго позже этого timestamp (ms). */
  afterTimestampMs?: number
}

/** Распарсенная итоговая запись о завершении /v1/{op}. */
type CompletionItem = {
  timestamp: number
  requestId?: string
  op?: string
  httpMethod?: string
  contour?: string
  availability?: string
  schoolHostPresent?: boolean
  clientHttpStatus?: number
  ok?: boolean
  errorCode?: string
  gcHttpStatus?: number
  durationMs?: number
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : NaN
  if (Number.isNaN(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null
  if (typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const j = JSON.parse(raw) as unknown
      return typeof j === 'object' && j !== null ? (j as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return null
}

function rowToCompletionItem(row: LogsRow): CompletionItem | null {
  const p = parsePayload(row.payload)
  if (!p) return null
  if (p.logStage !== COMPLETION_LOG_STAGE) return null
  return {
    timestamp: row.timestamp,
    requestId: typeof p.requestId === 'string' ? p.requestId : undefined,
    op: typeof p.op === 'string' ? p.op : undefined,
    httpMethod: typeof p.httpMethod === 'string' ? p.httpMethod : undefined,
    contour: typeof p.contour === 'string' ? p.contour : undefined,
    availability: typeof p.availability === 'string' ? p.availability : undefined,
    schoolHostPresent: typeof p.schoolHostPresent === 'boolean' ? p.schoolHostPresent : undefined,
    clientHttpStatus: typeof p.clientHttpStatus === 'number' ? p.clientHttpStatus : undefined,
    ok: typeof p.ok === 'boolean' ? p.ok : undefined,
    errorCode: typeof p.errorCode === 'string' ? p.errorCode : undefined,
    gcHttpStatus: typeof p.gcHttpStatus === 'number' ? p.gcHttpStatus : undefined,
    durationMs: typeof p.durationMs === 'number' ? p.durationMs : undefined
  }
}

function passesFilters(item: CompletionItem, f: GatewayAnalyticsFilters): boolean {
  if (f.dateFromMs !== undefined && item.timestamp < f.dateFromMs) return false
  if (f.dateToMs !== undefined && item.timestamp > f.dateToMs) return false
  if (f.op && item.op !== f.op) return false
  if (f.errorCode && item.errorCode !== f.errorCode) return false
  if (f.contour && item.contour !== f.contour) return false
  if (f.availability && item.availability !== f.availability) return false
  if (f.ok !== undefined && item.ok !== f.ok) return false
  if (f.durationMsMin !== undefined && (item.durationMs ?? -1) < f.durationMsMin) return false
  if (f.durationMsMax !== undefined && (item.durationMs ?? Number.MAX_SAFE_INTEGER) > f.durationMsMax) return false
  if (f.requestId) {
    const needle = f.requestId.toLowerCase()
    if (!item.requestId || !item.requestId.toLowerCase().includes(needle)) return false
  }
  return true
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

function summarize(items: CompletionItem[]) {
  const okCount = items.filter((i) => i.ok === true).length
  const errCount = items.length - okCount
  const opCounts: Record<string, number> = {}
  const errCounts: Record<string, number> = {}
  const durations: number[] = []
  for (const i of items) {
    if (i.op) opCounts[i.op] = (opCounts[i.op] ?? 0) + 1
    if (i.errorCode) errCounts[i.errorCode] = (errCounts[i.errorCode] ?? 0) + 1
    if (typeof i.durationMs === 'number') durations.push(i.durationMs)
  }
  durations.sort((a, b) => a - b)
  const sum = durations.reduce((a, b) => a + b, 0)
  const topOps = Object.entries(opCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([op, count]) => ({ op, count }))
  const topErrors = Object.entries(errCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code, count]) => ({ code, count }))
  return {
    total: items.length,
    okCount,
    errCount,
    topOps,
    topErrors,
    avgDurationMs: durations.length ? Math.round(sum / durations.length) : 0,
    p95DurationMs: percentile(durations, 95),
    p50DurationMs: percentile(durations, 50)
  }
}

/**
 * POST /api/gateway-analytics/invocations — аналитика завершённых /v1/{op} (manual §7.4.2).
 * Только Admin. Источник данных — серверные логи (writeServerLog → Heap)
 * с `payload.logStage === 'v1_op_completed'` (см. handleV1OpRoute.ts).
 */
export const gatewayAnalyticsInvocationsRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const body = (req.body ?? {}) as GatewayAnalyticsBody
  const mode = body.mode === 'poll' ? 'poll' : 'list'
  const filters: GatewayAnalyticsFilters = body.filters ?? {}
  const limit = clampInt(body.limit, 1, MAX_LIST_LIMIT, DEFAULT_LIST_LIMIT)
  const scanLimit = clampInt(body.scanLimit, 1, MAX_SCAN_LIMIT, DEFAULT_SCAN_LIMIT)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] запрос`,
    payload: { mode, limit, scanLimit, filters }
  })

  try {
    // Тянем последние N записей логов (severity 4 и 6 — completion может быть
    // обоих уровней) и фильтруем по logStage и пользовательским фильтрам.
    const rows = await logsRepo.findAll(ctx, {
      limit: scanLimit,
      offset: 0,
      severities: [4, 6]
    })

    let items: CompletionItem[] = []
    for (const row of rows) {
      const item = rowToCompletionItem(row)
      if (!item) continue
      if (mode === 'poll' && body.afterTimestampMs !== undefined && item.timestamp <= body.afterTimestampMs) {
        continue
      }
      if (passesFilters(item, filters)) {
        items.push(item)
      }
    }

    const matched = items.length
    items = items.slice(0, limit)
    const summary = summarize(items)
    const maxTimestamp = items.reduce((m, i) => (i.timestamp > m ? i.timestamp : m), 0)

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] ответ`,
      payload: { mode, scanned: rows.length, matched, returned: items.length }
    })

    return {
      success: true,
      mode,
      scanned: rows.length,
      matched,
      items,
      maxTimestamp,
      summary,
      note:
        'Источник — Heap-логи writeServerLog (logStage: v1_op_completed). При подключённой workspace-аналитике (queryAi/@traffic/sdk) возможно расширение, см. manual §7.4.2.'
    }
  } catch (e: unknown) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] ошибка`,
      payload: { error: e instanceof Error ? e.message : String(e) }
    })
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
})
