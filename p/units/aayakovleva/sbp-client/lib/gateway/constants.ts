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

/** Окно аналитики по умолчанию (часов). */
export const ANALYTICS_DEFAULT_WINDOW_HOURS = 24
