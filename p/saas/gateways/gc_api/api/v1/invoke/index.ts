import * as authToken from '../../../lib/authToken.lib'
import * as correlation from '../../../lib/correlation.lib'
import * as argsValidator from '../../../lib/argsValidator.lib'
import * as opMapper from '../../../lib/opMapper.lib'
import * as catalogEnsure from '../../../lib/catalogEnsure.lib'
import * as opCatalogRepo from '../../../repos/opCatalog.repo'
import { getOpDefinition } from '../../../shared/opRegistry'
import * as jsonHttp from '../../../lib/httpJson.lib'
import * as loggerLib from '../../../lib/logger.lib'

const LOG = 'api/v1/invoke'

/**
 * POST .../api/v1/invoke — основной вызов GC через gateway.
 * Headers: Authorization: Bearer &lt;clientToken&gt;
 * Body: { schoolId, op, args }
 */
export const v1InvokeRoute = app.post('/', async (ctx, req) => {
  const correlationId = correlation.newCorrelationId(ctx)
  const authRaw = req.headers?.authorization ?? req.headers?.Authorization
  const authHeader = typeof authRaw === 'string' ? authRaw : undefined

  const body = (req.body ?? {}) as { schoolId?: unknown; op?: unknown; args?: unknown }
  const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : ''
  const op = typeof body.op === 'string' ? body.op.trim() : ''

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG}] invoke`,
    payload: { correlationId, schoolId, op, hasAuth: !!authHeader }
  })

  if (!schoolId || !op) {
    return jsonHttp.jsonHttpResponse(400, {
      success: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'Поля schoolId и op обязательны',
        correlationId
      }
    })
  }

  const school = await authToken.authenticateBearer(ctx, authHeader, schoolId)
  if (!school) {
    return jsonHttp.jsonHttpResponse(401, {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Нет или невалидный Bearer-токен', correlationId }
    })
  }

  const allowedRaw = school.allowedOps
  if (Array.isArray(allowedRaw) && allowedRaw.length > 0) {
    const allow = allowedRaw.filter((x): x is string => typeof x === 'string')
    if (!allow.includes(op)) {
      return jsonHttp.jsonHttpResponse(403, {
        success: false,
        error: { code: 'OP_NOT_ALLOWED', message: `Операция «${op}» не в allowlist школы`, correlationId }
      })
    }
  }

  const def = getOpDefinition(op)
  if (!def) {
    return jsonHttp.jsonHttpResponse(404, {
      success: false,
      error: { code: 'OP_NOT_FOUND', message: 'Неизвестная операция', correlationId }
    })
  }

  await catalogEnsure.ensureCatalogPopulated(ctx)
  const catRow = await opCatalogRepo.findByOp(ctx, op)
  if (catRow?.disabled) {
    return jsonHttp.jsonHttpResponse(403, {
      success: false,
      error: { code: 'OP_NOT_ALLOWED', message: 'Операция отключена на gateway', correlationId }
    })
  }

  const val = await argsValidator.validateInvokeArgs(ctx, op, body.args)
  if (!val.ok) {
    return jsonHttp.jsonHttpResponse(400, {
      success: false,
      error: {
        code: 'INVALID_ARGS',
        message: 'Аргументы не прошли валидацию',
        details: val.errors,
        correlationId
      }
    })
  }

  const result = await opMapper.executeOp(ctx, {
    school,
    schoolId,
    op,
    args: val.args,
    correlationId
  })

  if (result.success) {
    return jsonHttp.jsonHttpResponse(200, {
      success: true,
      data: result.data,
      correlationId: result.correlationId
    })
  }

  return jsonHttp.jsonHttpResponse(result.httpStatus, {
    success: false,
    error: result.error,
    correlationId: result.correlationId
  })
})
