// @shared
/**
 * Ключи Heap-настроек GetCourse (PL API) для клиента и сервера.
 * Должны совпадать с `lib/settings.lib` / `SETTING_KEYS`.
 */
export const GC_SETTING_KEYS = {
  GC_API_KEY: 'gc_api_key',
  GC_ACCOUNT_DOMAIN: 'gc_account_domain',
  /** ID доп. поля заказа в GetCourse (`deal.addfields`) для флага интеграции. */
  GC_ORDER_FLAG_ADDFIELD_ID: 'gc_order_flag_addfield_id'
} as const
