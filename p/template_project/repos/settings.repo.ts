import Settings, { type SettingsRow } from '../tables/settings.table'
import * as loggerLib from '../lib/logger.lib'

const LOG_MODULE = 'repos/settings.repo'

/**
 * Репозиторий настроек — слой работы с БД.
 * Только CRUD-операции, без бизнес-логики.
 */
export async function findByKey(ctx: app.Ctx, key: string): Promise<SettingsRow | null> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] findByKey entry`,
    payload: { key }
  })
  const row = await Settings.findOneBy(ctx, { key })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] findByKey exit`,
    payload: { key, hasRow: !!row, rowId: row?.id }
  })
  return row
}

export async function findAll(ctx: app.Ctx): Promise<SettingsRow[]> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] findAll entry`,
    payload: {}
  })
  const rows = await Settings.findAll(ctx, {})
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] findAll exit`,
    payload: { count: rows.length, keys: rows.map((r) => r.key) }
  })
  return rows
}

export async function upsert(ctx: app.Ctx, key: string, value: unknown): Promise<void> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] upsert entry`,
    payload: { key, value }
  })
  await Settings.createOrUpdateBy(ctx, 'key', { key, value })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] upsert exit`,
    payload: { key }
  })
}

export async function deleteByKey(ctx: app.Ctx, key: string): Promise<void> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] deleteByKey entry`,
    payload: { key }
  })
  const row = await Settings.findOneBy(ctx, { key })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] deleteByKey findOneBy`,
    payload: { key, hasRow: !!row }
  })
  if (row) {
    await Settings.delete(ctx, row.id)
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] deleteByKey deleted`,
      payload: { key, id: row.id }
    })
  }
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] deleteByKey exit`,
    payload: { key }
  })
}
