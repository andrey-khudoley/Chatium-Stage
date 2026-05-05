import * as secretSettings from '../../../lib/secretSettings.lib'
import * as openapiCacheRepo from '../../../repos/openapiCache.repo'
import * as jsonHttp from '../../../lib/httpJson.lib'

/** GET — статус gateway и возраст кеша OpenAPI. */
export const v1HealthRoute = app.get('/', async (ctx, _req) => {
  const devPresent = !!(await secretSettings.getGcDevKeyPlain(ctx))
  const cache = await openapiCacheRepo.findByKey(ctx, openapiCacheRepo.OPENAPI_CACHE_KEY)
  const openapiAgeMs = cache ? Math.max(0, Date.now() - cache.fetchedAt) : null

  const body = {
    ok: true,
    gcDevKeyConfigured: devPresent,
    openapiCached: !!cache,
    openapiAgeMs,
    openapiVersion: cache?.version ?? null
  }

  return jsonHttp.jsonHttpResponse(200, body)
})
