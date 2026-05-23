import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getAllGroups — каталог: config/gc-op-http-mapping.json */
export const getAllGroupsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getAllGroups', req))
