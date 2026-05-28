// @shared
/**
 * Чистые помощники форматирования/классификации для домашней панели SBP-клиента
 * (HomePage и её презентационных подкомпонентов). Без состояния Vue.
 * Вынесено ради лимита размера файла HomePage.vue; поведение и тексты сохранены
 * дословно из старого PanelHomePage.
 */

const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Unix ms → строка локальной даты YYYY-MM-DD (для input[type=date]); '' если нет. */
export function msToLocalDate(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return ''
  const d = new Date(ms as number)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Unix ms → строка локального времени HH:MM (для input[type=time]); '' если нет. */
export function msToLocalTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return ''
  const d = new Date(ms as number)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/**
 * Дата + (необязательное) время → Unix ms (локальное время браузера).
 * Пустое время трактуется как 00:00. Без даты граница не задана (null).
 */
export function localPartsToMs(
  dateStr: string | null | undefined,
  timeStr: string | null | undefined
): number | null {
  if (!dateStr) return null
  const time = /^\d{2}:\d{2}/.test(timeStr || '') ? (timeStr as string) : '00:00'
  const ms = new Date(`${dateStr}T${time}`).getTime()
  return Number.isFinite(ms) && ms > 0 ? ms : null
}

export function formatKpiNumber(n: unknown): string {
  if (n === null || n === undefined) return '—'
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  return Intl.NumberFormat('ru-RU').format(n)
}

export function formatKpiPercent(share: unknown): string {
  if (share === null || share === undefined) return '—'
  if (typeof share !== 'number' || Number.isNaN(share)) return '—'
  return (share * 100).toFixed(1) + ' %'
}

export function formatMoney(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return (
    Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + ' ₽'
  )
}

export function formatTime(ts: unknown): string {
  if (!ts) return ''
  try {
    const d = new Date(ts as number)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch (_e) {
    return String(ts)
  }
}

export function updatedSince(now: number, ts: number | null | undefined): string {
  if (!ts) return ''
  const diff = Math.max(0, Math.floor((now - ts) / 1000))
  if (diff < 5) return 'сейчас'
  if (diff < 60) return diff + ' сек назад'
  const min = Math.floor(diff / 60)
  if (min < 60) return min + ' мин назад'
  const h = Math.floor(min / 60)
  return h + ' ч назад'
}

export function rowClassRequest(r: { ok?: boolean }): Record<string, boolean> {
  return {
    'row-clickable': true,
    'row-error': !r.ok
  }
}

export function rowClassWebhook(w: {
  tokenValid?: boolean
  status?: string
}): Record<string, boolean> {
  return {
    'row-error': !!w.tokenValid && w.status !== 'success',
    'row-warn': !w.tokenValid
  }
}

export function inviteStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'активна'
    case 'used':
      return 'использована'
    case 'revoked':
      return 'отозвана'
    case 'expired':
      return 'истекла'
    default:
      return status
  }
}

export function inviteStatusClass(status: string): string {
  if (status === 'active') return 'cell-ok'
  if (status === 'revoked' || status === 'expired') return 'cell-err'
  return ''
}

export function rawJsonString(entry: unknown): string {
  if (!entry) return ''
  try {
    return JSON.stringify(entry, null, 2)
  } catch (_e) {
    return '<unstringifiable>'
  }
}

/* ====== Статичные дефолты для пропсов / data() HomePage ====== */

export type SbpHomeApiUrls = {
  invoke: string
  recentRequests: string
  recentWebhooks: string
  analyticsSummary: string
  searchByRequestId: string
  rawRequest: string
  rawWebhook: string
  accessGenerateInvite: string
  accessRevokeInvite: string
  accessRevokeGrant: string
  accessInvites: string
  accessGrants: string
  filterSave: string
}

export function defaultSbpHomeApiUrls(): SbpHomeApiUrls {
  return {
    invoke: '',
    recentRequests: '',
    recentWebhooks: '',
    analyticsSummary: '',
    searchByRequestId: '',
    rawRequest: '',
    rawWebhook: '',
    accessGenerateInvite: '',
    accessRevokeInvite: '',
    accessRevokeGrant: '',
    accessInvites: '',
    accessGrants: '',
    filterSave: ''
  }
}

