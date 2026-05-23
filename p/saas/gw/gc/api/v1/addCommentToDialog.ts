import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addCommentToDialog — каталог: config/gc-op-http-mapping.json */
export const addCommentToDialogRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addCommentToDialog', req))
