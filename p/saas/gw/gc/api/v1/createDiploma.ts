import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/createDiploma — каталог: config/gc-op-http-mapping.json */
export const createDiplomaRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'createDiploma', req))
