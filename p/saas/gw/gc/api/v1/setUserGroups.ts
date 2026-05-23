import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/setUserGroups — каталог: config/gc-op-http-mapping.json */
export const setUserGroupsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'setUserGroups', req))
