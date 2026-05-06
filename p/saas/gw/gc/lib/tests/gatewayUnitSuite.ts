import { buildLegacyImportFormBody } from '../gateway/legacyGcFormBody'
import { detectLegacySemanticErrorRule } from '../gateway/legacyGcSemantic'
import { isApplicationJsonContentType, parseSchoolHeaders } from '../gateway/v1IncomingPost'

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

  tryPush(results, 'gw_form_body_fields', 'form: key, action, params base64 json', () => {
    const f = buildLegacyImportFormBody('school-key', 'add', { user: { email: 'a@b.co' } })
    if (f.key !== 'school-key' || f.action !== 'add') return false
    if (!f.params || f.params.length < 8) return false
    const decoded = JSON.parse(base64Decode(f.params)) as { user: { email: string } }
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

  return results
}
