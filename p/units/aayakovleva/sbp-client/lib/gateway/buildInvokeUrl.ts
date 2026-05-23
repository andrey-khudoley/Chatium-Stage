/**
 * Сборка URL исходящего вызова payments-gateway (implementation-plan §1.8.2).
 *
 * URL: <gateway_base_url>/api/v1/<op>. Префикс `/api/` соответствует file-based роутингу
 * gateway (`p/saas/gw/lifepay/api/v1/<op>.ts`). Метод выбирается по shared/gatewayContract.
 */

import { findOperationInCatalog } from '../../shared/gatewayContract'
import type { GatewayHttpMethod } from '../../shared/gatewayContract'

export type BuiltInvokeUrl =
  | { kind: 'ok'; url: string; method: GatewayHttpMethod }
  | { kind: 'op_unknown' }
  | { kind: 'base_url_invalid' }

/**
 * Собрать URL запроса к gateway. baseUrl должен быть нормализован (без trailing slash).
 */
export function buildInvokeUrl(baseUrl: string, op: string): BuiltInvokeUrl {
  const entry = findOperationInCatalog(op)
  if (!entry) return { kind: 'op_unknown' }
  const trimmed = (baseUrl || '').trim()
  if (!trimmed) return { kind: 'base_url_invalid' }
  const noTrailing = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
  return {
    kind: 'ok',
    url: `${noTrailing}/api/v1/${op}`,
    method: entry.httpMethod
  }
}
