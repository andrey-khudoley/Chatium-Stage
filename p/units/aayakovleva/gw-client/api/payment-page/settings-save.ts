// @shared-route
/**
 * `POST /api/payment-page/settings-save` — приватный эндпоинт для панели.
 *
 * Body: `{ key: string, value: unknown }`. Whitelist допускает только два ключа
 * настроек страницы оплаты:
 *   - GENERAL: сохраняется через setSetting (как раньше).
 *   - METHODS: bulk-update в таблице PaymentPageMethods (НЕ через setSetting).
 *     value = PaymentPageMethodRecord[] (массив с methodKey, resolver, section и т.д.)
 *
 * isSystem при bulk-update НЕ обновляется (берётся из хранимой строки).
 * Доступ — `guardInternalApi`. Помечен `// @shared-route` для `.run()` из Vue.
 */

import { runWithExclusiveLock } from '@app/sync'
import * as loggerLib from '../../lib/logger.lib'
import * as settingsLib from '../../lib/settings.lib'
import * as repo from '../../repos/paymentPageMethods.repo'
import { guardInternalApi } from '../../lib/access/apiGuard'
import {
  PAYMENT_PAGE_SETTING_KEYS,
  isPaymentPageSection,
  parseOfferListType,
  PAYMENT_PAGE_DEFAULT_SECTIONS
} from '../../shared/paymentPageTypes'

const LOG_PATH = 'api/payment-page/settings-save'

const ALLOWED: ReadonlySet<string> = new Set([
  PAYMENT_PAGE_SETTING_KEYS.GENERAL,
  PAYMENT_PAGE_SETTING_KEYS.METHODS
])

