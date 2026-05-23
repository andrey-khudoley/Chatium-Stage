import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/removeDealPositions — каталог: config/gc-op-http-mapping.json */
export const removeDealPositionsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'removeDealPositions', req))
