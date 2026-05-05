import * as opCatalogRepo from '../repos/opCatalog.repo'
import * as jsonSchemaValidate from './jsonSchemaValidate.lib'

export async function validateInvokeArgs(
  ctx: app.Ctx,
  op: string,
  args: unknown
): Promise<
  | { ok: true; args: Record<string, unknown> }
  | { ok: false; errors: jsonSchemaValidate.SchemaValidationIssue[] }
> {
  const row = await opCatalogRepo.findByOp(ctx, op)
  if (!row) {
    return { ok: false, errors: [{ path: '$', message: 'Операция отсутствует в каталоге (запустите обновление каталога)' }] }
  }
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return { ok: false, errors: [{ path: '$', message: 'args должен быть объектом' }] }
  }
  const schema = row.argsSchemaJson as Record<string, unknown>
  const res = jsonSchemaValidate.validateAgainstJsonSchema(args, schema)
  if (!res.ok) {
    return { ok: false, errors: res.errors }
  }
  return { ok: true, args: args as Record<string, unknown> }
}
