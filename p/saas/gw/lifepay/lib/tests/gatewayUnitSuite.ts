/**
 * Юнит-набор `lib/gateway/` (синхронные проверки без Heap). Покрывает классификаторы и
 * extract'ы по реальному контракту LifePay (apidoc.life-pay.ru/bill/index), отсутствие
 * неканонических значений `lpRule`, сборку query исходящего вызова и маскировку секретов в логах.
 */

import {
  billStatusName,
  classifyCancelBillResponse,
  classifyCreateBillResponse,
  classifyGetBillStatusResponse,
  extractCancelBillSuccess,
  extractCreateBillSuccess,
  extractGetBillStatusSuccess,
  type BillsV1SemanticResult
} from '../gateway/billsV1Semantic'
import { buildCreateBillBody, redactCreateBillBodyForLog } from '../gateway/buildCreateBillBody'
import { maskLpLogin } from '../gateway/lpCredentials'
import { UNIT_TEST_BLOCKS, flattenCatalogBlocks } from '../../shared/testCatalog'
import { redactRawDeep, MAX_RAW_BYTES } from '../../shared/redactRaw'

export type GatewayUnitTestResult = { id: string; title: string; passed: boolean; error?: string }

const GATEWAY_BLOCK_ID = 'unit-gateway'

const LP_GET_BILL_STATUS_OK = {
  code: 0,
  message: '',
  data: {
    '10197087498032': { status: 15, msg: 'Ожидает подтверждения' }
  }
}

const LP_CREATE_BILL_OK = {
  code: 0,
  message: '',
  data: {
    status: 15,
    number: 18948962804043,
    created: 1476091037,
    interval: 5,
    paymentUrl: 'https://qr.nspk.ru/AS10000001',
    paymentUrlWeb: 'https://web.qr.nspk.ru/AS10000001'
  }
}

const LP_CANCEL_BILL_OK = { code: 0, message: '', data: {} }

const LP_CODE_ERROR = { code: 7, message: 'Bill not found', data: {} }

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

function ruleOf(r: BillsV1SemanticResult | null): string | null {
  return r ? r.rule : null
}

