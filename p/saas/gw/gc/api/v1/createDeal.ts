import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/createDeal — каталог: config/gc-op-http-mapping.json */
export const createDealRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'createDeal', req))
