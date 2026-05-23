import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/setUri — каталог: config/gc-op-http-mapping.json */
export const setUriRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'setUri', req))
