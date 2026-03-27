// @shared

/** Локальная дневная статистика таймера/секундомера (localStorage), см. FocusClockPane */

export const FOCUS_CLOCK_STATS_STORAGE_VERSION = 1

export type FocusClockMode = 'timer' | 'stopwatch'

export type PersistedFocusClockStats = {
  version: number
  dayKey: string
  mode: FocusClockMode
  sessionsCount: number
  totalFocusSec: number
  totalSec: number
}

export function getFocusClockStatsStorageKey(mode: FocusClockMode): string {
  return `assistant:focus-clock-stats:${mode}`
}

export function readFocusClockStatsFromStorage(mode: FocusClockMode, dayKey: string): PersistedFocusClockStats | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getFocusClockStatsStorageKey(mode))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedFocusClockStats
    if (parsed.version !== FOCUS_CLOCK_STATS_STORAGE_VERSION) return null
    if (parsed.mode !== mode) return null
    if (parsed.dayKey !== dayKey) return null
    return parsed
  } catch {
    return null
  }
}

export function buildFocusClockStatsPayload(
  mode: FocusClockMode,
  dayKey: string,
  sessionsCount: number,
  totalFocusSec: number,
  totalSec: number
): PersistedFocusClockStats {
  return {
    version: FOCUS_CLOCK_STATS_STORAGE_VERSION,
    dayKey,
    mode,
    sessionsCount: Math.max(0, Math.floor(sessionsCount)),
    totalFocusSec: Math.max(0, Math.floor(totalFocusSec)),
    totalSec: Math.max(0, Math.floor(totalSec))
  }
}

export function writeFocusClockStatsToStorage(mode: FocusClockMode, payload: PersistedFocusClockStats): void {
  try {
    window.localStorage.setItem(getFocusClockStatsStorageKey(mode), JSON.stringify(payload))
  } catch {
    // ignore storage write errors
  }
}
