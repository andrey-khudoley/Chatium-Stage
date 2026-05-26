/**
 * Эндпоинт приёма вебхуков Lava.Top (`PurchaseWebhookLog`).
 *   - GET `/`  — проверка доступности (curl/браузер): эндпоинт развёрнут, ждёт POST.
 *   - POST `/` — приём вебхука. Авторизация: `X-Api-Key` или Basic = `lava_webhook_secret`.
 *
 * Намеренно два роута (GET + POST) на один путь `/` в одном файле: это один и тот же
 * webhook-эндпоинт (GET — info/health, POST — рабочий приём), семантически неразделимы.
 * Тот же паттерн — в `lava_gc_integration/api/integrations/lava/webhook/index.ts`.
 *
 * Ответ формируется как `{ statusCode, rawHttpBody, headers }` — это «честный» HTTP-статус
 * (паттерн gateway-роутов lifepay/api/v1): 401 при неверном секрете заставляет Lava.Top повторить,
 * 2xx — считается доставленным. Тело вебхука читается из `req.body` (платформа парсит JSON).
 */

import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'
import { processWebhook } from '../../lib/webhook/webhookRelay.service'
import type { LavaWebhookPayload } from '../../lib/gateway/lavaTypes'

const LOG_PATH = 'api/webhook/receive'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readHeaders(req: app.Req): Record<string, unknown> {
  const h = (req as unknown as { headers?: unknown }).headers
  return isObject(h) ? h : {}
}

function readHeader(headers: Record<string, unknown>, name: string): string {
  const lower = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const v = headers[key]
      if (typeof v === 'string') return v
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0]
      return ''
    }
  }
  return ''
}

function jsonResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    rawHttpBody: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  }
}

/** GET — проверка доступности (секрет не раскрывается, только флаг наличия). */
export const webhookInfoRoute = app.get('/', async (ctx) => {
  const secret = (await settingsLib.getLavaWebhookSecret(ctx)).trim()
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] GET: проверка доступности`,
    payload: { webhookSecretConfigured: secret.length > 0 }
  })
  return {
    ok: true,
    status: 'ready',
    message:
      'Эндпоинт активен. Рабочие уведомления Lava.Top — POST с JSON-телом (PurchaseWebhookLog) и заголовком X-Api-Key (или Basic), совпадающим с настройкой lava_webhook_secret.',
    expectedMethod: 'POST',
    webhookSecretConfigured: secret.length > 0
  }
})

/** POST — приём вебхука Lava.Top и проксирование на клиентский callback. */
export const webhookReceiveRoute = app.post('/', async (ctx, req) => {
  const headers = readHeaders(req)
  const apiKey = readHeader(headers, 'X-Api-Key').trim()
  const authorization = readHeader(headers, 'Authorization')

  const body = (req as unknown as { body?: unknown }).body
  if (
    !isObject(body) ||
    typeof body.contractId !== 'string' ||
    typeof body.eventType !== 'string'
  ) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] invalid_webhook_payload`,
      payload: { bodyType: Array.isArray(body) ? 'array' : typeof body }
    })
    return jsonResponse(400, { success: false, error: 'invalid_webhook_payload' })
  }

  const payload = body as unknown as LavaWebhookPayload

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] received`,
    payload: {
      eventType: payload.eventType,
      contractId: payload.contractId,
      status: payload.status
    }
  })

  const result = await processWebhook(ctx, payload, { apiKey, authorization })

  if (result.kind === 'unauthorized') {
    return jsonResponse(401, { success: false, error: 'unauthorized' })
  }
  if (result.kind === 'config_error') {
    return jsonResponse(500, { success: false, error: 'webhook_secret_not_configured' })
  }
  return jsonResponse(200, {
    success: true,
    duplicate: result.duplicate === true,
    forwarded: result.forwarded === true,
    contractNotFound: result.contractNotFound === true
  })
})
