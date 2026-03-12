/**
 * Репозиторий рефералов (referrals).
 * createOrUpdateReferral — создание или обновление по campaignId + ref;
 * incrementReferralStats — инкремент счётчиков заказов/оплат.
 */

import Referrals from '../../tables/referrals.table'

export interface CreateOrUpdateReferralInput {
  campaignId: string
  partnerId: string
  ref: string
  tgId?: string
  gcId?: string
  name?: string
  email?: string
  phone?: string
}

/**
 * Создаёт реферала или обновляет существующего по campaignId + ref.
 * При обновлении не затирает уже заполненные поля; при создании ставит registeredAt = now.
 */
export async function createOrUpdateReferral(
  ctx: app.Ctx,
  data: CreateOrUpdateReferralInput
): Promise<typeof Referrals.T> {
  const existing = await Referrals.findOneBy(ctx, {
    campaignId: data.campaignId,
    ref: data.ref
  })
  const now = new Date()
  if (existing) {
    const updated = await Referrals.update(ctx, {
      id: existing.id,
      ...(data.tgId != null && { tgId: data.tgId }),
      ...(data.gcId != null && { gcId: data.gcId }),
      ...(data.name != null && data.name !== '' && { name: data.name }),
      ...(data.email != null && data.email !== '' && { email: data.email }),
      ...(data.phone != null && data.phone !== '' && { phone: data.phone })
    })
    return updated
  }
  return Referrals.create(ctx, {
    campaignId: data.campaignId,
    partnerId: data.partnerId,
    ref: data.ref,
    tgId: data.tgId,
    gcId: data.gcId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    registeredAt: now,
    ordersCount: 0,
    ordersSum: 0,
    paymentsCount: 0,
    paymentsSum: 0
  })
}

export interface IncrementReferralStatsInput {
  ordersCount?: number
  ordersSum?: number
  paymentsCount?: number
  paymentsSum?: number
}

/**
 * Инкрементирует счётчики реферала по campaignId + ref.
 */
export async function incrementReferralStats(
  ctx: app.Ctx,
  campaignId: string,
  ref: string,
  update: IncrementReferralStatsInput
): Promise<void> {
  const referral = await Referrals.findOneBy(ctx, { campaignId, ref })
  if (!referral) return
  const ordersCount = (referral.ordersCount ?? 0) + (update.ordersCount ?? 0)
  const ordersSum = (referral.ordersSum ?? 0) + (update.ordersSum ?? 0)
  const paymentsCount = (referral.paymentsCount ?? 0) + (update.paymentsCount ?? 0)
  const paymentsSum = (referral.paymentsSum ?? 0) + (update.paymentsSum ?? 0)
  await Referrals.update(ctx, {
    id: referral.id,
    ordersCount,
    ordersSum,
    paymentsCount,
    paymentsSum
  })
}

export interface ListReferralsInput {
  partnerId?: string
  dateFrom?: string
  dateTo?: string
  minOrders?: number
  minPayments?: number
  limit?: number
  offset?: number
}

/**
 * Список рефералов кампании с фильтрами и пагинацией.
 * Фильтры dateFrom, dateTo, minOrders, minPayments применяются в памяти (выбирается до 2000 записей).
 */
export async function listReferrals(
  ctx: app.Ctx,
  campaignId: string,
  opts: ListReferralsInput = {}
): Promise<{ referrals: Array<typeof Referrals.T>; total: number }> {
  const limit = Math.min(opts.limit ?? 20, 100)
  const offset = opts.offset ?? 0
  const where: Record<string, unknown> = { campaignId }
  if (opts.partnerId) where.partnerId = opts.partnerId
  const hasMemoryFilters = opts.dateFrom != null || opts.dateTo != null || opts.minOrders != null || opts.minPayments != null
  if (hasMemoryFilters) {
    const rows = await Referrals.findAll(ctx, {
      where,
      order: [{ registeredAt: 'desc' }],
      limit: 2000,
      offset: 0
    })
    let filtered = rows
    if (opts.dateFrom) {
      const from = new Date(opts.dateFrom).getTime()
      filtered = filtered.filter((r) => (r.registeredAt ? new Date(r.registeredAt).getTime() >= from : false))
    }
    if (opts.dateTo) {
      const to = new Date(opts.dateTo).getTime()
      filtered = filtered.filter((r) => (r.registeredAt ? new Date(r.registeredAt).getTime() <= to : false))
    }
    if (opts.minOrders != null) {
      filtered = filtered.filter((r) => (r.ordersCount ?? 0) >= opts.minOrders!)
    }
    if (opts.minPayments != null) {
      filtered = filtered.filter((r) => (r.paymentsCount ?? 0) >= opts.minPayments!)
    }
    const total = filtered.length
    const paginated = filtered.slice(offset, offset + limit)
    return { referrals: paginated, total }
  }
  const [referrals, total] = await Promise.all([
    Referrals.findAll(ctx, {
      where,
      order: [{ registeredAt: 'desc' }],
      limit,
      offset
    }),
    Referrals.countBy(ctx, where)
  ])
  return { referrals, total }
}
