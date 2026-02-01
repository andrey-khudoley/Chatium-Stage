// @shared
/**
 * Логгер для браузера. Использует window.__BOOT__.logLevel (задаётся при серверной генерации).
 * Уровни — по стандарту syslog (RFC 5424): 0 Emergency … 7 Debug.
 * Логирует через console только если severity сообщения не строже настроенного порога.
 * Не импортирует lib — только клиентский код.
 */

/** Уровни строгости syslog (RFC 5424), 0 = самая высокая */
export const SYSLOG_SEVERITY = {
  Emergency: 0,
  Alert: 1,
  Critical: 2,
  Error: 3,
  Warning: 4,
  Notice: 5,
  Informational: 6,
  Debug: 7
} as const

export type SyslogSeverityName = keyof typeof SYSLOG_SEVERITY

/** Допустимые значения настройки (совпадают с lib/settings.lib) */
const CONFIG_LEVELS = ['Info', 'Warn', 'Error', 'Disable'] as const
type ConfigLevelName = (typeof CONFIG_LEVELS)[number]

/**
 * Порог по строгости syslog для каждой настройки:
 * показываем сообщения с severity <= порога (меньше число — строже).
 */
const CONFIG_TO_MAX_SEVERITY: Record<ConfigLevelName, number> = {
  Disable: -1,
  Error: 3,
  Warn: 4,
  Info: 7
}

function getBootLogLevel(): ConfigLevelName {
  if (typeof window === 'undefined') return 'Info'
  const boot = window.__BOOT__
  const raw = boot?.logLevel
  if (typeof raw === 'string' && CONFIG_LEVELS.includes(raw as ConfigLevelName)) {
    return raw as ConfigLevelName
  }
  return 'Info'
}

/**
 * Нужно ли выводить сообщение данного уровня syslog.
 * Логируем, когда настройка не Disable и severity сообщения не строже порога.
 */
export function shouldLog(severity: number): boolean {
  const config = getBootLogLevel()
  const maxSeverity = CONFIG_TO_MAX_SEVERITY[config]
  if (maxSeverity < 0) return false
  return severity >= 0 && severity <= maxSeverity
}

export function logEmergency(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Emergency)) console.error('[Emergency]', ...args)
}

export function logAlert(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Alert)) console.error('[Alert]', ...args)
}

export function logCritical(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Critical)) console.error('[Critical]', ...args)
}

export function logError(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Error)) console.error(...args)
}

export function logWarning(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Warning)) console.warn(...args)
}

export function logNotice(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Notice)) console.log('[Notice]', ...args)
}

export function logInfo(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Informational)) console.log(...args)
}

export function logDebug(...args: unknown[]): void {
  if (shouldLog(SYSLOG_SEVERITY.Debug)) console.log('[Debug]', ...args)
}

/** Обратная совместимость: logWarn = logWarning */
export const logWarn = logWarning
