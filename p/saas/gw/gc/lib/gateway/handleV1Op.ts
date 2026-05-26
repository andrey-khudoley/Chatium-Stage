/**
 * Общая цепочка обработки `/v1/{op}` (manual §2.6, §2.8, §2.11, §9.0) по lifepay-модели.
 *
 * Инкапсулирует все проверки (requestId, availability, заголовки школы, devKey, content-type,
 * args-валидация, path-template), а сам исходящий вызов к GetCourse делегирует прикладному
 * per-op handler-у (`api/v1/{op}.ts`). После вызова — единая классификация ответа GC через
 * `interpretGcContourResponse` и сборка ответа `/v1`.
 *
 * В `finally` — запись raw-журналов: `gatewayRequestLog` (всегда) и `gatewayUpstreamLog`
 * (только если был фактический вызов GC). Каждый repo-вызов обёрнут в свой try/catch, чтобы
 * не ломать клиентский ответ.
 *
 * ВАЖНО (против циклов импорта): этот файл НЕ импортирует `v1OpHandlers.ts` и `api/v1/*`.
 * Зависимость односторонняя: `api/v1/{op}.ts` → `handleV1Op.ts`.
 */

import * as loggerLib from '../logger.lib'
import * as settingsLib from '../settings.lib'
import { GW_OUTBOUND_TIMEOUT_MS, GW_MAX_REQUEST_BODY_BYTES } from './constants'
import { GATEWAY_OP_BETA_WARNING_ENTRY } from './gatewayBetaWarnings'
import { interpretGcContourResponse } from './interpretGcV1Response'
import { applyPathTemplate } from './pathTemplate'
import { findOperationCatalogEntry, type OperationEntry } from './operationsCatalog'
import { newGatewayRequestId } from './requestId'
import {
  extractJsonObjectArgs,
  isApplicationJsonContentType,
  measureSerializedBodyBytes,
  parseContentLengthBytes,
  parseSchoolHeaders,
  readHeaderInsensitive
} from './v1IncomingPost'
import { GW_HEADER_SCHOOL_HOST } from '../../shared/gatewayHttpHeaders'
import { parseFlatQueryArgs } from './v1GatewayQuery'
import { v1ErrorResponse, v1SuccessResponse, type V1TuneResponse } from './v1TuneResponse'
import { redactRawDeep } from '../../shared/redactRaw'
import * as gatewayRequestLogRepo from '../../repos/gatewayRequestLog.repo'
import * as gatewayUpstreamLogRepo from '../../repos/gatewayUpstreamLog.repo'

const LOG_PATH = 'lib/gateway/handleV1Op'

/** Минимальные поля входящего HTTP (роут платформы или синтетический объект в тестах). */
export type V1IncomingLike = {
  method?: string
  headers?: unknown
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}

/**
 * Сырой ответ GetCourse — для админского сьюита тестов
 * (`handleV1OpWithGcDiagnostic`). Публичный JSON `/v1/{op}` этого не включает.
 */
export type V1GcDiagnostic = {
  httpStatus: number
  contentType: string
  bodyText: string
}

/** Сырой результат исходящего HTTP к GetCourse. */
export type GcRawResult = {
  gcStatus: number
  gcContentType: string
  gcBodyText: string
}

/** Аргументы, которые общий обработчик передаёт per-op handler-у. */
export type HandlerArgs = {
  requestId: string
  schoolHost: string
  schoolApiKey: string
  devKey: string
  resolvedPath: string
  restArgs: Record<string, unknown>
  args: Record<string, unknown>
  entry: OperationEntry
}

/**
 * Результат per-op handler-а:
 *   - `gc_result` — был выполнен исходящий вызов к GC (его сырой ответ);
 *   - `gateway_error` — handler сам решил вернуть ошибку gateway (без вызова GC).
 */
export type GcHandlerResult =
  | { kind: 'gc_result'; gc: GcRawResult }
  | { kind: 'gateway_error'; code: string; details?: Record<string, unknown> }

export type V1GcHandler = (ctx: app.Ctx, a: HandlerArgs) => Promise<GcHandlerResult>

/** Аккумулятор данных для финальной записи в журналы gateway. */
type GwLogCtx = {
  requestId: string
  op: string
  contour: string
  method: string
  requestStart: number
  rawArgs: unknown
  rawHeadersSafe: unknown
  upstream:
    | null
    | {
        kind: string
        gcHttpStatus: number
        rawGcJson: unknown
        semanticRule: string
        sentAt: number
        durationMs: number
      }
}

