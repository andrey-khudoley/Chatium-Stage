import DayEntries, { type DayEntryRow } from '../tables/day_entries.table'

/**
 * Репозиторий записей дня (Утро / День / Вечер).
 * Одна запись на пользователя и дату (userId + date), формат date: YYYY-MM-DD.
 */

export async function getByUserAndDate(
  ctx: app.Ctx,
  userId: string,
  date: string
): Promise<DayEntryRow | null> {
  const rows = await DayEntries.findAll(ctx, {
    where: { userId, date },
    limit: 1
  })
  return rows[0] ?? null
}

export interface DayEntryPayload {
  morningText: string
  dayText: string
  eveningText: string
}

export async function upsertForUser(
  ctx: app.Ctx,
  userId: string,
  date: string,
  payload: DayEntryPayload
): Promise<DayEntryRow> {
  const existing = await getByUserAndDate(ctx, userId, date)
  if (existing) {
    await DayEntries.update(ctx, {
      id: existing.id,
      morningText: payload.morningText ?? '',
      dayText: payload.dayText ?? '',
      eveningText: payload.eveningText ?? ''
    })
    const updated = await DayEntries.findById(ctx, existing.id)
    return updated!
  }
  return DayEntries.create(ctx, {
    userId,
    date,
    morningText: payload.morningText ?? '',
    dayText: payload.dayText ?? '',
    eveningText: payload.eveningText ?? ''
  })
}