function runBillsV1SemanticChecks(results: GatewayUnitTestResult[]): void {
  tryPush(
    results,
    'gw_get_bill_status_success',
    'classifyGetBillStatusResponse: канонический ответ LifePay → null',
    () => {
      if (classifyGetBillStatusResponse(LP_GET_BILL_STATUS_OK) !== null) return false
      const ex = extractGetBillStatusSuccess(LP_GET_BILL_STATUS_OK)
      if (!ex) return false
      if (ex.billNumber !== '10197087498032') return false
      if (ex.status !== 'pending') return false
      if (ex.msg !== 'Ожидает подтверждения') return false
      return true
    }
  )

  tryPush(
    results,
    'gw_get_bill_status_empty_data',
    'classifyGetBillStatusResponse: code=0 + пустой словарь data → bills_v1_code_error',
    () => {
      if (ruleOf(classifyGetBillStatusResponse({ code: 0, message: '', data: {} })) !== 'bills_v1_code_error') return false
      if (ruleOf(classifyGetBillStatusResponse({ code: 0, data: { '10197087498032': {} } })) !== 'bills_v1_code_error') return false
      return true
    }
  )

  tryPush(
    results,
    'gw_get_bill_status_code_error',
    'classifyGetBillStatusResponse: code≠0 → bills_v1_code_error с lpNumericCode',
    () => {
      const r = classifyGetBillStatusResponse(LP_CODE_ERROR)
      if (!r) return false
      if (r.rule !== 'bills_v1_code_error') return false
      if (r.lpNumericCode !== 7) return false
      return true
    }
  )

  tryPush(
    results,
    'gw_cancel_bill_success',
    'classifyCancelBillResponse: code=0 + пустой data → null; success: { status: cancelled }',
    () => {
      if (classifyCancelBillResponse(LP_CANCEL_BILL_OK) !== null) return false
      const ex = extractCancelBillSuccess(LP_CANCEL_BILL_OK)
      if (ex.status !== 'cancelled') return false
      return true
    }
  )

  tryPush(
    results,
    'gw_cancel_bill_code_error',
    'classifyCancelBillResponse: code≠0 → bills_v1_code_error',
    () => {
      const r = classifyCancelBillResponse(LP_CODE_ERROR)
      if (!r) return false
      if (r.rule !== 'bills_v1_code_error') return false
      if (r.lpNumericCode !== 7) return false
      return true
    }
  )

  tryPush(
    results,
    'gw_create_bill_success',
    'classifyCreateBillResponse + extract: каноничный успех',
    () => {
      if (classifyCreateBillResponse(LP_CREATE_BILL_OK) !== null) return false
      const ex = extractCreateBillSuccess(LP_CREATE_BILL_OK)
      if (!ex) return false
      if (ex.billNumber !== '18948962804043') return false
      if (ex.paymentUrl !== 'https://qr.nspk.ru/AS10000001') return false
      if (ex.paymentUrlWeb !== 'https://web.qr.nspk.ru/AS10000001') return false
      return true
    }
  )

  tryPush(
    results,
    'gw_create_bill_missing_payment_url',
    'classifyCreateBillResponse: нет paymentUrl при code=0 → bills_v1_missing_payment_url',
    () => {
      const noUrl = { code: 0, data: { status: 15, number: 1, paymentUrlWeb: 'x' } }
      return ruleOf(classifyCreateBillResponse(noUrl)) === 'bills_v1_missing_payment_url'
    }
  )

  tryPush(
    results,
    'gw_bill_status_name_mapping',
    'billStatusName: 0/10/15/20/30 → initiated/success/pending/failed/cancelled',
    () => {
      if (billStatusName(0) !== 'initiated') return false
      if (billStatusName(10) !== 'success') return false
      if (billStatusName(15) !== 'pending') return false
      if (billStatusName(20) !== 'failed') return false
      if (billStatusName(30) !== 'cancelled') return false
      if (billStatusName(99) !== '99') return false
      return true
    }
  )

  tryPush(
    results,
    'gw_bills_v1_semantic_rule_type',
    'BillsV1SemanticRule: возвращаемые правила входят в канон §10',
    () => {
      const canon = new Set([
        'bills_v1_status_error',
        'bills_v1_code_error',
        'bills_v1_missing_payment_url',
        'bills_v1_error_string'
      ])
      const samples: unknown[] = [
        {},
        { code: 7 },
        { error: 'boom' },
        { code: 0, data: {} },
        { code: 0, data: { '1': {} } },
        LP_CODE_ERROR
      ]
      for (const s of samples) {
        const g = classifyGetBillStatusResponse(s)
        if (g && !canon.has(g.rule)) return false
        const c = classifyCancelBillResponse(s)
        if (c && !canon.has(c.rule)) return false
        const cr = classifyCreateBillResponse(s)
        if (cr && !canon.has(cr.rule)) return false
      }
      return true
    }
  )

  tryPush(
    results,
    'gw_get_bill_status_query_fields',
    'getBillStatus: конвенция query.number = args.billNumber (документационный)',
    () => {
      const args = { billNumber: 'BILL-42' }
      const query: Record<string, string> = { number: args.billNumber }
      if (query.number !== 'BILL-42') return false
      if ('billNumber' in query) return false
      return true
    }
  )

  tryPush(
    results,
    'gw_create_bill_body_amount_string',
    'buildCreateBillBody: amount передаётся в LifePay строкой "X.XX" (LifePay code 6020 при числе)',
    () => {
      const body = buildCreateBillBody(
        { apikey: 'a', login: '79161234567' },
        {
          amount: 1,
          customerEmail: 't@example.com',
          orderNumber: 'ORD-1',
          callbackUrl: 'https://cb',
          description: 'Test'
        }
      )
      if (typeof body.amount !== 'string') return false
      if (body.amount !== '1.00') return false
      const body2 = buildCreateBillBody(
        { apikey: 'a', login: '79161234567' },
        {
          amount: 199.5,
          customerEmail: 't@example.com',
          orderNumber: 'ORD-2',
          callbackUrl: 'https://cb',
          description: 'Test'
        }
      )
      if (body2.amount !== '199.50') return false
      if (body.method !== 'sbp') return false
      if (body.description !== 'Test') return false
      if (body.order.number !== 'ORD-1') return false
      return true
    }
  )

  tryPush(
    results,
    'gw_create_bill_body_phone_normalized',
    'buildCreateBillBody: customer_phone приводится к формату 7xxxxxxxxxx (apidoc.life-pay.ru)',
    () => {
      const make = (phone: string) => buildCreateBillBody(
        { apikey: 'a', login: '79161234567' },
        {
          amount: 1,
          customerEmail: 't@example.com',
          orderNumber: 'ORD',
          callbackUrl: 'https://cb',
          description: 'X',
          customerPhone: phone
        }
      ).customer_phone
      if (make('+71234567890') !== '71234567890') return false
      if (make('7 (123) 456-78-90') !== '71234567890') return false
      if (make('79161234567') !== '79161234567') return false
      const noPhone = buildCreateBillBody(
        { apikey: 'a', login: '79161234567' },
        { amount: 1, customerEmail: 't@example.com', orderNumber: 'O', callbackUrl: 'https://cb', description: 'X' }
      ).customer_phone
      if (noPhone !== null) return false
      return true
    }
  )

  tryPush(
    results,
    'gw_create_bill_body_redact_secrets',
    'redactCreateBillBodyForLog: apikey/login убраны, остальные поля сохранены',
    () => {
      const body = buildCreateBillBody(
        { apikey: 'SECRET_AK', login: '79161234567' },
        {
          amount: 1,
          customerEmail: 't@example.com',
          orderNumber: 'ORD-3',
          callbackUrl: 'https://cb',
          description: 'Test'
        }
      )
      const redacted = redactCreateBillBodyForLog(body)
      const serialized = JSON.stringify(redacted)
      if (serialized.includes('SECRET_AK')) return false
      if (serialized.includes('79161234567')) return false
      if ('apikey' in redacted) return false
      if ('login' in redacted) return false
      if (redacted.amount !== '1.00') return false
      if (redacted.order.number !== 'ORD-3') return false
      return true
    }
  )
}