/** Заголовки, которые ВСЕГДА исключаем из rawHeadersSafe до применения redactRawDeep. */
const HEADERS_SECRET_BLOCKLIST = new Set([
  'x-gc-school-api-key',
  'x-gc-school-host',
  'authorization',
  'cookie',
  'set-cookie'
])

function readHeadersObject(headers: unknown): Record<string, unknown> {
  if (!headers || typeof headers !== 'object') return {}
  return headers as Record<string, unknown>
}

function stripSecretHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(headers)) {
    if (HEADERS_SECRET_BLOCKLIST.has(k.toLowerCase())) continue
    out[k] = v
  }
  return out
}

function detectSchoolHostPresent(headers: unknown): boolean {
  const v = readHeaderInsensitive(headers, GW_HEADER_SCHOOL_HOST)
  return typeof v === 'string' && v.length > 0
}

function packGcDiagnostic(gc: GcRawResult): V1GcDiagnostic {
  return { httpStatus: gc.gcStatus, contentType: gc.gcContentType, bodyText: gc.gcBodyText }
}

/** Распарсить тело ответа GC для журнала (или marker, как в lifepay). */
function buildRawGcJson(gc: GcRawResult): unknown {
  try {
    const parsed = JSON.parse(gc.gcBodyText)
    return redactRawDeep(parsed)
  } catch {
    return {
      __kind: 'raw_text',
      gcHttpStatus: gc.gcStatus,
      gcContentType: gc.gcContentType,
      __rawText: (gc.gcBodyText ?? '').slice(0, 1024)
    }
  }
}

