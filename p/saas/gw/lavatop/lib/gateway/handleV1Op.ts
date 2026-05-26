/**
 * Общая цепочка обработки `/v1/{op}` Lava.Top-gateway. Адаптация
 * `p/saas/gw/lifepay/lib/gateway/handleV1Op.ts` под Lava.Top:
 *   1. Генерация `requestId`, лог `request_init`.
 *   2. Проверка `availability` по каталогу.
 *   3. Для POST — проверка Content-Type и размера тела.
 *   4. Извлечение/валидация заголовка `X-Lava-Apikey` (без логина).
 *   5. Валидация `args` через `argsValidator` из каталога.
 *   6. Вызов прикладного `handler` → `LavaClientResult` + семантика.
 *   7. Классификация транспорта Lava.Top: `rate_limited` (429) → `INVOKE_LAVA_RATE_LIMITED`,
 *      `timeout` / `network_error` / `upstream_status` / `upstream_parse_error`.
 *   8. Запись в `gatewayRequestLog` (всегда) + `gatewayUpstreamLog` (если был вызов) в `finally`.
 */

import * as loggerLib from '../logger.lib'
import { findOperation } from './operationsCatalog'
import type { OperationEntry } from './operationsCatalog'
import { generateRequestId } from './requestId'
import {
  buildOkResponse,
  buildErrorResponse,
  GATEWAY_OP_BETA_UNSTABLE_WARNING
} from './gatewayResponse'
import type { GatewayHttpResponse } from './gatewayResponse'
import { extractAndValidateLavaCredentials, maskLavaApikey } from './lavaCredentials'
import type { LavaCredentials } from './lavaCredentials'
import { GW_OUTBOUND_TIMEOUT_MS, GW_MAX_REQUEST_BODY_BYTES } from './constants'
import type { LavaClientResult } from './lavaTopClient'
import type { InvoicesV1SemanticResult } from './invoicesV1Semantic'
import { redactRawDeep } from '../../shared/redactRaw'
import * as gatewayRequestLogRepo from '../../repos/gatewayRequestLog.repo'
import * as gatewayUpstreamLogRepo from '../../repos/gatewayUpstreamLog.repo'

const LOG_PATH = 'lib/gateway/handleV1Op'

/** Аккумулятор данных для финальной записи в журналы gateway. */
type GatewayLogCtx = {
  requestId: string
  op: string
  contour: string
  method: string
  requestStart: number
  rawArgs: unknown
  rawHeadersSafe: unknown
  upstream: null | {
    kind: string
    lpHttpStatus: number
    rawLpJson: unknown
    semanticRule: string
    sentAt: number
    durationMs: number
  }
}

/** Заголовки, которые ВСЕГДА исключаем из rawHeadersSafe до применения redactRawDeep. */
const HEADERS_SECRET_BLOCKLIST = new Set([
  'x-lava-apikey',
  'x-api-key',
  'authorization',
  'cookie',
  'set-cookie'
])

function stripSecretHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(headers)) {
    if (HEADERS_SECRET_BLOCKLIST.has(k.toLowerCase())) continue
    out[k] = v
  }
  return out
}

function extractErrorCodeFromResponse(resp: GatewayHttpResponse): string {
  let body: Record<string, unknown> | null = null
  try {
    const parsed = JSON.parse(resp.rawHttpBody)
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>
  } catch {
    return ''
  }
  if (!body || body.ok === true) return ''
  const error = body.error
  if (error && typeof error === 'object') {
    const code = (error as Record<string, unknown>).code
    if (typeof code === 'string') return code
  }
  return ''
}

