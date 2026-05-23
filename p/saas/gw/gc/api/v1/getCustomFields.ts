import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getCustomFields — каталог: config/gc-op-http-mapping.json */
export const getCustomFieldsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getCustomFields', req))
