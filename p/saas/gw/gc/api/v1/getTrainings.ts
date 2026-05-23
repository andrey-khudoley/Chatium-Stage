import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getTrainings — каталог: config/gc-op-http-mapping.json */
export const getTrainingsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getTrainings', req))