async function writeGatewayLogs(
  ctx: app.Ctx,
  gwLog: GatewayLogCtx,
  resp: GatewayHttpResponse | null
): Promise<void> {
  const clientHttpStatus = resp?.statusCode ?? 500
  const errorCode = resp ? extractErrorCodeFromResponse(resp) : 'INVOKE_INTERNAL_ERROR'
  const requestedAt = gwLog.requestStart
  const durationMs = Date.now() - requestedAt

  try {
    await gatewayRequestLogRepo.create(ctx, {
      requestId: gwLog.requestId,
      op: gwLog.op,
      contour: gwLog.contour,
      method: gwLog.method,
      rawArgs: gwLog.rawArgs,
      rawHeadersSafe: gwLog.rawHeadersSafe,
      clientHttpStatus,
      errorCode,
      durationMs,
      requestedAt
    })
  } catch (e) {
    try {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] gateway_request_log_write_failed`,
        payload: { requestId: gwLog.requestId, op: gwLog.op, error: String(e) }
      })
    } catch {
      // глотаем
    }
  }

  if (gwLog.upstream) {
    try {
      await gatewayUpstreamLogRepo.create(ctx, {
        requestId: gwLog.requestId,
        op: gwLog.op,
        upstreamKind: gwLog.upstream.kind,
        rawLpJson: gwLog.upstream.rawLpJson,
        lpHttpStatus: gwLog.upstream.lpHttpStatus,
        semanticRule: gwLog.upstream.semanticRule,
        durationMs: gwLog.upstream.durationMs,
        sentAt: gwLog.upstream.sentAt
      })
    } catch (e) {
      try {
        await loggerLib.writeServerLog(ctx, {
          severity: 3,
          message: `[${LOG_PATH}] gateway_upstream_log_write_failed`,
          payload: { requestId: gwLog.requestId, op: gwLog.op, error: String(e) }
        })
      } catch {
        // глотаем
      }
    }
  }
}

export type HandlerArgs<A> = {
  requestId: string
  credentials: LavaCredentials
  args: A
}

/**
 * Результат прикладного handler:
 *   - `kind: 'lp_result'` — транспортная реакция Lava.Top + (при json_ok) семантика и payload успеха.
 *   - `kind: 'gateway_error'` — локальная ошибка gateway без обращения к Lava.Top.
 */
export type HandlerResult =
  | {
      kind: 'lp_result'
      lp: LavaClientResult
      semantic?: InvoicesV1SemanticResult | null
      successData?: unknown
    }
  | {
      kind: 'gateway_error'
      code: import('./gatewayErrors').GatewayErrorCode
      details?: Record<string, unknown>
    }

export type V1OpHandler<A> = (ctx: app.Ctx, args: HandlerArgs<A>) => Promise<HandlerResult>

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readQuery(req: app.Req): Record<string, unknown> {
  const q = (req as unknown as { query?: unknown }).query
  return isObject(q) ? q : {}
}

function readBody(req: app.Req): unknown {
  return (req as unknown as { body?: unknown }).body
}

function readHeaders(req: app.Req): Record<string, unknown> {
  const h = (req as unknown as { headers?: unknown }).headers
  return isObject(h) ? h : {}
}

function readHeader(headers: Record<string, unknown>, name: string): string | null {
  const lower = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const v = headers[key]
      if (typeof v === 'string') return v
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0]
      return null
    }
  }
  return null
}

function isJsonContentType(headerValue: string | null): boolean {
  if (!headerValue) return false
  const lower = headerValue.toLowerCase().trim()
  if (lower === 'application/json') return true
  return lower.startsWith('application/json;')
}

function estimateBodySize(body: unknown, headers: Record<string, unknown>): number {
  const cl = readHeader(headers, 'Content-Length')
  if (cl !== null) {
    const n = Number(cl)
    if (Number.isFinite(n) && n >= 0) return n
  }
  try {
    return JSON.stringify(body).length
  } catch {
    return 0
  }
}

/** Диагностический «отпечаток» тела ответа Lava.Top для логов `lp_semantic_error` (без PII). */
function extractLpJsonShape(lpJson: unknown): Record<string, unknown> | undefined {
  if (!isObject(lpJson)) {
    return { rootType: Array.isArray(lpJson) ? 'array' : typeof lpJson }
  }
  const shape: Record<string, unknown> = { rootKeys: Object.keys(lpJson) }
  shape.hasId = typeof lpJson.id === 'string' || typeof lpJson.contractId === 'string'
  shape.hasPaymentUrl =
    typeof lpJson.paymentUrl === 'string' || typeof lpJson.payment_url === 'string'
  if (typeof lpJson.status === 'string') shape.rootStatus = lpJson.status
  if (Array.isArray(lpJson.items)) shape.itemsCount = lpJson.items.length
  return shape
}

export async function handleV1Op<A = Record<string, unknown>>(
  ctx: app.Ctx,
  req: app.Req,
  op: string,
  handler: V1OpHandler<A>
): Promise<GatewayHttpResponse> {
  const requestId = generateRequestId()
  const gwLog: GatewayLogCtx = {
    requestId,
    op,
    contour: '',
    method: '',
    requestStart: Date.now(),
    rawArgs: {},
    rawHeadersSafe: {},
    upstream: null
  }

  let response: GatewayHttpResponse | null = null
  try {
    response = await runHandleV1Op(ctx, req, op, handler, requestId, gwLog)
    return response
  } catch (error) {
    try {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] internal_error`,
        payload: { requestId, op, error: String(error) }
      })
    } catch {
      // глотаем — лог упал, ответ всё равно нужен
    }
    response = buildErrorResponse(requestId, 'INVOKE_INTERNAL_ERROR')
    return response
  } finally {
    await writeGatewayLogs(ctx, gwLog, response)
  }
}

