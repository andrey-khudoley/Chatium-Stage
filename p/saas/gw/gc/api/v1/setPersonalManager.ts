import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/setPersonalManager — каталог: config/gc-op-http-mapping.json */
export const setPersonalManagerRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'setPersonalManager', req))
