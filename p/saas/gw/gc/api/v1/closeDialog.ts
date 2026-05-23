import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/closeDialog — каталог: config/gc-op-http-mapping.json */
export const closeDialogRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'closeDialog', req))
