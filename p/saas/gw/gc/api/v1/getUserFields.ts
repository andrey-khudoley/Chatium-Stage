import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserFields — каталог: config/gc-op-http-mapping.json */
export const getUserFieldsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserFields', req))
