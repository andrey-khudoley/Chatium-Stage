/**
 * Клиент исходящих вызовов к payments-gateway (implementation-plan §1.8.2).
 *
 * Один входящий `POST /api/lp/invoke` → ровно один исходящий вызов через `@app/request`.
 * Серверные ретраи запрещены (зеркало §8.6, §12.4 gateway-manual).
 * Секреты (`apikey`, `login`) подставляются в заголовки `X-Lp-Apikey`, `X-Lp-Login`.
 * `requestId` берётся из ответа gateway (`X-Gateway-Request-Id`), не генерируется заново.
 */

import { request } from '@app/request'

import { INVOKE_TIMEOUT_MS } from './constants'
import { buildInvokeUrl } from './buildInvokeUrl'
import * as settingsLib from '../settings.lib'
import * as loggerLib from '../logger.lib'
import { X_LP_APIKEY, X_LP_LOGIN, X_GATEWAY_REQUEST_ID } from '../../shared/gatewayContract'
import { INVOKE_PROXY_ERROR_CODES } from '../../shared/invokeApi'

const LOG_MODULE = 'lib/gateway/invokeClient'

export type InvokeResult = {
  httpStatus: number
  ok: boolean
  requestId: string
  /** Тело ответа gateway (распарсенный JSON). */
  responseBody: Record<string, unknown> | null
  /** Сырой текст тела ответа (для проксирования клиенту без изменений). */
  rawResponseBody: string
  /** Заголовок Content-Type ответа gateway. */
  responseContentType: string
  /** Длительность исходящего вызова, мс. */
  durationMs: number
  /** Локальная ошибка прокладки (settings_missing, op_unknown, network_error...) — пустая, если запрос ушёл и ответ распарсен. */
  proxyError: string
}

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { name?: unknown; code?: unknown; message?: unknown }
  if (typeof e.name === 'string' && /timeout/i.test(e.name)) return true
  if (typeof e.code === 'string' && /timeout|ETIMEDOUT/i.test(e.code)) return true
  if (typeof e.message === 'string' && /timeout|timed out/i.test(e.message)) return true
  return false
}

function readResponseRequestId(
  headers: unknown,
  parsedBody: Record<string, unknown> | null
): string {
  if (headers && typeof headers === 'object') {
    const h = headers as Record<string, unknown>
    for (const key of Object.keys(h)) {
      if (key.toLowerCase() === X_GATEWAY_REQUEST_ID.toLowerCase()) {
        const v = h[key]
        if (typeof v === 'string' && v.trim() !== '') return v
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0]
      }
    }
  }
  if (parsedBody && typeof parsedBody === 'object') {
    const rid = (parsedBody as Record<string, unknown>).requestId
    if (typeof rid === 'string' && rid.trim() !== '') return rid
  }
  return ''
}

function readContentType(headers: unknown): string {
  if (headers && typeof headers === 'object') {
    const h = headers as Record<string, unknown>
    for (const key of Object.keys(h)) {
      if (key.toLowerCase() === 'content-type') {
        const v = h[key]
        if (typeof v === 'string') return v
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0]
      }
    }
  }
  return 'application/json'
}

/**
 * Локальный результат-ошибка прокладки до фактического сетевого запроса
 * (settings_missing / op_unknown). HTTP-статус — 503 / 400.
 */
function buildProxyErrorResult(
  code: string,
  httpStatus: number,
  message: string,
  durationMs: number
): InvokeResult {
  const body = {
    ok: false,
    error: { code, message },
    requestId: null
  }
  const rawBody = JSON.stringify(body)
  return {
    httpStatus,
    ok: false,
    requestId: '',
    responseBody: body,
    rawResponseBody: rawBody,
    responseContentType: 'application/json',
    durationMs,
    proxyError: code
  }
}

/**
 * Выполнить вызов payments-gateway: <gateway_base_url>/api/v1/<op>.
 * Секреты подставляются в заголовки X-Lp-Apikey / X-Lp-Login.
 */
