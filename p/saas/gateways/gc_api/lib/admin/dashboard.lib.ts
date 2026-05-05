import * as settingsLib from '../settings.lib'
import * as logsRepo from '../../repos/logs.repo'
import * as loggerLib from '../logger.lib'
import * as requestLogRepo from '../../repos/requestLog.repo'
import RequestLog from '../../tables/requestLog.table'

const LOG_MODULE = 'lib/admin/dashboard.lib'

export type DashboardCounts = {
  errorCount: number
  warnCount: number
  resetAt: number
  invokeTotal: number
  invokeSuccess: number
  invokeFailed: number
  /** p50 задержки invoke (мс) по выборке последних записей RequestLog после сброса */
  invokeLatencyP50Ms: number | null
  invokeLatencyP95Ms: number | null
  /** Счётчики по `op` за период после сброса (топ из выборки, не полный Heap-groupBy) */
  invokePerOpSample: Record<string, number>
}

const INVOKE_SAMPLE_LIMIT = 500

function percentile(sorted: number[], p: number): number | null {
  const n = sorted.length
  if (!n) return null
  const idx = Math.min(n - 1, Math.max(0, Math.floor((p / 100) * (n - 1))))
  return sorted[idx]!
}

function buildInvokeSampleStats(rows: Array<{ op: string; latencyMs: number }>): {
  p50: number | null
  p95: number | null
  perOp: Record<string, number>
} {
  const latencies = rows.map((r) => r.latencyMs).filter((x) => typeof x === 'number' && Number.isFinite(x))
  latencies.sort((a, b) => a - b)
  const perOp: Record<string, number> = {}
  for (const r of rows) {
    if (typeof r.op === 'string' && r.op) {
      perOp[r.op] = (perOp[r.op] ?? 0) + 1
    }
  }
  return {
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    perOp
  }
}

/**
 * Получить счётчики ошибок и предупреждений дашборда после таймштампа сброса.
 */
export async function getDashboardCounts(ctx: app.Ctx): Promise<DashboardCounts> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getDashboardCounts entry`,
    payload: {}
  })
  const resetAt = await settingsLib.getDashboardResetAt(ctx)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getDashboardCounts resetAt`,
    payload: { resetAt }
  })
  const [errorCount, warnCount, invokeTotal, invokeSuccess, invokeFailed, invokeSample] = await Promise.all([
    logsRepo.countErrorsAfter(ctx, resetAt),
    logsRepo.countWarningsAfter(ctx, resetAt),
    RequestLog.countBy(ctx, { where: { createdAt: { $gte: resetAt } } }),
    RequestLog.countBy(ctx, { where: { createdAt: { $gte: resetAt }, status: 'success' } }),
    RequestLog.countBy(ctx, { where: { createdAt: { $gte: resetAt }, status: 'error' } }),
    requestLogRepo.findRecent(ctx, { limit: INVOKE_SAMPLE_LIMIT, sinceMs: resetAt })
  ])
  const sampleStats = buildInvokeSampleStats(
    invokeSample.map((r) => ({ op: r.op, latencyMs: r.latencyMs }))
  )
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getDashboardCounts counts`,
    payload: { errorCount, warnCount, invokeTotal, invokeSuccess, invokeFailed }
  })
  const result = {
    errorCount,
    warnCount,
    resetAt,
    invokeTotal,
    invokeSuccess,
    invokeFailed,
    invokeLatencyP50Ms: sampleStats.p50,
    invokeLatencyP95Ms: sampleStats.p95,
    invokePerOpSample: sampleStats.perOp
  }
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getDashboardCounts exit`,
    payload: result
  })
  return result
}

/**
 * Сбросить дашборд: записать текущий таймштамп в настройки.
 * Возвращает нулевые счётчики и новый resetAt (опциональное предложение — без повторного GET).
 */
export async function resetDashboard(ctx: app.Ctx): Promise<DashboardCounts> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] resetDashboard entry`,
    payload: {}
  })
  const resetAt = Date.now()
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] resetDashboard resetAt`,
    payload: { resetAt }
  })
  await settingsLib.setSetting(ctx, settingsLib.SETTING_KEYS.DASHBOARD_RESET_AT, resetAt)
  const result = {
    errorCount: 0,
    warnCount: 0,
    resetAt,
    invokeTotal: 0,
    invokeSuccess: 0,
    invokeFailed: 0,
    invokeLatencyP50Ms: null,
    invokeLatencyP95Ms: null,
    invokePerOpSample: {}
  }
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] resetDashboard exit`,
    payload: result
  })
  return result
}