async function writeGatewayLogs(
  ctx: app.Ctx,
  gwLog: GwLogCtx,
  clientHttpStatus: number,
  errorCode: string
): Promise<void> {
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
        rawGcJson: gwLog.upstream.rawGcJson,
        gcHttpStatus: gwLog.upstream.gcHttpStatus,
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

/** Итог цепочки до записи журналов: ответ клиенту + код ошибки + опц. сырой ответ GC. */
type RunResult = {
  response: V1TuneResponse
  errorCode: string
  gcDiagnostic?: V1GcDiagnostic
}

async function runHandleV1Op(
  ctx: app.Ctx,
  req: V1IncomingLike,
  op: string,
  handler: V1GcHandler,
  gwLog: GwLogCtx
): Promise<RunResult> {
  const requestId = gwLog.requestId
  const httpMethod = String(req.method ?? 'GET').toUpperCase()
  const entry = findOperationCatalogEntry(op)
  const schoolHostPresent = detectSchoolHostPresent(req.headers)

  const baseLog = (extra: Record<string, unknown>) => ({
    requestId,
    op,
    httpMethod,
    contour: entry?.contour,
    availability: entry?.availability,
    schoolHostPresent,
    ...extra
  })

  const finishError = (
    code: string,
    extra?: Record<string, unknown>,
    gcDiagnostic?: V1GcDiagnostic
  ): RunResult => ({
    response: v1ErrorResponse(code, requestId, extra),
    errorCode: code,
    ...(gcDiagnostic ? { gcDiagnostic } : {})
  })

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[api/v1/${op}] start`,
    payload: baseLog({ logStage: 'v1_op_start' })
  })

  if (!entry) {
    // manual §3.5: файл роута есть, а записи в каталоге нет — это рассогласование сборки,
    // а не INVOKE_OP_UNKNOWN (тот — платформенный 404, когда файла роута нет).
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[api/v1/${op}] catalog entry missing for existing route file`,
      payload: baseLog({ logStage: 'catalog_entry_missing', errorCode: 'INVOKE_INTERNAL_ERROR' })
    })
    return finishError('INVOKE_INTERNAL_ERROR')
  }

  gwLog.contour = entry.contour
  gwLog.method = entry.httpMethod

  if (httpMethod !== entry.httpMethod) {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] method not allowed`,
      payload: baseLog({
        logStage: 'http_method_not_allowed',
        errorCode: 'INVOKE_HTTP_METHOD_NOT_ALLOWED',
        expectedMethod: entry.httpMethod
      })
    })
    return finishError('INVOKE_HTTP_METHOD_NOT_ALLOWED', { expectedMethod: entry.httpMethod })
  }

  // manual §2.6: проверка availability — до заголовков школы и чтения devKey.
  const availability = entry.availability
  if (availability === 'disabled') {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] op disabled`,
      payload: baseLog({ logStage: 'op_disabled', errorCode: 'INVOKE_OP_DISABLED' })
    })
    return finishError('INVOKE_OP_DISABLED', { op })
  }
  if (availability === 'unsupported') {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] op unsupported`,
      payload: baseLog({ logStage: 'op_unsupported', errorCode: 'INVOKE_OP_UNSUPPORTED_BY_GC' })
    })
    return finishError('INVOKE_OP_UNSUPPORTED_BY_GC', { op })
  }

  const cl = parseContentLengthBytes(req.headers)
  if (cl !== null && cl > GW_MAX_REQUEST_BODY_BYTES) {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] body too large (content-length)`,
      payload: baseLog({ logStage: 'body_too_large', limitBytes: GW_MAX_REQUEST_BODY_BYTES, receivedBytes: cl })
    })
    return finishError('INVOKE_BODY_TOO_LARGE', {
      limitBytes: GW_MAX_REQUEST_BODY_BYTES,
      receivedBytes: cl
    })
  }

  const measured = measureSerializedBodyBytes(req.body)
  if (cl === null && measured > GW_MAX_REQUEST_BODY_BYTES) {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] body too large (measured)`,
      payload: baseLog({ logStage: 'body_too_large', limitBytes: GW_MAX_REQUEST_BODY_BYTES, receivedBytes: measured })
    })
    return finishError('INVOKE_BODY_TOO_LARGE', {
      limitBytes: GW_MAX_REQUEST_BODY_BYTES,
      receivedBytes: measured
    })
  }

  const hdrs = parseSchoolHeaders(req.headers)
  if (hdrs.ok === false) {
    const details =
      hdrs.code === 'INVOKE_SCHOOL_HOST_INVALID' && hdrs.hint ? { hint: hdrs.hint } : undefined
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] school headers`,
      payload: baseLog({ logStage: 'school_headers_fail', errorCode: hdrs.code })
    })
    return finishError(hdrs.code, details)
  }

  const rawDev = await settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.GC_DEVELOPER_API_KEY)
  const devKey = typeof rawDev === 'string' ? rawDev.trim() : ''
  if (!devKey) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[api/v1/${op}] dev key not configured`,
      payload: baseLog({ logStage: 'dev_key_missing', errorCode: 'GATEWAY_DEV_KEY_NOT_CONFIGURED' })
    })
    return finishError('GATEWAY_DEV_KEY_NOT_CONFIGURED')
  }

  let rawArgs: Record<string, unknown>
  if (entry.httpMethod === 'POST') {
    if (!isApplicationJsonContentType(req.headers)) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[api/v1/${op}] content-type`,
        payload: baseLog({ logStage: 'content_type_fail', errorCode: 'INVOKE_CONTENT_TYPE_UNSUPPORTED' })
      })
      return finishError('INVOKE_CONTENT_TYPE_UNSUPPORTED')
    }
    const argsEx = extractJsonObjectArgs(req.body)
    if (!argsEx.ok) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[api/v1/${op}] body not json object`,
        payload: baseLog({ logStage: 'body_invalid_json', errorCode: 'INVOKE_BODY_INVALID_JSON' })
      })
      return finishError('INVOKE_BODY_INVALID_JSON')
    }
    rawArgs = argsEx.args
  } else {
    rawArgs = parseFlatQueryArgs(req.query as Record<string, unknown> | undefined)
  }
  gwLog.rawArgs = redactRawDeep(rawArgs)

  const schema = entry.argsValidator
  const parsed = schema.safeParse(rawArgs) as
    | { success: true; data: unknown }
    | {
        success: false
        error: {
          errors?: Array<{ fullPath?: string; message: string }>
          data?: { fields?: Record<string, string> }
        }
      }
  if (!parsed.success) {
    const issues = parsed.error.errors ?? []
    const errors =
      issues.length > 0
        ? issues.map((iss) => ({ path: iss.fullPath ?? '', message: iss.message }))
        : Object.entries(parsed.error.data?.fields ?? {}).map(([path, message]) => ({
            path,
            message
          }))
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] args schema`,
      payload: baseLog({ logStage: 'args_schema_fail', errorCode: 'INVOKE_ARGS_SCHEMA_VIOLATION' })
    })
    return finishError('INVOKE_ARGS_SCHEMA_VIOLATION', { errors })
  }
  const args = parsed.data as Record<string, unknown>

  let resolvedPath: string
  let restArgs: Record<string, unknown>
  try {
    const applied = applyPathTemplate(entry.pathTemplate, args)
    resolvedPath = applied.path
    restArgs = applied.restArgs
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const m = /^MISSING_PATH_PARAM:(.+)$/.exec(msg)
    const paramName = m?.[1] ?? 'path'
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] path template`,
      payload: baseLog({ logStage: 'path_param_missing', paramName })
    })
    return finishError('INVOKE_ARGS_SCHEMA_VIOLATION', {
      errors: [
        {
          path: paramName,
          message: 'Отсутствует значение для подстановки в путь URL GetCourse'
        }
      ]
    })
  }

  // ─── Вызов per-op handler (единственное место исходящего вызова к GC) ───
  const handlerArgs: HandlerArgs = {
    requestId,
    schoolHost: hdrs.schoolHost,
    schoolApiKey: hdrs.schoolApiKey,
    devKey,
    resolvedPath,
    restArgs,
    args,
    entry
  }

  const upstreamStart = Date.now()
  let handlerResult: GcHandlerResult
  try {
    handlerResult = await handler(ctx, handlerArgs)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const isTimeout = msg === 'INVOKE_GC_TIMEOUT'
    const upstreamDuration = Date.now() - upstreamStart
    gwLog.upstream = {
      kind: isTimeout ? 'timeout' : 'network_error',
      gcHttpStatus: 0,
      rawGcJson: { __kind: isTimeout ? 'timeout' : 'network_error' },
      semanticRule: '',
      sentAt: upstreamStart,
      durationMs: upstreamDuration
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[api/v1/${op}] gc invoke error`,
      payload: baseLog({
        logStage: 'gc_invoke_throw',
        errorCode: isTimeout ? 'INVOKE_GC_TIMEOUT' : 'INVOKE_GC_NETWORK_ERROR'
      })
    })
    if (isTimeout) {
      return finishError('INVOKE_GC_TIMEOUT', { timeoutMs: GW_OUTBOUND_TIMEOUT_MS })
    }
    return finishError('INVOKE_GC_NETWORK_ERROR')
  }

  if (handlerResult.kind === 'gateway_error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[api/v1/${op}] gateway_error_from_handler`,
      payload: baseLog({ logStage: 'gateway_error_from_handler', errorCode: handlerResult.code })
    })
    return finishError(handlerResult.code, handlerResult.details)
  }

  const gc = handlerResult.gc
  const upstreamDuration = Date.now() - upstreamStart

  const outcome = interpretGcContourResponse({
    contour: entry.contour,
    gcStatus: gc.gcStatus,
    gcContentType: gc.gcContentType,
    gcBodyText: gc.gcBodyText
  })

  // Маппинг исхода → upstreamKind/semanticRule для журнала.
  let upstreamKind: string
  let semanticRule = ''
  if (outcome.kind === 'success') {
    upstreamKind = 'json_ok'
  } else if (outcome.kind === 'upstream_error') {
    upstreamKind = 'upstream_error'
  } else if (outcome.kind === 'json_parse_error') {
    upstreamKind = 'json_parse_error'
  } else {
    upstreamKind = 'semantic'
    semanticRule = outcome.gcRule
  }

  gwLog.upstream = {
    kind: upstreamKind,
    gcHttpStatus: gc.gcStatus,
    rawGcJson: buildRawGcJson(gc),
    semanticRule,
    sentAt: upstreamStart,
    durationMs: upstreamDuration
  }

  if (outcome.kind === 'upstream_error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[api/v1/${op}] gc upstream`,
      payload: baseLog({
        logStage: 'gc_upstream',
        errorCode: 'INVOKE_GC_UPSTREAM_ERROR',
        gcHttpStatus: outcome.gcHttpStatus,
        durationMs: upstreamDuration
      })
    })
    return finishError('INVOKE_GC_UPSTREAM_ERROR', { gcHttpStatus: outcome.gcHttpStatus }, packGcDiagnostic(gc))
  }

  if (outcome.kind === 'json_parse_error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[api/v1/${op}] gc json parse`,
      payload: baseLog({
        logStage: 'gc_json_parse_fail',
        errorCode: 'INVOKE_GC_UPSTREAM_ERROR',
        durationMs: upstreamDuration,
        gcHttpStatus: gc.gcStatus
      })
    })
    return finishError('INVOKE_GC_UPSTREAM_ERROR', { gcHttpStatus: gc.gcStatus }, packGcDiagnostic(gc))
  }

  if (outcome.kind === 'semantic_error') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[api/v1/${op}] gc semantic`,
      payload: baseLog({
        logStage: 'gc_semantic',
        errorCode: 'INVOKE_GC_SEMANTIC_ERROR',
        gcSemanticRule: outcome.gcRule,
        durationMs: upstreamDuration,
        gcHttpStatus: gc.gcStatus
      })
    })
    const semDetails: Record<string, unknown> = {
      gcContour: outcome.gcContour,
      gcRule: outcome.gcRule
    }
    if (outcome.gcContour === 'new') {
      if (outcome.gcNumericCode !== undefined) semDetails.gcNumericCode = outcome.gcNumericCode
      if (outcome.gcErrorsCount !== undefined) semDetails.gcErrorsCount = outcome.gcErrorsCount
    }
    return {
      response: v1ErrorResponse('INVOKE_GC_SEMANTIC_ERROR', requestId, semDetails),
      errorCode: 'INVOKE_GC_SEMANTIC_ERROR',
      gcDiagnostic: packGcDiagnostic(gc)
    }
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[api/v1/${op}] ok`,
    payload: baseLog({
      logStage: 'v1_op_ok',
      durationMs: upstreamDuration,
      gcHttpStatus: gc.gcStatus,
      clientHttpStatus: 200
    })
  })

  const warnings = availability === 'beta' ? [GATEWAY_OP_BETA_WARNING_ENTRY] : undefined
  return {
    response: v1SuccessResponse(outcome.data, requestId, warnings),
    errorCode: '',
    gcDiagnostic: packGcDiagnostic(gc)
  }
}

