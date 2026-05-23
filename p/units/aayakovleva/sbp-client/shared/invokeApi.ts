// @shared
/**
 * Типы запроса/ответа клиентской прокладки `POST /api/lp/invoke`
 * (implementation-plan §1.8.2). Тело и структура — зеркало контракта gateway §9.1.
 */

export type InvokeRequest = {
  op: string
  args: Record<string, unknown>
}

export type GatewayWarning = { code: string; message: string }

export type LpInvokeResponseOk = {
  ok: true
  data: unknown
  requestId: string
  warnings?: GatewayWarning[]
}

export type GatewayErrorBody = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type LpInvokeResponseError = {
  ok: false
  error: GatewayErrorBody
  requestId: string | null
}

export type LpInvokeResponse = LpInvokeResponseOk | LpInvokeResponseError

/** Локальные коды ошибок прокладки (не от gateway, а от самого invoke-роута). */
export const INVOKE_PROXY_ERROR_CODES = {
  SETTINGS_MISSING: 'INVOKE_SETTINGS_MISSING',
  OP_UNKNOWN: 'INVOKE_OP_UNKNOWN',
  BODY_INVALID: 'INVOKE_PROXY_BODY_INVALID'
} as const
