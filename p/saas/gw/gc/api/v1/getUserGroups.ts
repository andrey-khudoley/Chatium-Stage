import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserGroups — каталог: config/gc-op-http-mapping.json */
export const getUserGroupsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserGroups', req))
