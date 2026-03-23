import PomodoroState from '../tables/pomodoro-state.table'
import type { PomodoroAfterLongRest, PomodoroSettingsInput, PomodoroStateDto, PomodoroPhase, PomodoroStatus } from '../lib/pomodoro-types'
import { normalizePhaseChangeSoundId } from '../lib/pomodoro-types'
import { computePomodoroStatsDayKeyInTimeZone, normalizeClientStatsDayKey } from '../lib/pomodoro-stats-day'

const DEFAULTS: PomodoroSettingsInput = {
  workMinutes: 25,
  restMinutes: 5,
  longRestMinutes: 20,
  cyclesUntilLongRest: 4,
  pauseAfterWork: false,
  pauseAfterRest: false,
  afterLongRest: 'pause',
  autoStartRest: false,
  autoStartNextCycle: false,
  phaseChangeSound: 3
}

function normalizeMinutes(v: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback
  const n = Math.floor(v)
  return Math.max(1, Math.min(180, n))
}

function normalizeCycles(v: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback
  const n = Math.floor(v)
  return Math.max(1, Math.min(12, n))
}

function rowToState(row: typeof PomodoroState.T): PomodoroStateDto {
  return {
    status: row.status as PomodoroStatus,
    phase: row.phase as PomodoroPhase,
    currentTaskId: row.currentTaskId ?? '',
    phaseRemainingSec: Math.max(0, Math.floor(row.phaseRemainingSec)),
    phaseEndsAtMs: row.phaseEndsAtMs,
    cyclesCompleted: Math.max(0, Math.floor(row.cyclesCompleted)),
    totalWorkSec: Math.max(0, Math.floor(row.totalWorkSec)),
    totalRestSec: Math.max(0, Math.floor(row.totalRestSec)),
    totalSec: Math.max(0, Math.floor(row.totalWorkSec + row.totalRestSec)),
    workMinutes: normalizeMinutes(row.workMinutes, DEFAULTS.workMinutes),
    restMinutes: normalizeMinutes(row.restMinutes, DEFAULTS.restMinutes),
    longRestMinutes: normalizeMinutes(row.longRestMinutes, DEFAULTS.longRestMinutes),
    cyclesUntilLongRest: normalizeCycles(row.cyclesUntilLongRest, DEFAULTS.cyclesUntilLongRest),
    pauseAfterWork: !!row.pauseAfterWork,
    pauseAfterRest: !!row.pauseAfterRest,
    afterLongRest: (row.afterLongRest as PomodoroAfterLongRest) === 'stop' ? 'stop' : 'pause',
    autoStartRest: !!row.autoStartRest,
    autoStartNextCycle: !!row.autoStartNextCycle,
    phaseChangeSound: normalizePhaseChangeSoundId(row.phaseChangeSound ?? DEFAULTS.phaseChangeSound),
    tasksCompletedToday: Math.max(0, Math.floor(row.tasksCompletedToday ?? 0)),
    updatedAtMs: row.updatedAtMs
  }
}

async function createDefaultState(ctx: app.Ctx, userId: string): Promise<typeof PomodoroState.T> {
  const now = Date.now()
  return PomodoroState.create(ctx, {
    userId,
    status: 'stopped',
    phase: 'work',
    phaseRemainingSec: DEFAULTS.workMinutes * 60,
    phaseEndsAtMs: 0,
    cyclesCompleted: 0,
    totalWorkSec: 0,
    totalRestSec: 0,
    workMinutes: DEFAULTS.workMinutes,
    restMinutes: DEFAULTS.restMinutes,
    longRestMinutes: DEFAULTS.longRestMinutes,
    cyclesUntilLongRest: DEFAULTS.cyclesUntilLongRest,
    pauseAfterWork: DEFAULTS.pauseAfterWork,
    pauseAfterRest: DEFAULTS.pauseAfterRest,
    afterLongRest: DEFAULTS.afterLongRest,
    autoStartRest: DEFAULTS.autoStartRest,
    autoStartNextCycle: DEFAULTS.autoStartNextCycle,
    phaseChangeSound: DEFAULTS.phaseChangeSound,
    tasksCompletedToday: 0,
    updatedAtMs: now
  })
}

export async function getOrCreateStateRow(ctx: app.Ctx, userId: string): Promise<typeof PomodoroState.T> {
  const rows = await PomodoroState.findAll(ctx, { where: { userId }, limit: 1 })
  if (rows[0]) return rows[0]
  return createDefaultState(ctx, userId)
}

export async function getOrCreateState(ctx: app.Ctx, userId: string): Promise<PomodoroStateDto> {
  return rowToState(await getOrCreateStateRow(ctx, userId))
}

const STATS_FALLBACK_TIMEZONE = 'Europe/Moscow'

/**
 * Сброс дневной статистики при смене ключа периода (05:00 локально на клиенте или fallback по Москве).
 * updatedAtMs не трогаем — иначе сломается расчёт running-таймера в tick().
 */
export async function applyStatsPeriodIfNeeded(
  ctx: app.Ctx,
  row: typeof PomodoroState.T,
  expectedKey: string,
): Promise<typeof PomodoroState.T> {
  const stored = row.statsPeriodDayKey
  if (stored == null || stored === '') {
    return PomodoroState.update(ctx, {
      id: row.id,
      statsPeriodDayKey: expectedKey,
      updatedAtMs: row.updatedAtMs,
    })
  }
  if (stored === expectedKey) {
    return row
  }
  return PomodoroState.update(ctx, {
    id: row.id,
    statsPeriodDayKey: expectedKey,
    totalWorkSec: 0,
    totalRestSec: 0,
    tasksCompletedToday: 0,
    updatedAtMs: row.updatedAtMs,
  })
}

export async function getOrCreateStateWithDailyStats(
  ctx: app.Ctx,
  userId: string,
  clientStatsDayKey: string | undefined,
  nowMs: number,
): Promise<PomodoroStateDto> {
  let row = await getOrCreateStateRow(ctx, userId)
  const expectedKey =
    normalizeClientStatsDayKey(clientStatsDayKey) ?? computePomodoroStatsDayKeyInTimeZone(nowMs, STATS_FALLBACK_TIMEZONE)
  row = await applyStatsPeriodIfNeeded(ctx, row, expectedKey)
  return rowToState(row)
}

export async function updateState(
  ctx: app.Ctx,
  userId: string,
  patch: Partial<typeof PomodoroState.T>
): Promise<PomodoroStateDto> {
  const row = await getOrCreateStateRow(ctx, userId)
  const updated = await PomodoroState.update(ctx, {
    id: row.id,
    ...patch,
    updatedAtMs: Date.now()
  })
  return rowToState(updated)
}
