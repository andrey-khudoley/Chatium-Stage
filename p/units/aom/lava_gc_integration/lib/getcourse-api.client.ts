import { request } from '@app/request'
import * as loggerLib from './logger.lib'
import * as settingsLib from './settings.lib'

const LOG_MODULE = 'lib/getcourse-api.client'

/** Node.js Buffer (опционально в globalThis; без @types/node). */
type OptionalGlobalBuffer = {
  from(data: string, encoding: 'utf8'): { toString(encoding: 'base64'): string }
}

/**
 * Кодирование строки в Base64 (полностью самодостаточная реализация).
 * Работает в любой среде: Node.js, браузер, изолированный sandbox.
 * Сначала пытается использовать нативные методы (Buffer/btoa), затем fallback на ручную реализацию.
 */
function encodeBase64(str: string): string {
  // Попытка использовать нативные методы (оптимизация производительности)
  const nodeBuffer = (globalThis as { Buffer?: OptionalGlobalBuffer }).Buffer
  if (nodeBuffer) {
    return nodeBuffer.from(str, 'utf8').toString('base64')
  }
  if (typeof btoa !== 'undefined') {
    return btoa(unescape(encodeURIComponent(str)))
  }

  // Полностью ручная реализация Base64 для изолированных сред
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

  // Шаг 1: Преобразование строки в UTF-8 байты
  const utf8Bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i)

    if (charCode < 0x80) {
      // 1-байтовый символ (ASCII: 0x00-0x7F)
      utf8Bytes.push(charCode)
    } else if (charCode < 0x800) {
      // 2-байтовый символ (0x80-0x7FF)
      utf8Bytes.push(0xc0 | (charCode >> 6))
      utf8Bytes.push(0x80 | (charCode & 0x3f))
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      // 3-байтовый символ (0x800-0xFFFF, без суррогатных пар)
      utf8Bytes.push(0xe0 | (charCode >> 12))
      utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f))
      utf8Bytes.push(0x80 | (charCode & 0x3f))
    } else {
      // Суррогатная пара (4-байтовый символ Unicode: 0x10000-0x10FFFF)
      i++
      const surrogate = 0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff))
      utf8Bytes.push(0xf0 | (surrogate >> 18))
      utf8Bytes.push(0x80 | ((surrogate >> 12) & 0x3f))
      utf8Bytes.push(0x80 | ((surrogate >> 6) & 0x3f))
      utf8Bytes.push(0x80 | (surrogate & 0x3f))
    }
  }

  // Шаг 2: Кодирование байтов в Base64
  let result = ''
  for (let i = 0; i < utf8Bytes.length; i += 3) {
    const byte1 = utf8Bytes[i]
    const byte2 = i + 1 < utf8Bytes.length ? utf8Bytes[i + 1] : 0
    const byte3 = i + 2 < utf8Bytes.length ? utf8Bytes[i + 2] : 0

    // Группа из 3 байтов → 4 символа Base64
    const enc1 = byte1 >> 2
    const enc2 = ((byte1 & 0x3) << 4) | (byte2 >> 4)
    const enc3 = ((byte2 & 0xf) << 2) | (byte3 >> 6)
    const enc4 = byte3 & 0x3f

    result += base64Chars[enc1] + base64Chars[enc2]
    result += i + 1 < utf8Bytes.length ? base64Chars[enc3] : '='
    result += i + 2 < utf8Bytes.length ? base64Chars[enc4] : '='
  }

  return result
}

