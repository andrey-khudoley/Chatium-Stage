import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getAllWebinars — каталог: config/gc-op-http-mapping.json */
export const getAllWebinarsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getAllWebinars', req))
