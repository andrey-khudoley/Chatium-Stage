/**
 * Фаза 3 юнит-сьюта LifePay: валидация настроек панели и фильтра дат.
 *
 *   - runSettingsValidationChecks: isValidLpLogin, normalizeGatewayBaseUrl,
 *     isValidGatewayBaseUrl, generateWebhookToken;
 *   - runDateFilterChecks: isValidDateFilter / normalizeDateFilter
 *     (предикат валидности и нормализация границ).
 */

import {
  isValidLpLogin,
  normalizeGatewayBaseUrl,
  isValidGatewayBaseUrl,
  generateWebhookToken,
  LP_WEBHOOK_TOKEN_MIN_LENGTH,
  isValidDateFilter,
  normalizeDateFilter
} from '../settings.lib'
import { tryPush, type LifepayUnitTestResult } from './lifepayUnitHelpers'

export function runSettingsValidationChecks(results: LifepayUnitTestResult[]): void {
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

export function runDateFilterChecks(results: LifepayUnitTestResult[]): void {
  // isValidDateFilter — предикат валидности фильтра панели.
  tryPush(
    results,
    'df_isvalid_empty',
    'isValidDateFilter({}) → true (фильтр не задан)',
    () => isValidDateFilter({}) === true
  )
  tryPush(
    results,
    'df_isvalid_only_from',
    'isValidDateFilter({from}) → true',
    () => isValidDateFilter({ from: 1000 }) === true
  )
  tryPush(
    results,
    'df_isvalid_only_to',
    'isValidDateFilter({to}) → true',
    () => isValidDateFilter({ to: 2000 }) === true
  )
  tryPush(
    results,
    'df_isvalid_both_ok',
    'isValidDateFilter(from<to) → true',
    () => isValidDateFilter({ from: 1000, to: 2000 }) === true
  )
  tryPush(
    results,
    'df_isvalid_both_equal',
    'isValidDateFilter(from===to) → true',
    () => isValidDateFilter({ from: 1500, to: 1500 }) === true
  )
  tryPush(
    results,
    'df_isvalid_from_gt_to',
    'isValidDateFilter(from>to) → false',
    () => isValidDateFilter({ from: 2000, to: 1000 }) === false
  )
  tryPush(
    results,
    'df_isvalid_string_bound',
    'isValidDateFilter({from:"x"}) → false',
    () => isValidDateFilter({ from: 'x' as unknown as number }) === false
  )
  tryPush(
    results,
    'df_isvalid_zero',
    'isValidDateFilter({from:0}) → false (нужно > 0)',
    () => isValidDateFilter({ from: 0 }) === false
  )
  tryPush(
    results,
    'df_isvalid_negative',
    'isValidDateFilter({to:-5}) → false',
    () => isValidDateFilter({ to: -5 }) === false
  )
  tryPush(
    results,
    'df_isvalid_nan',
    'isValidDateFilter({from:NaN}) → false',
    () => isValidDateFilter({ from: NaN }) === false
  )
  tryPush(
    results,
    'df_isvalid_non_object',
    'isValidDateFilter(null/строка/число) → false',
    () =>
      isValidDateFilter(null) === false &&
      isValidDateFilter('x') === false &&
      isValidDateFilter(5) === false
  )

  // normalizeDateFilter — нормализация (floor, отбрасывание невалидного, {} при from>to).
  tryPush(results, 'df_norm_floor', 'normalizeDateFilter floors дробные границы', () => {
    const r = normalizeDateFilter({ from: 1000.9, to: 2000.9 })
    return r.from === 1000 && r.to === 2000
  })
  tryPush(results, 'df_norm_only_from', 'normalizeDateFilter({from}) → only from', () => {
    const r = normalizeDateFilter({ from: 1500 })
    return r.from === 1500 && r.to === undefined
  })
  tryPush(
    results,
    'df_norm_drop_invalid',
    'normalizeDateFilter отбрасывает невалидную границу',
    () => {
      const r = normalizeDateFilter({ from: 'x' as unknown as number, to: 2000 })
      return r.from === undefined && r.to === 2000
    }
  )
  tryPush(results, 'df_norm_empty_on_from_gt_to', 'normalizeDateFilter(from>to) → {}', () => {
    const r = normalizeDateFilter({ from: 5000, to: 1000 })
    return r.from === undefined && r.to === undefined
  })
  tryPush(results, 'df_norm_non_object', 'normalizeDateFilter(null/число) → {}', () => {
    const a = normalizeDateFilter(null)
    const b = normalizeDateFilter(42)
    return a.from === undefined && a.to === undefined && b.from === undefined && b.to === undefined
  })
  tryPush(results, 'df_norm_empty_input', 'normalizeDateFilter({}) → {}', () => {
    const r = normalizeDateFilter({})
    return r.from === undefined && r.to === undefined
  })
}
