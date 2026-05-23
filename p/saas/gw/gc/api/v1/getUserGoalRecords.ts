import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserGoalRecords — каталог: config/gc-op-http-mapping.json */
export const getUserGoalRecordsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserGoalRecords', req))
