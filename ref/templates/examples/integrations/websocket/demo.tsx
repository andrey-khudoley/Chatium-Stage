// @shared
import { jsx } from "@app/html-jsx"
import { renderVue } from "@app/vue"

/**
 * Демо-страница для WebSocket примеров
 */
export const websocketExampleRoute = app.get('/', async (ctx, req) => {
  return renderVue(ctx, () => import("./WebSocketDemo.vue"), {})
})


