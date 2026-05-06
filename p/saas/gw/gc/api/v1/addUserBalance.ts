import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addUserBalance — каталог: config/gc-op-http-mapping.json */
export const addUserBalanceRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addUserBalance', req))
