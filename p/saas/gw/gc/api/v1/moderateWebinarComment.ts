import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/moderateWebinarComment — каталог: config/gc-op-http-mapping.json */
export const moderateWebinarCommentRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'moderateWebinarComment', req))
