import { GC_OP_HTTP_MAPPING_ENTRIES } from '../gateway/gcOpHttpMapping.generated'
import { buildLegacyImportFormBody } from '../gateway/legacyGcFormBody'
import { base64ToUtf8String, utf8StringToBase64 } from '../gateway/utf8Base64'
import { detectLegacySemanticErrorRule } from '../gateway/legacyGcSemantic'
import { detectNewSemanticErrorRule } from '../gateway/newGcSemantic'
import { operationsCatalog, findOperationCatalogEntry } from '../gateway/operationsCatalog'
import { isApplicationJsonContentType, parseSchoolHeaders } from '../gateway/v1IncomingPost'
import { V1_OP_ARGS_SCHEMAS } from '../gateway/v1OpArgsSchemas.generated'
import { parseFlatQueryArgs } from '../gateway/v1GatewayQuery'

export type GatewayUnitTestResult = { id: string; title: string; passed: boolean; error?: string }

function push(
  results: GatewayUnitTestResult[],
  id: string,
  title: string,
  passed: boolean,
  error?: string
): void {
  results.push({ id, title, passed, ...(error ? { error } : {}) })
}

function tryPush(
  results: GatewayUnitTestResult[],
  id: string,
  title: string,
  fn: () => boolean
): void {
  try {
    push(results, id, title, fn())
  } catch (e) {
    push(results, id, title, false, (e as Error)?.message ?? String(e))
  }
}

