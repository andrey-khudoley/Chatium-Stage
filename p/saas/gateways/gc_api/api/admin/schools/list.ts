// @shared-route
import { requireAccountRole } from '@app/auth'
import * as gatewaySchoolRepo from '../../../repos/gatewaySchool.repo'

/**
 * GET /api/admin/schools/list — школы gateway (без секретов).
 * Query: limit?, offset?
 */
export const adminSchoolsListRoute = app.get('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const limit = Math.min(500, Math.max(1, parseInt(String(req.query?.limit ?? '100'), 10) || 100))
  const offset = Math.max(0, parseInt(String(req.query?.offset ?? '0'), 10) || 0)
  const rows = await gatewaySchoolRepo.findAll(ctx, { limit, offset })
  const schools = rows.map((r) => ({
    id: r.id,
    schoolId: r.schoolId,
    schoolSlug: r.schoolSlug,
    isEnabled: r.isEnabled,
    createdAt: r.createdAt,
    lastUsedAt: r.lastUsedAt ?? null,
    notes: r.notes ?? null,
    allowedOps: r.allowedOps ?? null,
    hasDevKeyOverride: !!(r.devKeyOverrideCiphertext && r.devKeyOverrideIv)
  }))
  return { success: true, schools, limit, offset }
})
