import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addCommentToWebinar — каталог: config/gc-op-http-mapping.json */
export const addCommentToWebinarRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addCommentToWebinar', req))
