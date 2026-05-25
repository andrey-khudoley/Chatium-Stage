/**
 * POST /api/lp/invoke — серверная прокладка к payments-gateway
 * (implementation-plan §1.8.2).
 *
 * Принимает JSON `{ op, args }`. Читает секреты из Heap, делает один исходящий вызов
 * через `@app/request` к `<gateway_base_url>/api/v1/<op>`. Тело ответа gateway возвращается
 * клиенту **без изменений**; HTTP-статус — как у gateway. requestId берётся из заголовка
 * `X-Gateway-Request-Id`.
 *
 * Доступ: requireRealUser + requireInternalAccess (ADR 0003, §1.11.8).
 * Без серверных ретраев. Без Idempotency-Key.
 */

import { invokeGateway } from '../../lib/gateway/invokeClient'
import { recordRequestLog } from '../../lib/gateway/recordRequestLog'
import { extractCorrelationId } from '../../shared/correlation'
import { guardInternalApi } from '../../lib/access/apiGuard'
import * as loggerLib from '../../lib/logger.lib'
import { findOperationInCatalog } from '../../shared/gatewayContract'
import { INVOKE_PROXY_ERROR_CODES } from '../../shared/invokeApi'
import { X_GATEWAY_REQUEST_ID } from '../../shared/gatewayContract'

const LOG_PATH = 'api/lp/invoke'

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
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
    const errBody = {
      ok: false,
      error: {
        code: INVOKE_PROXY_ERROR_CODES.BODY_INVALID,
        message: 'Тело запроса должно быть JSON-объектом { op, args }.'
      },
      requestId: null
    }
    return {
      statusCode: 400,
      rawHttpBody: JSON.stringify(errBody),
      headers: { 'Content-Type': 'application/json' }
    }
  }

  const op = typeof body.op === 'string' ? body.op.trim() : ''
  const argsRaw = body.args
  const args: Record<string, unknown> = isObject(argsRaw) ? argsRaw : {}

  if (!op) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] op_missing`,
      payload: {}
    })
    const errBody = {
      ok: false,
      error: {
        code: INVOKE_PROXY_ERROR_CODES.BODY_INVALID,
        message: 'Поле op обязательно.'
      },
      requestId: null
    }
    return {
      statusCode: 400,
      rawHttpBody: JSON.stringify(errBody),
      headers: { 'Content-Type': 'application/json' }
    }
  }

  if (!findOperationInCatalog(op)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] op_unknown`,
      payload: { op }
    })
    const errBody = {
      ok: false,
      error: {
        code: INVOKE_PROXY_ERROR_CODES.OP_UNKNOWN,
        message: 'Операция не найдена в локальном каталоге.'
      },
      requestId: null
    }
    return {
      statusCode: 400,
      rawHttpBody: JSON.stringify(errBody),
      headers: { 'Content-Type': 'application/json' }
    }
  }

  // correlationId — наш ключ связки request_log ↔ webhook (LifePay не возвращает
  // orderNumber в webhook). Клиент кладёт его и в callbackUrl, и в args. В gateway
  // НЕ пробрасываем (LifePay его не ждёт): отделяем от args перед вызовом.
  const correlationId = extractCorrelationId(args)
  const argsForGateway: Record<string, unknown> = { ...args }
  delete argsForGateway.correlationId

  const invoke = await invokeGateway(ctx, op, argsForGateway)

  // Запись в журнал — синхронно перед возвратом (журнал важнее производительности UI;
  // запись в Heap занимает ~5-50ms).
  try {
    await recordRequestLog(ctx, { op, args: argsForGateway, invoke, correlationId })
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] record_log_failed`,
      payload: { op, error: String(e) }
    })
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] response`,
    payload: { op, httpStatus: invoke.httpStatus, ok: invoke.ok, requestId: invoke.requestId }
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
