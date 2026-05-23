import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserCustomFields — каталог: config/gc-op-http-mapping.json */
export const getUserCustomFieldsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserCustomFields', req))
