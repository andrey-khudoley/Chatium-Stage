// @shared
import { jsx } from "@app/html-jsx"

/**
 * Главная страница примера Heap Tables CRUD
 * Перенаправление на основной пример
 */
export const heapTablesExampleRoute = app.get('/', async (ctx, req) => {
  // Перенаправляем на страницу с демо
  return ctx.redirect('./crud-example')
})

