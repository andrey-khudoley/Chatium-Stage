// @shared-route
import { requireAccountRole } from '@app/auth'
import * as catalogBuilder from '../../../lib/catalogBuilder.lib'

/** POST — перезагрузить OpenAPI и пересобрать каталог. */
export const adminCatalogRefreshRoute = app.post('/', async (ctx, _req) => {
  requireAccountRole(ctx, 'Admin')
  await catalogBuilder.buildCatalog(ctx, true)
  return { success: true }
})
