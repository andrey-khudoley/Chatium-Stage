/**
 * GET /api/lp/analytics/summary — карточки аналитики
 * (implementation-plan §1.8.4). Admin-only.
 *
 * Окно: по умолчанию 24 часа (query windowHours, max 24*30).
 *
 * Возвращает: requests {total, okShare, avgDurationMs, p95DurationMs, topErrorCode},
 * webhooks {total, successShare, tokenValidShare}.
 *
 * Эндпоинт не возвращает секретов и не выводит полных тел запросов/ответов.
 */

import * as requestLogRepo from '../../../repos/requestLog.repo'
import * as webhookLogRepo from '../../../repos/webhookLog.repo'
import * as loggerLib from '../../../lib/logger.lib'
import { ANALYTICS_DEFAULT_WINDOW_HOURS } from '../../../lib/gateway/constants'

const LOG_PATH = 'api/lp/analytics/summary'

const MAX_WINDOW_HOURS = 24 * 30

function parseWindow(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : typeof value === 'number' ? value : NaN
  if (!Number.isFinite(n) || n < 1) return ANALYTICS_DEFAULT_WINDOW_HOURS
  return Math.min(Math.floor(n), MAX_WINDOW_HOURS)
}

function computeP95(sortedAsc: number[]): number {
  if (sortedAsc.length === 0) return 0
  const idx = Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * 0.95))
  return sortedAsc[idx]
}

export const analyticsSummaryRoute = app.get('/', async (ctx, req) => {
  const windowHours = parseWindow((req.query as Record<string, unknown> | undefined)?.windowHours)
  const sinceTimestamp = Date.now() - windowHours * 60 * 60 * 1000

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { windowHours, sinceTimestamp }
  })

  // Подсчёт total и ok через countBy.
  const requestsTotal = await requestLogRepo.countSince(ctx, sinceTimestamp)
  const requestsOk = await requestLogRepo.countOkSince(ctx, sinceTimestamp)

  // Для avg/p95 и top errorCode — выгрузка записей окна. findRecentSince
  // внутри ходит cursor-пагинацией по 1000 (платформенный кэп findAll); внешний
  // limit ограничивает общее число записей (берём свежие, если их больше 5000).
  const recent = await requestLogRepo.findRecentSince(ctx, sinceTimestamp, 5000)
  const durations: number[] = []
  const errorCodeCount: Record<string, number> = {}
  for (const row of recent) {
    if (typeof row.durationMs === 'number' && Number.isFinite(row.durationMs)) {
      durations.push(row.durationMs)
    }
    if (!row.ok && row.errorCode) {
      errorCodeCount[row.errorCode] = (errorCodeCount[row.errorCode] || 0) + 1
    }
  }
  durations.sort((a, b) => a - b)
  const avgDurationMs =
    durations.length > 0 ? Math.round(durations.reduce((s, x) => s + x, 0) / durations.length) : 0
  const p95DurationMs = Math.round(computeP95(durations))

  let topErrorCode = ''
  let topErrorCount = 0
  for (const [code, count] of Object.entries(errorCodeCount)) {
    if (count > topErrorCount) {
      topErrorCount = count
      topErrorCode = code
    }
  }

  // Webhooks
  const webhooksTotal = await webhookLogRepo.countSince(ctx, sinceTimestamp)
  const webhooksSuccess = await webhookLogRepo.countStatusSuccessSince(ctx, sinceTimestamp)
  const webhooksTokenValid = await webhookLogRepo.countTokenValidSince(ctx, sinceTimestamp)

  const result = {
    success: true,
    windowHours,
    requests: {
      total: requestsTotal,
      okShare: requestsTotal > 0 ? Math.round((requestsOk / requestsTotal) * 1000) / 1000 : 0,
      avgDurationMs,
      p95DurationMs,
      topErrorCode,
      topErrorCount
    },
    webhooks: {
      total: webhooksTotal,
      successShare:
        webhooksTotal > 0 ? Math.round((webhooksSuccess / webhooksTotal) * 1000) / 1000 : 0,
      tokenValidShare:
        webhooksTotal > 0 ? Math.round((webhooksTokenValid / webhooksTotal) * 1000) / 1000 : 0
    }
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] exit`,
    payload: { windowHours, requestsTotal, webhooksTotal }
  })

  return result
})

export default analyticsSummaryRoute