async function runHandleV1Op<A>(
  ctx: app.Ctx,
  req: app.Req,
  op: string,
  handler: V1OpHandler<A>,
  requestId: string,
  gwLog: GatewayLogCtx
): Promise<GatewayHttpResponse> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] request_init`,
    payload: { requestId, op }
  })

  const headersAll = readHeaders(req)
  gwLog.rawHeadersSafe = redactRawDeep(stripSecretHeaders(headersAll))

  const entry: OperationEntry | null = findOperation(op)
  if (!entry) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] op_not_found_in_catalog`,
      payload: { requestId, op }
    })
    return buildErrorResponse(requestId, 'INVOKE_OP_UNKNOWN', { op })
  }

  gwLog.contour = entry.contour
  gwLog.method = entry.httpMethod

  if (entry.availability === 'disabled') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] op_disabled`,
      payload: { requestId, op }
    })
    return buildErrorResponse(requestId, 'INVOKE_OP_DISABLED', { op })
  }
  if (entry.availability === 'unsupported') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] op_unsupported`,
      payload: { requestId, op }
    })
    return buildErrorResponse(requestId, 'INVOKE_OP_UNSUPPORTED_BY_LP', { op })
  }

  const headers = headersAll
  if (entry.httpMethod === 'POST') {
    const contentType = readHeader(headers, 'Content-Type')
    if (!isJsonContentType(contentType)) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] content_type_unsupported`,
        payload: { requestId, op }
      })
      return buildErrorResponse(requestId, 'INVOKE_CONTENT_TYPE_UNSUPPORTED')
    }
    const size = estimateBodySize(readBody(req), headers)
    if (size > GW_MAX_REQUEST_BODY_BYTES) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] body_too_large`,
        payload: { requestId, op, limitBytes: GW_MAX_REQUEST_BODY_BYTES, receivedBytes: size }
      })
      return buildErrorResponse(requestId, 'INVOKE_BODY_TOO_LARGE', {
        limitBytes: GW_MAX_REQUEST_BODY_BYTES,
        receivedBytes: size
      })
    }
  }

  const credResult = extractAndValidateLavaCredentials(headers)
  if (credResult.kind === 'error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] auth_header_invalid`,
      payload: { requestId, op, code: credResult.code }
    })
    return buildErrorResponse(requestId, credResult.code, credResult.details)
  }
  const credentials = credResult.credentials

  let rawArgs: unknown
  if (entry.httpMethod === 'POST') {
    const body = readBody(req)
    if (!isObject(body)) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] body_invalid_json`,
        payload: { requestId, op, bodyType: Array.isArray(body) ? 'array' : typeof body }
      })
      gwLog.rawArgs =
        body === null || body === undefined
          ? { __noBody: true }
          : typeof body === 'string'
            ? { __nonJson: true, __preview: body.slice(0, 1024) }
            : redactRawDeep(body)
      return buildErrorResponse(requestId, 'INVOKE_BODY_INVALID_JSON')
    }
    rawArgs = body
  } else {
    rawArgs = readQuery(req)
  }
  gwLog.rawArgs = redactRawDeep(rawArgs)

  const parsed = entry.argsValidator.safeParse(rawArgs) as
    | { success: true; data: unknown }
    | { success: false; error: { issues?: Array<{ fullPath?: string; message: string }> } }
  if (parsed.success === false) {
    const issues = parsed.error?.issues
    const errors =
      Array.isArray(issues) && issues.length > 0
        ? issues.map((i) => ({ path: i.fullPath ?? '', message: i.message }))
        : [{ path: '', message: 'args не соответствует схеме' }]
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] args_schema_violation`,
      payload: { requestId, op, errors }
    })
    return buildErrorResponse(requestId, 'INVOKE_ARGS_SCHEMA_VIOLATION', { errors })
  }
  const args = parsed.data as Record<string, unknown>

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] lp_request_init`,
    payload: {
      requestId,
      op,
      contour: entry.contour,
      method: entry.httpMethod,
      apikeyMask: maskLavaApikey(credentials.apikey)
    }
  })

  const upstreamStart = Date.now()
  const result = await handler(ctx, { requestId, credentials, args: args as A })
  const upstreamDuration = Date.now() - upstreamStart

  // Заполнить gwLog.upstream — это значит «реальный вызов к Lava.Top был выполнен».
  if (result.kind === 'lp_result') {
    const lpResult = result.lp
    const upstreamKind: string = lpResult.kind
    let lpHttpStatus = 0
    let rawLpJson: unknown
    if (lpResult.kind === 'json_ok') {
      lpHttpStatus = lpResult.lpStatus
      rawLpJson = redactRawDeep(lpResult.lpJson)
    } else if (
      lpResult.kind === 'upstream_status' ||
      lpResult.kind === 'upstream_parse_error' ||
      lpResult.kind === 'rate_limited'
    ) {
      lpHttpStatus = lpResult.lpStatus
      rawLpJson = {
        __kind: lpResult.kind,
        lpHttpStatus: lpResult.lpStatus,
        __rawText: (lpResult.lpRawText ?? '').slice(0, 1024)
      }
    } else {
      // timeout | network_error — без http-статуса.
      rawLpJson = { __kind: lpResult.kind }
    }
    gwLog.upstream = {
      kind: upstreamKind,
      lpHttpStatus,
      rawLpJson,
      semanticRule: result.semantic?.rule ?? '',
      sentAt: upstreamStart,
      durationMs: upstreamDuration
    }
  }

  if (result.kind === 'gateway_error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] gateway_error_from_handler`,
      payload: { requestId, op, code: result.code }
    })
    return buildErrorResponse(requestId, result.code, result.details)
  }

  const lp = result.lp
  if (lp.kind === 'rate_limited') {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] lp_rate_limited`,
      payload: { requestId, op, lpHttpStatus: lp.lpStatus }
    })
    return buildErrorResponse(requestId, 'INVOKE_LAVA_RATE_LIMITED')
  }
  if (lp.kind === 'timeout') {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] lp_timeout`,
      payload: { requestId, op, timeoutMs: GW_OUTBOUND_TIMEOUT_MS }
    })
    return buildErrorResponse(requestId, 'INVOKE_LP_TIMEOUT', { timeoutMs: GW_OUTBOUND_TIMEOUT_MS })
  }
  if (lp.kind === 'network_error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] lp_network_error`,
      payload: { requestId, op }
    })
    return buildErrorResponse(requestId, 'INVOKE_LP_NETWORK_ERROR')
  }
  if (lp.kind === 'upstream_status' || lp.kind === 'upstream_parse_error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] lp_upstream_error`,
      payload: { requestId, op, lpHttpStatus: lp.lpStatus, kind: lp.kind }
    })
    return buildErrorResponse(requestId, 'INVOKE_LP_UPSTREAM_ERROR', { lpHttpStatus: lp.lpStatus })
  }

  if (result.semantic) {
    const details: Record<string, unknown> = {
      lpContour: entry.contour,
      lpRule: result.semantic.rule
    }
    const lpShape = lp.kind === 'json_ok' ? extractLpJsonShape(lp.lpJson) : undefined
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] lp_semantic_error`,
      payload: { requestId, op, ...details, ...(lpShape ? { lpShape } : {}) }
    })
    return buildErrorResponse(requestId, 'INVOKE_LP_SEMANTIC_ERROR', details)
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] lp_response_ok`,
    payload: { requestId, op }
  })

  const warnings = entry.availability === 'beta' ? [GATEWAY_OP_BETA_UNSTABLE_WARNING] : undefined
  return buildOkResponse(requestId, result.successData ?? null, warnings)
}
