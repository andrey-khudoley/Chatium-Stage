/**
 * Юнит-набор клиентской панели LifePay
 * (implementation-plan §1.8.2, §1.8.3; критерий приёмки №8).
 *
 * Не требует Heap и сети: проверяет чистые функции сборки URL, маскировки,
 * парсинга webhook, валидаций настроек. Покрытие веток §10:
 *   - сборка URL для POST/GET;
 *   - args без секретов;
 *   - редакция email/phone;
 *   - валидация login/токена;
 *   - парсинг webhook + извлечение order.number;
 *   - проверка токена webhook.
 */

import { buildInvokeUrl } from '../gateway/buildInvokeUrl'
import {
  redactEmail,
  redactPhone,
  redactArgsForLog,
  extractOrderNumber
} from '../../shared/redact'
import { redactRawDeep, MAX_RAW_BYTES } from '../../shared/redactRaw'
import {
  findOperationInCatalog,
  getOpHttpMethod,
  OPERATIONS_CATALOG
} from '../../shared/gatewayContract'
import {
  isValidLpLogin,
  normalizeGatewayBaseUrl,
  isValidGatewayBaseUrl,
  generateWebhookToken,
  LP_WEBHOOK_TOKEN_MIN_LENGTH
} from '../settings.lib'
import {
  parseWebhookBody,
  checkWebhookToken,
  unwrapWebhookBody,
  extractMultipartTextPayload
} from '../webhook/processWebhook'
import { classifyInvite } from '../access/invites'
import { decideInternalAccess } from '../access/requireInternalAccess'

export type LifepayUnitTestResult = {
  id: string
  title: string
  passed: boolean
  error?: string
}

function push(
  results: LifepayUnitTestResult[],
  id: string,
  title: string,
  passed: boolean,
  error?: string
): void {
  results.push({ id, title, passed, ...(error ? { error } : {}) })
}

