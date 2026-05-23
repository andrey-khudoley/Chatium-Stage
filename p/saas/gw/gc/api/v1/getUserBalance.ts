import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserBalance — каталог: config/gc-op-http-mapping.json */
export const getUserBalanceRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserBalance', req))
