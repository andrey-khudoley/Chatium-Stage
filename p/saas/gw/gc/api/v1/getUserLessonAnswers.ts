import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** GET /v1/getUserLessonAnswers — каталог: config/gc-op-http-mapping.json */
export const getUserLessonAnswersRoute = app.get('/', async (ctx, req) => handleV1OpRoute(ctx, 'getUserLessonAnswers', req))
