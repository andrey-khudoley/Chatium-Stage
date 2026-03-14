import { runWithExclusiveLock } from '@app/sync'
import Referrals from '../tables/referrals.table'
import ReferralAggregates from '../tables/referral_aggregates.table'
import Orders from '../tables/orders.table'
import Payments from '../tables/payments.table'
import Campaigns from '../tables/campaigns.table'

const BATCH_LIMIT = 1000

export interface RecalcReferralAggregatesParams {
  campaignOffset: number
  campaignIndex: number
  referralOffset: number
}

/**
 * Джоб пересчёта агрегатов рефералов одним батчем (≤BATCH_LIMIT записей на выборку).
 * Запускается цепочкой через scheduleJobAsap до полной обработки всех кампаний.
 * Пагинация кампаний: загрузка с offset/limit (campaignOffset, BATCH_LIMIT); campaignIndex — индекс внутри текущей страницы.
 * Полный пересчёт перезаписывает агрегаты по данным из таблиц заказов и оплат (не инкремент); запись по каждому рефералу сериализована с вебхуками через runWithExclusiveLock.
 */
export const recalcReferralAggregatesJob = app.job(
  '/recalc-referral-aggregates',
  async (ctx, params: RecalcReferralAggregatesParams) => {
    const campaignOffset = Math.max(0, Number(params?.campaignOffset) ?? 0)
    const campaignIndex = Math.max(0, Number(params?.campaignIndex) ?? 0)
    const referralOffset = Math.max(0, Number(params?.referralOffset) ?? 0)

    try {
      ctx.account.log('info', '[recalc-referral-aggregates-job] Старт батча', {
        json: { campaignOffset, campaignIndex, referralOffset }
      })

      const allCampaigns = await Campaigns.findAll(ctx, {
        limit: BATCH_LIMIT,
        offset: campaignOffset
      })
      const campaigns = allCampaigns.filter((c) => c.isDeleted !== true)

      if (campaignIndex >= campaigns.length) {
        ctx.account.log('info', '[recalc-referral-aggregates-job] Завершено: кампаний нет или все обработаны', {
          json: { campaignIndex, campaignsCount: campaigns.length }
        })
        return
      }

      const campaign = campaigns[campaignIndex]
      const campaignId = campaign.id

      const referrals = await Referrals.findAll(ctx, {
        where: { campaignId },
        limit: BATCH_LIMIT,
        offset: referralOffset
      })

      if (referrals.length === 0) {
        const nextCampaignIndex = campaignIndex + 1
        if (nextCampaignIndex < campaigns.length) {
          recalcReferralAggregatesJob.scheduleJobAsap(ctx, {
            campaignOffset,
            campaignIndex: nextCampaignIndex,
            referralOffset: 0
          })
          ctx.account.log('info', '[recalc-referral-aggregates-job] Кампания без рефералов, следующий батч', {
            json: { campaignId, nextCampaignIndex }
          })
        } else {
          recalcReferralAggregatesJob.scheduleJobAsap(ctx, {
            campaignOffset: campaignOffset + BATCH_LIMIT,
            campaignIndex: 0,
            referralOffset: 0
          })
          ctx.account.log('info', '[recalc-referral-aggregates-job] Следующая страница кампаний', {
            json: { nextCampaignOffset: campaignOffset + BATCH_LIMIT }
          })
        }
        return
      }

      const ordersByRef = new Map<string, { count: number; sum: number }>()
      const paymentsByRef = new Map<string, { count: number; sum: number }>()

      let ordersOffset = 0
      let ordersBatch: Array<{ ref?: string; orderSum?: number }> = []
      do {
        ordersBatch = await Orders.findAll(ctx, {
          where: { campaignId },
          limit: BATCH_LIMIT,
          offset: ordersOffset
        })
        for (const o of ordersBatch) {
          const ref = o.ref ?? ''
          if (!ref) continue
          const cur = ordersByRef.get(ref) ?? { count: 0, sum: 0 }
          cur.count += 1
          cur.sum += o.orderSum ?? 0
          ordersByRef.set(ref, cur)
        }
        ordersOffset += ordersBatch.length
      } while (ordersBatch.length === BATCH_LIMIT)

      let paymentsOffset = 0
      let paymentsBatch: Array<{ ref?: string; paymentSum?: number }> = []
      do {
        paymentsBatch = await Payments.findAll(ctx, {
          where: { campaignId },
          limit: BATCH_LIMIT,
          offset: paymentsOffset
        })
        for (const p of paymentsBatch) {
          const ref = p.ref ?? ''
          if (!ref) continue
          const cur = paymentsByRef.get(ref) ?? { count: 0, sum: 0 }
          cur.count += 1
          cur.sum += p.paymentSum ?? 0
          paymentsByRef.set(ref, cur)
        }
        paymentsOffset += paymentsBatch.length
      } while (paymentsBatch.length === BATCH_LIMIT)

      let updated = 0
      for (const r of referrals) {
        const ref = r.ref ?? ''
        const o = ordersByRef.get(ref) ?? { count: 0, sum: 0 }
        const pay = paymentsByRef.get(ref) ?? { count: 0, sum: 0 }
        await runWithExclusiveLock(ctx, `referral-aggregates:${r.id}`, {}, async () => {
          const existing = await ReferralAggregates.findOneBy(ctx, { referralId: r.id })
          if (existing) {
            await ReferralAggregates.update(ctx, {
              id: existing.id,
              ordersCount: o.count,
              ordersSum: o.sum,
              paymentsCount: pay.count,
              paymentsSum: pay.sum
            })
          } else {
            await ReferralAggregates.create(ctx, {
              referralId: r.id,
              campaignId: r.campaignId ?? campaignId,
              ordersCount: o.count,
              ordersSum: o.sum,
              paymentsCount: pay.count,
              paymentsSum: pay.sum
            })
          }
        })
        updated += 1
      }

      ctx.account.log('info', '[recalc-referral-aggregates-job] Батч обработан', {
        json: { campaignId, referralOffset, updated, referralsInBatch: referrals.length }
      })

      if (referrals.length === BATCH_LIMIT) {
        recalcReferralAggregatesJob.scheduleJobAsap(ctx, {
          campaignOffset,
          campaignIndex,
          referralOffset: referralOffset + BATCH_LIMIT
        })
      } else {
        const nextCampaignIndex = campaignIndex + 1
        if (nextCampaignIndex < campaigns.length) {
          recalcReferralAggregatesJob.scheduleJobAsap(ctx, {
            campaignOffset,
            campaignIndex: nextCampaignIndex,
            referralOffset: 0
          })
        } else {
          recalcReferralAggregatesJob.scheduleJobAsap(ctx, {
            campaignOffset: campaignOffset + BATCH_LIMIT,
            campaignIndex: 0,
            referralOffset: 0
          })
          ctx.account.log('info', '[recalc-referral-aggregates-job] Следующая страница кампаний', {
            json: { nextCampaignOffset: campaignOffset + BATCH_LIMIT }
          })
        }
      }
    } catch (err) {
      ctx.account.log('error', '[recalc-referral-aggregates-job] Ошибка', {
        json: { error: String(err), campaignOffset, campaignIndex, referralOffset }
      })
    }
  }
)
