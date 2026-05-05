/** Подмножество JSON Schema для валидации args invoke. */

export type SchemaValidationIssue = { path: string; message: string }

function typeOf(v: unknown): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v
}

function walk(
  value: unknown,
  schema: Record<string, unknown>,
  path: string,
  issues: SchemaValidationIssue[]
): void {
  const t = schema.type
  if (typeof t === 'string') {
    const tv = typeOf(value)
    let match = false
    if (t === 'string') match = tv === 'string'
    else if (t === 'number')
      match = tv === 'number' && typeof value === 'number' && Number.isFinite(value)
    else if (t === 'integer')
      match =
        tv === 'number' &&
        typeof value === 'number' &&
        Number.isFinite(value) &&
        Math.floor(value) === value
    else if (t === 'boolean') match = tv === 'boolean'
    else if (t === 'array') match = tv === 'array'
    else if (t === 'object') match = tv === 'object'
    else if (t === 'null') match = value === null
    if (!match) issues.push({ path, message: `ожидался тип ${t}, получено ${tv}` })
  }

  if (Array.isArray(schema.enum)) {
    const allowed = schema.enum as unknown[]
    if (!allowed.some((x) => x === value)) {
      issues.push({ path, message: 'значение не входит в enum' })
    }
  }

  if (
    schema.properties &&
    typeof schema.properties === 'object' &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    const props = schema.properties as Record<string, Record<string, unknown>>
    const req = Array.isArray(schema.required) ? (schema.required as string[]) : []
    const obj = value as Record<string, unknown>
    for (const k of req) {
      if (!(k in obj) || obj[k] === undefined) {
        issues.push({ path: `${path}.${k}`, message: 'обязательное поле отсутствует' })
      }
    }
    for (const k of Object.keys(props)) {
      if (k in obj && obj[k] !== undefined) walk(obj[k], props[k], `${path}.${k}`, issues)
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(obj)) {
        if (!props[k]) issues.push({ path: `${path}.${k}`, message: 'лишнее поле' })
      }
    }
  }

  if (
    schema.items &&
    typeof schema.items === 'object' &&
    Array.isArray(value)
  ) {
    const it = schema.items as Record<string, unknown>
    value.forEach((item, i) => walk(item, it, `${path}[${i}]`, issues))
  }
}

export function validateAgainstJsonSchema(
  value: unknown,
  schema: Record<string, unknown>
): { ok: true } | { ok: false; errors: SchemaValidationIssue[] } {
  if (!schema || typeof schema !== 'object') return { ok: true }
  if ('oneOf' in schema || 'allOf' in schema || 'anyOf' in schema) return { ok: true }

  const issues: SchemaValidationIssue[] = []
  walk(value, schema, '$', issues)
  return issues.length === 0 ? { ok: true } : { ok: false, errors: issues }
}
