import Settings, { type SettingsRow } from '../tables/settings.table'

/**
 * Репозиторий настроек — слой работы с БД.
 * Только CRUD-операции, без бизнес-логики.
 * Не логируем через logger.lib: getSetting/getLogLevel/getLogWebhook вызываются из writeServerLog,
 * а они используют findByKey — иначе получается рекурсия (Maximum call stack size exceeded).
 */
export async function findByKey(ctx: app.Ctx, key: string): Promise<SettingsRow | null> {
  if (!Settings?.findOneBy) {
    return null
  }
  return Settings.findOneBy(ctx, { key })
}

export async function findAll(ctx: app.Ctx): Promise<SettingsRow[]> {
  if (!Settings?.findAll) {
    return []
  }
  return Settings.findAll(ctx, {})
}

export async function upsert(ctx: app.Ctx, key: string, value: unknown): Promise<void> {
  if (!Settings?.createOrUpdateBy) {
    return
  }
  await Settings.createOrUpdateBy(ctx, 'key', { key, value })
}

export async function deleteByKey(ctx: app.Ctx, key: string): Promise<void> {
  if (!Settings?.findOneBy || !Settings?.delete) {
    return
  }
  const row = await Settings.findOneBy(ctx, { key })
  if (row) {
    await Settings.delete(ctx, row.id)
  }
}