export const paymentPageSettingsSaveRoute = app.post('/', async (ctx, req) => {
  const denied = await guardInternalApi(ctx)
  if (denied) return denied

  const body = req.body as { key?: unknown; value?: unknown }
  const key = typeof body?.key === 'string' ? body.key.trim() : ''
  const value = body?.value

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { key, valueType: typeof value }
  })

  if (!key) {
    try {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] key_missing`,
        payload: { reason: 'KEY_MISSING' }
      })
    } catch {
      /* fail-open */
    }
    return { success: false, error: 'KEY_MISSING' }
  }

  if (!ALLOWED.has(key)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] key_not_allowed`,
      payload: { key }
    })
    return { success: false, error: 'KEY_NOT_ALLOWED' }
  }

  // GENERAL — через setSetting как раньше
  if (key === PAYMENT_PAGE_SETTING_KEYS.GENERAL) {
    try {
      await settingsLib.setSetting(ctx, key, value)
    } catch (error) {
      try {
        await loggerLib.writeServerLog(ctx, {
          severity: 3,
          message: `[${LOG_PATH}] general_save_error`,
          payload: { key, error: String(error) }
        })
      } catch {
        /* fail-open */
      }
      return { success: false, error: String(error) }
    }

    // Запись уже состоялась — повторное чтение нужно только для эха в ответ.
    // Его сбой НЕ должен превращать успешное сохранение в success:false,
    // иначе UI ошибочно откатит тумблер. Фоллбэк — эхо отправленного value.
    let saved: unknown = value
    try {
      saved = await settingsLib.getSetting(ctx, key)
    } catch (readError) {
      try {
        await loggerLib.writeServerLog(ctx, {
          severity: 4,
          message: `[${LOG_PATH}] general_echo_read_failed`,
          payload: { key, error: String(readError) }
        })
      } catch {
        /* fail-open */
      }
    }

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] general_saved`,
      payload: { key }
    })
    return { success: true, key, value: saved }
  }

  // METHODS — bulk-update в таблице PaymentPageMethods
  if (key === PAYMENT_PAGE_SETTING_KEYS.METHODS) {
    if (!Array.isArray(value)) {
      await loggerLib.writeServerLog(ctx, {
        severity: 4,
        message: `[${LOG_PATH}] methods_invalid_value`,
        payload: { reason: 'VALUE_MUST_BE_ARRAY', valueType: typeof value }
      })
      return { success: false, error: 'VALUE_MUST_BE_ARRAY' }
    }

    try {
      let updated = 0
      let skipped = 0
      let notFound = 0

      await runWithExclusiveLock(ctx, 'gw-client:pp-method-write', async () => {
        for (const item of value) {
          if (item === null || typeof item !== 'object' || Array.isArray(item)) {
            await loggerLib.writeServerLog(ctx, {
              severity: 7,
              message: `[${LOG_PATH}] methods_skip_invalid_item`,
              payload: { reason: 'ITEM_NOT_OBJECT' }
            })
            skipped++
            continue
          }
          const rec = item as Record<string, unknown>
          const methodKey = typeof rec.methodKey === 'string' ? rec.methodKey.trim() : ''
          if (!methodKey) {
            await loggerLib.writeServerLog(ctx, {
              severity: 7,
              message: `[${LOG_PATH}] methods_skip_no_key`,
              payload: { reason: 'METHODKEY_EMPTY' }
            })
            skipped++
            continue
          }

          // Читаем текущую строку для определения isSystem и сохранения resolver системных методов
          const existingRow = await repo.getByMethodKey(ctx, methodKey)

          // Нормализуем секцию
          const rawSection = rec.section
          const section = isPaymentPageSection(rawSection)
            ? rawSection
            : (PAYMENT_PAGE_DEFAULT_SECTIONS[methodKey] ?? 'pay')

          // Нормализуем числа
          const order =
            typeof rec.order === 'number' && Number.isFinite(rec.order) && rec.order >= 0
              ? Math.floor(rec.order)
              : 0
          const minAmount =
            typeof rec.minAmount === 'number' &&
            Number.isFinite(rec.minAmount) &&
            rec.minAmount >= 0
              ? Math.floor(rec.minAmount)
              : 0
          let maxAmount =
            typeof rec.maxAmount === 'number' &&
            Number.isFinite(rec.maxAmount) &&
            rec.maxAmount >= 0
              ? Math.floor(rec.maxAmount)
              : 0

          // Невалидный диапазон (max>0 и max<min) сделал бы метод недоступным для всех
          // сумм. Трактуем max как «без верхнего ограничения» (0) и логируем.
          if (maxAmount > 0 && maxAmount < minAmount) {
            await loggerLib.writeServerLog(ctx, {
              severity: 4,
              message: `[${LOG_PATH}] methods_invalid_range`,
              payload: { methodKey, minAmount, maxAmount }
            })
            maxAmount = 0
          }

          // Остальные поля
          const enabled = typeof rec.enabled === 'boolean' ? rec.enabled : true
          const name = typeof rec.name === 'string' ? rec.name : methodKey
          const label = typeof rec.label === 'string' ? rec.label : ''
          const imageUrl = typeof rec.imageUrl === 'string' ? rec.imageUrl : ''
          const offerListType = parseOfferListType(rec.offerListType)

          // Offers
          let offersNormalized: unknown = []
          if (Array.isArray(rec.offers)) {
            offersNormalized = rec.offers
          }

          // Resolver: для системных методов — не перезаписываем (берём из хранимой строки)
          let patchResolver: { resolverType?: string; resolverValue?: string } = {}
          if (existingRow && existingRow.isSystem) {
            // Resolver системного метода неизменен — не включаем в patch
          } else {
            const resolverRaw =
              rec.resolver !== null &&
              typeof rec.resolver === 'object' &&
              !Array.isArray(rec.resolver)
                ? (rec.resolver as Record<string, unknown>)
                : {}
            const resolverType =
              resolverRaw.type === 'id' || resolverRaw.type === 'class'
                ? (resolverRaw.type as string)
                : 'id'
            // Для кастомных: если входящий resolverValue пустой или невалидный — сохраняем прежнее значение
            const RESOLVER_VALUE_RE = /^[A-Za-z0-9_-]+$/
            const incomingResolverValue =
              typeof resolverRaw.value === 'string' ? resolverRaw.value : ''
            const resolverValue = RESOLVER_VALUE_RE.test(incomingResolverValue)
              ? incomingResolverValue
              : (existingRow?.resolverValue ?? methodKey)
            patchResolver = { resolverType, resolverValue }
          }

          const wasUpdated = await repo.updateByMethodKey(ctx, methodKey, {
            name,
            section,
            order,
            enabled,
            minAmount,
            maxAmount,
            imageUrl,
            label,
            offerListType,
            offers: offersNormalized,
            ...patchResolver
          })
          if (wasUpdated) {
            updated++
          } else {
            notFound++
          }
        }
      })

      // notFound > 0 означает рассинхрон: клиент прислал метод, которого уже нет
      // в таблице (удалён в другой вкладке). Часть правок при этом НЕ применилась —
      // нельзя отдавать success:true, иначе UI покажет «Сохранено» при потере данных.
      if (notFound > 0) {
        await loggerLib.writeServerLog(ctx, {
          severity: 4,
          message: `[${LOG_PATH}] methods_partial_not_found`,
          payload: { updated, skipped, notFound }
        })
        return {
          success: false,
          error: 'Часть методов не найдена (изменены в другой вкладке). Обновите страницу.',
          updated,
          skipped,
          notFound
        }
      }

      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] methods_saved`,
        payload: { updated, skipped, notFound }
      })
      return { success: true, updated, skipped }
    } catch (error) {
      try {
        await loggerLib.writeServerLog(ctx, {
          severity: 3,
          message: `[${LOG_PATH}] methods_save_error`,
          payload: { key, error: String(error) }
        })
      } catch {
        /* fail-open */
      }
      return { success: false, error: String(error) }
    }
  }

  // Не должны сюда попасть (ALLOWED whitelist выше), но для полноты
  await loggerLib.writeServerLog(ctx, {
    severity: 3,
    message: `[${LOG_PATH}] unexpected_key`,
    payload: { key }
  })
  return { success: false, error: 'KEY_NOT_HANDLED' }
})

export default paymentPageSettingsSaveRoute
