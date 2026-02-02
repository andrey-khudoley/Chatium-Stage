import Logs, { type LogsRow } from '../tables/logs.table'

/**
 * Репозиторий логов — слой работы с БД.
 * Только CRUD-операции, без бизнес-логики.
 */
export async function create(
  ctx: app.Ctx,
  data: { message: string; payload: unknown; severity: number; level: string; timestamp: number }
): Promise<LogsRow> {
  return Logs.create(ctx, data)
}

export async function findAll(
  ctx: app.Ctx,
  opts: { limit?: number; offset?: number } = {}
): Promise<LogsRow[]> {
  return Logs.findAll(ctx, {
    order: [{ timestamp: 'desc' }],
    limit: opts.limit ?? 1000,
    offset: opts.offset ?? 0
  })
}

export async function findById(ctx: app.Ctx, id: string): Promise<LogsRow | null> {
  return Logs.findById(ctx, id)
}