function runCredentialsMaskingChecks(results: GatewayUnitTestResult[]): void {
  tryPush(
    results,
    'gw_credentials_not_in_log_payload',
    'maskLpLogin / apikeyLength: секреты не попадают в сериализованный payload лога',
    () => {
      const login = '79161234567'
      const apikey = 'super_secret_apikey_value_long_string'

      const masked = maskLpLogin(login)
      if (masked === login) return false
      if (masked.includes(login)) return false

      const payload: Record<string, unknown> = {
        requestId: 'rid-1',
        op: 'getBillStatus',
        contour: 'bills_v1',
        method: 'GET',
        loginMask: masked,
        apikeyLength: apikey.length
      }
      const serialized = JSON.stringify(payload)
      if (serialized.includes(login)) return false
      if (serialized.includes(apikey)) return false

      const tampered: Record<string, unknown> = { ...payload, apikey, login }
      const tamperedSerialized = JSON.stringify(tampered)
      if (!tamperedSerialized.includes(login)) return false
      if (!tamperedSerialized.includes(apikey)) return false
      return true
    }
  )

  tryPush(
    results,
    'gw_masked_login_short_form',
    'maskLpLogin: некорректная длина → +7***',
    () => {
      if (maskLpLogin('123') !== '+7***') return false
      if (maskLpLogin('') !== '+7***') return false
      const masked = maskLpLogin('79161234567')
      if (!masked.startsWith('+')) return false
      if (!masked.includes('***')) return false
      return true
    }
  )
}

