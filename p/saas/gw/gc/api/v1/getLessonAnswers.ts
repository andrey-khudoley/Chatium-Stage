import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getLessonAnswers — каталог: config/gc-op-http-mapping.json */
export const getLessonAnswersRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getLessonAnswers', req))
