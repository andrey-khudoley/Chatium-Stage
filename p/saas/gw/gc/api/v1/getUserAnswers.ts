import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserAnswers — каталог: config/gc-op-http-mapping.json */
export const getUserAnswersRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserAnswers', req))
