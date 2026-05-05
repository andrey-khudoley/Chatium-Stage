// @shared-route
import { requireAccountRole } from '@app/auth'
import * as gatewaySchoolRepo from '../../../repos/gatewaySchool.repo'

/** POST — удалить школу по schoolId. */
export const adminSchoolsDeleteRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const body = (req.body ?? {}) as { schoolId?: unknown }
  const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : ''
  if (!schoolId) return { success: false, error: 'schoolId обязателен' }

  const school = await gatewaySchoolRepo.findBySchoolId(ctx, schoolId)
  if (!school) return { success: false, error: 'Школа не найдена' }

  await gatewaySchoolRepo.deleteById(ctx, school.id)
  return { success: true }
})
