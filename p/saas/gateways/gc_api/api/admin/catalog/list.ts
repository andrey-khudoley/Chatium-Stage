// @shared-route
import { requireAccountRole } from '@app/auth'
import * as catalogEnsure from '../../../lib/catalogEnsure.lib'
import * as opCatalogRepo from '../../../repos/opCatalog.repo'

/** GET — каталог операций (полная строка из Heap). */
export const adminCatalogListRoute = app.get('/', async (ctx, _req) => {
  requireAccountRole(ctx, 'Admin')
  await catalogEnsure.ensureCatalogPopulated(ctx)
  const rows = await opCatalogRepo.findAll(ctx)
  return { success: true, operations: rows }
})
