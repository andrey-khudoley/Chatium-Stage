import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/removeUserGroups — каталог: config/gc-op-http-mapping.json */
export const removeUserGroupsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'removeUserGroups', req))
