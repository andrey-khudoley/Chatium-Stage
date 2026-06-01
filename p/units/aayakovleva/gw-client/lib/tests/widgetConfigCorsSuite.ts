/**
 * Юнит-набор: per-method CORS-логика `api/widgets/config`.
 *
 * Тестирует pure-функцию `checkWidgetOrigin` из `shared/widgetCorsCheck` и
 * правило `enabled = cors.allowed && methodEnabled`. Без Heap и сети.
 *
 * Кейсы охватывают:
 *   - разделение lifepay/lavatop allow-list (origin в одном → не в другом);
 *   - origin вне обоих списков → оба false (→ 403);
 *   - отсутствие Origin и Referer → fail-closed;
 *   - fallback на Referer с путём и query;
 *   - пустой Referer → fail-closed;
 *   - форматы whitelist (host, https://host, https://host:port, https://host/path);
 *   - домен в обоих списках → оба allowed=true (нет регресса);
 *   - взаимодействие CORS-конъюнкта с флагом метода.
 */

import { tryPush, type LifepayUnitTestResult } from './lifepayUnitHelpers'
import { checkWidgetOrigin } from '../../shared/widgetCorsCheck'

export type { LifepayUnitTestResult } from './lifepayUnitHelpers'

export function runWidgetConfigCorsChecks(results: LifepayUnitTestResult[]): void {
  // --- origin из lifepay-списка → lifepay allowed, lavatop не allowed ---
  tryPush(
    results,
    'widget_config_cors_lifepay_origin_only',
    'origin из lifepay-списка → lifepay allowed=true, lavatop allowed=false',
    () => {
      const headers = { origin: 'https://shop.example.com' }
      const lp = checkWidgetOrigin(headers, 'shop.example.com')
      const lt = checkWidgetOrigin(headers, 'other.example.com')
      return lp.allowed === true && lt.allowed === false
    }
  )

  // --- origin из lavatop-списка → симметрично ---
  tryPush(
    results,
    'widget_config_cors_lavatop_origin_only',
    'origin из lavatop-списка → lavatop allowed=true, lifepay allowed=false',
    () => {
      const headers = { origin: 'https://store.example.com' }
      const lp = checkWidgetOrigin(headers, 'shop.example.com')
      const lt = checkWidgetOrigin(headers, 'store.example.com')
      return lt.allowed === true && lp.allowed === false
    }
  )

  // --- origin вне обоих списков → оба false ---
  tryPush(
    results,
    'widget_config_cors_origin_not_in_any_list',
    'origin вне обоих списков → оба allowed=false (→ 403)',
    () => {
      const headers = { origin: 'https://unknown.example.com' }
      const lp = checkWidgetOrigin(headers, 'shop.example.com')
      const lt = checkWidgetOrigin(headers, 'store.example.com')
      return lp.allowed === false && lt.allowed === false
    }
  )

  // --- нет Origin и нет Referer → fail-closed ---
  tryPush(
    results,
    'widget_config_cors_no_origin_no_referer',
    'Origin отсутствует AND Referer отсутствует → оба allowed=false (fail-closed)',
    () => {
      const headers: Record<string, unknown> = {}
      const lp = checkWidgetOrigin(headers, 'shop.example.com')
      const lt = checkWidgetOrigin(headers, 'store.example.com')
      return lp.allowed === false && lt.allowed === false
    }
  )

  // --- нет Origin, Referer = полный URL с lifepay-доменом → lifepay allowed ---
  tryPush(
    results,
    'widget_config_cors_referer_fallback_lifepay',
    'Origin отсутствует, Referer=https://<lifepay-домен>/path?q=1 → lifepay allowed=true, lavatop=false',
    () => {
      const headers = { referer: 'https://shop.example.com/cart?id=42' }
      const lp = checkWidgetOrigin(headers, 'shop.example.com')
      const lt = checkWidgetOrigin(headers, 'store.example.com')
      return lp.allowed === true && lt.allowed === false
    }
  )

  // --- Referer присутствует, но пустая строка → fail-closed ---
  tryPush(
    results,
    'widget_config_cors_referer_empty_string',
    'Referer присутствует но пустой → оба allowed=false (fail-closed)',
    () => {
      const headers = { referer: '' }
      const lp = checkWidgetOrigin(headers, 'shop.example.com')
      const lt = checkWidgetOrigin(headers, 'store.example.com')
      return lp.allowed === false && lt.allowed === false
    }
  )

  // --- формат whitelist: plain host ---
  tryPush(
    results,
    'widget_config_cors_whitelist_format_plain_host',
    'whitelist "example.com" матчит origin "https://example.com"',
    () => {
      const headers = { origin: 'https://example.com' }
      const result = checkWidgetOrigin(headers, 'example.com')
      return result.allowed === true
    }
  )

  // --- формат whitelist: https://host ---
  tryPush(
    results,
    'widget_config_cors_whitelist_format_https_host',
    'whitelist "https://example.com" матчит origin "https://example.com"',
    () => {
      const headers = { origin: 'https://example.com' }
      const result = checkWidgetOrigin(headers, 'https://example.com')
      return result.allowed === true
    }
  )

  // --- формат whitelist: https://host:port ---
  tryPush(
    results,
    'widget_config_cors_whitelist_format_https_host_port',
    'whitelist "https://example.com:8080" матчит origin "https://example.com"',
    () => {
      const headers = { origin: 'https://example.com' }
      const result = checkWidgetOrigin(headers, 'https://example.com:8080')
      return result.allowed === true
    }
  )

  // --- формат whitelist: https://host/path ---
  tryPush(
    results,
    'widget_config_cors_whitelist_format_https_host_path',
    'whitelist "https://example.com/path" матчит origin "https://example.com"',
    () => {
      const headers = { origin: 'https://example.com' }
      const result = checkWidgetOrigin(headers, 'https://example.com/path')
      return result.allowed === true
    }
  )

  // --- домен в обоих списках → оба allowed=true (нет регресса) ---
  tryPush(
    results,
    'widget_config_cors_shared_domain_both_allowed',
    'домен в обоих списках → lifepay allowed=true И lavatop allowed=true',
    () => {
      const headers = { origin: 'https://shared.example.com' }
      const lp = checkWidgetOrigin(headers, 'shared.example.com')
      const lt = checkWidgetOrigin(headers, 'shared.example.com')
      return lp.allowed === true && lt.allowed === true
    }
  )

  // --- домен в обоих списках, lifepayEnabled=false → lifepay enabled=false, lavatop enabled=true ---
  tryPush(
    results,
    'widget_config_cors_shared_domain_lifepay_disabled',
    'домен в обоих списках, lifepayEnabled=false → lifepay enabled=false, lavatop enabled=true',
    () => {
      const headers = { origin: 'https://shared.example.com' }
      const lp = checkWidgetOrigin(headers, 'shared.example.com')
      const lt = checkWidgetOrigin(headers, 'shared.example.com')
      const lifepayMethodEnabled = false
      const lavatopMethodEnabled = true
      const lifepayEnabled = lp.allowed && lifepayMethodEnabled
      const lavatopEnabled = lt.allowed && lavatopMethodEnabled
      return lifepayEnabled === false && lavatopEnabled === true
    }
  )

  // --- полная формула: origin только в lifepay-списке → lavatopEnabled=false ---
  tryPush(
    results,
    'widget_config_cors_leak_full_formula',
    'origin только в lifepay-списке; lavatopEnabled = cors.allowed && methodEnabled && offerOk && amountOk → false',
    () => {
      const headers = { origin: 'https://shop.example.com' }
      const lavatopCors = checkWidgetOrigin(headers, 'store.example.com')
      const lavatopMethodEnabled = true
      const offerOk = true
      const amountOk = true
      const lavatopEnabled = lavatopCors.allowed && lavatopMethodEnabled && offerOk && amountOk
      return lavatopEnabled === false
    }
  )

  // --- amount-конъюнкт гасит enabled ---
  tryPush(
    results,
    'widget_config_cors_amount_gates_enabled',
    'cors.allowed=true, methodEnabled=true, offerOk=true, amountOk=false → enabled=false',
    () => {
      const headers = { origin: 'https://shop.example.com' }
      const cors = checkWidgetOrigin(headers, 'shop.example.com')
      const methodEnabled = true
      const offerOk = true
      const amountOk = false
      const enabled = cors.allowed && methodEnabled && offerOk && amountOk
      return enabled === false
    }
  )
}
