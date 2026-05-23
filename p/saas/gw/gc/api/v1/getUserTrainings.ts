import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserTrainings — каталог: config/gc-op-http-mapping.json */
export const getUserTrainingsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserTrainings', req))
