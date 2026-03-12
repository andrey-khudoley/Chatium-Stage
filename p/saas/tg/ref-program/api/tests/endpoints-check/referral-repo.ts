// @shared-route
import { requireAnyUser } from '@app/auth'
import * as loggerLib from '../../../lib/logger.lib'
import * as campaignRepo from '../../../lib/repo/campaignRepo'
import * as referralRepo from '../../../lib/repo/referralRepo'
import Campaigns from '../../../tables/campaigns.table'
import CampaignMembers from '../../../tables/campaign_members.table'
import Partners from '../../../tables/partners.table'
import Referrals from '../../../tables/referrals.table'

const LOG_PATH = 'api/tests/endpoints-check/referral-repo'

type TestResult = { id: string; title: string; passed: boolean; error?: string }

/**
 * GET /api/tests/endpoints-check/referral-repo — тесты репозитория рефералов.
 */
export const referralRepoTestRoute = app.get('/', async (ctx, req) => {
  requireAnyUser(ctx)

  const userId = ctx.user?.id
  if (typeof userId !== 'string') {
    return { success: false, error: 'Нет пользователя в контексте', results: [], at: Date.now() }
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос проверки referralRepo`,
    payload: {}
  })

  const results: TestResult[] = []
  let campaignId: string | null = null
  let partnerId: string | null = null
  const testRef = 'ref-referral-test-' + Date.now()

  try {
    const campaign = await campaignRepo.createCampaign(ctx, {
      title: `[${LOG_PATH}] Тестовая кампания`,
      ownerUserId: userId
    })
    campaignId = campaign?.id ?? null

    if (!campaignId) {
      pushSkipped(results, 'Кампания не создана')
    } else {
      const partner = await Partners.create(ctx, {
        campaignId,
        tgId: 'test-tg-referral-' + Date.now(),
        username: 'test_referral_user',
        fullName: 'Test Referral Partner',
        stats: null
      })
      partnerId = partner?.id ?? null

      if (!partnerId) {
        pushSkipped(results, 'Партнёр не создан')
      } else {
        try {
          const r1 = await referralRepo.createOrUpdateReferral(ctx, {
            campaignId,
            partnerId,
            ref: testRef,
            name: 'Test User',
            email: 'test@example.com'
          })
          const createOk =
            r1 != null &&
            r1.id != null &&
            r1.ref === testRef &&
            (r1.ordersCount ?? 0) === 0 &&
            (r1.paymentsCount ?? 0) === 0
          results.push({
            id: 'createOrUpdateReferral-new',
            title: 'createOrUpdateReferral (новый реферал)',
            passed: createOk
          })
          if (!createOk) {
            results[results.length - 1].error = `ref=${r1?.ref}, ordersCount=${r1?.ordersCount}`
          }
        } catch (e) {
          results.push({
            id: 'createOrUpdateReferral-new',
            title: 'createOrUpdateReferral (новый реферал)',
            passed: false,
            error: (e as Error)?.message ?? String(e)
          })
        }

        try {
          const r2 = await referralRepo.createOrUpdateReferral(ctx, {
            campaignId,
            partnerId,
            ref: testRef,
            phone: '+79001234567'
          })
          const updateOk = r2 != null && r2.ref === testRef
          results.push({
            id: 'createOrUpdateReferral-update',
            title: 'createOrUpdateReferral (обновление)',
            passed: updateOk
          })
          if (!updateOk) {
            results[results.length - 1].error = 'реферал не обновлён или ref не совпадает'
          }
        } catch (e) {
          results.push({
            id: 'createOrUpdateReferral-update',
            title: 'createOrUpdateReferral (обновление)',
            passed: false,
            error: (e as Error)?.message ?? String(e)
          })
        }

        try {
          await referralRepo.incrementReferralStats(ctx, campaignId, testRef, {
            ordersCount: 1,
            ordersSum: 10000
          })
          const refAfter = await Referrals.findOneBy(ctx, { campaignId, ref: testRef })
          const incrementOk =
            refAfter != null &&
            (refAfter.ordersCount ?? 0) >= 1 &&
            (refAfter.ordersSum ?? 0) >= 10000
          results.push({
            id: 'incrementReferralStats',
            title: 'incrementReferralStats',
            passed: incrementOk
          })
          if (!incrementOk) {
            results[results.length - 1].error = `ordersCount=${refAfter?.ordersCount}, ordersSum=${refAfter?.ordersSum}`
          }
        } catch (e) {
          results.push({
            id: 'incrementReferralStats',
            title: 'incrementReferralStats',
            passed: false,
            error: (e as Error)?.message ?? String(e)
          })
        }
      }
    }
  } finally {
    if (campaignId) {
      const referrals = await Referrals.findAll(ctx, {
        where: { campaignId },
        limit: 100
      })
      for (const r of referrals) {
        try {
          await Referrals.delete(ctx, r.id)
        } catch (_) {}
      }
      if (partnerId) {
        try {
          await Partners.delete(ctx, partnerId)
        } catch (_) {}
      }
      const members = await CampaignMembers.findAll(ctx, {
        where: { campaignId },
        limit: 100
      })
      for (const m of members) {
        try {
          await CampaignMembers.delete(ctx, m.id)
        } catch (_) {}
      }
      try {
        await Campaigns.delete(ctx, campaignId)
      } catch (_) {}
    }
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Итог: ${results.filter((r) => r.passed).length}/${results.length} тестов пройдено`,
    payload: { results: results.map((r) => ({ id: r.id, passed: r.passed, error: r.error })) }
  })

  return { success: true, test: 'referral-repo', results, at: Date.now() }
})

function pushSkipped(results: TestResult[], reason: string): void {
  const ids = [
    'createOrUpdateReferral-new',
    'createOrUpdateReferral-update',
    'incrementReferralStats'
  ]
  const titles: Record<string, string> = {
    'createOrUpdateReferral-new': 'createOrUpdateReferral (новый реферал)',
    'createOrUpdateReferral-update': 'createOrUpdateReferral (обновление)',
    incrementReferralStats: 'incrementReferralStats'
  }
  for (const id of ids) {
    results.push({ id, title: titles[id], passed: false, error: reason })
  }
}
