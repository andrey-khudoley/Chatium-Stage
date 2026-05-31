/**
 * Конвертация рублёвой суммы в целевую валюту для deal-потока Lava.Top.
 *
 * Приоритет источника курса:
 *   1) RUB → identity (без конвертации).
 *   2) USD/EUR: ручной курс (widget_lavatop_manual_rate_*), если задан > 0.
 *   3) USD/EUR: курс ЦБ РФ (https://www.cbr-xml-daily.ru/daily_json.js).
 *
 * Не импортирует кросс-проектные библиотеки (lava_gc_integration и др.).
 */

import { request } from '@app/request'
import * as loggerLib from '../logger.lib'
import { getLavatopManualRate } from '../settings.lib'

const LOG_MODULE = 'lib/rates/currencyConverter'
const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'

export type PaymentCurrency = 'RUB' | 'USD' | 'EUR'

export type ConvertResult =
  | { ok: true; amount: number; rate: number; source: 'identity' | 'manual' | 'cbr' }
  | { ok: false; code: 'RATE_UNAVAILABLE' }

/**
 * Округляет до двух знаков после запятой (центы). Один раунд, без повторной арифметики.
 */
function roundToCents(x: number): number {
  return Math.round((x + Number.EPSILON) * 100) / 100
}

/**
 * Конвертирует сумму в рублях в целевую валюту.
 */
export async function convertRubTo(
  ctx: app.Ctx,
  params: { amountRub: number; currency: PaymentCurrency }
): Promise<ConvertResult> {
  const { amountRub, currency } = params

  // RUB → identity, без конвертации
  if (currency === 'RUB') {
    const amount = roundToCents(amountRub)
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] convertRubTo: identity`,
      payload: { amountRub, currency, rate: 1, source: 'identity', amount }
    })
    return { ok: true, amount, rate: 1, source: 'identity' }
  }

  // Ручной курс (из настроек)
  const manualRate = await getLavatopManualRate(ctx, currency)
  if (manualRate !== null) {
    const amount = roundToCents(amountRub / manualRate)
    if (!Number.isFinite(amount) || amount <= 0) {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_MODULE}] convertRubTo: manual rate produced invalid amount`,
        payload: { amountRub, currency, rate: manualRate, amount }
      })
      return { ok: false, code: 'RATE_UNAVAILABLE' }
    }
    await loggerLib.writeServerLog(ctx, {
      severity: 7,
      message: `[${LOG_MODULE}] convertRubTo: manual`,
      payload: { amountRub, currency, rate: manualRate, source: 'manual', amount }
    })
    return { ok: true, amount, rate: manualRate, source: 'manual' }
  }

  // Курс ЦБ РФ
  let cbrBody: Record<string, unknown>
  try {
    const response = await request({
      url: CBR_URL,
      method: 'get',
      responseType: 'json',
      throwHttpErrors: false,
      timeout: 15000
    })
    if (response.statusCode !== 200) {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_MODULE}] convertRubTo: CBR HTTP error`,
        payload: { currency, statusCode: response.statusCode }
      })
      return { ok: false, code: 'RATE_UNAVAILABLE' }
    }
    cbrBody = (response.body ?? {}) as Record<string, unknown>
  } catch {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] convertRubTo: CBR request exception`,
      payload: { currency }
    })
    return { ok: false, code: 'RATE_UNAVAILABLE' }
  }

  // Извлечение Valute[currency].Value / Nominal
  const valute = (cbrBody.Valute ?? {}) as Record<string, Record<string, unknown>>
  const item = valute[currency]
  if (!item) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] convertRubTo: CBR currency not found`,
      payload: { currency }
    })
    return { ok: false, code: 'RATE_UNAVAILABLE' }
  }
  const value = Number(item.Value)
  const nominal = Number(item.Nominal ?? 1)
  if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(nominal) || nominal <= 0) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] convertRubTo: CBR invalid value/nominal`,
      payload: { currency, value, nominal }
    })
    return { ok: false, code: 'RATE_UNAVAILABLE' }
  }
  const rubForOne = value / nominal
  const amount = roundToCents(amountRub / rubForOne)

  if (!Number.isFinite(amount) || amount <= 0) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_MODULE}] convertRubTo: CBR conversion invalid amount`,
      payload: { currency, amountRub, rubForOne, amount }
    })
    return { ok: false, code: 'RATE_UNAVAILABLE' }
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_MODULE}] convertRubTo: cbr`,
    payload: { amountRub, currency, rate: rubForOne, source: 'cbr', amount }
  })
  return { ok: true, amount, rate: rubForOne, source: 'cbr' }
}
