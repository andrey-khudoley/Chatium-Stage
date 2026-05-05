import OpCatalog, { type OpCatalogRow } from '../tables/opCatalog.table'

export async function findByOp(ctx: app.Ctx, op: string): Promise<OpCatalogRow | null> {
  return OpCatalog.findOneBy(ctx, { op })
}

export async function findAll(ctx: app.Ctx): Promise<OpCatalogRow[]> {
  return OpCatalog.findAll(ctx, {
    order: [{ op: 'asc' }]
  })
}

export async function upsertByOp(ctx: app.Ctx, data: Omit<OpCatalogRow, 'id'>): Promise<OpCatalogRow> {
  return OpCatalog.createOrUpdateBy(ctx, 'op', data)
}

export async function deleteAll(ctx: app.Ctx): Promise<void> {
  const rows = await OpCatalog.findAll(ctx, {})
  for (const row of rows) {
    await OpCatalog.delete(ctx, row.id)
  }
}
