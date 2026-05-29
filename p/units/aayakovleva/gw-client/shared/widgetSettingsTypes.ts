// @shared
/**
 * Типы и константы виджетной конфигурации. Делятся между сервером (геттер
 * `getWidgetSettings`, API-эндпоинты), клиентом (Admin-компоненты в Vue) и
 * сериализуются в публичный ответ `GET /api/widgets/config` для userscripts.
 *
 * Не содержит логики обращения к Heap — только pure-данные и парсеры.
 */

/** Идентификатор виджет-метода в конфигурации и аудит-логах. */
export type WidgetMethod = 'lifepay' | 'lavatop'

/**
 * Тип списка офферов на стороне виджета.
 * - `whitelist` — показываем виджет только для офферов из `offerIds`.
 * - `blacklist` — показываем для всех офферов, кроме перечисленных.
 */
export type WidgetOfferListType = 'whitelist' | 'blacklist'

/**
 * Серверный объект настроек виджета — что админ задал в веб-панели.
 * Соответствует 8 ключам в `SETTING_KEYS` (`widget_*`). Поля уже преобразованы
 * из строкового хранения Heap в типизированные значения.
 */
export type WidgetSettingsData = {
  lifepayEnabled: boolean
  lifepayDomains: string
  lifepayMin: number
  lifepayMax: number
  /** Per-method фильтр офферов LifePay (источник — GC через `getOffers`). */
  lifepayOfferListType: WidgetOfferListType
  /** Уже распарсенный массив id GC-офферов. */
  lifepayOfferIds: string[]
  lavatopEnabled: boolean
  lavatopDomains: string
  lavatopMin: number
  lavatopMax: number
  /** Per-method фильтр офферов Lava.Top (источник — Lava.Top `listProducts`). */
  lavatopOfferListType: WidgetOfferListType
  /** Уже распарсенный массив id Lava.Top-offer'ов. */
  lavatopOfferIds: string[]
}

/** Конфигурация одного метода в публичном ответе `/api/widgets/config`. */
export type WidgetMethodPublicConfig = {
  enabled: boolean
  /** `0` означает «без ограничений снизу». */
  minAmount: number
  /** `0` означает «без ограничений сверху». */
  maxAmount: number
  /** Тип фильтра офферов конкретного метода. */
  offerListType: WidgetOfferListType
  /** Список id офферов для фильтрации показа. */
  offerIds: string[]
}

/**
 * Публичный конфиг виджета, который возвращает `/api/widgets/config` после
 * прохождения CORS-whitelist. Userscript использует поля для клиентской
 * фильтрации (по сумме и офферу) и решает, рендерить ли кликабельный блок.
 *
 * Поля `offerListType`/`offerIds` теперь живут внутри `lifepay`/`lavatop`:
 * списки офферов для LifePay (GC-офферы) и Lava.Top (Lava.Top-офферы) —
 * это разные сущности из разных источников.
 */
export type WidgetPublicConfig = {
  lifepay: WidgetMethodPublicConfig
  lavatop: WidgetMethodPublicConfig
}

/**
 * Жёсткий серверный потолок суммы для intent-эндпоинтов. Не зависит от
 * пользовательских настроек `widget_*_max` — служит защитой от злоупотреблений
 * с поддельным Origin: даже если злоумышленник подделает заголовок и пройдёт
 * CORS-фильтр, создать платёжный intent на любую сумму он не сможет.
 *
 * 500 000 ₽ — компромисс: покрывает типичные сценарии магазина, ограничивает
 * blast radius до уровня одного крупного заказа.
 */
export const WIDGET_INTENT_HARD_LIMIT_RUB = 500_000

/**
 * Имена виджет-ключей в Heap-таблице `settings`. Дублируют значения из
 * `SETTING_KEYS` (`lib/settings.lib.ts`), но экспортируются из `shared/`,
 * чтобы Vue-компоненты могли использовать их без импорта из `lib/` (запрещено
 * правилом Vue/SSR). При переименовании ключа поправить ОБА места — это
 * сознательный компромисс ради изолированности слоёв.
 */
export const WIDGET_SETTING_KEYS = {
  LIFEPAY_ENABLED: 'widget_lifepay_enabled',
  LIFEPAY_DOMAINS: 'widget_lifepay_domains',
  LIFEPAY_MIN: 'widget_lifepay_min',
  LIFEPAY_MAX: 'widget_lifepay_max',
  LIFEPAY_OFFER_LIST_TYPE: 'widget_lifepay_offer_list_type',
  LIFEPAY_OFFER_IDS: 'widget_lifepay_offer_ids',
  LAVATOP_ENABLED: 'widget_lavatop_enabled',
  LAVATOP_DOMAINS: 'widget_lavatop_domains',
  LAVATOP_MIN: 'widget_lavatop_min',
  LAVATOP_MAX: 'widget_lavatop_max',
  LAVATOP_OFFER_LIST_TYPE: 'widget_lavatop_offer_list_type',
  LAVATOP_OFFER_IDS: 'widget_lavatop_offer_ids'
} as const

/**
 * Безопасный парсер `widget_offer_ids` из Heap. Принимает JSON-строку массива
 * строк, при любой ошибке возвращает пустой массив (виджет покажется для всех).
 */
export function parseOfferIds(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw.trim().length === 0) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const result: string[] = []
    for (const item of parsed) {
      if (typeof item === 'string' && item.trim().length > 0) {
        result.push(item.trim())
      }
    }
    return result
  } catch {
    return []
  }
}

/**
 * Безопасный парсер `widget_offer_list_type`. Любое значение, кроме `blacklist`,
 * считается whitelist'ом (консервативный дефолт: если список офферов задан,
 * виджет покажется только для перечисленных).
 */
export function parseOfferListType(raw: unknown): WidgetOfferListType {
  return raw === 'blacklist' ? 'blacklist' : 'whitelist'
}
