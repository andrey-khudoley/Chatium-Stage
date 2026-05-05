// @shared-route
import { requireAccountRole } from '@app/auth'
import * as gatewayOnboard from '../../../lib/gatewayOnboard.lib'

/** POST — добавить/обновить школу (как onboard + новый clientToken). */
export const adminSchoolsAddRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
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
    return { success: false, error: 'Нужны schoolId, schoolSlug, schoolApiKey' }
  }

  const { clientToken } = await gatewayOnboard.onboardOrUpdateSchool(ctx, {
    schoolId,
    schoolSlug,
    schoolApiKey,
    devKeyOverride
  })
  return { success: true, schoolId, clientToken }
})
