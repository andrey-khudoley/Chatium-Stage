import * as loggerLib from '../logger.lib'
import * as settingsLib from '../settings.lib'
import { GW_OUTBOUND_TIMEOUT_MS, GW_MAX_REQUEST_BODY_BYTES } from './constants'
import { GATEWAY_OP_BETA_WARNING_ENTRY } from './gatewayBetaWarnings'
import { interpretGcContourResponse } from './interpretGcV1Response'
import { invokeLegacyGcExportGet } from './legacyGcExportGet'
import { invokeLegacyGcImportPost } from './legacyGcImportClient'
import { invokeNewGcApi } from './newGcApiClient'
import { applyPathTemplate } from './pathTemplate'
import { findOperationCatalogEntry, type OperationCatalogEntry } from './operationsCatalog'
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
import { emitGatewayInvokeCompletedEvent } from './gatewayWorkspaceEvents'
import { v1ErrorResponse, v1SuccessResponse, type V1TuneResponse } from './v1TuneResponse'

/** Минимальные поля входящего HTTP (роут платформы или синтетический объект в тестах). */
export type V1IncomingLike = {
  method?: string
  headers?: unknown
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}

/** Метаданные обработки одной операции для итогового логирования (manual §7.2). */
export type V1CompletionMeta = {
  schoolHostPresent: boolean
  gcHttpStatus?: number
  errorCode?: string
  durationMs: number
}

/**
 * Сырой ответ GetCourse (статус, Content-Type, тело) после исходящего HTTP к школе.
 * Публичный JSON `/v1/{op}` это не включает — поле используется только
 * `handleV1OpRouteWithGcDiagnostic` для админского сьюита тестов.
 */
export type V1GcDiagnostic = {
  httpStatus: number
  contentType: string
  bodyText: string
}

type InnerResult = {
  response: V1TuneResponse
  meta: V1CompletionMeta
  gcDiagnostic?: V1GcDiagnostic
}

function packGcDiagnostic(gc: {
  gcStatus: number
  gcContentType: string
  gcBodyText: string
}): V1GcDiagnostic {
  return {
    httpStatus: gc.gcStatus,
    contentType: gc.gcContentType,
    bodyText: gc.gcBodyText
  }
}

function findEntry(op: string): OperationCatalogEntry | undefined {
  return findOperationCatalogEntry(op)
}

function detectSchoolHostPresent(headers: unknown): boolean {
  const v = readHeaderInsensitive(headers, GW_HEADER_SCHOOL_HOST)
  return typeof v === 'string' && v.length > 0
}

