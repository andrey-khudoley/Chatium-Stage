import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getExportResult — каталог: config/gc-op-http-mapping.json */
export const getExportResultRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getExportResult', req))
