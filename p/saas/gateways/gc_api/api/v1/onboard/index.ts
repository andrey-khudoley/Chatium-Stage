import * as secretSettings from '../../../lib/secretSettings.lib'
import * as gatewayOnboard from '../../../lib/gatewayOnboard.lib'
import * as jsonHttp from '../../../lib/httpJson.lib'
import * as loggerLib from '../../../lib/logger.lib'

const LOG = 'api/v1/onboard'

/**
 * POST .../api/v1/onboard — регистрация школы (X-Onboarding-Token).
 */
export const v1OnboardRoute = app.post('/', async (ctx, req) => {
  const headerTok =
    req.headers?.['x-onboarding-token'] ??
    req.headers?.['X-Onboarding-Token'] ??
    req.headers?.['X-Onboarding-token']
  const token = typeof headerTok === 'string' ? headerTok.trim() : ''
  const expected = await secretSettings.getOnboardingToken(ctx)

  if (!expected || token !== expected) {
    return jsonHttp.jsonHttpResponse(403, {
      success: false,
      error: { code: 'FORBIDDEN', message: 'Неверный X-Onboarding-Token' }
    })
  }

  const body = (req.body ?? {}) as {
    schoolId?: unknown
    schoolSlug?: unknown
    schoolApiKey?: unknown
    devKeyOverride?: unknown
  }

  const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : ''
  const schoolSlug = typeof body.schoolSlug === 'string' ? body.schoolSlug.trim() : ''
  const schoolApiKey = typeof body.schoolApiKey === 'string' ? body.schoolApiKey.trim() : ''
  const devKeyOverride =
    typeof body.devKeyOverride === 'string' && body.devKeyOverride.trim()
      ? body.devKeyOverride.trim()
      : undefined

  if (!schoolId || !schoolSlug || !schoolApiKey) {
    return jsonHttp.jsonHttpResponse(400, {
      success: false,
      error: { code: 'INVALID_ARGS', message: 'Нужны schoolId, schoolSlug, schoolApiKey' }
    })
  }

  try {
    const { clientToken } = await gatewayOnboard.onboardOrUpdateSchool(ctx, {
      schoolId,
      schoolSlug,
      schoolApiKey,
      devKeyOverride
    })
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG}] onboard ok`,
      payload: { schoolId }
    })
    return jsonHttp.jsonHttpResponse(200, {
      success: true,
      schoolId,
      clientToken
    })
  } catch (e) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG}] onboard error`,
      payload: { error: String(e) }
    })
    return jsonHttp.jsonHttpResponse(500, {
      success: false,
      error: { code: 'INTERNAL', message: String(e) }
    })
  }
})
