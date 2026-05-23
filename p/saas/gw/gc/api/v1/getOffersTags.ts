import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getOffersTags — каталог: config/gc-op-http-mapping.json */
export const getOffersTagsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getOffersTags', req))
