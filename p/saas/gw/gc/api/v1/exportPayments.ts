import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/exportPayments — каталог: config/gc-op-http-mapping.json */
export const exportPaymentsRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'exportPayments', req))
