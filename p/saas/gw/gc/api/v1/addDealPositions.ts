import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addDealPositions — каталог: config/gc-op-http-mapping.json */
export const addDealPositionsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addDealPositions', req))
