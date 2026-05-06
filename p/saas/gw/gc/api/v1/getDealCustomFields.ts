import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getDealCustomFields — каталог: config/gc-op-http-mapping.json */
export const getDealCustomFieldsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getDealCustomFields', req))
