// @shared
/**
 * Контракт публичного API payments-gateway (implementation-plan §1.5, §1.8).
 * Зеркало `p/saas/gw/lifepay/shared/gatewayHttpHeaders.ts` + клиентский
 * каталог операций. Значения секретов здесь не хранятся.
 */

export const X_LP_APIKEY = 'X-Lp-Apikey'
export const X_LP_LOGIN = 'X-Lp-Login'
export const X_GATEWAY_REQUEST_ID = 'X-Gateway-Request-Id'

export type GatewayHttpMethod = 'GET' | 'POST'

export type OperationCatalogEntry = {
  op: string
  httpMethod: GatewayHttpMethod
  description: string
}

export const OPERATIONS_CATALOG: OperationCatalogEntry[] = [
  {
    op: 'createBill',
    httpMethod: 'POST',
    description: 'Создать счёт LifePay (bills_v1)'
  },
  {
    op: 'getBillStatus',
    httpMethod: 'GET',
    description: 'Получить статус счёта по billNumber'
  },
  {
    op: 'cancelBill',
    httpMethod: 'POST',
    description: 'Отменить неоплаченный счёт по billNumber'
  }
]

export function findOperationInCatalog(op: string): OperationCatalogEntry | null {
  return OPERATIONS_CATALOG.find((e) => e.op === op) ?? null
}

export function getOpHttpMethod(op: string): GatewayHttpMethod | null {
  const entry = findOperationInCatalog(op)
  return entry ? entry.httpMethod : null
}
