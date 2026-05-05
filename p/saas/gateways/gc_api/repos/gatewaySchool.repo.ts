import GatewaySchool, { type GatewaySchoolRow } from '../tables/gatewaySchool.table'

export async function findBySchoolId(ctx: app.Ctx, schoolId: string): Promise<GatewaySchoolRow | null> {
  return GatewaySchool.findOneBy(ctx, { schoolId })
}

export async function findAll(
  ctx: app.Ctx,
  opts: { limit?: number; offset?: number } = {}
): Promise<GatewaySchoolRow[]> {
  const limit = opts.limit ?? 500
  const offset = opts.offset ?? 0
  return GatewaySchool.findAll(ctx, {
    order: [{ createdAt: 'desc' }],
    limit,
    offset
  })
}

export async function create(ctx: app.Ctx, data: Omit<GatewaySchoolRow, 'id'>): Promise<GatewaySchoolRow> {
  return GatewaySchool.create(ctx, data)
}

export async function upsertBySchoolId(
  ctx: app.Ctx,
  data: Omit<GatewaySchoolRow, 'id'>
): Promise<GatewaySchoolRow> {
  return GatewaySchool.createOrUpdateBy(ctx, 'schoolId', data)
}

export async function update(ctx: app.Ctx, id: string, patch: Partial<GatewaySchoolRow>): Promise<void> {
  await GatewaySchool.update(ctx, id, patch)
}

export async function deleteById(ctx: app.Ctx, id: string): Promise<void> {
  await GatewaySchool.delete(ctx, id)
}
