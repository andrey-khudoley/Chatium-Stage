import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/moderateWebinarUser — каталог: config/gc-op-http-mapping.json */
export const moderateWebinarUserRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'moderateWebinarUser', req))
