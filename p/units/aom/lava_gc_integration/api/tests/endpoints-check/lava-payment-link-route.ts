// @shared-route
import { requireAnyUser } from '@app/auth'
import { lavaPaymentLinkRoute } from '../../../api/integrations/lava/payment-link/index'
import * as loggerLib from '../../../lib/logger.lib'
import * as settingsLib from '../../../lib/settings.lib'

const LOG_PATH = 'api/tests/endpoints-check/lava-payment-link-route'

type TestResult = { id: string; title: string; passed: boolean; error?: string }

/**
 * GET /api/tests/endpoints-check/lava-payment-link-route — POST payment-link через route.run: UNAUTHORIZED и VALIDATION_ERROR.
 */
export const lavaPaymentLinkRouteTestRoute = app.get('/', async (ctx, req) => {
  requireAnyUser(ctx)

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Тесты роута payment-link`,
    payload: {}
  })

  const results: TestResult[] = []
  const token = (await settingsLib.getGcServiceToken(ctx)).trim()

  const check = async (id: string, title: string, fn: () => Promise<boolean>) => {
    try {
      const passed = await fn()
      results.push({ id, title, passed })
    } catch (e) {
      results.push({
        id,
        title,
        passed: false,
        error: (e as Error)?.message ?? String(e)
      })
    }
  }

  await check('wrong_service_token', 'payment-link: неверный X-Service-Token → UNAUTHORIZED', async () => {
    if (!token) {
      return true
    }
    const res = (await lavaPaymentLinkRoute.run(ctx, {
      body: {
        gcOrderId: `route-test-${Date.now()}`,
        buyerEmail: 'route@example.com',
        amount: 50,
        currency: 'RUB'
      },
      headers: { 'x-service-token': 'wrong-token-for-test' }
    })) as { success?: boolean; errorCode?: string }
    return res.success === false && res.errorCode === 'UNAUTHORIZED'
  })

  await check('missing_token_config', 'payment-link: при пустом gc_service_token → UNAUTHORIZED', async () => {
    if (token) {
      return true
    }
    const res = (await lavaPaymentLinkRoute.run(ctx, {
      body: {
        gcOrderId: 'x',
        buyerEmail: 'a@b.c',
        amount: 50,
        currency: 'RUB'
      },
      headers: { 'x-service-token': 'any' }
    })) as { success?: boolean; errorCode?: string }
    return res.success === false && res.errorCode === 'UNAUTHORIZED'
  })

  await check('validation_empty_order', 'payment-link: пустой gcOrderId при верном токене → VALIDATION_ERROR', async () => {
    if (!token) {
      return true
    }
    const res = (await lavaPaymentLinkRoute.run(ctx, {
      body: {
        gcOrderId: '   ',
        buyerEmail: 'a@b.c',
        amount: 50,
        currency: 'RUB'
      },
      headers: { 'x-service-token': token }
    })) as { success?: boolean; errorCode?: string }
    return res.success === false && res.errorCode === 'VALIDATION_ERROR'
  })

  return { success: true, test: 'lava-payment-link-route', results, at: Date.now() }
})
