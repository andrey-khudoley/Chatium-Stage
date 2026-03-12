// @shared-route
import { requireRealUser } from '@app/auth'
import * as memberRepo from '../../lib/repo/memberRepo'
import * as referralRepo from '../../lib/repo/referralRepo'
import Partners from '../../tables/partners.table'
import Referrals from '../../tables/referrals.table'

/**
 * GET /api/analytics/dashboard?campaignId=… — агрегаты кампании и последние рефералы для дашборда.
 * Требуется авторизация и доступ к кампании.
 */
export const dashboardRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const campaignId = typeof req.query?.campaignId === 'string' ? req.query.campaignId.trim() : ''
  if (!campaignId) {
    return { success: false, error: 'Параметр campaignId обязателен' }
  }

  const access = await memberRepo.checkCampaignAccess(ctx, campaignId, user.id)
  if (!access.hasAccess) {
    return { success: false, error: 'Нет доступа к кампании' }
  }

  const [partnersCount, referralsCount, allReferrals, latestReferrals] = await Promise.all([
    Partners.countBy(ctx, { campaignId }),
    Referrals.countBy(ctx, { campaignId }),
    Referrals.findAll(ctx, { where: { campaignId }, limit: 1000 }),
    referralRepo.listReferrals(ctx, campaignId, { limit: 10, offset: 0 })
  ])

  let totalOrdersCount = 0
  let totalOrdersSum = 0
  let totalPaymentsCount = 0
  let totalPaymentsSum = 0
  for (const r of allReferrals) {
    totalOrdersCount += r.ordersCount ?? 0
    totalOrdersSum += r.ordersSum ?? 0
    totalPaymentsCount += r.paymentsCount ?? 0
    totalPaymentsSum += r.paymentsSum ?? 0
  }

  const latest = latestReferrals.referrals.map((r) => ({
    id: r.id,
    ref: r.ref,
    name: r.name,
    email: r.email,
    registeredAt: (r as { registeredAt?: string }).registeredAt,
    ordersCount: r.ordersCount ?? 0,
    ordersSum: r.ordersSum ?? 0,
    paymentsCount: r.paymentsCount ?? 0,
    paymentsSum: r.paymentsSum ?? 0
  }))

  return {
    success: true,
    aggregates: {
      partnersCount,
      referralsCount,
      totalOrdersCount,
      totalOrdersSum,
      totalPaymentsCount,
      totalPaymentsSum
    },
    latestReferrals: latest
  }
})
