import OpenapiCache, { type OpenapiCacheRow } from '../tables/openapiCache.table'

export const OPENAPI_CACHE_KEY = 'gc-new-openapi'

export async function findByKey(ctx: app.Ctx, key: string): Promise<OpenapiCacheRow | null> {
  return OpenapiCache.findOneBy(ctx, { key })
}

export async function upsertByKey(
  ctx: app.Ctx,
  data: Omit<OpenapiCacheRow, 'id'>
): Promise<OpenapiCacheRow> {
  return OpenapiCache.createOrUpdateBy(ctx, 'key', data)
}
