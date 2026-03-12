// @shared-route
import { requireRealUser } from '@app/auth'
import * as memberRepo from '../../lib/repo/memberRepo'
import * as referralRepo from '../../lib/repo/referralRepo'

/**
 * GET /api/referrals/list?campaignId=…&partnerId=&limit=&offset= — список рефералов кампании.
 * Требуется авторизация и доступ к кампании.
 */
export const listReferralsRoute = app.get('/', async (ctx, req) => {
  const user = requireRealUser(ctx)
  const campaignId = typeof req.query?.campaignId === 'string' ? req.query.campaignId.trim() : ''
  if (!campaignId) {
    return { success: false, error: 'Параметр campaignId обязателен' }
  }

  const access = await memberRepo.checkCampaignAccess(ctx, campaignId, user.id)
  if (!access.hasAccess) {
    return { success: false, error: 'Нет доступа к кампании' }
  }

  const limit = typeof req.query?.limit === 'string' ? parseInt(req.query.limit, 10) : 20
  const offset = typeof req.query?.offset === 'string' ? parseInt(req.query.offset, 10) : 0
  const partnerId = typeof req.query?.partnerId === 'string' ? req.query.partnerId.trim() || undefined : undefined

  const { referrals: rows, total } = await referralRepo.listReferrals(ctx, campaignId, {
    limit: Number.isNaN(limit) ? 20 : Math.min(limit, 100),
    offset: Number.isNaN(offset) ? 0 : Math.max(0, offset),
    partnerId
  })

  const referrals = rows.map((r) => ({
    id: r.id,
    ref: r.ref ?? '',
    name: r.name,
    email: r.email,
    phone: r.phone,
    registeredAt: r.registeredAt != null ? new Date(r.registeredAt).toISOString() : undefined,
    ordersCount: r.ordersCount ?? 0,
    ordersSum: r.ordersSum ?? 0,
    paymentsCount: r.paymentsCount ?? 0,
    paymentsSum: r.paymentsSum ?? 0
  }))

  return {
    success: true,
    referrals,
    total
  }
})
