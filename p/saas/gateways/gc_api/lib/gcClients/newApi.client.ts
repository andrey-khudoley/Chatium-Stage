import { request } from '@app/request'
import { GC_NEW_API_BASE } from '../openapiLoader.lib'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function flattenSearchParams(args: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null) continue
    out[k] = typeof v === 'object' ? JSON.stringify(v) : String(v)
  }
  return out
}

export async function callNewApi(opts: {
  gcPath: string
  method: 'GET' | 'POST'
  args: Record<string, unknown>
  bearerToken: string
}): Promise<{ statusCode: number; body: unknown; headers: Record<string, unknown> }> {
  const url = `${GC_NEW_API_BASE}${opts.gcPath}`
  const max = 3
  let attempt = 0
  let last: { statusCode: number; body: unknown; headers: Record<string, unknown> } = {
    statusCode: 0,
    body: null,
    headers: {}
  }

  while (attempt < max) {
    attempt++
    const res = await request({
      method: opts.method.toLowerCase() as 'get' | 'post',
      url,
      ...(opts.method === 'GET'
        ? { searchParams: flattenSearchParams(opts.args) }
        : { json: opts.args }),
      headers: { Authorization: `Bearer ${opts.bearerToken}` },
      responseType: 'json',
      throwHttpErrors: false,
      timeout: 90_000
    })

    const headersObj =
      res.headers && typeof res.headers === 'object'
        ? (res.headers as Record<string, unknown>)
        : {}

    last = {
      statusCode: res.statusCode ?? 0,
      body: res.body,
      headers: headersObj
    }

    if (last.statusCode === 429 || (last.statusCode >= 500 && last.statusCode < 600)) {
      const ra = headersObj['retry-after'] ?? headersObj['Retry-After']
      const retryAfterSec = parseInt(String(ra ?? ''), 10)
      const delay = Number.isFinite(retryAfterSec)
        ? retryAfterSec * 1000
        : Math.min(1000 * 2 ** attempt, 8000)
      if (attempt < max) {
        await sleep(delay)
        continue
      }
    }

    return last
  }

  return last
}
