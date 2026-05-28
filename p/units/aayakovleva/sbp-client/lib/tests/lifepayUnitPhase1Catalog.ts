/**
 * Фаза 1 юнит-сьюта LifePay: каталог операций и сборка URL.
 *
 *   - runCatalogChecks: OPERATIONS_CATALOG, getOpHttpMethod, findOperationInCatalog;
 *   - runUrlBuildChecks: buildInvokeUrl — POST/GET, trailing slash, unknown op, пустой base.
 */

import { buildInvokeUrl } from '../gateway/buildInvokeUrl'
import {
  findOperationInCatalog,
  getOpHttpMethod,
  OPERATIONS_CATALOG
} from '../../shared/gatewayContract'
import { tryPush, type LifepayUnitTestResult } from './lifepayUnitHelpers'

export function runCatalogChecks(results: LifepayUnitTestResult[]): void {
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

export function runUrlBuildChecks(results: LifepayUnitTestResult[]): void {
  tryPush(
    results,
    'lp_invoke_url_build_post',
    'buildInvokeUrl(base, createBill) → POST /api/v1/createBill',
    () => {
      const r = buildInvokeUrl('https://gw.example.com/p/saas/gw/lifepay', 'createBill')
      return (
        r.kind === 'ok' &&
        r.method === 'POST' &&
        r.url === 'https://gw.example.com/p/saas/gw/lifepay/api/v1/createBill'
      )
    }
  )

  tryPush(
    results,
    'lp_invoke_url_build_get',
    'buildInvokeUrl(base, getBillStatus) → GET /api/v1/getBillStatus',
    () => {
      const r = buildInvokeUrl('https://gw.example.com', 'getBillStatus')
      return (
        r.kind === 'ok' &&
        r.method === 'GET' &&
        r.url === 'https://gw.example.com/api/v1/getBillStatus'
      )
    }
  )

  tryPush(results, 'lp_invoke_url_trailing_slash', 'buildInvokeUrl обрезает trailing slash', () => {
    const r = buildInvokeUrl('https://gw.example.com/', 'createBill')
    return r.kind === 'ok' && r.url === 'https://gw.example.com/api/v1/createBill'
  })

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
