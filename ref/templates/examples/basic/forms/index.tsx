// @shared
import { jsx } from "@app/html-jsx"
import { renderVue } from "@app/vue"

/**
 * Главная страница примеров форм
 */
export const formsExampleRoute = app.get('/', async (ctx, req) => {
  return renderVue(ctx, () => import("./FormsExamples.vue"), {})
})

