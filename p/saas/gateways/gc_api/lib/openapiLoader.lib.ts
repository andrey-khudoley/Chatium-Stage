import { request } from '@app/request'
import * as openapiCacheRepo from '../repos/openapiCache.repo'
import * as loggerLib from './logger.lib'

const LOG = 'lib/openapiLoader.lib'
export const GC_OPENAPI_SCHEMA_URL = 'https://getcourse.ru/pl/postback/redoc/schema'
/** База вызовов new API (servers в схеме часто example.test — подменяем). */
export const GC_NEW_API_BASE = 'https://getcourse.ru/pl/postback'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type OpenapiSpec = {
  openapi?: string
  servers?: Array<{ url?: string }>
  paths?: Record<string, Record<string, unknown>>
  components?: { schemas?: Record<string, unknown> }
}

function isOpenapiSpec(x: unknown): x is OpenapiSpec {
  return typeof x === 'object' && x !== null && 'paths' in x
}

export async function fetchOpenapiFromNetwork(ctx: app.Ctx): Promise<OpenapiSpec> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG}] fetchOpenapiFromNetwork`,
    payload: { url: GC_OPENAPI_SCHEMA_URL }
  })
  const res = await request({
    method: 'get',
    url: GC_OPENAPI_SCHEMA_URL,
    responseType: 'json',
    throwHttpErrors: false,
    timeout: 60_000
  })
  if (res.statusCode !== 200) {
    throw new Error(`OpenAPI fetch failed: HTTP ${res.statusCode}`)
  }
  const parsed = res.body as unknown
  if (!isOpenapiSpec(parsed)) {
    throw new Error('OpenAPI: нет поля paths')
  }
  return parsed
}

export async function loadCachedOpenapi(ctx: app.Ctx): Promise<OpenapiSpec | null> {
  const row = await openapiCacheRepo.findByKey(ctx, openapiCacheRepo.OPENAPI_CACHE_KEY)
  if (!row?.json || !isOpenapiSpec(row.json)) return null
  return row.json
}

export async function saveOpenapiCache(ctx: app.Ctx, spec: OpenapiSpec): Promise<void> {
  const version =
    typeof (spec as { info?: { version?: string } }).info?.version === 'string'
      ? (spec as { info: { version: string } }).info.version
      : undefined
  await openapiCacheRepo.upsertByKey(ctx, {
    key: openapiCacheRepo.OPENAPI_CACHE_KEY,
    json: spec,
    version,
    fetchedAt: Date.now()
  })
}

/** Возвращает спецификацию: из кеша если свежая, иначе сеть + кеш. */
export async function getOrRefreshOpenapi(ctx: app.Ctx, forceRefresh = false): Promise<OpenapiSpec> {
  if (!forceRefresh) {
    const row = await openapiCacheRepo.findByKey(ctx, openapiCacheRepo.OPENAPI_CACHE_KEY)
    if (row?.json && isOpenapiSpec(row.json)) {
      const age = Date.now() - (row.fetchedAt ?? 0)
      if (age >= 0 && age < CACHE_TTL_MS) {
        return row.json
      }
    }
  }
  try {
    const spec = await fetchOpenapiFromNetwork(ctx)
    await saveOpenapiCache(ctx, spec)
    return spec
  } catch (e) {
    const fallback = await loadCachedOpenapi(ctx)
    if (fallback) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG}] сеть недоступна, используем кеш OpenAPI`,
        payload: { error: String(e) }
      })
      return fallback
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG}] OpenAPI недоступен и кеш пуст — stub paths:{} (каталог new-op с permissive args)`,
      payload: { error: String(e) }
    })
    return { openapi: '3.0.0', info: { version: 'offline-stub' }, paths: {} }
  }
}
