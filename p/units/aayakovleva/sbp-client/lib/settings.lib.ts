import * as repo from '../repos/settings.repo'
import * as loggerLib from './logger.lib'

const LOG_MODULE = 'lib/settings.lib'

/** Ключи настроек */
export const SETTING_KEYS = {
  PROJECT_NAME: 'project_name',
  PROJECT_TITLE: 'project_title',
  LOG_LEVEL: 'log_level',
  LOGS_LIMIT: 'logs_limit',
  LOG_WEBHOOK: 'log_webhook',
  DASHBOARD_RESET_AT: 'dashboard_reset_at',
  // LifePay client panel (implementation-plan §1.8.1)
  LP_APIKEY: 'lp_apikey',
  LP_LOGIN: 'lp_login',
  LP_WEBHOOK_TOKEN: 'lp_webhook_token',
  GATEWAY_BASE_URL: 'gateway_base_url',
  // Глобальный фильтр панели по дате/времени (один на всё приложение).
  PANEL_DATE_FILTER: 'panel_date_filter'
} as const

/** Настройка вебхука логов: enable — активна ли отправка, url — куда отправлять. */
export type LogWebhookSetting = { enable: boolean; url: string }

/**
 * Глобальный фильтр панели по дате/времени (Unix ms). Любая граница может
 * отсутствовать: только from — «всё после», только to — «всё до», обе — диапазон.
 * Пустой объект `{}` означает «фильтр не задан» (показываются все данные).
 */
export type DateFilter = { from?: number; to?: number }

/** Проверяет одну границу фильтра: число, конечное, > 0. */
function isValidBound(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Валидирует фильтр дат. Объект; каждая присутствующая граница — корректное
 * число (> 0); если обе заданы — from <= to. Отсутствие границ допустимо.
 */
export function isValidDateFilter(value: unknown): value is DateFilter {
  if (typeof value !== 'object' || value === null) return false
  const o = value as Record<string, unknown>
  if (o.from !== undefined && !isValidBound(o.from)) return false
  if (o.to !== undefined && !isValidBound(o.to)) return false
  if (isValidBound(o.from) && isValidBound(o.to) && o.from > o.to) return false
  return true
}

/**
 * Нормализует фильтр: оставляет только валидные границы (Math.floor), отбрасывает
 * отсутствующие/невалидные. Возвращает `{}` если ничего валидного нет.
 */
export function normalizeDateFilter(value: unknown): DateFilter {
  if (typeof value !== 'object' || value === null) return {}
  const o = value as Record<string, unknown>
  const result: DateFilter = {}
  if (isValidBound(o.from)) result.from = Math.floor(o.from)
  if (isValidBound(o.to)) result.to = Math.floor(o.to)
  if (result.from !== undefined && result.to !== undefined && result.from > result.to) {
    return {}
  }
  return result
}

/** Значения по умолчанию */
export const DEFAULTS = {
  [SETTING_KEYS.PROJECT_NAME]: 'LifePay SBP Client',
  [SETTING_KEYS.PROJECT_TITLE]: 'LifePay SBP Client',
  [SETTING_KEYS.LOG_LEVEL]: 'Info',
  [SETTING_KEYS.LOGS_LIMIT]: '100',
  [SETTING_KEYS.LOG_WEBHOOK]: { enable: false, url: '' } as LogWebhookSetting,
  [SETTING_KEYS.DASHBOARD_RESET_AT]: null as number | null,
  [SETTING_KEYS.LP_APIKEY]: '',
  [SETTING_KEYS.LP_LOGIN]: '',
  [SETTING_KEYS.LP_WEBHOOK_TOKEN]: '',
  [SETTING_KEYS.GATEWAY_BASE_URL]: ''
} as const

/** Минимальная длина webhook-токена (implementation-plan §1.8.1: ≥ 32 байт). */
export const LP_WEBHOOK_TOKEN_MIN_LENGTH = 32

/** Валидация login по §2.5 manual: 11 цифр, первая 7. */
export function isValidLpLogin(value: string): boolean {
  return /^7\d{10}$/.test(value)
}

/** Валидация gateway_base_url: http(s)://..., без trailing slash. */
export function normalizeGatewayBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const noTrailing = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
  return noTrailing
}

export function isValidGatewayBaseUrl(value: string): boolean {
  if (!value) return false
  return /^https?:\/\/[^\s]+$/.test(value)
}

/** Допустимые уровни логирования */
export const LOG_LEVELS = ['Debug', 'Info', 'Warn', 'Error', 'Disable'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && LOG_LEVELS.includes(value as LogLevel)
}

export function parseLogsLimit(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value)
  }
  const n = typeof value === 'string' ? parseInt(value, 10) : NaN
  return !isNaN(n) && n > 0 ? n : 100
}

/** getSetting не логирует через writeServerLog — вызывается из logger.lib (getLogLevel, getLogWebhook), рекурсия. */
export async function getSetting(ctx: app.Ctx, key: string): Promise<unknown> {
  const row = await repo.findByKey(ctx, key)
  if (row && row.value !== undefined && row.value !== null) {
    return row.value
  }
  return (DEFAULTS as Record<string, unknown>)[key] ?? null
}

/**
 * Получить настройку как строку.
 */
export async function getSettingString(ctx: app.Ctx, key: string): Promise<string> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getSettingString entry`,
    payload: { key }
  })
  const value = await getSetting(ctx, key)
  const result =
    typeof value === 'string' ? value : String((DEFAULTS as Record<string, unknown>)[key] ?? '')
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getSettingString exit`,
    payload: { key, value, result }
  })
  return result
}

