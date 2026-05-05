import { runWithExclusiveLock } from '@app/sync'
import RequestLog from '../tables/requestLog.table'

const EXPORT_OPS = ['exportUsers', 'exportGroupUsers', 'exportDeals', 'exportPayments', 'getExportResult'] as const

const WINDOW_MS = 2 * 60 * 60 * 1000
const MAX_EXPORT_REQUESTS = 100

export function isLegacyExportOp(op: string): boolean {
  return (EXPORT_OPS as readonly string[]).includes(op)
}

/** Лимит Export API GC: 100 запросов за 2 часа (приближённо по журналу invoke). */
export async function assertLegacyExportAllowance(ctx: app.Ctx, op: string): Promise<void> {
  if (!isLegacyExportOp(op)) return

  await runWithExclusiveLock(ctx, 'gc-gateway-legacy-export-quota', async () => {
    const since = Date.now() - WINDOW_MS
    let total = 0
    for (const exportOp of EXPORT_OPS) {
      total += await RequestLog.countBy(ctx, {
        where: {
          createdAt: { $gte: since },
          op: exportOp,
          status: 'success'
        }
      })
    }
    if (total >= MAX_EXPORT_REQUESTS) {
      throw new Error(`GC_RATE_LIMIT: достигнут лимит Export API (${MAX_EXPORT_REQUESTS} за 2 ч.)`)
    }
  })
}
