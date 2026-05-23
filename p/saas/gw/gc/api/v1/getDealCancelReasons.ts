import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getDealCancelReasons — каталог: config/gc-op-http-mapping.json */
export const getDealCancelReasonsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getDealCancelReasons', req))
