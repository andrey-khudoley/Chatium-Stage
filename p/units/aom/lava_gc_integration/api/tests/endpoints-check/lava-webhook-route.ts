/** Сервер-only: импорт `lavaWebhookRoute` тянет `app.body` со схемой — не помечать @shared-route. */
import { requireAnyUser } from '@app/auth'
import {
  lavaWebhookInfoRoute,
  lavaWebhookRoute
} from '../../../api/integrations/lava/webhook/index'
import * as loggerLib from '../../../lib/logger.lib'
import * as settingsLib from '../../../lib/settings.lib'

const LOG_PATH = 'api/tests/endpoints-check/lava-webhook-route'

type TestResult = { id: string; title: string; passed: boolean; error?: string }

function baseBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    eventType: 'payment.success',
    contractId: `route-wh-${Date.now()}`,
    amount: 100,
    currency: 'RUB',
    status: 'completed',
    timestamp: new Date().toISOString(),
    ...overrides
  }
}

/** Ответ `ctx.resp.json(…, 401)` при `route.run` может отличаться от HTTP; принимаем несколько форм. */
function isUnauthorizedRouteResult(r: unknown): boolean {
  if (r == null) {
    return false
  }
  if (typeof r === 'string') {
    return /unauthorized/i.test(r)
  }
  if (typeof r === 'object') {
    const o = r as Record<string, unknown>
    if (o.success === false) {
      return true
    }
    if (o.statusCode === 401) {
      return true
    }
    if (typeof o.body === 'string' && /unauthorized/i.test(o.body)) {
      return true
    }
  }
  return false
}

function isValidationRelatedFailure(caught: unknown, r: unknown): boolean {
  if (caught) {
    const m = caught instanceof Error ? caught.message : String(caught)
    if (/validat|schema|422|expected|enum|required/i.test(m)) {
      return true
    }
  }
  if (r && typeof r === 'object') {
    const o = r as Record<string, unknown>
    if (o.statusCode === 422) {
      return true
    }
    const err = String(o.error ?? o.reason ?? '')
    if (/validat/i.test(err)) {
      return true
    }
  }
  return false
}

/**
 * GET /api/tests/endpoints-check/lava-webhook-route — `lavaWebhookInfoRoute` и `lavaWebhookRoute.run`:
 * структура GET, 401 при неверном ключе, провал валидации тела, успех при верном ключе и валидном теле.
 */
export const lavaWebhookRouteTestRoute = app.get('/', async (ctx, _req) => {
  requireAnyUser(ctx)

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Тесты роута webhook`,
    payload: {}
  })

  const results: TestResult[] = []
  const secret = (await settingsLib.getLavaWebhookSecret(ctx)).trim()

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

  await check('info_get', 'webhook GET: ok, status ready, webhookSecretConfigured boolean', async () => {
    const res = (await lavaWebhookInfoRoute.run(ctx)) as Record<string, unknown>
    return (
      res.ok === true &&
      res.status === 'ready' &&
      typeof res.webhookSecretConfigured === 'boolean' &&
      res.expectedMethod === 'POST'
    )
  })

  await check('post_wrong_api_key', 'webhook POST: неверный X-Api-Key → отказ (401-семантика)', async () => {
    try {
      const r = await lavaWebhookRoute.run(ctx, {
        ...baseBody(),
        headers: { 'X-Api-Key': 'definitely-not-the-webhook-secret' }
      })
      return isUnauthorizedRouteResult(r)
    } catch (e) {
      const m = (e as Error)?.message ?? String(e)
      return /unauthorized|401/i.test(m)
    }
  })

  await check('post_missing_api_key', 'webhook POST: без заголовка ключа при заданном секрете → отказ', async () => {
    if (!secret) {
      return true
    }
    let r: unknown
    try {
      r = await lavaWebhookRoute.run(ctx, {
        ...baseBody(),
        headers: {}
      })
    } catch (e) {
      return false
    }
    return isUnauthorizedRouteResult(r)
  })

  await check('post_invalid_body', 'webhook POST: невалидное тело (eventType) → валидация', async () => {
    let r: unknown
    let caught: unknown
    try {
      r = await lavaWebhookRoute.run(ctx, {
        ...baseBody(),
        eventType: 'totally.invalid.event',
        headers: secret ? { 'X-Api-Key': secret } : { 'X-Api-Key': 'x' }
      })
    } catch (e) {
      caught = e
    }
    return isValidationRelatedFailure(caught, r)
  })

  await check('post_success_contract_not_found', 'webhook POST: верный ключ + валидное тело → { success: true }', async () => {
    if (!secret) {
      return true
    }
    let r: unknown
    try {
      r = await lavaWebhookRoute.run(ctx, {
        ...baseBody({ contractId: `missing-route-${Date.now()}` }),
        headers: { 'X-Api-Key': secret }
      })
    } catch (e) {
      return false
    }
    const o = r as { success?: boolean }
    return o.success === true
  })

  return { success: true, test: 'lava-webhook-route', results, at: Date.now() }
})
