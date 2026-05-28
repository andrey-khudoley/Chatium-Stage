import * as repo from '../repos/settings.repo'
import * as loggerLib from './logger.lib'
import {
  SETTING_KEYS,
  LOG_LEVELS,
  LP_WEBHOOK_TOKEN_MIN_LENGTH,
  LAVA_WEBHOOK_SECRET_MIN_LENGTH,
  isLogLevel,
  parseLogsLimit,
  isValidLpLogin,
  normalizeGatewayBaseUrl,
  isValidGatewayBaseUrl,
  normalizeLavaBaseUrl,
  isValidLavaBaseUrl,
  isValidDateFilter,
  normalizeDateFilter
} from './settings.lib'

const LOG_MODULE = 'lib/settings.mutations'

/**
 * Сохранить настройку. Валидирует значение для известных ключей.
 *
 * Вынесено из settings.lib.ts (декомпозиция под /check). Публичный API
 * сохранён через re-export `setSetting` из settings.lib.ts.
 */
export async function setSetting(ctx: app.Ctx, key: string, value: unknown): Promise<void> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] setSetting entry`,
    payload: { key, value }
  })
  let normalized: unknown = value

  if (key === SETTING_KEYS.LOG_LEVEL) {
    const str = typeof value === 'string' ? value : String(value)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LOG_LEVEL branch`,
      payload: { str, isLogLevel: isLogLevel(str) }
    })
    if (!isLogLevel(str)) {
      throw new Error(
        `Недопустимый уровень логирования: ${str}. Допустимо: ${LOG_LEVELS.join(', ')}`
      )
    }
    normalized = str
  } else if (key === SETTING_KEYS.LOGS_LIMIT) {
    const n = parseLogsLimit(value)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LOGS_LIMIT branch`,
      payload: { n, value }
    })
    if (n < 1 || n > 10000) {
      throw new Error(`Лимит логов должен быть от 1 до 10000, получено: ${value}`)
    }
    normalized = String(n)
  } else if (key === SETTING_KEYS.PROJECT_NAME || key === SETTING_KEYS.PROJECT_TITLE) {
    normalized = typeof value === 'string' ? value.trim() : String(value)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting PROJECT_NAME/PROJECT_TITLE branch`,
      payload: { normalized }
    })
  } else if (key === SETTING_KEYS.LOG_WEBHOOK) {
    if (typeof value !== 'object' || value === null) {
      throw new Error('log_webhook должен быть объектом { enable: boolean, url: string }')
    }
    const o = value as Record<string, unknown>
    normalized = {
      enable: typeof o.enable === 'boolean' ? o.enable : false,
      url: typeof o.url === 'string' ? o.url : ''
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LOG_WEBHOOK branch`,
      payload: { normalized }
    })
  } else if (key === SETTING_KEYS.DASHBOARD_RESET_AT) {
    const n = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(n) || n < 0) {
      throw new Error('dashboard_reset_at должен быть неотрицательным числом (Unix ms)')
    }
    normalized = Math.floor(n)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting DASHBOARD_RESET_AT branch`,
      payload: { normalized }
    })
  } else if (key === SETTING_KEYS.LP_APIKEY) {
    const str = typeof value === 'string' ? value.trim() : ''
    if (!str) {
      throw new Error('lp_apikey не может быть пустым')
    }
    normalized = str
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LP_APIKEY branch (length only, value redacted)`,
      payload: { keyLength: str.length }
    })
  } else if (key === SETTING_KEYS.LP_LOGIN) {
    const str = typeof value === 'string' ? value.trim() : ''
    if (!isValidLpLogin(str)) {
      throw new Error(
        'lp_login должен быть номером телефона в формате 7XXXXXXXXXX (11 цифр, начинается с 7).'
      )
    }
    normalized = str
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LP_LOGIN branch (masked)`,
      payload: { loginMask: `+${str.slice(0, 4)}***${str.slice(-4)}` }
    })
  } else if (key === SETTING_KEYS.LP_WEBHOOK_TOKEN) {
    const str = typeof value === 'string' ? value.trim() : ''
    if (str.length < LP_WEBHOOK_TOKEN_MIN_LENGTH) {
      throw new Error(
        `lp_webhook_token должен содержать не менее ${LP_WEBHOOK_TOKEN_MIN_LENGTH} символов`
      )
    }
    normalized = str
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LP_WEBHOOK_TOKEN branch (length only, value redacted)`,
      payload: { tokenLength: str.length }
    })
  } else if (key === SETTING_KEYS.GATEWAY_BASE_URL) {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    const normalizedUrl = normalizeGatewayBaseUrl(trimmed)
    if (!isValidGatewayBaseUrl(normalizedUrl)) {
      throw new Error('gateway_base_url должен начинаться с http:// или https:// и быть непустым')
    }
    normalized = normalizedUrl
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting GATEWAY_BASE_URL branch`,
      payload: { normalized: normalizedUrl }
    })
  } else if (key === SETTING_KEYS.LAVA_TEST_APIKEY) {
    const str = typeof value === 'string' ? value.trim() : ''
    if (!str) {
      throw new Error('lava_test_apikey не может быть пустым')
    }
    normalized = str
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LAVA_TEST_APIKEY branch (length only, value redacted)`,
      payload: { keyLength: str.length }
    })
  } else if (key === SETTING_KEYS.LAVA_BASE_URL) {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    // Пустой ввод → дефолт `https://gate.lava.top` (паттерн lavatop gateway).
    const candidate = trimmed || 'https://gate.lava.top'
    const normalizedUrl = normalizeLavaBaseUrl(candidate)
    if (!isValidLavaBaseUrl(normalizedUrl)) {
      throw new Error('lava_base_url должен начинаться с http:// или https:// и быть непустым')
    }
    normalized = normalizedUrl
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LAVA_BASE_URL branch`,
      payload: { normalized: normalizedUrl }
    })
  } else if (key === SETTING_KEYS.LAVA_WEBHOOK_SECRET) {
    const str = typeof value === 'string' ? value.trim() : ''
    if (str.length < LAVA_WEBHOOK_SECRET_MIN_LENGTH) {
      throw new Error(
        `lava_webhook_secret должен содержать не менее ${LAVA_WEBHOOK_SECRET_MIN_LENGTH} символов`
      )
    }
    normalized = str
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting LAVA_WEBHOOK_SECRET branch (length only, value redacted)`,
      payload: { secretLength: str.length }
    })
  } else if (key === SETTING_KEYS.PANEL_DATE_FILTER) {
    if (!isValidDateFilter(value)) {
      throw new Error(
        'panel_date_filter должен быть объектом { from?: number > 0, to?: number > 0 }, при обеих границах from <= to'
      )
    }
    normalized = normalizeDateFilter(value)
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_MODULE}] setSetting PANEL_DATE_FILTER branch`,
      payload: { normalized }
    })
  }

  await repo.upsert(ctx, key, normalized)
  // Маскировка значений-секретов в exit-логе:
  const exitNormalized =
    key === SETTING_KEYS.LP_APIKEY ||
    key === SETTING_KEYS.LP_WEBHOOK_TOKEN ||
    key === SETTING_KEYS.LAVA_TEST_APIKEY ||
    key === SETTING_KEYS.LAVA_WEBHOOK_SECRET
      ? '***'
      : key === SETTING_KEYS.LP_LOGIN && typeof normalized === 'string' && normalized.length === 11
        ? `+${normalized.slice(0, 4)}***${normalized.slice(-4)}`
        : normalized
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] setSetting exit`,
    payload: { key, normalized: exitNormalized }
  })
}
