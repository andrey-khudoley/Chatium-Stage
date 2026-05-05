import * as authToken from '../../../lib/authToken.lib'
import * as gatewayRotate from '../../../lib/gatewayRotate.lib'
import * as jsonHttp from '../../../lib/httpJson.lib'
import * as loggerLib from '../../../lib/logger.lib'

const LOG = 'api/v1/rotate-token'

/** POST — перевыпуск Bearer (старый токен обязателен в Authorization). */
export const v1RotateTokenRoute = app.post('/', async (ctx, req) => {
  const authRaw = req.headers?.authorization ?? req.headers?.Authorization
  const authHeader = typeof authRaw === 'string' ? authRaw : undefined

  const body = (req.body ?? {}) as { schoolId?: unknown }
  const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : ''

  if (!schoolId) {
    return jsonHttp.jsonHttpResponse(400, {
      success: false,
      error: { code: 'INVALID_ARGS', message: 'Нужен schoolId' }
    })
  }

  const school = await authToken.authenticateBearer(ctx, authHeader, schoolId)
  if (!school) {
    return jsonHttp.jsonHttpResponse(401, {
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Нет или невалидный Bearer-токен' }
    })
  }

  try {
    const { plainToken } = await gatewayRotate.rotateSchoolToken(ctx, schoolId)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG}] rotated`,
      payload: { schoolId }
    })
    return jsonHttp.jsonHttpResponse(200, {
      success: true,
      schoolId,
      clientToken: plainToken
    })
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG}] error`,
      payload: { error: String(e) }
    })
    return jsonHttp.jsonHttpResponse(404, {
      success: false,
      error: { code: 'NOT_FOUND', message: String(e) }
    })
  }
})
