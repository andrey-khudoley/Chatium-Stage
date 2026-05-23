import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getDealComments — каталог: config/gc-op-http-mapping.json */
export const getDealCommentsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getDealComments', req))
