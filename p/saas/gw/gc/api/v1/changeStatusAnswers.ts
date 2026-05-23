import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/changeStatusAnswers — каталог: config/gc-op-http-mapping.json */
export const changeStatusAnswersRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'changeStatusAnswers', req))
