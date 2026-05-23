import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** POST /v1/addCommentToLessonAnswer — каталог: config/gc-op-http-mapping.json */
export const addCommentToLessonAnswerRoute = app.post('/', async (ctx, req) => handleV1OpRoute(ctx, 'addCommentToLessonAnswer', req))