async function innerHandleV1OpRoute(ctx: app.Ctx, op: string, req: V1IncomingLike): Promise<InnerResult> {
  const started = Date.now()
  const requestId = newGatewayRequestId()
  const httpMethod = String(req.method ?? 'GET').toUpperCase()
  const entry = findEntry(op)
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
    gcHttpStatus?: number,
    gcDiagnostic?: V1GcDiagnostic
  ): InnerResult => ({
    response: v1ErrorResponse(code, requestId, extra),
    meta: {
      schoolHostPresent,
      gcHttpStatus: gcHttpStatus ?? gcDiagnostic?.httpStatus,
      errorCode: code,
      durationMs: Date.now() - started
    },
    ...(gcDiagnostic ? { gcDiagnostic } : {})
  })

  try {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] start`,
      payload: baseLog({ logStage: 'v1_op_start' })
    })

    if (!entry) {
      // manual §3.5: при наличии файла роута и отсутствии записи в каталоге это ошибка
      // конфигурации сборки (рассогласование api/v1 и `operationsCatalog`), а не
      // INVOKE_OP_UNKNOWN — последний возникает на платформенном 404, когда файла роута нет.
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[api/v1/${op}] catalog entry missing for existing route file`,
        payload: baseLog({ logStage: 'catalog_entry_missing', errorCode: 'INVOKE_INTERNAL_ERROR' })
      })
      return finishError('INVOKE_INTERNAL_ERROR')
    }

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

    // manual §2.6: проверка `availability` (§2.11) ставится до проверки заголовков школы и
    // чтения `gc_developer_api_key` — для `disabled`/`unsupported` исходящий вызов к GC
    // не выполняется, и ответ должен быть детерминирован без зависимости от наличия секретов
    // и хедеров клиента.
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

    const schema = entry.argsSchema
    const parsed = schema.safeParse(rawArgs)
    if (!parsed.success) {
      const issues = parsed.error.errors ?? []
      const errors =
        issues.length > 0
          ? issues.map((iss) => ({
              path: iss.fullPath ?? '',
              message: iss.message
            }))
          : Object.entries(parsed.error.data.fields ?? {}).map(([path, message]) => ({
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
    let outboundArgs: Record<string, unknown>
    try {
      const applied = applyPathTemplate(entry.pathTemplate, args)
      resolvedPath = applied.path
      outboundArgs = applied.restArgs
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

    let gc: { gcStatus: number; gcContentType: string; gcBodyText: string }

    try {
      if (entry.contour === 'legacy' && entry.httpMethod === 'POST') {
        const action = entry.legacyImportAction
        if (!action) {
          await loggerLib.writeServerLog(ctx, {
            severity: 3,
            message: `[api/v1/${op}] legacy action missing`,
            payload: baseLog({ logStage: 'legacy_action_missing', errorCode: 'INVOKE_INTERNAL_ERROR' })
          })
          return finishError('INVOKE_INTERNAL_ERROR')
        }
        const paramsPayload =
          op === 'addUser' || op === 'createDeal'
            ? ((args as { params?: Record<string, unknown> }).params ?? {})
            : args
        gc = await invokeLegacyGcImportPost({
          schoolHostTrimmed: hdrs.schoolHost,
          resolvedPath,
          schoolApiKey: hdrs.schoolApiKey,
          legacyImportAction: action,
          paramsPayload
        })
      } else if (entry.contour === 'legacy' && entry.httpMethod === 'GET') {
        gc = await invokeLegacyGcExportGet({
          schoolHostTrimmed: hdrs.schoolHost,
          resolvedPath,
          schoolApiKey: hdrs.schoolApiKey,
          queryArgs: outboundArgs
        })
      } else {
        gc = await invokeNewGcApi({
          schoolHostTrimmed: hdrs.schoolHost,
          resolvedPath,
          httpMethod: entry.httpMethod,
          developerKey: devKey,
          schoolApiKey: hdrs.schoolApiKey,
          args: outboundArgs
        })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      const isTimeout = msg === 'INVOKE_GC_TIMEOUT'
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

    const contour: 'legacy' | 'new' = entry.contour === 'legacy' ? 'legacy' : 'new'
    const outcome = interpretGcContourResponse({
      contour,
      gcStatus: gc.gcStatus,
      gcContentType: gc.gcContentType,
      gcBodyText: gc.gcBodyText
    })

    const durationMs = Date.now() - started

    if (outcome.kind === 'upstream_error') {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[api/v1/${op}] gc upstream`,
        payload: baseLog({
          logStage: 'gc_upstream',
          errorCode: 'INVOKE_GC_UPSTREAM_ERROR',
          gcHttpStatus: outcome.gcHttpStatus,
          durationMs
        })
      })
      return finishError(
        'INVOKE_GC_UPSTREAM_ERROR',
        { gcHttpStatus: outcome.gcHttpStatus },
        outcome.gcHttpStatus,
        packGcDiagnostic(gc)
      )
    }

    if (outcome.kind === 'json_parse_error') {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[api/v1/${op}] gc json parse`,
        payload: baseLog({
          logStage: 'gc_json_parse_fail',
          errorCode: 'INVOKE_GC_UPSTREAM_ERROR',
          durationMs,
          gcHttpStatus: gc.gcStatus
        })
      })
      return finishError('INVOKE_GC_UPSTREAM_ERROR', { gcHttpStatus: gc.gcStatus }, gc.gcStatus, packGcDiagnostic(gc))
    }

    if (outcome.kind === 'semantic_error') {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[api/v1/${op}] gc semantic`,
        payload: baseLog({
          logStage: 'gc_semantic',
          errorCode: 'INVOKE_GC_SEMANTIC_ERROR',
          gcSemanticRule: outcome.gcRule,
          durationMs,
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
        meta: {
          schoolHostPresent,
          gcHttpStatus: gc.gcStatus,
          errorCode: 'INVOKE_GC_SEMANTIC_ERROR',
          durationMs
        },
        gcDiagnostic: packGcDiagnostic(gc)
      }
    }

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[api/v1/${op}] ok`,
      payload: baseLog({
        logStage: 'v1_op_ok',
        durationMs,
        gcHttpStatus: gc.gcStatus,
        clientHttpStatus: 200
      })
    })

    const warnings = availability === 'beta' ? [GATEWAY_OP_BETA_WARNING_ENTRY] : undefined

    return {
      response: v1SuccessResponse(outcome.data, requestId, warnings),
      meta: {
        schoolHostPresent,
        gcHttpStatus: gc.gcStatus,
        durationMs
      },
      gcDiagnostic: packGcDiagnostic(gc)
    }
  } catch (e: unknown) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[api/v1/${op}] internal`,
      payload: {
        requestId,
        op,
        httpMethod,
        contour: entry?.contour,
        availability: entry?.availability,
        schoolHostPresent,
        logStage: 'v1_op_internal',
        errorCode: 'INVOKE_INTERNAL_ERROR',
        error: e instanceof Error ? e.message : String(e)
      }
    })
    return {
      response: v1ErrorResponse('INVOKE_INTERNAL_ERROR', requestId),
      meta: {
        schoolHostPresent,
        errorCode: 'INVOKE_INTERNAL_ERROR',
        durationMs: Date.now() - started
      }
    }
  }
}

/** Извлечь requestId из тела ответа /v1 (для итогового лога/события — без секретов). */
function extractRequestIdFromBody(rawHttpBody: string): string {
  try {
    const j = JSON.parse(rawHttpBody) as { requestId?: unknown }
    return typeof j.requestId === 'string' ? j.requestId : ''
  } catch {
    return ''
  }
}

async function finalizeV1OpInvocation(
  ctx: app.Ctx,
  op: string,
  _req: V1IncomingLike,
  started: number,
  httpMethod: string,
  entry: OperationCatalogEntry | undefined,
  inner: InnerResult
): Promise<void> {
  const requestId = extractRequestIdFromBody(inner.response.rawHttpBody)
  const ok = inner.response.statusCode === 200 && !inner.meta.errorCode

  // Итоговая запись о завершении (manual §7.2): минимальный набор полей в одном payload,
  // независимо от ветки. Стабильный logStage для агрегации в админке (manual §7.4.2).
  await loggerLib.writeServerLog(ctx, {
    severity: ok ? 6 : 4,
    message: `[api/v1/${op}] completed ${ok ? 'ok' : inner.meta.errorCode ?? 'err'}`,
    payload: {
      logStage: 'v1_op_completed',
      requestId,
      op,
      httpMethod,
      contour: entry?.contour,
      availability: entry?.availability,
      schoolHostPresent: inner.meta.schoolHostPresent,
      clientHttpStatus: inner.response.statusCode,
      ok,
      errorCode: inner.meta.errorCode,
      gcHttpStatus: inner.meta.gcHttpStatus,
      durationMs: inner.meta.durationMs
    }
  })

  await emitGatewayInvokeCompletedEvent(ctx, {
    started,
    op,
    incomingMethod: httpMethod,
    contour: entry?.contour,
    availability: entry?.availability,
    response: inner.response,
    gcHttpStatusOverride: inner.meta.gcHttpStatus
  })
}

export async function handleV1OpRoute(ctx: app.Ctx, op: string, req: V1IncomingLike): Promise<V1TuneResponse> {
  const started = Date.now()
  const httpMethod = String(req.method ?? 'GET').toUpperCase()
  const entry = findEntry(op)
  const inner = await innerHandleV1OpRoute(ctx, op, req)
  await finalizeV1OpInvocation(ctx, op, req, started, httpMethod, entry, inner)
  return inner.response
}

/**
 * Как `handleV1OpRoute`, плюс сырой ответ GetCourse для админского сьюита (`lib/tests/gateway/v1OpsSuiteRunner.ts`).
 * Публичные роуты `/v1/{op}` должны вызывать только `handleV1OpRoute`.
 */
export async function handleV1OpRouteWithGcDiagnostic(
  ctx: app.Ctx,
  op: string,
  req: V1IncomingLike
): Promise<{ response: V1TuneResponse; gcDiagnostic?: V1GcDiagnostic }> {
  const started = Date.now()
  const httpMethod = String(req.method ?? 'GET').toUpperCase()
  const entry = findEntry(op)
  const inner = await innerHandleV1OpRoute(ctx, op, req)
  await finalizeV1OpInvocation(ctx, op, req, started, httpMethod, entry, inner)
  return { response: inner.response, gcDiagnostic: inner.gcDiagnostic }
}
