import { request } from '@app/request'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function encodeParamsBase64(args: Record<string, unknown>): string {
  const B = (globalThis as { Buffer?: { from(data: string, encoding?: string): { toString(enc: string): string } } })
    .Buffer
  const json = JSON.stringify(args)
  if (B) return B.from(json, 'utf8').toString('base64')
  throw new Error('Buffer недоступен для base64 params')
}

/** Нормализация хоста школы: `myschool` → `myschool.getcourse.ru`. */
export function normalizeSchoolHost(schoolSlug: string): string {
  let s = schoolSlug.trim().replace(/^https?:\/\//i, '')
  const slash = s.indexOf('/')
  if (slash >= 0) s = s.slice(0, slash)
  if (s.includes('.') && s.includes('getcourse')) return s
  if (s.endsWith('.getcourse.ru')) return s
  return `${s}.getcourse.ru`
}

export async function callLegacyApi(opts: {
  schoolSlug: string
  path: string
  action: string
  schoolApiKey: string
  args: Record<string, unknown>
}): Promise<{ statusCode: number; body: unknown }> {
  const host = normalizeSchoolHost(opts.schoolSlug)
  const url = `https://${host}${opts.path}`
  const params = encodeParamsBase64(opts.args)
  const max = 3
  let attempt = 0
  let last = { statusCode: 0, body: null as unknown }

  while (attempt < max) {
    attempt++
    const res = await request({
      method: 'post',
      url,
      form: {
        key: opts.schoolApiKey,
        action: opts.action,
        params
      },
      responseType: 'json',
      throwHttpErrors: false,
      timeout: 120_000
    })

    last = { statusCode: res.statusCode ?? 0, body: res.body }

    if (last.statusCode === 429 || (last.statusCode >= 500 && last.statusCode < 600)) {
      const delay = Math.min(1000 * 2 ** attempt, 8000)
      if (attempt < max) {
        await sleep(delay)
        continue
      }
    }

    return last
  }

  return last
}
