/**
 * POST /api/lp/invoke — серверная прокладка к payments-gateway.
 *
 * URL сохранён исторически (исходно — `lp` от LifePay). После ребрендинга
 * проекта `sbp-client` → `gw-client` и введения многогейтвейности (2026-05-28)
 * этот же роут обслуживает оба гейтвея — диспатчеризация по обязательному
 * полю `gatewayId` в теле запроса.
 *
 * Тело: `{ gatewayId: 'lifepay' | 'lavatop', op: string, args: object }`.
 * Делает один исходящий вызов через `@app/request` к
 * `<base_url>/api/v1/<op>` соответствующего gateway. Тело ответа возвращается
 * клиенту **без изменений**; HTTP-статус — как у gateway. requestId берётся
 * из заголовка `X-Gateway-Request-Id`.
 *
 * Доступ: requireRealUser + requireInternalAccess (ADR 0003, §1.11.8).
 * Без серверных ретраев. Без Idempotency-Key.
 */

import { invokeByGateway } from '../../lib/gateway/invokeDispatcher'
import { recordRequestLog } from '../../lib/gateway/recordRequestLog'
import { extractCorrelationId } from '../../shared/correlation'
import { guardInternalApi } from '../../lib/access/apiGuard'
import * as loggerLib from '../../lib/logger.lib'
import { findOperationInGateway } from '../../shared/gatewayContract'
import { INVOKE_PROXY_ERROR_CODES, SUPPORTED_GATEWAYS, isGatewayId } from '../../shared/invokeApi'
import { X_GATEWAY_REQUEST_ID } from '../../shared/gatewayContract'

const LOG_PATH = 'api/lp/invoke'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function jsonError(httpStatus: number, code: string, message: string) {
  const body = { ok: false, error: { code, message }, requestId: null }
  return {
    statusCode: httpStatus,
    rawHttpBody: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  }
}

export const invokeRoute = app.post('/', async (ctx, req) => {
  const denied = await guardInternalApi(ctx)
  if (denied) return denied

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] request_init`,
    payload: { bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : [] }
  })

  const body = req.body
  if (!isObject(body)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] body_invalid`,
      payload: { bodyType: typeof body }
    })
    return jsonError(
      400,
      INVOKE_PROXY_ERROR_CODES.BODY_INVALID,
      'Тело запроса должно быть JSON-объектом { gatewayId, op, args }.'
    )
  }

  const gatewayIdRaw = body.gatewayId
  if (typeof gatewayIdRaw !== 'string' || gatewayIdRaw.trim() === '') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] gateway_required`,
      payload: { gatewayIdType: typeof gatewayIdRaw }
    })
    return jsonError(
      400,
      INVOKE_PROXY_ERROR_CODES.GATEWAY_REQUIRED,
      `Поле gatewayId обязательно. Допустимо: ${SUPPORTED_GATEWAYS.join(', ')}.`
    )
  }
  const gatewayId = gatewayIdRaw.trim()
  if (!isGatewayId(gatewayId)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] gateway_unknown`,
      payload: { gatewayId }
    })
    return jsonError(
      400,
      INVOKE_PROXY_ERROR_CODES.GATEWAY_UNKNOWN,
      `Неизвестный gatewayId: "${gatewayId}". Допустимо: ${SUPPORTED_GATEWAYS.join(', ')}.`
    )
  }

  const op = typeof body.op === 'string' ? body.op.trim() : ''
  const argsRaw = body.args
  const args: Record<string, unknown> = isObject(argsRaw) ? argsRaw : {}

  if (!op) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] op_missing`,
      payload: { gatewayId }
    })
    return jsonError(400, INVOKE_PROXY_ERROR_CODES.BODY_INVALID, 'Поле op обязательно.')
  }

  if (!findOperationInGateway(gatewayId, op)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] op_unknown`,
      payload: { gatewayId, op }
    })
    return jsonError(
      400,
      INVOKE_PROXY_ERROR_CODES.OP_UNKNOWN,
      `Операция "${op}" не найдена в каталоге гейтвея "${gatewayId}".`
    )
  }

  // correlationId — ключ связки request_log ↔ webhook (LifePay-специфика).
  // Для Lava.Top используется отдельный механизм (contractId), но клиент может
  // передавать correlationId и при вызовах Lava.Top — поле опциональное.
  const correlationId = extractCorrelationId(args)
  const argsForGateway: Record<string, unknown> = { ...args }
  delete argsForGateway.correlationId

  const invoke = await invokeByGateway(ctx, gatewayId, op, argsForGateway)

  // Запись в журнал — синхронно перед возвратом (журнал важнее производительности UI;
  // запись в Heap занимает ~5-50ms).
  try {
    await recordRequestLog(ctx, {
      gatewayId,
      op,
      args: argsForGateway,
      invoke,
      correlationId
    })
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] record_log_failed`,
      payload: { gatewayId, op, error: String(e) }
    })
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] response`,
    payload: {
      gatewayId,
      op,
      httpStatus: invoke.httpStatus,
      ok: invoke.ok,
      requestId: invoke.requestId
    }
  })

  const responseHeaders: Record<string, string> = {
    'Content-Type': invoke.responseContentType
  }
  if (invoke.requestId) {
    responseHeaders[X_GATEWAY_REQUEST_ID] = invoke.requestId
  }

  return {
    statusCode: invoke.httpStatus,
    rawHttpBody: invoke.rawResponseBody || JSON.stringify(invoke.responseBody ?? null),
    headers: responseHeaders
  }
})

export default invokeRoute
