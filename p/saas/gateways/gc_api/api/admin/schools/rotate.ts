// @shared-route
import { requireAccountRole } from '@app/auth'
import * as gatewayRotate from '../../../lib/gatewayRotate.lib'

/** POST — перевыпустить clientToken (без проверки старого токена). */
export const adminSchoolsRotateRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const body = (req.body ?? {}) as { schoolId?: unknown }
  const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : ''
  if (!schoolId) return { success: false, error: 'schoolId обязателен' }

  try {
    const { plainToken } = await gatewayRotate.rotateSchoolToken(ctx, schoolId)
    return { success: true, schoolId, clientToken: plainToken }
  } catch {
    return { success: false, error: 'Школа не найдена' }
  }
})