export async function invokeGateway(
  ctx: app.Ctx,
  op: string,
  args: Record<string, unknown>
): Promise<InvokeResult> {
  const start = Date.now()

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] invokeGateway entry`,
    payload: { op, argsKeys: Object.keys(args) }
  })

  const apikey = await settingsLib.getLpApikey(ctx)
  const login = await settingsLib.getLpLogin(ctx)
  const baseUrl = await settingsLib.getGatewayBaseUrl(ctx)

  if (!apikey || !login || !baseUrl) {
    const durationMs = Date.now() - start
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_MODULE}] settings_missing`,
      payload: {
        op,
        apikeyEmpty: !apikey,
        loginEmpty: !login,
        baseUrlEmpty: !baseUrl
      }
    })
    return buildProxyErrorResult(
      INVOKE_PROXY_ERROR_CODES.SETTINGS_MISSING,
      503,
      'Настройки LifePay не заполнены (lp_apikey / lp_login / gateway_base_url). Откройте админку проекта.',
      durationMs
    )
  }

  const urlBuild = buildInvokeUrl(baseUrl, op)
  if (urlBuild.kind === 'op_unknown') {
    const durationMs = Date.now() - start
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_MODULE}] op_unknown`,
      payload: { op }
    })
    return buildProxyErrorResult(
      INVOKE_PROXY_ERROR_CODES.OP_UNKNOWN,
      400,
      'Операция не найдена в локальном каталоге клиентской прокладки.',
      durationMs
    )
  }
  if (urlBuild.kind === 'base_url_invalid') {
    const durationMs = Date.now() - start
    return buildProxyErrorResult(
      INVOKE_PROXY_ERROR_CODES.SETTINGS_MISSING,
      503,
      'gateway_base_url пуст или некорректен.',
      durationMs
    )
  }

  const { url, method } = urlBuild

  // Заголовки общие для GET/POST. Content-Type только для POST.
  const headers: Record<string, string> = {
    [X_LP_APIKEY]: apikey,
    [X_LP_LOGIN]: login
  }
  if (method === 'POST') {
    headers['Content-Type'] = 'application/json; charset=utf-8'
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] gateway_request_init`,
    payload: { op, method, url, apikeyLength: apikey.length }
  })

  let response: { statusCode: number; body: unknown; headers?: unknown }
  try {
    if (method === 'POST') {
      response = await request({
        url,
        method: 'post',
        headers,
        json: args,
        responseType: 'text',
        throwHttpErrors: false,
        timeout: INVOKE_TIMEOUT_MS
      })
    } else {
      // GET: args идёт в query.
      const searchParams: Record<string, string> = {}
      for (const [k, v] of Object.entries(args)) {
        if (v === undefined || v === null) continue
        searchParams[k] =
          typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
            ? String(v)
            : JSON.stringify(v)
      }
      response = await request({
        url,
        method: 'get',
        headers,
        searchParams,
        responseType: 'text',
        throwHttpErrors: false,
        timeout: INVOKE_TIMEOUT_MS
      })
    }
  } catch (error) {
    const durationMs = Date.now() - start
    const timeout = isTimeoutError(error)
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] gateway_${timeout ? 'timeout' : 'network_error'}`,
      payload: { op, durationMs, errorMessage: String(error) }
    })
    const code = timeout ? 'INVOKE_LP_TIMEOUT' : 'INVOKE_LP_NETWORK_ERROR'
    const message = timeout
      ? 'Превышено время ожидания ответа от payments-gateway.'
      : 'Не удалось установить соединение с payments-gateway.'
    return buildProxyErrorResult(code, timeout ? 504 : 502, message, durationMs)
  }

  const durationMs = Date.now() - start
  const rawText = typeof response.body === 'string' ? response.body : ''
  let parsedBody: Record<string, unknown> | null = null
  try {
    parsedBody = rawText.trim() ? (JSON.parse(rawText) as Record<string, unknown>) : null
  } catch {
    parsedBody = null
  }
  const requestId = readResponseRequestId(response.headers, parsedBody)
  const contentType = readContentType(response.headers)
  const ok = !!(parsedBody && parsedBody.ok === true)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] gateway_response`,
    payload: {
      op,
      httpStatus: response.statusCode,
      ok,
      requestId,
      durationMs,
      hasBody: !!parsedBody
    }
  })

  return {
    httpStatus: response.statusCode,
    ok,
    requestId,
    responseBody: parsedBody,
    rawResponseBody: rawText,
    responseContentType: contentType,
    durationMs,
    proxyError: ''
  }
}
