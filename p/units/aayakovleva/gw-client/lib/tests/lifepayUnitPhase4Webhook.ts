/**
 * Фаза 4 юнит-сьюта LifePay: парсинг и проверка webhook.
 *
 *   - runWebhookParseChecks: parseWebhookBody, unwrapWebhookBody (все стратегии),
 *     extractDataFromRawMultipart, isSuccessfulPayment;
 *   - runWebhookReadChecks: readWebhookDataField (FormData string / File / absent);
 *   - runWebhookTokenChecks: checkWebhookToken (not_configured / missing / mismatch / valid).
 */

import {
  parseWebhookBody,
  checkWebhookToken,
  unwrapWebhookBody,
  readWebhookDataField,
  extractDataFromRawMultipart,
  isSuccessfulPayment
} from '../webhook/processWebhook'
import { tryPush, tryPushAsync, type LifepayUnitTestResult } from './lifepayUnitHelpers'

export function runWebhookParseChecks(results: LifepayUnitTestResult[]): void {
  tryPush(results, 'lp_webhook_parse_basic', 'parseWebhookBody читает основные поля', () => {
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
  })

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
      const u = unwrapWebhookBody('{"data":{"number":"U6","type":"refund"}}', 'application/json')
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

  tryPush(results, 'lp_webhook_unwrap_null', 'unwrapWebhookBody(null) → strategy=noop', () => {
    const u = unwrapWebhookBody(null, '')
    return u.strategy === 'noop' && u.payload === null
  })

  tryPush(
    results,
    'lp_webhook_raw_multipart_extract',
    'extractDataFromRawMultipart: достаёт поле data из сырого multipart-тела',
    () => {
      const json = '{"number":"M4","status":"success"}'
      const raw =
        '--BOUNDARY\r\n' +
        'Content-Disposition: form-data; name="data"\r\n' +
        '\r\n' +
        json +
        '\r\n--BOUNDARY--\r\n'
      if (extractDataFromRawMultipart(raw, 'data') !== json) return false
      // нет нужного поля → null
      if (extractDataFromRawMultipart(raw, 'other') !== null) return false
      // не multipart → null
      if (extractDataFromRawMultipart('{"plain":"json"}', 'data') !== null) return false
      return true
    }
  )

  tryPush(
    results,
    'lp_webhook_success_condition',
    'isSuccessfulPayment: только payment+success → true',
    () => {
      const make = (type: string, status: string) =>
        isSuccessfulPayment({
          number: '1',
          type,
          status,
          method: 'sbp',
          amount: '1.00',
          orderNumber: 'O',
          email: ''
        })
      if (make('payment', 'success') !== true) return false
      if (make('payment', 'fail') !== false) return false
      if (make('refund', 'success') !== false) return false
      if (make('', '') !== false) return false
      return true
    }
  )
}

export async function runWebhookReadChecks(results: LifepayUnitTestResult[]): Promise<void> {
  // FormData с текстовым полем `data` (типичный LifePay-multipart).
  await tryPushAsync(
    results,
    'lp_webhook_formdata_string',
    'readWebhookDataField: текстовое поле data → строка',
    async () => {
      const form = { get: (k: string) => (k === 'data' ? '{"number":"F1"}' : null) }
      return (await readWebhookDataField(form, 'data')) === '{"number":"F1"}'
    }
  )

  // FormData, где `data` пришёл File-подобным объектом — читаем через .text().
  await tryPushAsync(
    results,
    'lp_webhook_formdata_file',
    'readWebhookDataField: File-подобное поле → .text()',
    async () => {
      const form = {
        get: (k: string) =>
          k === 'data'
            ? { name: 'data', type: 'application/json', text: async () => '{"number":"F2"}' }
            : null
      }
      return (await readWebhookDataField(form, 'data')) === '{"number":"F2"}'
    }
  )

  // Поля нет / FormData отсутствует → null.
  await tryPushAsync(
    results,
    'lp_webhook_formdata_absent',
    'readWebhookDataField: нет поля / нет form → null',
    async () => {
      const empty = { get: () => null }
      if ((await readWebhookDataField(empty, 'data')) !== null) return false
      if ((await readWebhookDataField(null, 'data')) !== null) return false
      if ((await readWebhookDataField(undefined, 'data')) !== null) return false
      return true
    }
  )
}

export function runWebhookTokenChecks(results: LifepayUnitTestResult[]): void {
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
