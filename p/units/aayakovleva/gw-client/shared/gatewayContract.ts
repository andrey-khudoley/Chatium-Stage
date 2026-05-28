// @shared
/**
 * Контракты публичного API payments-gateway (многогейтвейная архитектура).
 * Заголовки upstream-вызовов, типы каталога операций и каталоги по гейтвеям.
 *
 * Поддерживаются:
 *  - `lifepay` — серверный gateway `p/saas/gw/lifepay` (контур `bills_v1`).
 *  - `lavatop` — серверный gateway `p/saas/gw/lavatop` (контур `invoices_v1`).
 *
 * Каждый гейтвей имеет свой контракт авторизации к upstream (его клиент собирает
 * `lib/gateway/lifepayClient.ts` или `lib/gateway/lavatopClient.ts`).
 *
 * Значения секретов здесь не хранятся.
 */

import type { GatewayId } from './invokeApi'
import { SUPPORTED_GATEWAYS } from './invokeApi'

/** Имена HTTP-заголовков, которые клиент проекта `gw-client` шлёт к gateway LifePay. */
export const X_LP_APIKEY = 'X-Lp-Apikey'
export const X_LP_LOGIN = 'X-Lp-Login'

/** Имя HTTP-заголовка, которое клиент шлёт к gateway Lava.Top. */
export const X_LAVA_APIKEY = 'X-Lava-Apikey'

/** Корреляционный идентификатор ответа gateway (общий для всех гейтвеев). */
export const X_GATEWAY_REQUEST_ID = 'X-Gateway-Request-Id'

export type GatewayHttpMethod = 'GET' | 'POST'

export type OperationCatalogEntry = {
  op: string
  httpMethod: GatewayHttpMethod
  description: string
}

/** Каталог операций LifePay (контур `bills_v1`). */
export const LIFEPAY_OPERATIONS: OperationCatalogEntry[] = [
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

/** Каталог операций Lava.Top (контур `invoices_v1`). */
export const LAVATOP_OPERATIONS: OperationCatalogEntry[] = [
  {
    op: 'createInvoice',
    httpMethod: 'POST',
    description: 'Создать инвойс Lava.Top (invoices_v1)'
  },
  {
    op: 'getInvoiceStatus',
    httpMethod: 'GET',
    description: 'Получить статус инвойса по contractId'
  },
  {
    op: 'listProducts',
    httpMethod: 'GET',
    description: 'Список продуктов магазина'
  },
  {
    op: 'updateOfferPrice',
    httpMethod: 'POST',
    description: 'Обновить цену оффера продукта'
  }
]

/**
 * Каталоги по гейтвеям. При добавлении третьего гейтвея — расширить эту запись
 * и `SUPPORTED_GATEWAYS` в `invokeApi.ts`.
 */
export const OPERATIONS_BY_GATEWAY: Record<GatewayId, OperationCatalogEntry[]> = {
  lifepay: LIFEPAY_OPERATIONS,
  lavatop: LAVATOP_OPERATIONS
}

/** Полный плоский каталог всех операций (со ссылкой на гейтвей). */
export type FlatCatalogEntry = OperationCatalogEntry & { gatewayId: GatewayId }
export const FULL_OPERATIONS_CATALOG: FlatCatalogEntry[] = SUPPORTED_GATEWAYS.flatMap((gatewayId) =>
  OPERATIONS_BY_GATEWAY[gatewayId].map((entry) => ({ ...entry, gatewayId }))
)

/**
 * @deprecated Используйте `LIFEPAY_OPERATIONS` либо `OPERATIONS_BY_GATEWAY[gatewayId]`.
 * Оставлено для обратной совместимости юнит-тестов LifePay, ожидающих именно
 * этот символ (`shared/gatewayContract.OPERATIONS_CATALOG`).
 */
export const OPERATIONS_CATALOG = LIFEPAY_OPERATIONS

/**
 * @deprecated Используйте `findOperationInGateway(gatewayId, op)` либо
 *             `findOperationInAnyGateway(op)`. Оставлено для обратной
 *             совместимости вызовов, не указывающих гейтвей. Возвращает запись
 *             только для каталога LifePay (исторический поведенческий дефолт).
 */
export function findOperationInCatalog(op: string): OperationCatalogEntry | null {
  return LIFEPAY_OPERATIONS.find((e) => e.op === op) ?? null
}

/** Поиск операции в каталоге конкретного гейтвея. */
export function findOperationInGateway(
  gatewayId: GatewayId,
  op: string
): OperationCatalogEntry | null {
  const catalog = OPERATIONS_BY_GATEWAY[gatewayId]
  if (!catalog) return null
  return catalog.find((e) => e.op === op) ?? null
}

/** Поиск операции в любом каталоге (с указанием, где найдена). */
export function findOperationInAnyGateway(op: string): FlatCatalogEntry | null {
  return FULL_OPERATIONS_CATALOG.find((e) => e.op === op) ?? null
}

/**
 * @deprecated Используйте `findOperationInGateway(gatewayId, op).httpMethod`.
 */
export function getOpHttpMethod(op: string): GatewayHttpMethod | null {
  const entry = findOperationInCatalog(op)
  return entry ? entry.httpMethod : null
}