function runRedactRawDeepChecks(results: GatewayUnitTestResult[]): void {
  tryPush(
    results,
    'gw_redactraw_secrets_top',
    'redactRawDeep удаляет apikey/login/token на верхнем уровне',
    () => {
      const r = redactRawDeep({
        apikey: 'A', login: 'L', token: 'T',
        lp_apikey: 'X', lp_login: 'Y', lp_webhook_token: 'Z',
        keep: 'visible'
      }) as Record<string, unknown>
      return !('apikey' in r) && !('login' in r) && !('token' in r) &&
        !('lp_apikey' in r) && !('lp_login' in r) && !('lp_webhook_token' in r) &&
        r.keep === 'visible'
    }
  )
  tryPush(
    results,
    'gw_redactraw_headers_secrets',
    'redactRawDeep удаляет Authorization / X-Lp-* / Cookie',
    () => {
      const r = redactRawDeep({
        headers: { authorization: 'Bearer xx', 'X-Lp-Apikey': 'A', 'X-Lp-Login': 'L', cookie: 'c=1', other: 'ok' }
      }) as Record<string, unknown>
      const h = r.headers as Record<string, unknown>
      return !('authorization' in h) && !('X-Lp-Apikey' in h) &&
        !('X-Lp-Login' in h) && !('cookie' in h) && h.other === 'ok'
    }
  )
  tryPush(
    results,
    'gw_redactraw_pii_nested',
    'redactRawDeep маскирует email/phone/passport во вложенных объектах',
    () => {
      const r = redactRawDeep({
        customer: { email: 'a@b.com', phone: '79991234567', passport: '4500123456' },
        data: { '1': { fio: 'X', address: 'Y' } }
      }) as Record<string, unknown>
      const c = r.customer as Record<string, unknown>
      const d = r.data as Record<string, unknown>
      const d1 = d['1'] as Record<string, unknown>
      return typeof c.email === 'string' && c.email !== 'a@b.com' &&
        typeof c.phone === 'string' && c.phone !== '79991234567' &&
        c.passport === '***' && d1.fio === '***' && d1.address === '***'
    }
  )
  tryPush(
    results,
    'gw_redactraw_truncation',
    'redactRawDeep усекает payload > MAX_RAW_BYTES',
    () => {
      const big = { data: 'x'.repeat(MAX_RAW_BYTES + 100) }
      const r = redactRawDeep(big) as Record<string, unknown>
      return r.__truncated === true &&
        typeof r.__originalBytes === 'number' &&
        (r.__originalBytes as number) > MAX_RAW_BYTES &&
        typeof r.__preview === 'string' &&
        (r.__preview as string).length === MAX_RAW_BYTES
    }
  )
  tryPush(
    results,
    'gw_redactraw_circular',
    'redactRawDeep заменяет цикл на __circular',
    () => {
      const obj: Record<string, unknown> = { a: 1 }
      obj.self = obj
      const r = redactRawDeep(obj) as Record<string, unknown>
      return r.a === 1 && r.self === '__circular'
    }
  )
  tryPush(
    results,
    'gw_redactraw_function_nonserializable',
    'redactRawDeep заменяет function на __nonSerializable',
    () => {
      const r = redactRawDeep({ fn: () => 1, ok: 'v' }) as Record<string, unknown>
      return r.fn === '__nonSerializable' && r.ok === 'v'
    }
  )
  tryPush(
    results,
    'gw_redactraw_array_root',
    'redactRawDeep корректно обрабатывает массив-корень',
    () => {
      const r = redactRawDeep([{ email: 'a@b.c' }, { passport: '1' }]) as unknown[]
      const r0 = r[0] as Record<string, unknown>
      const r1 = r[1] as Record<string, unknown>
      return Array.isArray(r) && r.length === 2 &&
        typeof r0.email === 'string' && r0.email !== 'a@b.c' &&
        r1.passport === '***'
    }
  )
  tryPush(
    results,
    'gw_redactraw_primitive_root',
    'redactRawDeep возвращает примитивы как есть',
    () =>
      redactRawDeep('hello') === 'hello' &&
      redactRawDeep(42) === 42 &&
      redactRawDeep(null) === null &&
      redactRawDeep(true) === true
  )
}

function runGatewayCatalogSyncCheck(
  results: GatewayUnitTestResult[],
  idsBefore: ReadonlyArray<string>
): void {
  tryPush(
    results,
    'catalog_gateway_ids_match_runner',
    'unit-gateway: каталог содержит все id прогона gateway-набора',
    () => {
      const block = UNIT_TEST_BLOCKS.find((b) => b.id === GATEWAY_BLOCK_ID)
      if (!block) return false
      const fromRunner = new Set(idsBefore)
      const fromCatalog = new Set(flattenCatalogBlocks([block]).map((t) => t.id))
      for (const id of fromRunner) {
        if (!fromCatalog.has(id)) return false
      }
      return true
    }
  )
}

export function runGatewayUnitChecks(): GatewayUnitTestResult[] {
  const results: GatewayUnitTestResult[] = []

  runBillsV1SemanticChecks(results)
  runCredentialsMaskingChecks(results)
  runRedactRawDeepChecks(results)

  const idsBeforeSyncCheck = results.map((r) => r.id)
  runGatewayCatalogSyncCheck(results, idsBeforeSyncCheck)

  return results
}