/** Убирает протокол и хвостовой слэш; домен хранится как `school.getcourse.ru` или полный host. */
export function normalizeGcAccountDomain(raw: string): string {
  let s = raw.trim()
  if (!s) return ''
  s = s.replace(/^https?:\/\//i, '')
  const slash = s.indexOf('/')
  if (slash >= 0) s = s.slice(0, slash)
  return s.replace(/\/+$/, '')
}

function jsonForLog(value: unknown, maxLen = 12000): string {
  try {
    const str = JSON.stringify(value)
    if (str.length <= maxLen) return str
    return `${str.slice(0, maxLen)}… [truncated]`
  } catch {
    return String(value)
  }
}

export type UpdateDealStatusParams = {
  gcOrderId: string
  buyerEmail: string
  dealStatus: string
  paymentStatus?: string
  dealIsPaid?: number
}

/**
 * Разбор ответа PL API: верхний `success`, вложенный `result.success` / `result.error`
 * (HTTP 200 при ошибке в теле — норма для GetCourse).
 */
function parseGcDealsResponse(body: unknown): { ok: boolean; detail: string } {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, detail: 'invalid_body' }
  }
  const b = body as Record<string, unknown>
  const topOk = b.success === true || b.success === 'true'
  if (!topOk) {
    return { ok: false, detail: `success=${String(b.success)}` }
  }
  const result = b.result
  if (typeof result !== 'object' || result === null) {
    return { ok: true, detail: 'top_only' }
  }
  const r = result as Record<string, unknown>
  if (r.error === true || r.error === 'true') {
    const msg = r.error_message != null ? String(r.error_message) : 'result.error'
    return { ok: false, detail: msg }
  }
  const innerOk = r.success === true || r.success === 'true'
  if (!innerOk) {
    const msg = r.error_message != null ? String(r.error_message) : 'result.success_false'
    return { ok: false, detail: msg }
  }
  return { ok: true, detail: 'ok' }
}

function responseSuggestsInvalidApiKey(body: unknown): boolean {
  const raw = JSON.stringify(body ?? '').toLowerCase()
  if (raw.includes('неверный') && raw.includes('ключ')) return true
  if (raw.includes('invalid') && raw.includes('key')) return true
  if (raw.includes('wrong') && (raw.includes('key') || raw.includes('api'))) return true
  if (raw.includes('bad') && raw.includes('key')) return true
  if (raw.includes('ошибка авторизации')) return true
  if (raw.includes('access denied')) return true
  if (raw.includes('доступ запрещ')) return true
  return false
}

function responseSuggestsKeyAcceptedBusinessError(body: unknown): boolean {
  const raw = JSON.stringify(body ?? '').toLowerCase()
  if (raw.includes('не найден') || raw.includes('not found')) return true
  if (raw.includes('сделк') || raw.includes('deal') || raw.includes('заказ') || raw.includes('order'))
    return true
  if (raw.includes('user') && (raw.includes('email') || raw.includes('пользоват'))) return true
  return false
}

/** Типичный отказ PL API в `result` при HTTP 200 (не сбой сети/транспорта). */
function isGcPlApiBusinessRejection(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  if (b.success !== true && b.success !== 'true') return false
  const result = b.result
  if (typeof result !== 'object' || result === null) return false
  const r = result as Record<string, unknown>
  if (r.error === true || r.error === 'true') return true
  const innerOk = r.success === true || r.success === 'true'
  return !innerOk
}

export type VerifyGcPlApiParams = { apiKey: string; domain: string }

/**
 * Проверка ключа и домена: POST `pl/api/deals` с заведомо несуществующим `deal_number`.
 * При валидном ключе GetCourse обычно отвечает бизнес-ошибкой по сделке; при неверном ключе — отказом авторизации.
 */
