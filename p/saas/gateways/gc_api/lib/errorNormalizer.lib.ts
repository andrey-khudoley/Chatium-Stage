/** Единый формат ошибок gateway ↔ клиент */

export type NormalizedGcError = {
  code: string
  message: string
  gcDetails?: unknown
}

export function normalizeNewApiError(statusCode: number, body: unknown): NormalizedGcError {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const msg =
    typeof b.message === 'string'
      ? b.message
      : typeof b.error === 'string'
        ? b.error
        : `GetCourse new API HTTP ${statusCode}`
  let code = 'GC_UNKNOWN'
  if (statusCode === 401 || statusCode === 403) code = 'GC_AUTH'
  else if (statusCode === 429) code = 'GC_RATE_LIMIT'
  else if (statusCode >= 500) code = 'GC_UNAVAILABLE'
  else if (statusCode === 422 || statusCode === 400) code = 'GC_VALIDATION'
  const apiCode = b.apiCode ?? b.code
  if (typeof apiCode === 'string' && apiCode.toLowerCase().includes('not_found')) code = 'GC_USER_NOT_FOUND'
  return { code, message: msg, gcDetails: body }
}

export function normalizeLegacyApiError(body: unknown): NormalizedGcError {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const success = String(b.success ?? '').toLowerCase()
  const result = b.result && typeof b.result === 'object' ? (b.result as Record<string, unknown>) : {}
  const errMsg =
    typeof result.error_message === 'string'
      ? result.error_message
      : typeof result.message === 'string'
        ? result.message
        : typeof b.error_message === 'string'
          ? b.error_message
          : 'Ошибка Legacy API GetCourse'
  let code = 'GC_UNKNOWN'
  const low = errMsg.toLowerCase()
  if (low.includes('ключ') || low.includes('key') || low.includes('auth')) code = 'GC_AUTH'
  else if (low.includes('limit') || low.includes('лимит')) code = 'GC_RATE_LIMIT'
  else if (low.includes('не найден') || low.includes('not found')) code = 'GC_USER_NOT_FOUND'
  if (success === 'false' || result.error === true || result.error === 'true') {
    return { code, message: errMsg, gcDetails: body }
  }
  return { code: 'GC_UNKNOWN', message: errMsg, gcDetails: body }
}

export function isLegacyBodySuccess(body: unknown): boolean {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const success = String(b.success ?? '').toLowerCase()
  if (success === 'true') return true
  const result = b.result && typeof b.result === 'object' ? (b.result as Record<string, unknown>) : {}
  const rs = String(result.success ?? '').toLowerCase()
  return rs === 'true'
}
