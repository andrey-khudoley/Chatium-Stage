import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/exportDeals — каталог: config/gc-op-http-mapping.json */
export const exportDealsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'exportDeals', req))
