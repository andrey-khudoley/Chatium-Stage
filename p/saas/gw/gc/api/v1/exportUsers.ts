import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/exportUsers — каталог: config/gc-op-http-mapping.json */
export const exportUsersRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'exportUsers', req))
