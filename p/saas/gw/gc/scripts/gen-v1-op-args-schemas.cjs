/**
 * Генерирует lib/gateway/v1OpArgsSchemas.generated.ts из new_api_schema.json + gc-op-http-mapping.json.
 * Запуск: node scripts/gen-v1-op-args-schemas.cjs (из корня приложения p/saas/gw/gc).
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OPENAPI = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/gateway/new_api_schema.json'), 'utf8'))
const MAPPING = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/gc-op-http-mapping.json'), 'utf8'))

function resolveRef(ref) {
  if (!ref || typeof ref !== 'string' || !ref.startsWith('#/')) return null
  const parts = ref.replace(/^#\//, '').split('/')
  let cur = OPENAPI
  for (const p of parts) {
    cur = cur[p]
    if (cur === undefined) return null
  }
  return cur
}

function mergeAllOf(schema, depth) {
  if (depth > 20) return { type: 'object', properties: {} }
  if (!schema || schema.type !== 'object') return schema
  if (!Array.isArray(schema.allOf)) return schema
  const out = { type: 'object', properties: {}, required: [] }
  for (const branch of schema.allOf) {
    const b = branch.$ref ? resolveRef(branch.$ref) : branch
    if (!b || b.type !== 'object') continue
    if (b.properties) Object.assign(out.properties, b.properties)
    if (Array.isArray(b.required)) out.required.push(...b.required)
  }
  out.required = [...new Set(out.required)]
  return out
}

function schemaToS(schema, depth, optionalKeys) {
  if (depth > 25) return 's.any()'
  if (!schema) return 's.any()'

  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref)
    return schemaToS(resolved, depth + 1, optionalKeys)
  }

  if (schema.allOf && schema.type === 'object') {
    const merged = mergeAllOf(schema, depth + 1)
    return schemaToS(merged, depth + 1, optionalKeys)
  }

  if (Array.isArray(schema.allOf) && !schema.type) {
    const merged = mergeAllOf({ type: 'object', allOf: schema.allOf }, depth + 1)
    return schemaToS(merged, depth + 1, optionalKeys)
  }

  const t = schema.type
  if (t === 'string') return 's.string()'
  if (t === 'integer' || t === 'number') return 's.number()'
  if (t === 'boolean') return 's.boolean()'
  if (t === 'array') {
    const inner = schema.items ? schemaToS(schema.items, depth + 1, optionalKeys) : 's.any()'
    return `s.array(${inner})`
  }
  if (t === 'object' && schema.properties) {
    const req = new Set(schema.required || [])
    const keys = Object.keys(schema.properties)
    if (keys.length === 0) return 's.object({})'
    const parts = keys.map((k) => {
      const prop = schema.properties[k]
      const inner = schemaToS(prop, depth + 1, optionalKeys)
      const opt = !req.has(k)
      return `${k}: ${inner}${opt ? '.optional()' : ''}`
    })
    return `s.object({\n      ${parts.join(',\n      ')}\n    })`
  }
  return 's.any()'
}

function buildGetSchema(pathKey, methodLower) {
  const pi = OPENAPI.paths[pathKey]
  if (!pi || !pi[methodLower]) return null
  const op = pi[methodLower]
  const params = op.parameters || []
  const queryParams = params.filter((p) => p.in === 'query')
  if (queryParams.length === 0) return 's.object({})'

  const props = {}
  const required = []
  for (const p of queryParams) {
    const name = p.name
    const sch = p.schema || { type: 'string' }
    props[name] = sch
    if (p.required) required.push(name)
  }
  const fakeSchema = {
    type: 'object',
    properties: props,
    required
  }
  return schemaToS(fakeSchema, 0)
}

function buildPostSchema(pathKey) {
  const pi = OPENAPI.paths[pathKey]
  if (!pi || !pi.post) return null
  const rb = pi.post.requestBody
  if (!rb || !rb.content || !rb.content['application/json']) return 's.object({})'
  let sch = rb.content['application/json'].schema
  sch = sch.$ref ? resolveRef(sch.$ref) : sch
  if (sch && sch.allOf) sch = mergeAllOf(sch, 0)
  return schemaToS(sch, 0)
}

/** Legacy: входящие args для gateway — объект params и опционально action (импорт); action/key не в args. */
function legacySchemas(op) {
  if (op === 'addUser') {
    return `s.object({
      params: s.any()
    })`
  }
  if (op === 'createDeal') {
    return `s.object({
      params: s.any()
    })`
  }
  if (
    op === 'exportUsers' ||
    op === 'exportDeals' ||
    op === 'exportPayments' ||
    op === 'getCustomFields'
  ) {
    return 's.object({})'
  }
  if (op === 'exportGroupUsers') {
    return `s.object({
      groupId: s.number()
    })`
  }
  if (op === 'getExportResult') {
    return `s.object({
      exportId: s.number()
    })`
  }
  return 's.any()'
}

/** Ручные схемы там, где OpenAPI даёт oneOf/слишком широкую модель (§4.1 set-uri). */
const MANUAL_OP_SCHEMA_EXPR = {
  setUri: `s.object({
    uri: s.string(),
    event_id: s.number(),
    event_object_id: s.number()
  })`
}

const lines = []
lines.push('/**')
lines.push(' * Автогенерация: `node scripts/gen-v1-op-args-schemas.cjs`')
lines.push(' * Источники: docs/gateway/new_api_schema.json, config/gc-op-http-mapping.json + legacy-хелпер.')
lines.push(' */')
lines.push("import { s } from '@app/schema'")
lines.push('')
lines.push('export type V1OpArgsSchemaMap = Record<string, ReturnType<typeof s.object>>')
lines.push('')
lines.push('export const V1_OP_ARGS_SCHEMAS = {')

for (const e of MAPPING.entries) {
  const op = e.op
  const pt = e.pathTemplate.startsWith('/') ? e.pathTemplate : `/${e.pathTemplate}`
  let expr = 's.any()'

  if (MANUAL_OP_SCHEMA_EXPR[op]) {
    expr = MANUAL_OP_SCHEMA_EXPR[op]
  } else if (e.contour === 'legacy') {
    expr = legacySchemas(op)
  } else if (e.httpMethod === 'GET') {
    const g = buildGetSchema(pt, 'get')
    expr = g || 's.any()'
  } else if (e.httpMethod === 'POST') {
    const p = buildPostSchema(pt)
    expr = p || 's.any()'
  }

  lines.push(`  ${JSON.stringify(op)}: ${expr},`)
}

lines.push('} as const')
lines.push('')
lines.push('export type V1OpName = keyof typeof V1_OP_ARGS_SCHEMAS')

const outPath = path.join(ROOT, 'lib/gateway/v1OpArgsSchemas.generated.ts')
fs.writeFileSync(outPath, lines.join('\n') + '\n')
console.log('Wrote', outPath, 'ops:', MAPPING.entries.length)
