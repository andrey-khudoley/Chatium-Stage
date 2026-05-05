// @shared-route
import { requireAccountRole } from '@app/auth'
import * as gatewaySchoolRepo from '../../../repos/gatewaySchool.repo'

/** POST — обновить метаданные школы (без смены API-ключа). */
export const adminSchoolsUpdateRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const body = (req.body ?? {}) as {
    schoolId?: unknown
    schoolSlug?: unknown
    allowedOps?: unknown
    isEnabled?: unknown
    notes?: unknown
  }
  const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : ''
  if (!schoolId) return { success: false, error: 'schoolId обязателен' }

  const school = await gatewaySchoolRepo.findBySchoolId(ctx, schoolId)
  if (!school) return { success: false, error: 'Школа не найдена' }

  const patch: Record<string, unknown> = {}
  if (typeof body.schoolSlug === 'string' && body.schoolSlug.trim()) {
    patch.schoolSlug = body.schoolSlug.trim()
  }
  if (body.isEnabled !== undefined) {
    patch.isEnabled = !!body.isEnabled
  }
  if (body.notes !== undefined) {
    patch.notes = typeof body.notes === 'string' ? body.notes : String(body.notes ?? '')
  }
  if (body.allowedOps === null) {
    patch.allowedOps = undefined
  } else if (Array.isArray(body.allowedOps)) {
    patch.allowedOps = body.allowedOps.filter((x): x is string => typeof x === 'string')
  }

  await gatewaySchoolRepo.update(ctx, school.id, patch as never)
  return { success: true }
})
