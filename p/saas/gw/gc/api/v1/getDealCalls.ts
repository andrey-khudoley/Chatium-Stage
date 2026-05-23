import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getDealCalls — каталог: config/gc-op-http-mapping.json */
export const getDealCallsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getDealCalls', req))
