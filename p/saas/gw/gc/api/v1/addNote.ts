import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addNote — каталог: config/gc-op-http-mapping.json */
export const addNoteRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addNote', req))
