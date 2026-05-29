/**
 * Серверный геттер виджет-конфигурации.
 *
 * Читает 8 виджет-ключей из таблицы `settings` через общий `getSetting`,
 * приводит к типизированному объекту `WidgetSettingsData` (boolean / number /
 * string[]). Используется страницей `/web/admin` для SSR-пропов и виджетными
 * API-эндпоинтами (`config`, `intent-lifepay`, `intent-lavatop`).
 */

import * as settingsLib from '../settings.lib'
import {
  parseOfferIds,
  parseOfferListType,
  type WidgetSettingsData
} from '../../shared/widgetSettingsTypes'

/** Безопасно парсит min/max сумму. Любая ошибка → 0 (без ограничения). */
function parseAmountSetting(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) return Math.floor(raw)
  if (typeof raw === 'string') {
    const n = parseInt(raw, 10)
    if (Number.isFinite(n) && n >= 0) return n
  }
  return 0
}

/**
 * Читает все виджет-настройки одной выборкой и возвращает типизированный
 * объект. Не логирует значения (домены и max — не секреты, но лишний шум в
 * логах не нужен; идентификатор оффера потенциально чувствителен).
 */
export async function getWidgetSettings(ctx: app.Ctx): Promise<WidgetSettingsData> {
  // Параллельное чтение 8 ключей — каждый публичный вызов (config / intent)
  // упирался бы в 8 последовательных Heap-roundtrip; Promise.all сокращает
  // latency до одного раунд-трипа в идеале.
  const [
    lifepayEnabledRaw,
    lifepayDomainsRaw,
    lifepayMinRaw,
    lifepayMaxRaw,
    lifepayOfferListTypeRaw,
    lifepayOfferIdsRaw,
    lavatopEnabledRaw,
    lavatopDomainsRaw,
    lavatopMinRaw,
    lavatopMaxRaw,
    lavatopOfferListTypeRaw,
    lavatopOfferIdsRaw
  ] = await Promise.all([
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_ENABLED),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_DOMAINS),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_MIN),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_MAX),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_OFFER_LIST_TYPE),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LIFEPAY_OFFER_IDS),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LAVATOP_ENABLED),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LAVATOP_DOMAINS),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LAVATOP_MIN),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LAVATOP_MAX),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LAVATOP_OFFER_LIST_TYPE),
    settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.WIDGET_LAVATOP_OFFER_IDS)
  ])

  return {
    lifepayEnabled: lifepayEnabledRaw === 'true',
    lifepayDomains: typeof lifepayDomainsRaw === 'string' ? lifepayDomainsRaw : '',
    lifepayMin: parseAmountSetting(lifepayMinRaw),
    lifepayMax: parseAmountSetting(lifepayMaxRaw),
    lifepayOfferListType: parseOfferListType(lifepayOfferListTypeRaw),
    lifepayOfferIds: parseOfferIds(lifepayOfferIdsRaw),
    lavatopEnabled: lavatopEnabledRaw === 'true',
    lavatopDomains: typeof lavatopDomainsRaw === 'string' ? lavatopDomainsRaw : '',
    lavatopMin: parseAmountSetting(lavatopMinRaw),
    lavatopMax: parseAmountSetting(lavatopMaxRaw),
    lavatopOfferListType: parseOfferListType(lavatopOfferListTypeRaw),
    lavatopOfferIds: parseOfferIds(lavatopOfferIdsRaw)
  }
}
