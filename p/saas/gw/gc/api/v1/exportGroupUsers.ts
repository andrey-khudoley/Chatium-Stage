import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/exportGroupUsers — каталог: config/gc-op-http-mapping.json */
export const exportGroupUsersRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'exportGroupUsers', req))
