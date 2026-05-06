import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getDialogHistory — каталог: config/gc-op-http-mapping.json */
export const getDialogHistoryRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getDialogHistory', req))
