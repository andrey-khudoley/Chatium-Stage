import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/updateDealFields — каталог: config/gc-op-http-mapping.json */
export const updateDealFieldsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'updateDealFields', req))
