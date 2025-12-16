// @shared
import { jsx } from "@app/html-jsx"
import { renderVue } from "@app/vue"

/**
 * Демо-страница для примеров работы с файлами
 */
export const filesExampleRoute = app.get('/', async (ctx, req) => {
  return renderVue(ctx, () => import("./FileManagement.vue"), {})
})


