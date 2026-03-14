// @shared-route
import { requireAccountRole } from '@app/auth'
import { recalcReferralAggregatesJob } from '../../jobs/recalc-referral-aggregates.job'

/**
 * POST /api/admin/recalc-referral-aggregates — поставить в очередь пересчёт агрегатов рефералов.
 * Только Admin. Не выполняет пересчёт сам: запускает джоб (цепочка батчей по 1000 записей).
 */
export const recalcReferralAggregatesRoute = app.post('/', async (ctx) => {
  requireAccountRole(ctx, 'Admin')

  try {
    recalcReferralAggregatesJob.scheduleJobAsap(ctx, {
      campaignOffset: 0,
      campaignIndex: 0,
      referralOffset: 0
    })
    ctx.account.log('info', '[recalc-referral-aggregates] Пересчёт поставлен в очередь')
    return {
      success: true,
      jobScheduled: true
    }
  } catch (err) {
    ctx.account.log('error', '[recalc-referral-aggregates] Ошибка постановки джоба', {
      json: { error: String(err) }
    })
    return {
      success: false,
      error: (err as Error)?.message ?? String(err)
    }
  }
})
