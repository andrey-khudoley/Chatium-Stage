import { s } from '@app/schema'
import {
  GC_OP_HTTP_MAPPING_ENTRIES,
  GC_OP_HTTP_MAPPING_SCHEMA_VERSION,
  type GcMappingEntry
} from './gcOpHttpMapping.generated'
import { V1_OP_ARGS_SCHEMAS } from './v1OpArgsSchemas.generated'

/**
 * Строгая схема POST /v1/addUser (manual §2.4, gc-required-fields-by-op.json).
 * Перекрывает автогенерацию для демо-тестов (`params.user.email`).
 */
export const addUserArgsSchema = s.object({
  params: s.object({
    user: s.object({
      email: s.string()
    })
  })
})

/** Любая объектная схема `args` (s.object с произвольными полями) — для каталога. */
type AnyArgsSchema = ReturnType<typeof s.object> | ReturnType<typeof s.any>

/** Точечные ручные перекрытия автогенерации (manual §3.1: SSOT каталога). */
const ARGS_SCHEMA_OVERRIDES: Record<string, AnyArgsSchema> = {
  addUser: addUserArgsSchema as unknown as AnyArgsSchema
}

/** Запись каталога: маппинг + живой объект схемы `args` для рантайм-валидации (manual §3.5). */
export type OperationCatalogEntry = GcMappingEntry & {
  argsSchema: AnyArgsSchema
}

function buildEntry(e: GcMappingEntry): OperationCatalogEntry {
  const fromOverride = ARGS_SCHEMA_OVERRIDES[e.op]
  const fromGenerated = (V1_OP_ARGS_SCHEMAS as unknown as Record<string, AnyArgsSchema>)[e.op]
  const argsSchema = fromOverride ?? fromGenerated ?? s.any()
  return { ...e, argsSchema }
}

/**
 * Каталог операций gateway — единый SSOT для `GET /v1/operations` и `/v1/{op}` (manual §3.1, §3.2, §3.5).
 * Состав строится из автогенерации `gcOpHttpMapping.generated.ts` (entries+schemaVersion)
 * и `v1OpArgsSchemas.generated.ts` (схемы args), плюс ручные перекрытия (`ARGS_SCHEMA_OVERRIDES`).
 * Импортируется только из серверного кода обычным TS-импортом.
 */
export const operationsCatalog = {
  schemaVersion: GC_OP_HTTP_MAPPING_SCHEMA_VERSION,
  entries: GC_OP_HTTP_MAPPING_ENTRIES.map(buildEntry) as readonly OperationCatalogEntry[]
} as const

/** Поиск записи по `op` (manual §3.5: общий источник для роута и каталога). */
export function findOperationCatalogEntry(op: string): OperationCatalogEntry | undefined {
  return operationsCatalog.entries.find((e) => e.op === op)
}

/** Live-объект схемы args для рантайм-валидации `parse`/`safeParse` (manual §3.5). */
export function getV1ArgsSchemaForOp(op: string) {
  const entry = findOperationCatalogEntry(op)
  if (entry) return entry.argsSchema
  return s.any()
}

/**
 * Сериализация схемы `args` для тела ответа `GET /v1/operations` (manual §3.4).
 * Объекты `@app/schema` (TypeBox-производные ZType) представляют собой JSON-Schema-подобную
 * структуру с перечислимыми полями (`type`, `properties`, `required`, ...) — `JSON.stringify`
 * даёт пригодный для передачи клиенту вид, методы (`parse`, `safeParse`) автоматически отсекаются.
 */
export function serializeArgsSchemaForCatalog(op: string): unknown {
  const schema = getV1ArgsSchemaForOp(op) as unknown as {
    toJSON?: () => unknown
    serialize?: () => unknown
  } & Record<string, unknown>
  if (typeof schema?.toJSON === 'function') {
    try {
      return schema.toJSON()
    } catch {
      /* fallthrough к JSON.stringify */
    }
  }
  if (typeof schema?.serialize === 'function') {
    try {
      return schema.serialize()
    } catch {
      /* fallthrough к JSON.stringify */
    }
  }
  try {
    return JSON.parse(JSON.stringify(schema))
  } catch {
    return null
  }
}
