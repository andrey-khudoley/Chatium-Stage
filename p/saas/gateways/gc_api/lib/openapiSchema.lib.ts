import type { OpenapiSpec } from './openapiLoader.lib'

/** Разрешение JSON Pointer $ref внутри спеки (поверхностно). */
export function resolveJsonPointer(spec: unknown, pointer: string): unknown {
  if (!pointer.startsWith('#/')) return undefined
  const parts = pointer.slice(2).split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
  let cur: unknown = spec
  for (const part of parts) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

export function derefSchema(spec: OpenapiSpec, schema: unknown, depth = 0): unknown {
  if (depth > 24 || schema === null || typeof schema !== 'object') return schema
  const o = schema as Record<string, unknown>
  if (typeof o.$ref === 'string') {
    const resolved = resolveJsonPointer(spec as unknown, o.$ref)
    if (resolved === undefined) return schema
    return derefSchema(spec, resolved, depth + 1)
  }
  const out: Record<string, unknown> = { ...o }
  if (Array.isArray(o.oneOf)) {
    out.oneOf = o.oneOf.map((x) => derefSchema(spec, x, depth + 1))
  }
  if (Array.isArray(o.allOf)) {
    out.allOf = o.allOf.map((x) => derefSchema(spec, x, depth + 1))
  }
  if (o.properties && typeof o.properties === 'object') {
    const props: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(o.properties as Record<string, unknown>)) {
      props[k] = derefSchema(spec, v, depth + 1)
    }
    out.properties = props
  }
  if (o.items && typeof o.items === 'object') {
    out.items = derefSchema(spec, o.items, depth + 1)
  }
  return out
}

export function extractArgsSchemaFromOperation(
  spec: OpenapiSpec,
  path: string,
  method: 'get' | 'post'
): Record<string, unknown> {
  const pathItem = spec.paths?.[path]
  if (!pathItem) {
    return { type: 'object', additionalProperties: true }
  }
  const op = pathItem[method] as Record<string, unknown> | undefined
  if (!op) {
    return { type: 'object', additionalProperties: true }
  }

  const rb = op.requestBody as
    | {
        content?: Record<string, { schema?: unknown }>
      }
    | undefined
  const jsonSchema = rb?.content?.['application/json']?.schema
  if (jsonSchema) {
    const d = derefSchema(spec, jsonSchema)
    return typeof d === 'object' && d !== null ? (d as Record<string, unknown>) : { type: 'object', additionalProperties: true }
  }

  const params = (op.parameters ?? []) as unknown[]
  if (!params.length) {
    return { type: 'object', additionalProperties: true }
  }

  const properties: Record<string, unknown> = {}
  const required: string[] = []

  for (const p of params) {
    if (!p || typeof p !== 'object') continue
    const pref = p as { $ref?: string }
    let param = pref.$ref ? resolveJsonPointer(spec as unknown, pref.$ref) : p
    if (!param || typeof param !== 'object') continue
    const po = param as {
      name?: string
      in?: string
      required?: boolean
      schema?: unknown
    }
    if (!po.name || po.in !== 'query') continue
    const sch = po.schema ? derefSchema(spec, po.schema) : { type: 'string' }
    properties[po.name] = typeof sch === 'object' && sch !== null ? sch : { type: 'string' }
    if (po.required) required.push(po.name)
  }

  return {
    type: 'object',
    properties,
    required: required.length ? required : undefined,
    additionalProperties: true
  }
}
