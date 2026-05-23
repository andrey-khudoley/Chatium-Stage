import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getDealFields — каталог: config/gc-op-http-mapping.json */
export const getDealFieldsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getDealFields', req))
