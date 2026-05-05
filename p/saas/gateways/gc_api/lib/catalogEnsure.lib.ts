import * as opCatalogRepo from '../repos/opCatalog.repo'
import * as catalogBuilder from './catalogBuilder.lib'

/** Если каталог пуст — однократно строим из OpenAPI + реестра. */
export async function ensureCatalogPopulated(ctx: app.Ctx): Promise<void> {
  const rows = await opCatalogRepo.findAll(ctx)
  if (rows.length === 0) {
    await catalogBuilder.buildCatalog(ctx, false)
  }
}
