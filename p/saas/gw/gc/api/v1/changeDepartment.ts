import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/changeDepartment — каталог: config/gc-op-http-mapping.json */
export const changeDepartmentRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'changeDepartment', req))
