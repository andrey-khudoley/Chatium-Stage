import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getDealsTags — каталог: config/gc-op-http-mapping.json */
export const getDealsTagsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getDealsTags', req))
