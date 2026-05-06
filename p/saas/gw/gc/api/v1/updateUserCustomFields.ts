import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/updateUserCustomFields — каталог: config/gc-op-http-mapping.json */
export const updateUserCustomFieldsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'updateUserCustomFields', req))
