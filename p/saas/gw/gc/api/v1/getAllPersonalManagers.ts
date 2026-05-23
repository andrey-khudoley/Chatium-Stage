import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getAllPersonalManagers — каталог: config/gc-op-http-mapping.json */
export const getAllPersonalManagersRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getAllPersonalManagers', req))
