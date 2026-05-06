import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/getWebinarsByIds — каталог: config/gc-op-http-mapping.json */
export const getWebinarsByIdsRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'getWebinarsByIds', req))
