import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserDiplomas — каталог: config/gc-op-http-mapping.json */
export const getUserDiplomasRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserDiplomas', req))
