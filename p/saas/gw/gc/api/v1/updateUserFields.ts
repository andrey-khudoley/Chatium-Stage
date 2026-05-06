import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/updateUserFields — каталог: config/gc-op-http-mapping.json */
export const updateUserFieldsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'updateUserFields', req))
