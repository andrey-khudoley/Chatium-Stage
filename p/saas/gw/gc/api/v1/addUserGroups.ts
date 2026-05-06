import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addUserGroups — каталог: config/gc-op-http-mapping.json */
export const addUserGroupsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addUserGroups', req))
