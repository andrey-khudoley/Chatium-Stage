import { s } from '@app/schema'
import {
  GC_OP_HTTP_MAPPING_ENTRIES,
  GC_OP_HTTP_MAPPING_SCHEMA_VERSION,
  type GcMappingEntry
} from './gcOpHttpMapping.generated'
import { V1_OP_ARGS_SCHEMAS } from './v1OpArgsSchemas.generated'

/**
 * Ручные схемы `args` для legacy ops (manual §2.4, gc-required-fields-by-op.json,
 * https://getcourse.ru/help/api).
 *
 * Источника, пригодного для машинной генерации, нет: `legacy_api_schema.json`
 * описывает только транспорт (`POST /users` принимает форму `key/action/params`,
 * GET — только `?key=...`); содержательная структура `params` и фильтры в legacy
 * OpenAPI не описаны — поля ниже сняты с https://getcourse.ru/help/api руками.
 *
 * Все объекты `additionalProperties: true` — пропускаем неизвестные поля GC
 * (forward-совместимость), а `INVOKE_ARGS_SCHEMA_VIOLATION` срабатывает только
 * на отсутствии обязательных полей или несоответствии типов.
 */

const passthrough = { additionalProperties: true } as const

/** POST /pl/api/users (action=add). Обязателен `params.user.email`; остальное — опционально. */
export const addUserArgsSchema = s.object({
  params: s.object({
    user: s.object({
      email: s.string(),
      phone: s.string().optional(),
      first_name: s.string().optional(),
      last_name: s.string().optional(),
      city: s.string().optional(),
      country: s.string().optional(),
      group_name: s.array(s.string()).optional(),
      addfields: s.any().optional()
    }, passthrough),
    system: s.any().optional(),
    session: s.any().optional()
  }, passthrough)
}, passthrough)

/**
 * POST /pl/api/deals (action=add). Обязателен `params.user.email`;
 * `params.deal` — объект (offer_code/offer_id «один из» — дизъюнкцию `s` напрямую
 * не выражает, дальше валидирует семантика GC).
 */
const createDealArgsSchema = s.object({
  params: s.object({
    user: s.object({
      email: s.string(),
      phone: s.string().optional(),
      first_name: s.string().optional(),
      last_name: s.string().optional()
    }, passthrough),
    deal: s.object({
      offer_code: s.string().optional(),
      offer_id: s.number().optional(),
      deal_number: s.string().optional(),
      deal_cost: s.number().optional(),
      deal_status: s.string().optional(),
      deal_is_paid: s.string().optional(),
      deal_currency: s.string().optional(),
      funnel_id: s.number().optional(),
      funnel_stage_id: s.number().optional()
    }, passthrough),
    system: s.any().optional()
  }, passthrough)
}, passthrough)

/**
 * GET /pl/api/account/users — формально обязательных нет, перечислены известные фильтры
 * для документации в `GET /v1/operations`.
 */
const exportUsersArgsSchema = s.object({
  'created_at[from]': s.string().optional(),
  'created_at[to]': s.string().optional(),
  status: s.string().optional(),
  email: s.string().optional(),
  idgrouplist: s.string().optional()
}, passthrough)

/** GET /pl/api/account/deals — известные фильтры. */
const exportDealsArgsSchema = s.object({
  'created_at[from]': s.string().optional(),
  'created_at[to]': s.string().optional(),
  status: s.string().optional(),
  'payed_at[from]': s.string().optional(),
  'payed_at[to]': s.string().optional(),
  user_in_group: s.number().optional(),
  user_id: s.number().optional()
}, passthrough)

/** GET /pl/api/account/payments — известные фильтры. */
const exportPaymentsArgsSchema = s.object({
  'created_at[from]': s.string().optional(),
  'created_at[to]': s.string().optional(),
  status: s.string().optional(),
  'status_changed_at[from]': s.string().optional(),
  'status_changed_at[to]': s.string().optional()
}, passthrough)

/** GET /pl/api/account/groups/{groupId}/users — обязателен `groupId` (path). */
const exportGroupUsersArgsSchema = s.object({
  groupId: s.string(),
  'created_at[from]': s.string().optional(),
  'created_at[to]': s.string().optional(),
  'added_at[from]': s.string().optional(),
  'added_at[to]': s.string().optional(),
  status: s.string().optional()
}, passthrough)

/** GET /pl/api/account/fields — формально обязательных параметров нет, кроме `key`. */
const getCustomFieldsArgsSchema = s.object({}, passthrough)

/** GET /pl/api/account/exports/{exportId} — обязателен `exportId` (path). */
const getExportResultArgsSchema = s.object({
  exportId: s.string()
}, passthrough)

/** Любая объектная схема `args` (s.object с произвольными полями) — для каталога. */
type AnyArgsSchema = ReturnType<typeof s.object> | ReturnType<typeof s.any>

/** Точечные ручные перекрытия автогенерации (manual §3.1: SSOT каталога). */
const ARGS_SCHEMA_OVERRIDES: Record<string, AnyArgsSchema> = {
  addUser: addUserArgsSchema as unknown as AnyArgsSchema,
  createDeal: createDealArgsSchema as unknown as AnyArgsSchema,
  exportDeals: exportDealsArgsSchema as unknown as AnyArgsSchema,
  exportGroupUsers: exportGroupUsersArgsSchema as unknown as AnyArgsSchema,
  exportPayments: exportPaymentsArgsSchema as unknown as AnyArgsSchema,
  exportUsers: exportUsersArgsSchema as unknown as AnyArgsSchema,
  getCustomFields: getCustomFieldsArgsSchema as unknown as AnyArgsSchema,
  getExportResult: getExportResultArgsSchema as unknown as AnyArgsSchema
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
