// @shared-route
/**
 * `POST /api/payment-page/method-create` — создание кастомного метода оплаты.
 *
 * Body: `{ name, resolverType, resolverValue, section }`.
 * Валидация: resolverType ∈ {id, class}; resolverValue — CSS-токен [A-Za-z0-9_-]+;
 * section — допустимая PaymentPageSection; name — непустая строка.
 *
 * Под runWithExclusiveLock — защита от гонок при параллельном создании.
 * Коллизию methodKey перегенерирует до 5 раз.
 *
 * Доступ — guardInternalApi. Помечен // @shared-route для .run() из Vue.
 */

import { runWithExclusiveLock } from '@app/sync'
import * as loggerLib from '../../lib/logger.lib'
import * as repo from '../../repos/paymentPageMethods.repo'
import { guardInternalApi } from '../../lib/access/apiGuard'
import { isPaymentPageSection, parsePaymentPageMethodRecord } from '../../shared/paymentPageTypes'

const LOG_PATH = 'api/payment-page/method-create'

const RESOLVER_VALUE_RE = /^[A-Za-z0-9_-]+$/

/** Генерирует 4-символьный случайный суффикс из [a-z0-9]. */
function rand4(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/** Санирует строку до CSS-безопасного токена (оставляет [a-z0-9_-], lowercase). */
function sanitize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export const paymentPageMethodCreateRoute = app.post('/', async (ctx, req) => {
  const denied = await guardInternalApi(ctx)
  if (denied) return denied

  const body = req.body as {
    name?: unknown
    resolverType?: unknown
    resolverValue?: unknown
    section?: unknown
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const resolverType = typeof body?.resolverType === 'string' ? body.resolverType.trim() : ''
  const resolverValue = typeof body?.resolverValue === 'string' ? body.resolverValue.trim() : ''
  const section = body?.section

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] entry`,
    payload: { name, resolverType, resolverValue, section }
  })

  // Валидация
  if (resolverType !== 'id' && resolverType !== 'class') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] validation_failed resolverType`,
      payload: { resolverType }
    })
    return { success: false, error: 'resolverType должен быть "id" или "class"' }
  }

  if (!RESOLVER_VALUE_RE.test(resolverValue)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] validation_failed resolverValue`,
      payload: { resolverValue }
    })
    return {
      success: false,
      error: 'resolverValue должен содержать только буквы, цифры, дефисы и подчёркивания'
    }
  }

  if (!isPaymentPageSection(section)) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] validation_failed section`,
      payload: { section }
    })
    return { success: false, error: 'Недопустимое значение section' }
  }

  if (!name) {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] validation_failed name_empty`,
      payload: {}
    })
    return { success: false, error: 'name не может быть пустым' }
  }

  try {
    let createdRow
    await runWithExclusiveLock(ctx, 'gw-client:pp-method-write', async () => {
      // Генерируем methodKey, до 5 попыток при коллизии
      let methodKey = ''
      const sanitized = sanitize(resolverValue) || 'method'
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = 'custom-' + sanitized + '-' + rand4()
        const existing = await repo.getByMethodKey(ctx, candidate)
        if (!existing) {
          methodKey = candidate
          break
        }
        await loggerLib.writeServerLog(ctx, {
          severity: 4,
          message: `[${LOG_PATH}] methodKey collision, retrying`,
          payload: { candidate, attempt }
        })
      }

      if (!methodKey) {
        await loggerLib.writeServerLog(ctx, {
          severity: 3,
          message: `[${LOG_PATH}] methodKey_generation_failed`,
          payload: { reason: 'methodKey_generation_failed' }
        })
        throw new Error('Не удалось сгенерировать уникальный methodKey после 5 попыток')
      }

      createdRow = await repo.create(ctx, {
        methodKey,
        resolverType,
        resolverValue,
        name,
        section: section as string,
        label: '',
        imageUrl: '',
        offerListType: 'off',
        order: 0,
        minAmount: 0,
        maxAmount: 0,
        enabled: true,
        isSystem: false,
        offers: []
      })

      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] created`,
        payload: { methodKey, section }
      })
    })

    if (!createdRow) {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] create_row_missing`,
        payload: { reason: 'createdRow_is_null' }
      })
      return { success: false, error: 'Ошибка создания метода' }
    }

    // Нормализуем в PaymentPageMethodRecord для ответа
    const row = createdRow as Awaited<ReturnType<typeof repo.create>>
    const record = parsePaymentPageMethodRecord({
      methodKey: row.methodKey,
      name: row.name,
      resolver: { type: row.resolverType, value: row.resolverValue },
      enabled: row.enabled,
      isSystem: row.isSystem,
      minAmount: row.minAmount,
      maxAmount: row.maxAmount,
      imageUrl: row.imageUrl,
      label: row.label,
      section: row.section,
      order: row.order,
      offerListType: row.offerListType,
      offers: row.offers ?? []
    })

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] success`,
      payload: { methodKey: record.methodKey }
    })

    return { success: true, method: record }
  } catch (error) {
    try {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] error`,
        payload: { error: String(error) }
      })
    } catch {
      /* fail-open */
    }
    return { success: false, error: String(error) }
  }
})

export default paymentPageMethodCreateRoute