export type SbpHomeSettings = {
  lp_apikey: string
  lp_login: string
  lp_webhook_token: string
  gateway_base_url: string
}

export function defaultSbpHomeSettings(): SbpHomeSettings {
  return {
    lp_apikey: '',
    lp_login: '',
    lp_webhook_token: '',
    gateway_base_url: ''
  }
}

export type SbpHomeTab = { id: string; label: string; icon: string; adminOnly?: boolean }

export function sbpHomeTabs(): SbpHomeTab[] {
  return [
    { id: 'overview', label: 'Обзор', icon: 'fa-chart-line' },
    { id: 'requests', label: 'Запросы', icon: 'fa-list' },
    { id: 'webhooks', label: 'Webhook', icon: 'fa-bell' },
    { id: 'createBill', label: 'Создать', icon: 'fa-file-invoice' },
    { id: 'access', label: 'Доступ', icon: 'fa-user-shield', adminOnly: true }
  ]
}

export function sbpRequestsFilters(): Array<{ id: string; label: string }> {
  return [
    { id: 'all', label: 'Все' },
    { id: 'ok', label: 'Успешные' },
    { id: 'err', label: 'Ошибки' }
  ]
}

export function sbpWebhooksFilters(): Array<{ id: string; label: string }> {
  return [
    { id: 'all', label: 'Все' },
    { id: 'success', label: 'success' },
    { id: 'fail', label: 'fail' },
    { id: 'invalid', label: 'токен ✗' }
  ]
}

/** Возвращает чипы статуса конфигурации (для индикатора в шапке). */
export function sbpConfigChips(
  s: SbpHomeSettings
): Array<{ key: keyof SbpHomeSettings; label: string; set: boolean }> {
  return [
    { key: 'lp_apikey', label: 'API-ключ', set: !!s.lp_apikey },
    { key: 'lp_login', label: 'Login', set: !!s.lp_login },
    { key: 'lp_webhook_token', label: 'Webhook-токен', set: !!s.lp_webhook_token },
    { key: 'gateway_base_url', label: 'Gateway URL', set: !!s.gateway_base_url }
  ]
}

/** Подсчёт строк журнала запросов по pill-фильтрам. */
export function sbpRequestCounts(requests: Array<{ ok?: boolean }>): {
  all: number
  ok: number
  err: number
} {
  return {
    all: requests.length,
    ok: requests.filter((r) => r.ok).length,
    err: requests.filter((r) => !r.ok).length
  }
}

/** Подсчёт строк журнала webhook по pill-фильтрам. */
export function sbpWebhookCounts(webhooks: Array<{ status?: string; tokenValid?: boolean }>): {
  all: number
  success: number
  fail: number
  invalid: number
} {
  return {
    all: webhooks.length,
    success: webhooks.filter((w) => w.status === 'success' && w.tokenValid).length,
    fail: webhooks.filter((w) => w.status === 'fail' && w.tokenValid).length,
    invalid: webhooks.filter((w) => !w.tokenValid).length
  }
}

/** Применяет pill-фильтр к журналу запросов. */
export function sbpFilterRequests<T extends { ok?: boolean }>(requests: T[], filter: string): T[] {
  if (filter === 'ok') return requests.filter((r) => r.ok)
  if (filter === 'err') return requests.filter((r) => !r.ok)
  return requests
}

/** Применяет pill-фильтр к журналу webhook. */
export function sbpFilterWebhooks<T extends { status?: string; tokenValid?: boolean }>(
  webhooks: T[],
  filter: string
): T[] {
  if (filter === 'success') return webhooks.filter((w) => w.status === 'success' && w.tokenValid)
  if (filter === 'fail') return webhooks.filter((w) => w.status === 'fail' && w.tokenValid)
  if (filter === 'invalid') return webhooks.filter((w) => !w.tokenValid)
  return webhooks
}

/** Текст метки периода: «с X по Y» / «с X» / «по Y» / «за всё время». */
export function sbpPeriodLabel(fromMs: number | null, toMs: number | null): string {
  if (fromMs === null && toMs === null) return 'за всё время'
  if (fromMs !== null && toMs !== null) return `с ${formatTime(fromMs)} по ${formatTime(toMs)}`
  if (fromMs !== null) return `с ${formatTime(fromMs)}`
  return `по ${formatTime(toMs)}`
}
