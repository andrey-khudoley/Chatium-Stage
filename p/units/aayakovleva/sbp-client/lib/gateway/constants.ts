/**
 * Константы клиентской прокладки LifePay (implementation-plan §1.8).
 *
 * INVOKE_TIMEOUT_MS — таймаут исходящего вызова к payments-gateway.
 * На 5 секунд больше, чем GW_OUTBOUND_TIMEOUT_MS (10 секунд в gateway) — чтобы
 * gateway успел отдать свою ошибку INVOKE_LP_TIMEOUT до нашего таймаута.
 */
export const INVOKE_TIMEOUT_MS = 15_000

/** Максимум записей в одном ответе /api/lp/recent-*. */
export const RECENT_DEFAULT_LIMIT = 20
export const RECENT_MAX_LIMIT = 100

/**
 * Максимум записей, сканируемых аналитикой/выборками в одном проходе.
 * Достигается cursor-пагинацией по батчам ≤ 1000 (платформенный кэп Heap.findAll).
 */
export const ANALYTICS_SCAN_LIMIT = 5000
