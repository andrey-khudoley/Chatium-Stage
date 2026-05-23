import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserDeals — каталог: config/gc-op-http-mapping.json */
export const getUserDealsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserDeals', req))
