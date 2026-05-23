import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserPurchases — каталог: config/gc-op-http-mapping.json */
export const getUserPurchasesRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserPurchases', req))
