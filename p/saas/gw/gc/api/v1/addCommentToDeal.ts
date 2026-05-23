import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addCommentToDeal — каталог: config/gc-op-http-mapping.json */
export const addCommentToDealRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addCommentToDeal', req))
