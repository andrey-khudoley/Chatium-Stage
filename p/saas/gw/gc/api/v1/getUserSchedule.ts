import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserSchedule — каталог: config/gc-op-http-mapping.json */
export const getUserScheduleRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserSchedule', req))