/** getLogLevel не логирует через writeServerLog — вызывается из logger.lib, рекурсия. */
export async function getLogLevel(ctx: app.Ctx): Promise<LogLevel> {
  const value = await getSetting(ctx, SETTING_KEYS.LOG_LEVEL)
  return isLogLevel(value) ? value : (DEFAULTS[SETTING_KEYS.LOG_LEVEL] as LogLevel)
}

/**
 * Получить лимит логов (число).
 */
export async function getLogsLimit(ctx: app.Ctx): Promise<number> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getLogsLimit entry`,
    payload: {}
  })
  const value = await getSetting(ctx, SETTING_KEYS.LOGS_LIMIT)
  const result = parseLogsLimit(value)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getLogsLimit exit`,
    payload: { value, result }
  })
  return result
}

function isLogWebhook(value: unknown): value is LogWebhookSetting {
  if (typeof value !== 'object' || value === null) return false
  const o = value as Record<string, unknown>
  return typeof o.enable === 'boolean' && typeof o.url === 'string'
}

/** getLogWebhook не логирует через writeServerLog — вызывается из logger.lib, рекурсия. */
export async function getLogWebhook(ctx: app.Ctx): Promise<LogWebhookSetting> {
  const value = await getSetting(ctx, SETTING_KEYS.LOG_WEBHOOK)
  return isLogWebhook(value) ? value : DEFAULTS[SETTING_KEYS.LOG_WEBHOOK]
}

/**
 * Получить таймштамп сброса дашборда (Unix ms). При отсутствии — 0 (учитываются все логи).
 */
export async function getDashboardResetAt(ctx: app.Ctx): Promise<number> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getDashboardResetAt entry`,
    payload: {}
  })
  const value = await getSetting(ctx, SETTING_KEYS.DASHBOARD_RESET_AT)
  const result =
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getDashboardResetAt exit`,
    payload: { value, result }
  })
  return result
}

/**
 * Получить глобальный фильтр панели по дате/времени. При отсутствии или невалидных
 * данных возвращает `{}` (фильтр не задан). Гарантирует только валидные границы.
 */
export async function getPanelDateFilter(ctx: app.Ctx): Promise<DateFilter> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getPanelDateFilter entry`,
    payload: {}
  })
  const value = await getSetting(ctx, SETTING_KEYS.PANEL_DATE_FILTER)
  const result = isValidDateFilter(value) ? normalizeDateFilter(value) : {}
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getPanelDateFilter exit`,
    payload: { from: result.from ?? null, to: result.to ?? null }
  })
  return result
}

/**
 * Получить все настройки в виде объекта ключ-значение (с дефолтами).
 */
export async function getAllSettings(ctx: app.Ctx): Promise<Record<string, unknown>> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getAllSettings entry`,
    payload: {}
  })
  const rows = await repo.findAll(ctx)
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getAllSettings repo.findAll result`,
    payload: { rowsCount: rows.length, keys: rows.map((r) => r.key) }
  })
  const result = { ...DEFAULTS } as Record<string, unknown>
  for (const row of rows) {
    if (row.key && row.value !== undefined && row.value !== null) {
      result[row.key] = row.value
    }
  }
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] getAllSettings exit`,
    payload: { resultKeys: Object.keys(result) }
  })
  return result
}

/**
 * Получить значение настройки LifePay как trim-строку (или пустую строку).
 * Не логирует значение (секреты не должны попадать в payload).
 */
async function getStringSettingRaw(ctx: app.Ctx, key: string): Promise<string> {
  const value = await getSetting(ctx, key)
  return typeof value === 'string' ? value.trim() : ''
}

/** Получить lp_apikey без логирования значения (только наличие). */
export async function getLpApikey(ctx: app.Ctx): Promise<string> {
  return getStringSettingRaw(ctx, SETTING_KEYS.LP_APIKEY)
}

/** Получить lp_login. */
export async function getLpLogin(ctx: app.Ctx): Promise<string> {
  return getStringSettingRaw(ctx, SETTING_KEYS.LP_LOGIN)
}

/** Получить lp_webhook_token без логирования значения. */
export async function getLpWebhookToken(ctx: app.Ctx): Promise<string> {
  return getStringSettingRaw(ctx, SETTING_KEYS.LP_WEBHOOK_TOKEN)
}

/** Получить gateway_base_url. */
export async function getGatewayBaseUrl(ctx: app.Ctx): Promise<string> {
  return getStringSettingRaw(ctx, SETTING_KEYS.GATEWAY_BASE_URL)
}

/**
 * Сгенерировать случайный webhook-токен длиной ≥ 32 hex-символа.
 * Используется Math.random (платформа Chatium; crypto не везде доступен в Node-runtime).
 */
export function generateWebhookToken(byteCount: number = 32): string {
  const chars = 'abcdef0123456789'
  let result = ''
  // 2 hex-символа на байт
  const totalChars = Math.max(byteCount * 2, LP_WEBHOOK_TOKEN_MIN_LENGTH)
  for (let i = 0; i < totalChars; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// setSetting вынесен в settings.mutations.ts (декомпозиция под /check).
// Re-export сохраняет публичный API: `import { setSetting } from './settings.lib'`
// и `settingsLib.setSetting(...)` через `import * as settingsLib from './settings.lib'`.
export { setSetting } from './settings.mutations'