function tryPush(
  results: LifepayUnitTestResult[],
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

function runCatalogChecks(results: LifepayUnitTestResult[]): void {
  tryPush(
    results,
    'lp_catalog_three_ops',
    'OPERATIONS_CATALOG содержит createBill/getBillStatus/cancelBill',
    () => {
      const ops = OPERATIONS_CATALOG.map((e) => e.op).sort()
      return (
        ops.length === 3 &&
        ops[0] === 'cancelBill' &&
        ops[1] === 'createBill' &&
        ops[2] === 'getBillStatus'
      )
    }
  )

  tryPush(
    results,
    'lp_catalog_methods',
    'createBill=POST, getBillStatus=GET, cancelBill=POST',
    () =>
      getOpHttpMethod('createBill') === 'POST' &&
      getOpHttpMethod('getBillStatus') === 'GET' &&
      getOpHttpMethod('cancelBill') === 'POST' &&
      getOpHttpMethod('unknown') === null
  )

  tryPush(
    results,
    'lp_catalog_findOperation',
    'findOperationInCatalog возвращает null для unknown',
    () => findOperationInCatalog('createBill') !== null && findOperationInCatalog('xxx') === null
  )
}

function runUrlBuildChecks(results: LifepayUnitTestResult[]): void {
  tryPush(
    results,
    'lp_invoke_url_build_post',
    'buildInvokeUrl(base, createBill) → POST /api/v1/createBill',
    () => {
      const r = buildInvokeUrl('https://gw.example.com/p/saas/gw/lifepay', 'createBill')
      return r.kind === 'ok' && r.method === 'POST' && r.url === 'https://gw.example.com/p/saas/gw/lifepay/api/v1/createBill'
    }
  )

  tryPush(
    results,
    'lp_invoke_url_build_get',
    'buildInvokeUrl(base, getBillStatus) → GET /api/v1/getBillStatus',
    () => {
      const r = buildInvokeUrl('https://gw.example.com', 'getBillStatus')
      return r.kind === 'ok' && r.method === 'GET' && r.url === 'https://gw.example.com/api/v1/getBillStatus'
    }
  )

  tryPush(
    results,
    'lp_invoke_url_trailing_slash',
    'buildInvokeUrl обрезает trailing slash',
    () => {
      const r = buildInvokeUrl('https://gw.example.com/', 'createBill')
      return r.kind === 'ok' && r.url === 'https://gw.example.com/api/v1/createBill'
    }
  )

  tryPush(
    results,
    'lp_invoke_unknown_op',
    'buildInvokeUrl(base, "xxx") → op_unknown',
    () => buildInvokeUrl('https://gw.example.com', 'xxx').kind === 'op_unknown'
  )

  tryPush(
    results,
    'lp_invoke_empty_base_url',
    'buildInvokeUrl("", "createBill") → base_url_invalid',
    () => buildInvokeUrl('', 'createBill').kind === 'base_url_invalid'
  )
}

function runRedactionChecks(results: LifepayUnitTestResult[]): void {
  tryPush(
    results,
    'lp_redact_email',
    'redactEmail("user@example.com") → "u***@e***.com"',
    () => redactEmail('user@example.com') === 'u***@e***.com'
  )

  tryPush(
    results,
    'lp_redact_email_no_at',
    'redactEmail("not-email") → "***"',
    () => redactEmail('not-email') === '***'
  )

  tryPush(
    results,
    'lp_redact_phone',
    'redactPhone("79991234567") → "+7***4567"',
    () => redactPhone('79991234567') === '+7***4567'
  )

  tryPush(
    results,
    'lp_redact_phone_short',
    'redactPhone("12") → "***"',
    () => redactPhone('12') === '***'
  )

  tryPush(
    results,
    'lp_invoke_redact_email_in_args',
    'redactArgsForLog маскирует customerEmail',
    () => {
      const r = redactArgsForLog({
        orderNumber: 'A1',
        amount: 1.0,
        customerEmail: 'tester@khudoley.pro'
      })
      return r.customerEmail === 't***@k***.pro' && r.orderNumber === 'A1' && r.amount === 1.0
    }
  )

  tryPush(
    results,
    'lp_invoke_redact_phone_in_args',
    'redactArgsForLog маскирует customerPhone',
    () => {
      const r = redactArgsForLog({ customerPhone: '79991234567' })
      return r.customerPhone === '+7***4567'
    }
  )

  tryPush(
    results,
    'lp_invoke_no_secrets_in_args_redacted',
    'redactArgsForLog удаляет apikey/login/token',
    () => {
      const r = redactArgsForLog({
        apikey: 'SECRET',
        login: '79991234567',
        token: 'WEBHOOK_SECRET',
        orderNumber: 'A2'
      }) as Record<string, unknown>
      return (
        !('apikey' in r) &&
        !('login' in r) &&
        !('token' in r) &&
        r.orderNumber === 'A2'
      )
    }
  )

  tryPush(
    results,
    'lp_extract_order_number',
    'extractOrderNumber возвращает строку из args',
    () =>
      extractOrderNumber({ orderNumber: 'A3' }) === 'A3' &&
      extractOrderNumber({ orderNumber: 42 }) === '' &&
      extractOrderNumber(null) === ''
  )
}

function runRedactRawDeepChecks(results: LifepayUnitTestResult[]): void {
  // 1. Удаление секретов на любом уровне.
  tryPush(
    results,
    'lp_redactraw_secrets_top',
    'redactRawDeep удаляет apikey/login/token на верхнем уровне',
    () => {
      const r = redactRawDeep({
        apikey: 'SECRET',
        login: 'LOGIN',
        token: 'TOK',
        lp_apikey: 'X',
        lp_login: 'Y',
        lp_webhook_token: 'Z',
        keep: 'visible'
      }) as Record<string, unknown>
      return !('apikey' in r) && !('login' in r) && !('token' in r) &&
        !('lp_apikey' in r) && !('lp_login' in r) && !('lp_webhook_token' in r) &&
        r.keep === 'visible'
    }
  )
  tryPush(
    results,
    'lp_redactraw_secrets_nested',
    'redactRawDeep удаляет секреты в вложенных объектах и массивах',
    () => {
      const r = redactRawDeep({
        headers: { authorization: 'Bearer xx', 'X-Lp-Apikey': 'A', other: 'ok' },
        list: [{ apikey: 'S', name: 'n' }]
      }) as Record<string, unknown>
      const h = r.headers as Record<string, unknown>
      const list0 = (r.list as Array<Record<string, unknown>>)[0]
      return !('authorization' in h) && !('X-Lp-Apikey' in h) && h.other === 'ok' &&
        !('apikey' in list0) && list0.name === 'n'
    }
  )

  // 2. Маскирование email/phone (рекурсивно).
  tryPush(
    results,
    'lp_redactraw_email_nested',
    'redactRawDeep маскирует email в customer.email',
    () => {
      const r = redactRawDeep({
        customer: { email: 'user@example.com', phone: '79991234567' }
      }) as Record<string, unknown>
      const c = r.customer as Record<string, unknown>
      return typeof c.email === 'string' && c.email !== 'user@example.com' &&
        typeof c.phone === 'string' && c.phone !== '79991234567'
    }
  )

  // 3. Маскирование прочих PII (passport, inn, fio, address).
  tryPush(
    results,
    'lp_redactraw_pii_other',
    'redactRawDeep маскирует passport/inn/fio/address на ***',
    () => {
      const r = redactRawDeep({
        passport: '1234567890',
        inn: '770101101010',
        fio: 'Иван Иванов',
        address: 'Москва, ул. Ленина 1',
        nested: { fullname: 'Some One' }
      }) as Record<string, unknown>
      const n = r.nested as Record<string, unknown>
      return r.passport === '***' && r.inn === '***' && r.fio === '***' &&
        r.address === '***' && n.fullname === '***'
    }
  )

  // 4. Усечение payload > 64KB.
  tryPush(
    results,
    'lp_redactraw_truncation',
    'redactRawDeep усекает payload > MAX_RAW_BYTES',
    () => {
      const big = { data: 'x'.repeat(MAX_RAW_BYTES + 100) }
      const r = redactRawDeep(big) as Record<string, unknown>
      return r.__truncated === true && typeof r.__originalBytes === 'number' &&
        (r.__originalBytes as number) > MAX_RAW_BYTES &&
        typeof r.__preview === 'string' && (r.__preview as string).length === MAX_RAW_BYTES
    }
  )

  // 5. Не-сериализуемые значения.
  tryPush(
    results,
    'lp_redactraw_non_serializable',
    'redactRawDeep заменяет functions на __nonSerializable',
    () => {
      const r = redactRawDeep({ fn: () => 1, ok: 'v' }) as Record<string, unknown>
      return r.fn === '__nonSerializable' && r.ok === 'v'
    }
  )

  // 6. Циклические ссылки.
  tryPush(
    results,
    'lp_redactraw_circular',
    'redactRawDeep ловит циклические ссылки',
    () => {
      const obj: Record<string, unknown> = { name: 'a' }
      obj.self = obj
      const r = redactRawDeep(obj) as Record<string, unknown>
      return r.name === 'a' && r.self === '__circular'
    }
  )

  // 7. Массивы как корень.
  tryPush(
    results,
    'lp_redactraw_array_root',
    'redactRawDeep корректно обрабатывает массив в корне',
    () => {
      const r = redactRawDeep([{ email: 'a@b.c' }, { passport: '1' }]) as unknown[]
      const r0 = r[0] as Record<string, unknown>
      const r1 = r[1] as Record<string, unknown>
      return Array.isArray(r) && r.length === 2 &&
        typeof r0.email === 'string' && r0.email !== 'a@b.c' &&
        r1.passport === '***'
    }
  )

  // 8. Примитивы как корень — возвращаются как есть.
  tryPush(
    results,
    'lp_redactraw_primitive_root',
    'redactRawDeep возвращает примитивы без изменений',
    () =>
      redactRawDeep('hello') === 'hello' &&
      redactRawDeep(42) === 42 &&
      redactRawDeep(null) === null &&
      redactRawDeep(true) === true
  )
}

function runSettingsValidationChecks(results: LifepayUnitTestResult[]): void {
  tryPush(
    results,
    'lp_login_valid',
    'isValidLpLogin принимает 11 цифр с первой 7',
    () => isValidLpLogin('79991234567') === true
  )

  tryPush(
    results,
    'lp_login_invalid_wrong_first',
    'isValidLpLogin отвергает первую цифру != 7',
    () => isValidLpLogin('89991234567') === false
  )

  tryPush(
    results,
    'lp_login_invalid_length',
    'isValidLpLogin отвергает != 11 цифр',
    () => isValidLpLogin('7999123456') === false && isValidLpLogin('799912345678') === false
  )

  tryPush(
    results,
    'lp_gateway_base_url_normalize',
    'normalizeGatewayBaseUrl обрезает trailing slash',
    () =>
      normalizeGatewayBaseUrl('https://gw.example.com/') === 'https://gw.example.com' &&
      normalizeGatewayBaseUrl('  https://gw.example.com  ') === 'https://gw.example.com'
  )

  tryPush(
    results,
    'lp_gateway_base_url_valid',
    'isValidGatewayBaseUrl: http(s)://...',
    () =>
      isValidGatewayBaseUrl('https://gw.example.com') === true &&
      isValidGatewayBaseUrl('http://localhost:3000') === true &&
      isValidGatewayBaseUrl('ftp://x.y') === false &&
      isValidGatewayBaseUrl('') === false
  )

  tryPush(
    results,
    'lp_generate_webhook_token_min_length',
    'generateWebhookToken() >= LP_WEBHOOK_TOKEN_MIN_LENGTH',
    () => {
      const t = generateWebhookToken()
      return typeof t === 'string' && t.length >= LP_WEBHOOK_TOKEN_MIN_LENGTH
    }
  )

  tryPush(
    results,
    'lp_generate_webhook_token_hex',
    'generateWebhookToken() только hex-символы',
    () => /^[0-9a-f]+$/.test(generateWebhookToken())
  )
}

function runWebhookParseChecks(results: LifepayUnitTestResult[]): void {
  tryPush(
    results,
    'lp_webhook_parse_basic',
    'parseWebhookBody читает основные поля',
    () => {
      const r = parseWebhookBody({
        number: '123',
        type: 'payment',
        status: 'success',
        method: 'internetAcquiring',
        amount: '1.00',
        order: { number: 'A4' }
      })
      return (
        r.number === '123' &&
        r.type === 'payment' &&
        r.status === 'success' &&
        r.method === 'internetAcquiring' &&
        r.amount === '1.00' &&
        r.orderNumber === 'A4'
      )
    }
  )

  tryPush(
    results,
    'lp_webhook_extract_order_number_nested',
    'parseWebhookBody извлекает order.number из вложенного JSON',
    () => parseWebhookBody({ number: 'x', order: { number: 'NESTED1' } }).orderNumber === 'NESTED1'
  )

  tryPush(
    results,
    'lp_webhook_email_raw',
    'parseWebhookBody возвращает сырой email (без маскирования)',
    () => {
      const r = parseWebhookBody({ number: '1', email: 'buyer@shop.ru' })
      return r.email === 'buyer@shop.ru'
    }
  )

  tryPush(
    results,
    'lp_webhook_email_from_customer',
    'parseWebhookBody берёт email из customer.email при отсутствии в корне',
    () => {
      const r = parseWebhookBody({ number: '1', customer: { email: 'x@y.z' } })
      return r.email === 'x@y.z'
    }
  )

  tryPush(
    results,
    'lp_webhook_no_body',
    'parseWebhookBody на пустом body возвращает пустые строки',
    () => {
      const r = parseWebhookBody(null)
      return r.number === '' && r.orderNumber === '' && r.email === ''
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_object',
    'unwrapWebhookBody: чистый объект → strategy=object',
    () => {
      const u = unwrapWebhookBody({ number: '1', type: 'payment' }, 'application/json')
      return (
        u.strategy === 'object' &&
        typeof u.payload === 'object' &&
        (u.payload as Record<string, unknown>).number === '1'
      )
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_json_string',
    'unwrapWebhookBody: JSON-строка → strategy=json_string',
    () => {
      const u = unwrapWebhookBody(
        '{"number":"X9","type":"payment","order":{"number":"ORD1"}}',
        'text/plain'
      )
      const p = u.payload as Record<string, unknown>
      return (
        u.strategy === 'json_string' &&
        p.number === 'X9' &&
        (p.order as Record<string, unknown>).number === 'ORD1'
      )
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_form_data_field',
    'unwrapWebhookBody: {data:"<json>"} → strategy=form_data_field_json',
    () => {
      const u = unwrapWebhookBody(
        { data: '{"number":"Y2","status":"success"}' },
        'application/x-www-form-urlencoded'
      )
      const p = u.payload as Record<string, unknown>
      return u.strategy === 'form_data_field_json' && p.number === 'Y2' && p.status === 'success'
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_object_data_field',
    'unwrapWebhookBody: {data:{<object>}} → strategy=object_data_field',
    () => {
      const u = unwrapWebhookBody(
        { data: { number: 'V5', type: 'payment', order: { number: 'ORDV5' } } },
        'application/json'
      )
      const p = u.payload as Record<string, unknown>
      return (
        u.strategy === 'object_data_field' &&
        p.number === 'V5' &&
        (p.order as Record<string, unknown>).number === 'ORDV5'
      )
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_json_string_data_object',
    'unwrapWebhookBody: \'{"data":{...}}\' → strategy=object_data_field',
    () => {
      const u = unwrapWebhookBody(
        '{"data":{"number":"U6","type":"refund"}}',
        'application/json'
      )
      const p = u.payload as Record<string, unknown>
      return u.strategy === 'object_data_field' && p.number === 'U6' && p.type === 'refund'
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_form_urlencoded_string',
    'unwrapWebhookBody: строка "a=1&b=2" → strategy=form_flat',
    () => {
      const u = unwrapWebhookBody('number=Z3&type=payment&amount=10.00', '')
      const p = u.payload as Record<string, unknown>
      return u.strategy === 'form_flat' && p.number === 'Z3' && p.type === 'payment'
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_form_urlencoded_data_json',
    'unwrapWebhookBody: строка "data=<urlencoded-json>" → strategy=form_data_field_json',
    () => {
      const json = '{"number":"W4","type":"refund"}'
      const u = unwrapWebhookBody(`data=${encodeURIComponent(json)}`, '')
      const p = u.payload as Record<string, unknown>
      return u.strategy === 'form_data_field_json' && p.number === 'W4' && p.type === 'refund'
    }
  )

  tryPush(
    results,
    'lp_webhook_unwrap_null',
    'unwrapWebhookBody(null) → strategy=noop',
    () => {
      const u = unwrapWebhookBody(null, '')
      return u.strategy === 'noop' && u.payload === null
    }
  )

  tryPush(
    results,
    'lp_webhook_multipart_files_data_string',
    'extractMultipartTextPayload: req.files.data — строка',
    () => {
      const got = extractMultipartTextPayload(
        { data: '{"number":"M1","status":"success"}' },
        undefined
      )
      return (
        got !== undefined &&
        typeof (got as Record<string, unknown>).data === 'string' &&
        (got as Record<string, unknown>).data === '{"number":"M1","status":"success"}'
      )
    }
  )

  tryPush(
    results,
    'lp_webhook_multipart_files_data_wrapped',
    'extractMultipartTextPayload: req.files.data — обёртка {content:"<json>"}',
    () => {
      const got = extractMultipartTextPayload(
        { data: { content: '{"number":"M2"}' } },
        undefined
      ) as Record<string, unknown> | undefined
      return !!got && typeof got.data === 'string' && got.data === '{"number":"M2"}'
    }
  )

  tryPush(
    results,
    'lp_webhook_multipart_fields_data',
    'extractMultipartTextPayload: data в req.fields, не в req.files',
    () => {
      const got = extractMultipartTextPayload(
        undefined,
        { data: '{"number":"M3"}' }
      ) as Record<string, unknown> | undefined
      return !!got && typeof got.data === 'string' && got.data === '{"number":"M3"}'
    }
  )

  tryPush(
    results,
    'lp_webhook_multipart_none',
    'extractMultipartTextPayload: ни files, ни fields — undefined',
    () => {
      const got = extractMultipartTextPayload(undefined, undefined)
      return got === undefined
    }
  )

  tryPush(
    results,
    'lp_webhook_multipart_buffer_data',
    'extractMultipartTextPayload: Buffer-like {type:"Buffer", data:[...bytes]}',
    () => {
      const jsonStr = '{"number":"M4"}'
      const bytes = []
      for (let i = 0; i < jsonStr.length; i++) bytes.push(jsonStr.charCodeAt(i))
      const got = extractMultipartTextPayload(
        { data: { type: 'Buffer', data: bytes } },
        undefined
      ) as Record<string, unknown> | undefined
      return !!got && typeof got.data === 'string' && got.data === jsonStr
    }
  )
}

function runWebhookTokenChecks(results: LifepayUnitTestResult[]): void {
  tryPush(
    results,
    'lp_webhook_token_not_configured',
    'checkWebhookToken(any, "") → "not_configured"',
    () => checkWebhookToken('x', '') === 'not_configured'
  )

  tryPush(
    results,
    'lp_webhook_token_missing',
    'checkWebhookToken(null, "set") → "missing"',
    () =>
      checkWebhookToken(null, 'real-token-12345678901234567890') === 'missing' &&
      checkWebhookToken(undefined, 'real-token-12345678901234567890') === 'missing'
  )

  tryPush(
    results,
    'lp_webhook_token_mismatch_403',
    'checkWebhookToken("wrong", "right") → "mismatch"',
    () => checkWebhookToken('wrong', 'right') === 'mismatch'
  )

  tryPush(
    results,
    'lp_webhook_token_valid',
    'checkWebhookToken("same", "same") → "valid"',
    () => checkWebhookToken('abc123', 'abc123') === 'valid'
  )
}

function runAccessChecks(results: LifepayUnitTestResult[]): void {
  const now = 1_000_000

  // classifyInvite
  tryPush(results, 'access_classify_unknown', 'classifyInvite(null) → unknown', () =>
    classifyInvite(null, now) === 'unknown'
  )
  tryPush(results, 'access_classify_used', 'classifyInvite(usedAt) → used', () =>
    classifyInvite({ usedAt: 5, expiresAt: now + 1000 }, now) === 'used'
  )
  tryPush(results, 'access_classify_revoked', 'classifyInvite(revokedAt) → revoked', () =>
    classifyInvite({ revokedAt: 5, expiresAt: now + 1000 }, now) === 'revoked'
  )
  tryPush(results, 'access_classify_expired', 'classifyInvite(expiresAt<now) → expired', () =>
    classifyInvite({ expiresAt: now - 1 }, now) === 'expired'
  )
  tryPush(results, 'access_classify_valid', 'classifyInvite(свежий) → valid', () =>
    classifyInvite({ expiresAt: now + 1000 }, now) === 'valid'
  )
  tryPush(
    results,
    'access_classify_used_precedence',
    'classifyInvite: used приоритетнее revoked/expired',
    () => classifyInvite({ usedAt: 5, revokedAt: 5, expiresAt: now - 1 }, now) === 'used'
  )

  // decideInternalAccess
  tryPush(results, 'access_decide_admin', 'decideInternalAccess(admin) → true', () =>
    decideInternalAccess(true, false) === true
  )
  tryPush(results, 'access_decide_grant', 'decideInternalAccess(grant) → true', () =>
    decideInternalAccess(false, true) === true
  )
  tryPush(results, 'access_decide_none', 'decideInternalAccess(нет) → false', () =>
    decideInternalAccess(false, false) === false
  )
}

export async function runLifepayUnitChecks(): Promise<{
  success: boolean
  results: LifepayUnitTestResult[]
  summary: { total: number; passed: number; failed: number }
}> {
  const results: LifepayUnitTestResult[] = []

  runCatalogChecks(results)
  runUrlBuildChecks(results)
  runRedactionChecks(results)
  runRedactRawDeepChecks(results)
  runSettingsValidationChecks(results)
  runWebhookParseChecks(results)
  runWebhookTokenChecks(results)
  runAccessChecks(results)

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  return {
    success: failed === 0,
    results,
    summary: { total: results.length, passed, failed }
  }
}
