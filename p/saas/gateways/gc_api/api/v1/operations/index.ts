import * as catalogEnsure from '../../../lib/catalogEnsure.lib'
import * as opCatalogRepo from '../../../repos/opCatalog.repo'
import * as gatewaySchoolRepo from '../../../repos/gatewaySchool.repo'
import * as loggerLib from '../../../lib/logger.lib'

const LOG = 'api/v1/operations'

function simpleHash(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return String(h)
}

/**
 * GET .../api/v1/operations — каталог op (публичный read-only).
 * Query: schoolId? — если задан и школа имеет allowlist, фильтруем операции.
 */
export const v1OperationsRoute = app.get('/', async (ctx, req) => {
  await catalogEnsure.ensureCatalogPopulated(ctx)
  const rows = await opCatalogRepo.findAll(ctx)

  const qSchool = req.query?.schoolId
  const schoolId = typeof qSchool === 'string' ? qSchool.trim() : ''
  let allow: string[] | null = null
  if (schoolId) {
    const school = await gatewaySchoolRepo.findBySchoolId(ctx, schoolId)
    const raw = school?.allowedOps
    if (Array.isArray(raw) && raw.length > 0) {
      allow = raw.filter((x): x is string => typeof x === 'string')
    }
  }

  const operations = rows
    .filter((r) => !allow || allow.includes(r.op))
    .map((r) => ({
      op: r.op,
      circuit: r.circuit,
      description: r.description,
      args_schema: r.argsSchemaJson,
      deprecated: r.deprecated,
      disabled: r.disabled
    }))

  const payload = {
    version: 'v0',
    generatedAt: Date.now(),
    operations
  }

  const etag = `"${simpleHash(JSON.stringify(operations))}"`

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG}] catalog`,
    payload: { count: operations.length, schoolFilter: !!allow }
  })

  return {
    statusCode: 200,
    rawHttpBody: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ETag: etag,
      'Cache-Control': 'public, max-age=600'
    }
  }
})
