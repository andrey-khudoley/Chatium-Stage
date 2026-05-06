import { handleV1AddUserPost } from '../../lib/gateway/v1AddUserHandler'

/** POST /v1/addUser — импорт пользователя (Legacy), см. `lib/gateway/v1AddUserHandler.ts`. */
export const addUserRoute = app.post('/', handleV1AddUserPost)
