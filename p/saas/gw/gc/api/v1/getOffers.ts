import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getOffers — каталог: config/gc-op-http-mapping.json */
export const getOffersRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getOffers', req))