export async function verifyGcPlApiAccess(
  ctx: app.Ctx,
  params: VerifyGcPlApiParams
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const apiKey = params.apiKey.trim()
  const domain = normalizeGcAccountDomain(params.domain)
  if (!apiKey || !domain) {
    return { ok: false, message: 'Укажите ключ API и домен аккаунта (например school.getcourse.ru).' }
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] verifyGcPlApiAccess: запрос`,
    payload: { host: domain, hasKey: true }
  })

  const paramsObj = {
    user: { email: 'chatium-pl-verify@invalid.local' },
    deal: {
      deal_number: `__chatium_verify_${Date.now()}__`,
      deal_status: 'false'
    }
  }
  const paramsBase64 = encodeBase64(JSON.stringify(paramsObj))
  const url = `https://${domain}/pl/api/deals`

  let response: { statusCode?: number; body?: unknown }
  try {
    response = await request({
      url,
      method: 'post',
      form: {
        action: 'add',
        key: apiKey,
        params: paramsBase64
      },
      responseType: 'json',
      throwHttpErrors: false,
      timeout: 15000
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] verifyGcPlApiAccess: сеть`,
      payload: { error: msg }
    })
    return {
      ok: false,
      message: `Не удалось достучаться до ${domain}: ${msg}`
    }
  }

  const statusOk =
    typeof response.statusCode === 'number' && response.statusCode >= 200 && response.statusCode < 300
  if (!statusOk) {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] verifyGcPlApiAccess: HTTP`,
      payload: { statusCode: response.statusCode }
    })
    return {
      ok: false,
      message: `GetCourse ответил HTTP ${String(response.statusCode)}. Проверьте домен аккаунта.`
    }
  }

  const body = response.body
  if (typeof body !== 'object' || body === null) {
    return {
      ok: false,
      message: 'Ответ GetCourse не JSON — проверьте домен (должен открываться PL API по HTTPS).'
    }
  }

  if (responseSuggestsInvalidApiKey(body)) {
    return { ok: false, message: 'Ключ API отклонён GetCourse или недостаточно прав.' }
  }

  const parsed = parseGcDealsResponse(body)
  if (parsed.ok) {
    return { ok: true, message: 'Подключение к GetCourse успешно.' }
  }

  if (responseSuggestsKeyAcceptedBusinessError(body)) {
    return {
      ok: true,
      message: 'Ключ принят (тестовая сделка отклонена — для проверки ключа это ожидаемо).'
    }
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] verifyGcPlApiAccess: неоднозначный ответ`,
    payload: { detail: parsed.detail }
  })

  return {
    ok: false,
    message:
      'Не удалось однозначно проверить ключ. Убедитесь, что домен и ключ скопированы из настроек GetCourse.'
  }
}

/**
 * POST `https://{domain}/pl/api/deals` — обновление заказа (deal_status, опционально оплата).
 * Ошибки только логируются; исключения не бросаются (вызов из webhook не должен падать).
 */
