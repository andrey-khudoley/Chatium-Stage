// @shared

const STATS_DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Предыдущий календарный день (григорианский), по компонентам даты. */
function prevGregorianDay(y: number, month1to12: number, day: number): { y: number; m: number; d: number } {
  const u = Date.UTC(y, month1to12 - 1, day - 1)
  const dt = new Date(u)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

function formatYmd(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Ключ периода дневной статистики помодоро: смена в 05:00 по локальному времени среды (браузер на клиенте).
 */
export function computePomodoroStatsDayKeyLocal(nowMs: number): string {
  const d = new Date(nowMs)
  let y = d.getFullYear()
  let m = d.getMonth() + 1
  let day = d.getDate()
  if (d.getHours() < 5) {
    const p = prevGregorianDay(y, m, day)
    y = p.y
    m = p.m
    day = p.d
  }
  return formatYmd(y, m, day)
}

/**
 * То же правило (граница в 05:00), по компонентам даты в заданной IANA-зоне (для сервера без ключа от клиента).
 */
export function computePomodoroStatsDayKeyInTimeZone(nowMs: number, timeZone: string): string {
  const partsArr = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(nowMs))

  const parts: Record<string, string> = {}
  for (const p of partsArr) {
    if (p.type !== 'literal') parts[p.type] = p.value
  }

  const y = parseInt(parts.year, 10)
  const mo = parseInt(parts.month, 10)
  const d = parseInt(parts.day, 10)
  const h = parseInt(parts.hour, 10)

  if (h < 5) {
    const p = prevGregorianDay(y, mo, d)
    return formatYmd(p.y, p.m, p.d)
  }
  return formatYmd(y, mo, d)
}

export function normalizeClientStatsDayKey(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const t = raw.trim()
  if (t.length > 32 || !STATS_DAY_KEY_RE.test(t)) return undefined
  return t
}
