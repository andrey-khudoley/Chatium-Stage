import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getOfferById — каталог: config/gc-op-http-mapping.json */
export const getOfferByIdRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getOfferById', req))
