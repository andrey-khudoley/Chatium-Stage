// @shared
/**
 * Типы и константы виджетной конфигурации. Делятся между сервером (геттер
 * `getWidgetSettings`, API-эндпоинты), клиентом (Admin-компоненты в Vue) и
 * сериализуются в публичный ответ `POST /api/widgets/config` для userscripts.
 *
 * Не содержит логики обращения к Heap — только pure-данные и парсеры.
 */

/** Идентификатор виджет-метода в конфигурации и аудит-логах. */
export type WidgetMethod = 'lifepay' | 'lavatop'

/**
 * Тип списка офферов на стороне виджета.
 * - `whitelist` — показываем виджет только для офферов из `offers`.
 * - `blacklist` — показываем для всех офферов, кроме перечисленных.
 */
export type WidgetOfferListType = 'whitelist' | 'blacklist'

/** Запись разрешённого/запрещённого оффера: id (точное совпадение) и title (нечёткое). */
export type AllowedOffer = { id: string; title: string }

/**
 * Серверный объект настроек виджета — что админ задал в веб-панели.
 * Соответствует ключам в `SETTING_KEYS` (`widget_*`). Поля уже преобразованы
 * из строкового хранения Heap в типизированные значения.
 */
export type WidgetSettingsData = {
  lifepayEnabled: boolean
  lifepayDomains: string
  lifepayMin: number
  lifepayMax: number
  /** Per-method фильтр офферов LifePay (источник — GC через `getOffers`). */
  lifepayOfferListType: WidgetOfferListType
  /** Уже распарсенный массив офферов (id + title). */
  lifepayOffers: AllowedOffer[]
  lavatopEnabled: boolean
  lavatopDomains: string
  lavatopMin: number
  lavatopMax: number
  /** Per-method фильтр офферов Lava.Top (источник — Lava.Top `listProducts`). */
  lavatopOfferListType: WidgetOfferListType
  /** Уже распарсенный массив офферов (id + title). */
  lavatopOffers: AllowedOffer[]
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
  /** Список офферов ({id, title}) для фильтрации показа на клиенте. */
  offers: AllowedOffer[]
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
  /** @deprecated legacy-ключ (string[]); чтение для fallback. Запись — через LIFEPAY_OFFERS. */
  LIFEPAY_OFFER_IDS: 'widget_lifepay_offer_ids',
  /** Новый ключ (AllowedOffer[] JSON). */
  LIFEPAY_OFFERS: 'widget_lifepay_offers',
  LAVATOP_ENABLED: 'widget_lavatop_enabled',
  LAVATOP_DOMAINS: 'widget_lavatop_domains',
  LAVATOP_MIN: 'widget_lavatop_min',
  LAVATOP_MAX: 'widget_lavatop_max',
  LAVATOP_OFFER_LIST_TYPE: 'widget_lavatop_offer_list_type',
  /** @deprecated legacy-ключ (string[]); чтение для fallback. Запись — через LAVATOP_OFFERS. */
  LAVATOP_OFFER_IDS: 'widget_lavatop_offer_ids',
  /** Новый ключ (AllowedOffer[] JSON). */
  LAVATOP_OFFERS: 'widget_lavatop_offers'
} as const

/**
 * Безопасный парсер списка офферов из Heap. Поддерживает два формата:
 * - legacy: JSON-массив строк (`string[]`) → [{id:s, title:''}]
 * - новый: JSON-массив объектов `{id,title}` → нормализует и дедуплицирует по id.
 * При любой ошибке или не-массиве возвращает пустой массив.
 */
export function parseAllowedOffers(raw: unknown): AllowedOffer[] {
  if (typeof raw !== 'string' || raw.trim().length === 0) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  const seen = new Set<string>()
  const result: AllowedOffer[] = []
  for (const item of parsed) {
    if (typeof item === 'string') {
      // legacy: строка → id=trim, title=''
      const id = item.trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      result.push({ id, title: '' })
    } else if (typeof item === 'object' && item !== null) {
      const o = item as Record<string, unknown>
      const id = String(o.id ?? '').trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      const title = typeof o.title === 'string' ? o.title.trim() : ''
      result.push({ id, title })
    }
    // иначе пропускаем
  }
  return result
}

/**
 * Безопасный парсер `widget_offer_list_type`. Любое значение, кроме `blacklist`,
 * считается whitelist'ом (консервативный дефолт: если список офферов задан,
 * виджет покажется только для перечисленных).
 */
export function parseOfferListType(raw: unknown): WidgetOfferListType {
  return raw === 'blacklist' ? 'blacklist' : 'whitelist'
}

/** Нормализует title для нечёткого сравнения офферов. */
function normalizeTitle(s: unknown): string {
  // \s+ покрывает неразрывные пробелы ( ) и прочие Unicode-пробелы — JS \s их включает.
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * СИНХРОНИЗИРОВАНО с userscripts/common.js → areAllPositionsAllowed.
 * При изменении правил allow/normalize править ОБА места.
 *
 * Проверяет, разрешён ли один оффер по whitelist/blacklist.
 * - whitelist: offer.id точно совпадает с allowed[].id ИЛИ нормализованный
 *   offer.title совпадает с нормализованным allowed[].title (только непустые title).
 * - blacklist: не совпадает ни по id, ни по title.
 *
 * Используется на сервере в intent-обработчиках для проверки позиций заказа.
 * Userscript имеет собственную копию в common.js.
 */
export function isOfferAllowed(
  offer: { id: string; title: string },
  allowed: AllowedOffer[],
  listType: WidgetOfferListType
): boolean {
  const normTitle = normalizeTitle(offer.title)
  const idMatch = allowed.some((a) => a.id === offer.id)
  const titleMatch =
    normTitle !== '' && allowed.some((a) => a.title !== '' && normalizeTitle(a.title) === normTitle)
  const inList = idMatch || titleMatch
  return listType === 'blacklist' ? !inList : inList
}

/**
 * Проверяет, разрешены ли ВСЕ позиции заказа.
 * - Пустой массив positions → false (нет позиций — не допускаем).
 * - Иначе — positions.every(isOfferAllowed).
 */
export function areAllOffersAllowed(
  offers: { id: string; title: string }[],
  allowed: AllowedOffer[],
  listType: WidgetOfferListType
): boolean {
  if (!Array.isArray(offers) || offers.length === 0) return false
  return offers.every((o) => isOfferAllowed(o, allowed, listType))
}

/** Доступность одного метода оплаты (результат серверного расчёта в /api/widgets/config). */
export type WidgetMethodAvailability = { enabled: boolean }

/**
 * Ответ `/api/widgets/config` (POST): доступность каждого метода оплаты
 * с учётом офферов, диапазона суммы и флага enabled из настроек.
 */
export type WidgetAvailabilityConfig = {
  lifepay: WidgetMethodAvailability
  lavatop: WidgetMethodAvailability
}
