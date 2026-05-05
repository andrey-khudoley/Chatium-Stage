import type { GatewaySchoolRow } from '../tables/gatewaySchool.table'
import { getOpDefinition } from '../shared/opRegistry'
import * as gatewaySchoolRepo from '../repos/gatewaySchool.repo'
import * as secretSettings from './secretSettings.lib'
import * as gatewaySchoolSecrets from './gatewaySchoolSecrets.lib'
import * as newApiClient from './gcClients/newApi.client'
import * as legacyClient from './gcClients/legacy.client'
import * as errorNormalizer from './errorNormalizer.lib'
import * as legacyExportLimit from './legacyExportLimit.lib'
import * as requestLogger from './requestLogger.lib'
import * as loggerLib from './logger.lib'

const LOG = 'lib/opMapper.lib'

export type InvokeResult =
  | { success: true; data: unknown; correlationId: string }
  | {
      success: false
      correlationId: string
      httpStatus: number
      error: { code: string; message: string; correlationId: string; gcDetails?: unknown }
    }

export async function executeOp(
  ctx: app.Ctx,
  params: {
    school: GatewaySchoolRow
    schoolId: string
    op: string
    args: Record<string, unknown>
    correlationId: string
  }
): Promise<InvokeResult> {
  const { school, schoolId, op, args, correlationId } = params
  const started = Date.now()
  const def = getOpDefinition(op)
  if (!def) {
    const latencyMs = Date.now() - started
    await requestLogger.writeRequestLog(ctx, {
      correlationId,
      schoolId,
      op,
      circuit: 'unknown',
      status: 'error',
      latencyMs,
      errorCode: 'OP_NOT_FOUND',
      errorMessage: 'Неизвестная операция'
    })
    return {
      success: false,
      correlationId,
      httpStatus: 404,
      error: {
        code: 'OP_NOT_FOUND',
        message: 'Операция не найдена в реестре',
        correlationId
      }
    }
  }

  try {
    await legacyExportLimit.assertLegacyExportAllowance(ctx, op)
  } catch (e) {
    const latencyMs = Date.now() - started
    const msg = String(e)
    await requestLogger.writeRequestLog(ctx, {
      correlationId,
      schoolId,
      op,
      circuit: def.circuit,
      status: 'error',
      latencyMs,
      errorCode: 'GC_RATE_LIMIT',
      errorMessage: msg,
      args
    })
    return {
      success: false,
      correlationId,
      httpStatus: 503,
      error: {
        code: 'GC_RATE_LIMIT',
        message: msg,
        correlationId
      }
    }
  }

  const master = await secretSettings.getGatewayMasterKey(ctx)
  let schoolApiKeyPlain: string
  try {
    schoolApiKeyPlain = gatewaySchoolSecrets.decryptSchoolApiKey(school, master)
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG}] decrypt school key failed`,
      payload: { schoolId, error: String(e) }
    })
    const latencyMs = Date.now() - started
    await requestLogger.writeRequestLog(ctx, {
      correlationId,
      schoolId,
      op,
      circuit: def.circuit,
      status: 'error',
      latencyMs,
      errorCode: 'INTERNAL',
      errorMessage: 'Не удалось расшифровать ключ школы',
      args
    })
    return {
      success: false,
      correlationId,
      httpStatus: 500,
      error: {
        code: 'INTERNAL',
        message: 'Ошибка конфигурации gateway (ключ школы)',
        correlationId
      }
    }
  }

  try {
    if (def.circuit === 'new') {
      const devKey = await gatewaySchoolSecrets.getEffectiveDevKey(ctx, school)
      if (!devKey) {
        const latencyMs = Date.now() - started
        await requestLogger.writeRequestLog(ctx, {
          correlationId,
          schoolId,
          op,
          circuit: 'new',
          status: 'error',
          latencyMs,
          errorCode: 'GC_DEV_KEY_MISSING',
          errorMessage: 'Не задан dev-ключ GC',
          args
        })
        return {
          success: false,
          correlationId,
          httpStatus: 503,
          error: {
            code: 'GC_DEV_KEY_MISSING',
            message: 'На gateway не настроен ключ разработчика GetCourse',
            correlationId
          }
        }
      }

      const bearerToken = `${devKey}_${schoolApiKeyPlain}`
      const res = await newApiClient.callNewApi({
        gcPath: def.gcPath!,
        method: def.gcMethod!,
        args,
        bearerToken
      })

      await gatewaySchoolRepo.update(ctx, school.id, { lastUsedAt: Date.now() })

      const latencyMs = Date.now() - started

      if (res.statusCode >= 200 && res.statusCode < 300) {
        await requestLogger.writeRequestLog(ctx, {
          correlationId,
          schoolId,
          op,
          circuit: 'new',
          status: 'success',
          gcStatusCode: res.statusCode,
          latencyMs,
          args
        })
        return { success: true, data: res.body, correlationId }
      }

      const norm = errorNormalizer.normalizeNewApiError(res.statusCode, res.body)
      await requestLogger.writeRequestLog(ctx, {
        correlationId,
        schoolId,
        op,
        circuit: 'new',
        status: 'error',
        gcStatusCode: res.statusCode,
        latencyMs,
        errorCode: norm.code,
        errorMessage: norm.message,
        args
      })

      const httpStatus = res.statusCode >= 500 ? 503 : 502
      return {
        success: false,
        correlationId,
        httpStatus,
        error: {
          code: norm.code,
          message: norm.message,
          correlationId,
          gcDetails: norm.gcDetails
        }
      }
    }

    const res = await legacyClient.callLegacyApi({
      schoolSlug: school.schoolSlug,
      path: def.legacyPath!,
      action: def.legacyAction!,
      schoolApiKey: schoolApiKeyPlain,
      args
    })

    await gatewaySchoolRepo.update(ctx, school.id, { lastUsedAt: Date.now() })

    const latencyMs = Date.now() - started

    const okHttp = res.statusCode >= 200 && res.statusCode < 300
    const okBody = okHttp && errorNormalizer.isLegacyBodySuccess(res.body)

    if (okBody) {
      await requestLogger.writeRequestLog(ctx, {
        correlationId,
        schoolId,
        op,
        circuit: 'legacy',
        status: 'success',
        gcStatusCode: res.statusCode,
        latencyMs,
        args
      })
      return { success: true, data: res.body, correlationId }
    }

    const norm = errorNormalizer.normalizeLegacyApiError(res.body)
    await requestLogger.writeRequestLog(ctx, {
      correlationId,
      schoolId,
      op,
      circuit: 'legacy',
      status: 'error',
      gcStatusCode: res.statusCode,
      latencyMs,
      errorCode: norm.code,
      errorMessage: norm.message,
      args
    })

    const httpStatus =
      res.statusCode === 429 ? 503 : res.statusCode >= 500 ? 503 : 502
    return {
      success: false,
      correlationId,
      httpStatus,
      error: {
        code: norm.code,
        message: norm.message,
        correlationId,
        gcDetails: norm.gcDetails
      }
    }
  } catch (e) {
    const latencyMs = Date.now() - started
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG}] executeOp exception`,
      payload: { schoolId, op, error: String(e) }
    })
    await requestLogger.writeRequestLog(ctx, {
      correlationId,
      schoolId,
      op,
      circuit: def.circuit,
      status: 'error',
      latencyMs,
      errorCode: 'INTERNAL',
      errorMessage: String(e),
      args
    })
    return {
      success: false,
      correlationId,
      httpStatus: 503,
      error: {
        code: 'GC_UNAVAILABLE',
        message: String(e),
        correlationId
      }
    }
  }
}
