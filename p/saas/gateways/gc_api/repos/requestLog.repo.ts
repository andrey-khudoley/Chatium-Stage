import RequestLog, { type RequestLogRow } from '../tables/requestLog.table'

export async function create(ctx: app.Ctx, data: Omit<RequestLogRow, 'id'>): Promise<RequestLogRow> {
  return RequestLog.create(ctx, data)
}

export async function findRecent(
  ctx: app.Ctx,
  opts: {
    limit?: number
    schoolId?: string
    op?: string
    status?: string
    sinceMs?: number
  } = {}
): Promise<RequestLogRow[]> {
  const limit = opts.limit ?? 100
  const where: Record<string, unknown> = {}
  if (opts.schoolId) where.schoolId = opts.schoolId
  if (opts.op) where.op = opts.op
  if (opts.status) where.status = opts.status
  if (opts.sinceMs !== undefined) where.createdAt = { $gte: opts.sinceMs }

  return RequestLog.findAll(ctx, {
    where: Object.keys(where).length ? (where as never) : undefined,
    order: [{ createdAt: 'desc' }],
    limit
  })
}

export async function countSince(ctx: app.Ctx, sinceMs: number): Promise<number> {
  return RequestLog.countBy(ctx, {
    where: { createdAt: { $gte: sinceMs } }
  })
}

export async function countByOpSince(
  ctx: app.Ctx,
  sinceMs: number,
  op: string
): Promise<number> {
  return RequestLog.countBy(ctx, {
    where: { createdAt: { $gte: sinceMs }, op }
  })
}
