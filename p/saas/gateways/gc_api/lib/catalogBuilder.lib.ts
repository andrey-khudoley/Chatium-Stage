import { OP_REGISTRY } from '../shared/opRegistry'
import { LEGACY_ARG_SCHEMAS } from '../shared/legacyArgSchemas'
import * as opCatalogRepo from '../repos/opCatalog.repo'
import * as openapiLoader from './openapiLoader.lib'
import * as openapiSchema from './openapiSchema.lib'
import * as loggerLib from './logger.lib'

const LOG = 'lib/catalogBuilder.lib'

function openapiVersionHash(spec: openapiLoader.OpenapiSpec): string {
  const v = (spec as { info?: { version?: string } }).info?.version ?? ''
  const paths = spec.paths ? Object.keys(spec.paths).length : 0
  return `${v}_${paths}`
}

/** Пересобирает строки OpCatalog из OP_REGISTRY + OpenAPI (new) или static (legacy). */
export async function buildCatalog(ctx: app.Ctx, forceRefreshOpenapi = false): Promise<void> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG}] buildCatalog start`,
    payload: { forceRefreshOpenapi }
  })

  await opCatalogRepo.deleteAll(ctx)

  const spec = await openapiLoader.getOrRefreshOpenapi(ctx, forceRefreshOpenapi)
  const ver = openapiVersionHash(spec)

  for (const def of OP_REGISTRY) {
    if (def.circuit === 'legacy') {
      const argsSchema =
        LEGACY_ARG_SCHEMAS[def.op] ?? ({ type: 'object', additionalProperties: true } as Record<string, unknown>)
      await opCatalogRepo.upsertByOp(ctx, {
        op: def.op,
        circuit: 'legacy',
        description: def.description,
        argsSchemaJson: argsSchema,
        returnsSchemaJson: undefined,
        gcMethod: undefined,
        gcPath: undefined,
        deprecated: def.deprecated ?? false,
        disabled: false,
        source: 'legacy-static',
        sourceVersion: 'v0',
        updatedAt: Date.now()
      })
      continue
    }

    const method = def.gcMethod!.toLowerCase() as 'get' | 'post'
    const argsSchema = openapiSchema.extractArgsSchemaFromOperation(spec, def.gcPath!, method)

    await opCatalogRepo.upsertByOp(ctx, {
      op: def.op,
      circuit: 'new',
      description: def.description,
      argsSchemaJson: argsSchema,
      returnsSchemaJson: undefined,
      gcMethod: def.gcMethod,
      gcPath: def.gcPath,
      deprecated: def.deprecated ?? false,
      disabled: false,
      source: 'openapi',
      sourceVersion: ver,
      updatedAt: Date.now()
    })
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG}] buildCatalog done`,
    payload: { ops: OP_REGISTRY.length, openapiVer: ver }
  })
}