/** Внутренняя обёртка: единый прогон + запись журналов в finally. */
async function executeWithLogging(
  ctx: app.Ctx,
  req: V1IncomingLike,
  op: string,
  handler: V1GcHandler
): Promise<RunResult> {
  const requestId = newGatewayRequestId()
  const gwLog: GwLogCtx = {
    requestId,
    op,
    contour: '',
    method: String(req.method ?? 'GET').toUpperCase(),
    requestStart: Date.now(),
    rawArgs: {},
    rawHeadersSafe: redactRawDeep(stripSecretHeaders(readHeadersObject(req.headers))),
    upstream: null
  }

  let result: RunResult | null = null
  try {
    result = await runHandleV1Op(ctx, req, op, handler, gwLog)
    return result
  } catch (error) {
    try {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[api/v1/${op}] internal`,
        payload: {
          requestId,
          op,
          logStage: 'v1_op_internal',
          errorCode: 'INVOKE_INTERNAL_ERROR',
          error: error instanceof Error ? error.message : String(error)
        }
      })
    } catch {
      // глотаем — лог упал, ответ всё равно нужен
    }
    result = {
      response: v1ErrorResponse('INVOKE_INTERNAL_ERROR', requestId),
      errorCode: 'INVOKE_INTERNAL_ERROR'
    }
    return result
  } finally {
    const clientHttpStatus = result?.response.statusCode ?? 500
    const errorCode = result?.errorCode ?? 'INVOKE_INTERNAL_ERROR'
    await writeGatewayLogs(ctx, gwLog, clientHttpStatus, errorCode)
  }
}

/** Публичная точка входа для файловых роутов `api/v1/{op}.ts`. */
export async function handleV1Op(
  ctx: app.Ctx,
  req: V1IncomingLike,
  op: string,
  handler: V1GcHandler
): Promise<V1TuneResponse> {
  const result = await executeWithLogging(ctx, req, op, handler)
  return result.response
}

/**
 * Как `handleV1Op`, плюс сырой ответ GetCourse для админского сьюита тестов
 * (`lib/tests/gateway/v1OpsSuiteRunner.ts`). Публичные роуты должны звать только `handleV1Op`.
 */
export async function handleV1OpWithGcDiagnostic(
  ctx: app.Ctx,
  req: V1IncomingLike,
  op: string,
  handler: V1GcHandler
): Promise<{ response: V1TuneResponse; gcDiagnostic?: V1GcDiagnostic }> {
  const result = await executeWithLogging(ctx, req, op, handler)
  return { response: result.response, gcDiagnostic: result.gcDiagnostic }
}
