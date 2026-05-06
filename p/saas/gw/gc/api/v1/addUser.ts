import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'
import { GW_ADD_USER_MAPPING } from '../../lib/gateway/gcAddUserMapping'
import { interpretLegacyHttpResponse } from '../../lib/gateway/interpretGcV1Response'
import { invokeLegacyGcImportPost } from '../../lib/gateway/legacyGcImportClient'
import { GW_MAX_REQUEST_BODY_BYTES } from '../../lib/gateway/constants'
import { addUserArgsSchema, getAddUserCatalogMeta } from '../../lib/gateway/operationsCatalog'
import { newGatewayRequestId } from '../../lib/gateway/requestId'
import {
  extractJsonObjectArgs,
  isApplicationJsonContentType,
  measureSerializedBodyBytes,
  parseContentLengthBytes,
  parseSchoolHeaders
} from '../../lib/gateway/v1IncomingPost'
import { v1ErrorResponse, v1SuccessResponse, type V1TuneResponse } from '../../lib/gateway/v1TuneResponse'

const LOG_PATH = 'api/v1/addUser'
const OP = 'addUser'

export const addUserRoute = app.post('/', async (ctx, req): Promise<V1TuneResponse> => {
  const started = Date.now()
  const requestId = newGatewayRequestId()
  const incomingMethod = String((req as { method?: string }).method ?? 'POST').toUpperCase()
  const meta = getAddUserCatalogMeta()

  const baseLog = (extra: Record<string, unknown>) => ({
    requestId,
    op: OP,
    incomingMethod,
    contour: meta.contour,
    availability: meta.availability,
    ...extra
  })

  try {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] start`,
      payload: baseLog({ logStage: 'v1_addUser_start' })
    })

    if (incomingMethod !== 'POST') {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] method not allowed`,
        payload: baseLog({
          logStage: 'http_method_not_allowed',
          errorCode: 'INVOKE_HTTP_METHOD_NOT_ALLOWED',
          expectedMethod: 'POST'
        })
      })
      return v1ErrorResponse('INVOKE_HTTP_METHOD_NOT_ALLOWED', requestId, { expectedMethod: 'POST' })
    }

    const cl = parseContentLengthBytes(req.headers)
    if (cl !== null && cl > GW_MAX_REQUEST_BODY_BYTES) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] body too large (content-length)`,
        payload: baseLog({ logStage: 'body_too_large', limitBytes: GW_MAX_REQUEST_BODY_BYTES, receivedBytes: cl })
      })
      return v1ErrorResponse('INVOKE_BODY_TOO_LARGE', requestId, {
        limitBytes: GW_MAX_REQUEST_BODY_BYTES,
        receivedBytes: cl
      })
    }

    const measured = measureSerializedBodyBytes(req.body)
    if (cl === null && measured > GW_MAX_REQUEST_BODY_BYTES) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] body too large (measured)`,
        payload: baseLog({ logStage: 'body_too_large', limitBytes: GW_MAX_REQUEST_BODY_BYTES, receivedBytes: measured })
      })
      return v1ErrorResponse('INVOKE_BODY_TOO_LARGE', requestId, {
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
        message: `[${LOG_PATH}] school headers`,
        payload: baseLog({ logStage: 'school_headers_fail', errorCode: hdrs.code })
      })
      return v1ErrorResponse(hdrs.code, requestId, details)
    }

    const rawDev = await settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.GC_DEVELOPER_API_KEY)
    const devKey = typeof rawDev === 'string' ? rawDev.trim() : ''
    if (!devKey) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] dev key not configured`,
        payload: baseLog({ logStage: 'dev_key_missing', errorCode: 'GATEWAY_DEV_KEY_NOT_CONFIGURED' })
      })
      return v1ErrorResponse('GATEWAY_DEV_KEY_NOT_CONFIGURED', requestId)
    }

    if (!isApplicationJsonContentType(req.headers)) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] content-type`,
        payload: baseLog({ logStage: 'content_type_fail', errorCode: 'INVOKE_CONTENT_TYPE_UNSUPPORTED' })
      })
      return v1ErrorResponse('INVOKE_CONTENT_TYPE_UNSUPPORTED', requestId)
    }

    const argsEx = extractJsonObjectArgs(req.body)
    if (!argsEx.ok) {
      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] body not json object`,
        payload: baseLog({ logStage: 'body_invalid_json', errorCode: 'INVOKE_BODY_INVALID_JSON' })
      })
      return v1ErrorResponse('INVOKE_BODY_INVALID_JSON', requestId)
    }

    const parsed = addUserArgsSchema.safeParse(argsEx.args)
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
        message: `[${LOG_PATH}] args schema`,
        payload: baseLog({ logStage: 'args_schema_fail', errorCode: 'INVOKE_ARGS_SCHEMA_VIOLATION' })
      })
      return v1ErrorResponse('INVOKE_ARGS_SCHEMA_VIOLATION', requestId, { errors })
    }
    const args = parsed.data

    const availability = GW_ADD_USER_MAPPING.availability as
      | 'enabled'
      | 'beta'
      | 'disabled'
      | 'unsupported'
    if (availability === 'disabled') {
      return v1ErrorResponse('INVOKE_OP_DISABLED', requestId, { op: OP })
    }
    if (availability === 'unsupported') {
      return v1ErrorResponse('INVOKE_OP_UNSUPPORTED_BY_GC', requestId, { op: OP })
    }

    let gc: Awaited<ReturnType<typeof invokeLegacyGcImportPost>>
    try {
      gc = await invokeLegacyGcImportPost({
        schoolHostTrimmed: hdrs.schoolHost,
        pathTemplate: GW_ADD_USER_MAPPING.pathTemplate,
        schoolApiKey: hdrs.schoolApiKey,
        legacyImportAction: GW_ADD_USER_MAPPING.legacyImportAction,
        paramsPayload: args.params as unknown as Record<string, unknown>
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      const isTimeout = msg === 'INVOKE_GC_TIMEOUT'
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] gc invoke error`,
        payload: baseLog({
          logStage: 'gc_invoke_throw',
          errorCode: isTimeout ? 'INVOKE_GC_TIMEOUT' : 'INVOKE_GC_NETWORK_ERROR'
        })
      })
      if (isTimeout) {
        return v1ErrorResponse('INVOKE_GC_TIMEOUT', requestId, { timeoutMs: 10_000 })
      }
      return v1ErrorResponse('INVOKE_GC_NETWORK_ERROR', requestId)
    }

    const outcome = interpretLegacyHttpResponse({
      gcStatus: gc.gcStatus,
      gcContentType: gc.gcContentType,
      gcBodyText: gc.gcBodyText
    })

    const durationMs = Date.now() - started

    if (outcome.kind === 'upstream_error') {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] gc upstream`,
        payload: baseLog({
          logStage: 'gc_upstream',
          errorCode: 'INVOKE_GC_UPSTREAM_ERROR',
          gcHttpStatus: outcome.gcHttpStatus,
          durationMs,
          schoolHostPresent: true
        })
      })
      return v1ErrorResponse('INVOKE_GC_UPSTREAM_ERROR', requestId, {
        gcHttpStatus: outcome.gcHttpStatus
      })
    }

    if (outcome.kind === 'json_parse_error') {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] gc json parse`,
        payload: baseLog({
          logStage: 'gc_json_parse_fail',
          errorCode: 'INVOKE_GC_UPSTREAM_ERROR',
          durationMs,
          gcHttpStatus: gc.gcStatus
        })
      })
      return v1ErrorResponse('INVOKE_GC_UPSTREAM_ERROR', requestId, { gcHttpStatus: gc.gcStatus })
    }

    if (outcome.kind === 'semantic_error') {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] gc semantic`,
        payload: baseLog({
          logStage: 'gc_semantic',
          errorCode: 'INVOKE_GC_SEMANTIC_ERROR',
          gcSemanticRule: outcome.gcRule,
          durationMs
        })
      })
      return v1ErrorResponse('INVOKE_GC_SEMANTIC_ERROR', requestId, {
        gcContour: 'legacy',
        gcRule: outcome.gcRule
      })
    }

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] ok`,
      payload: baseLog({
        logStage: 'v1_addUser_ok',
        durationMs,
        gcHttpStatus: gc.gcStatus,
        clientHttpStatus: 200,
        schoolHostPresent: true
      })
    })

    return v1SuccessResponse(outcome.data, requestId)
  } catch (e: unknown) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] internal`,
      payload: {
        requestId,
        op: OP,
        error: e instanceof Error ? e.message : String(e)
      }
    })
    return v1ErrorResponse('INVOKE_INTERNAL_ERROR', requestId)
  }
})