/** Юниты gateway: семантика Legacy, form body, заголовки (без сети). */
export function runGatewayUnitChecks(): GatewayUnitTestResult[] {
  const results: GatewayUnitTestResult[] = []

  tryPush(results, 'gw_legacy_semantic_success_false', 'Legacy success:false → legacy_root_success_false', () => {
    const rule = detectLegacySemanticErrorRule({ success: false })
    return rule === 'legacy_root_success_false'
  })

  tryPush(results, 'gw_legacy_semantic_ok', 'Legacy success:true без error → null', () => {
    return detectLegacySemanticErrorRule({ success: true, result: {} }) === null
  })

  tryPush(results, 'gw_utf8_base64_roundtrip', 'utf8StringToBase64 ↔ base64ToUtf8String (кириллица)', () => {
    const s = '{"x":"привет"}'
    return base64ToUtf8String(utf8StringToBase64(s)) === s
  })

  tryPush(results, 'gw_form_body_fields', 'form: key, action, params base64 json', () => {
    const f = buildLegacyImportFormBody('school-key', 'add', { user: { email: 'a@b.co' } })
    if (f.key !== 'school-key' || f.action !== 'add') return false
    if (!f.params || f.params.length < 8) return false
    const decoded = JSON.parse(base64ToUtf8String(f.params)) as { user: { email: string } }
    return decoded.user.email === 'a@b.co'
  })

  tryPush(results, 'gw_content_type_json', 'application/json допустим', () => {
    return isApplicationJsonContentType({ 'Content-Type': 'application/json' })
  })

  tryPush(results, 'gw_content_type_json_charset', 'application/json; charset=utf-8', () => {
    return isApplicationJsonContentType({ 'Content-Type': 'application/json; charset=utf-8' })
  })

  tryPush(results, 'gw_content_type_reject_form', 'application/x-www-form-urlencoded отклонён', () => {
    return !isApplicationJsonContentType({ 'Content-Type': 'application/x-www-form-urlencoded' })
  })

  tryPush(results, 'gw_headers_ok', 'X-Gc-School-Host + Api-Key', () => {
    const r = parseSchoolHeaders({
      'X-Gc-School-Host': 'school.getcourse.ru',
      'X-Gc-School-Api-Key': 'k1'
    })
    return r.ok && r.schoolHost === 'school.getcourse.ru' && r.schoolApiKey === 'k1'
  })

  tryPush(results, 'gw_headers_missing_key', 'нет Api-Key → INVOKE_SCHOOL_KEY_MISSING', () => {
    const r = parseSchoolHeaders({ 'X-Gc-School-Host': 'school.getcourse.ru' })
    return r.ok === false && r.code === 'INVOKE_SCHOOL_KEY_MISSING'
  })

  tryPush(results, 'gw_new_semantic_n1', 'new status:false → new_status_false', () => {
    const d = detectNewSemanticErrorRule({ status: false })
    return d?.rule === 'new_status_false'
  })

  tryPush(results, 'gw_new_semantic_n2', 'new code≠200 → new_code_non_200', () => {
    const d = detectNewSemanticErrorRule({ code: 403 })
    return d?.rule === 'new_code_non_200' && d.gcNumericCode === 403
  })

  tryPush(results, 'gw_new_semantic_n3', 'new data.result:false → new_data_result_false', () => {
    const d = detectNewSemanticErrorRule({
      status: true,
      code: 200,
      data: { result: false }
    })
    return d?.rule === 'new_data_result_false'
  })

  tryPush(results, 'gw_new_semantic_ok', 'new успех без признаков ошибки → null', () => {
    return (
      detectNewSemanticErrorRule({
        status: true,
        code: 200,
        data: { result: true, items: [] }
      }) === null
    )
  })

  tryPush(results, 'gw_catalog_entries_have_schema', 'каждый op из gc-op-http-mapping есть в V1_OP_ARGS_SCHEMAS', () => {
    for (const e of GC_OP_HTTP_MAPPING_ENTRIES) {
      if (!(e.op in V1_OP_ARGS_SCHEMAS)) return false
    }
    return true
  })

  tryPush(results, 'gw_catalog_ops_sorted_unique', 'GC_OP_HTTP_MAPPING_ENTRIES: уникальные op', () => {
    const ops = GC_OP_HTTP_MAPPING_ENTRIES.map((e) => e.op)
    return ops.length === new Set(ops).size
  })

  // manual §3.1, §3.2: единый источник каталога — operationsCatalog (TS-модуль).
  tryPush(results, 'gw_operations_catalog_matches_mapping', 'operationsCatalog.entries покрывает все op маппинга', () => {
    const fromCatalog = operationsCatalog.entries.map((e) => e.op).sort()
    const fromMapping = GC_OP_HTTP_MAPPING_ENTRIES.map((e) => e.op).sort()
    if (fromCatalog.length !== fromMapping.length) return false
    for (let i = 0; i < fromCatalog.length; i++) {
      if (fromCatalog[i] !== fromMapping[i]) return false
    }
    return true
  })

  // manual §3.5: и роут /v1/{op}, и каталог берут запись из одного источника.
  tryPush(results, 'gw_operations_catalog_has_args_schema', 'каждая запись каталога имеет live-объект argsSchema', () => {
    for (const e of operationsCatalog.entries) {
      const sch = e.argsSchema as { safeParse?: unknown }
      if (!sch || typeof sch.safeParse !== 'function') return false
    }
    return true
  })

  // manual §3.5: addUser имеет ручную перекрывающую схему params.user.email.
  tryPush(results, 'gw_operations_catalog_addUser_strict', 'addUser argsSchema валидирует params.user.email', () => {
    const e = findOperationCatalogEntry('addUser')
    if (!e) return false
    const sch = e.argsSchema as { safeParse: (d: unknown) => { success: boolean } }
    const ok = sch.safeParse({ params: { user: { email: 'a@b.co' } } })
    const bad = sch.safeParse({ params: { user: {} } })
    return ok.success === true && bad.success === false
  })

  // manual §3.5: повторяющиеся ключи query → последнее значение.
  tryPush(results, 'gw_query_dup_keys_keep_last', 'parseFlatQueryArgs: дубликаты ключей → последнее значение', () => {
    const a = parseFlatQueryArgs({ groupId: ['1', '2', '7'] })
    const b = parseFlatQueryArgs({ groupId: '5' })
    return a.groupId === 7 && b.groupId === 5
  })

  return results
}