export async function updateDealStatus(ctx: app.Ctx, params: UpdateDealStatusParams): Promise<void> {
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] updateDealStatus: вход`,
    payload: {
      gcOrderId: params.gcOrderId,
      dealStatus: params.dealStatus,
      dealIsPaid: params.dealIsPaid
    }
  })

  const apiKey = (await settingsLib.getGcApiKey(ctx)).trim()
  const domain = normalizeGcAccountDomain(await settingsLib.getGcAccountDomain(ctx))

  if (!apiKey || !domain) {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] updateDealStatus: пропуск — нет ключа или домена`,
      payload: { gcOrderId: params.gcOrderId, hasKey: Boolean(apiKey), hasDomain: Boolean(domain) }
    })
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] updateDealStatus: не заданы gc_api_key или gc_account_domain`,
      payload: { gcOrderId: params.gcOrderId, hasKey: Boolean(apiKey), domain }
    })
    return
  }

  const deal: Record<string, unknown> = {
    deal_number: params.gcOrderId,
    deal_status: params.dealStatus
  }
  if (params.paymentStatus !== undefined) {
    deal.payment_status = params.paymentStatus
  }
  if (params.dealIsPaid !== undefined) {
    deal.deal_is_paid = params.dealIsPaid
  }

  const paramsObj = {
    user: { email: params.buyerEmail },
    deal
  }

  const paramsBase64 = encodeBase64(JSON.stringify(paramsObj))
  const url = `https://${domain}/pl/api/deals`

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] updateDealStatus: HTTP POST pl/api/deals`,
    payload: {
      gcOrderId: params.gcOrderId,
      host: domain,
      paramsLen: paramsBase64.length
    }
  })

  const response = await request({
    url,
    method: 'post',
    form: {
      action: 'add',
      key: apiKey,
      params: paramsBase64
    },
    responseType: 'json',
    throwHttpErrors: false,
    timeout: 15000
  })

  const statusOk =
    typeof response.statusCode === 'number' && response.statusCode >= 200 && response.statusCode < 300
  const parsed = parseGcDealsResponse(response.body)

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] updateDealStatus: ответ GetCourse`,
    payload: {
      gcOrderId: params.gcOrderId,
      statusCode: response.statusCode,
      statusOk,
      parseOk: parsed.ok,
      parseDetail: parsed.detail
    }
  })

  if (!statusOk || !parsed.ok) {
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] updateDealStatus: ветка ошибки (HTTP или тело)`,
      payload: { gcOrderId: params.gcOrderId, statusOk, parseOk: parsed.ok }
    })
    const businessRejection = statusOk && !parsed.ok && isGcPlApiBusinessRejection(response.body)
    await loggerLib.writeServerLog(ctx, {
      severity: businessRejection ? 6 : 3,
      message: businessRejection
        ? `[${LOG_MODULE}] updateDealStatus: отказ PL API по заказу (бизнес-ответ, HTTP ${String(response.statusCode)})`
        : `[${LOG_MODULE}] updateDealStatus: ошибка GetCourse PL API (транспорт или неожиданный ответ)`,
      payload: {
        gcOrderId: params.gcOrderId,
        url,
        statusCode: response.statusCode,
        parse: parsed.detail,
        body: jsonForLog(response.body)
      }
    })
    return
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] updateDealStatus: трассировка — сделка обновлена в PL API`,
    payload: { gcOrderId: params.gcOrderId, dealStatus: params.dealStatus }
  })

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] updateDealStatus: успех`,
    payload: {
      gcOrderId: params.gcOrderId,
      dealStatus: params.dealStatus
    }
  })
}

export type ProbeGcOrderPlApiResult = {
  httpOk: boolean
  statusCode?: number
  /** Успех по полям `success` / `result` в JSON GetCourse (как в `parseGcDealsResponse`). */
  plApiLogicalSuccess: boolean
  parseDetail: string
  message: string
  /** Нет `gc_api_key` / домена в настройках — запрос к GetCourse не отправлялся. */
  skippedCredentials: boolean
}

/**
 * Диагностический вызов PL API для существующего заказа: `deal_number` + email покупателя +
 * `deal_status: payment_waiting`. Может изменить статус заказа в GetCourse — использовать только на тестовых заказах.
 */
export async function probeGcOrderPlApi(
  ctx: app.Ctx,
  params: { gcOrderId: string; buyerEmail: string }
): Promise<ProbeGcOrderPlApiResult> {
  const gcOrderId = params.gcOrderId.trim()
  const buyerEmail = params.buyerEmail.trim()

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] probeGcOrderPlApi: вход`,
    payload: { gcOrderId, hasEmail: Boolean(buyerEmail) }
  })

  const apiKey = (await settingsLib.getGcApiKey(ctx)).trim()
  const domain = normalizeGcAccountDomain(await settingsLib.getGcAccountDomain(ctx))

  if (!apiKey || !domain) {
    return {
      httpOk: false,
      plApiLogicalSuccess: false,
      parseDetail: 'no_credentials',
      message: 'Задайте gc_api_key и gc_account_domain в настройках.',
      skippedCredentials: true
    }
  }

  const paramsObj = {
    user: { email: buyerEmail },
    deal: {
      deal_number: gcOrderId,
      deal_status: 'payment_waiting'
    }
  }

  const paramsBase64 = encodeBase64(JSON.stringify(paramsObj))
  const url = `https://${domain}/pl/api/deals`

  let response: { statusCode?: number; body?: unknown }
  try {
    response = await request({
      url,
      method: 'post',
      form: {
        action: 'add',
        key: apiKey,
        params: paramsBase64
      },
      responseType: 'json',
      throwHttpErrors: false,
      timeout: 15000
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] probeGcOrderPlApi: сеть`,
      payload: { error: msg }
    })
    return {
      httpOk: false,
      plApiLogicalSuccess: false,
      parseDetail: 'network',
      message: `Сеть: ${msg}`,
      skippedCredentials: false
    }
  }

  const statusOk =
    typeof response.statusCode === 'number' && response.statusCode >= 200 && response.statusCode < 300
  const parsed = parseGcDealsResponse(response.body)

  await loggerLib.writeServerLog(ctx, {
    severity: parsed.ok ? 6 : 4,
    message: `[${LOG_MODULE}] probeGcOrderPlApi: ответ`,
    payload: {
      gcOrderId,
      statusCode: response.statusCode,
      parseOk: parsed.ok,
      parseDetail: parsed.detail
    }
  })

  const message = parsed.ok
    ? 'GetCourse принял запрос (deal_status=payment_waiting).'
    : `Ответ PL API: ${parsed.detail}`

  return {
    httpOk: statusOk,
    statusCode: response.statusCode,
    plApiLogicalSuccess: parsed.ok,
    parseDetail: parsed.detail,
    message,
    skippedCredentials: false
  }
}
