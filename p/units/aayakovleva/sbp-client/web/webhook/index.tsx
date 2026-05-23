/**
 * POST /webhook?token=... — приёмник webhook LifePay
 * (implementation-plan §1.8.3, apidoc.life-pay.ru/notification).
 *
 * Анонимный роут (LifePay не аутентифицируется ролью Chatium). Аутентификация —
 * только токен в query (точное равенство строк со значением `lp_webhook_token` в Heap).
 * MD5-подпись webhook **не** проверяется: LifePay её не публикует (нет полей
 * check/signature/hash в теле, нет описания алгоритма).
 *
 * Поведение:
 *   - токен не настроен → 503 без тела, без записи в webhook_log;
 *   - токен отсутствует в query → 401 без тела, без записи;
 *   - токен не совпадает → 403 без тела, без записи (значение токена в логи не попадает);
 *   - токен валиден → разворачивание тела (`unwrapWebhookBody`) + парсинг
 *     (`parseWebhookBody`), запись в webhook_log + дедупликация по number
 *     через webhook_idempotency, возврат 200 OK.
 *
 * Контракт LifePay (apidoc.life-pay.ru/notification): POST с payload
 * транзакции под ключом `data`. По логам реального трафика LifePay шлёт
 * `multipart/form-data` с одним полем `data`, содержащим JSON-строку
 * транзакции. Возможные транспорты, которые поддерживает приёмник:
 *   - `multipart/form-data; boundary=…` (фактический транспорт LifePay) —
 *     `req.body` пустой, поле `data` достаём через `req.files`/`req.fields`
 *     (`extractMultipartTextPayload`);
 *   - `application/json` с JSON-обёрткой `{"data":{...}}`;
 *   - `application/x-www-form-urlencoded` с полем `data=<urlencoded-json>`;
 *   - чистый `application/json` без обёртки.
 * `unwrapWebhookBody` сводит всё к JSON-объекту payload. Стратегия пишется
 * в лог `webhook_payload_parsed.unwrapStrategy` для диагностики, плюс
 * `body_received` с подробным shape `req.files`/`req.fields` — чтобы видеть
 * точный формат, в котором Chatium-платформа отдала multipart.
 *
 * Ретраи LifePay: при не-200 ответе LifePay повторяет webhook через 1 / 3 /
 * 5 / 10 минут, далее раз в час, всего не более 10 попыток. Поэтому даже
 * при ошибке записи в журнал отвечаем 200 OK — дедупликация по `number`
 * через `webhook_idempotency` защищает от двойного учёта.
 */

import * as settingsLib from '../../lib/settings.lib'
import * as loggerLib from '../../lib/logger.lib'
import * as webhookLogRepo from '../../repos/webhookLog.repo'
import * as webhookIdempRepo from '../../repos/webhookIdempotency.repo'
import {
  checkWebhookToken,
  parseWebhookBody,
  unwrapWebhookBody,
  extractMultipartTextPayload
} from '../../lib/webhook/processWebhook'
import { prepareRawLog } from '../../shared/prepareRawLog'

const LOG_PATH = 'web/webhook'

// Используем цепочечную форму `app.post('/').body(...).handle(...)` —
// объявление схемы тела позволяет платформе Chatium корректно разобрать
// `multipart/form-data` (см. inner/docs/002-routing.md §«Валидация тела
// через .body() и .query()»). LifePay-payload — единственное опциональное
// поле `data` со JSON-строкой транзакции; делаем optional, чтобы платформа
// не отбраковала запрос с другим Content-Type или иной формой тела.
export const webhookRoute = app
  .post('/')
  .body((s) => ({
    data: s.string().optional()
  }))
  .handle(async (ctx, req) => {
  // Сразу зафиксировать факт вызова — без значения токена и тела (минимизация утечки).
  const queryRaw = (req as unknown as { query?: unknown }).query
  const queryObj =
    typeof queryRaw === 'object' && queryRaw !== null
      ? (queryRaw as Record<string, unknown>)
      : {}
  const tokenFromQuery = typeof queryObj.token === 'string' ? queryObj.token : null

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] webhook_init`,
    payload: {
      hasToken: !!tokenFromQuery,
      tokenLength: tokenFromQuery ? tokenFromQuery.length : 0
    }
  })

  const tokenFromSettings = await settingsLib.getLpWebhookToken(ctx)
  const tokenCheck = checkWebhookToken(tokenFromQuery, tokenFromSettings)

  if (tokenCheck === 'not_configured') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] token_not_configured`,
      payload: {}
    })
    return {
      statusCode: 503,
      rawHttpBody: '',
      headers: { 'Content-Type': 'text/plain' }
    }
  }

  if (tokenCheck === 'missing') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] token_missing`,
      payload: {}
    })
    return {
      statusCode: 401,
      rawHttpBody: '',
      headers: { 'Content-Type': 'text/plain' }
    }
  }

  if (tokenCheck === 'mismatch') {
    await loggerLib.writeServerLog(ctx, {
      severity: 4,
      message: `[${LOG_PATH}] token_mismatch`,
      payload: { tokenLength: tokenFromQuery ? tokenFromQuery.length : 0 }
    })
    return {
      statusCode: 403,
      rawHttpBody: '',
      headers: { 'Content-Type': 'text/plain' }
    }
  }

  // Токен валиден — снимаем тело, заголовки и multipart-поля.
  const reqAny = req as unknown as {
    body?: unknown
    headers?: Record<string, unknown> | unknown
    rawHttpBody?: unknown
    rawBody?: unknown
    files?: Record<string, unknown> | unknown
    fields?: Record<string, unknown> | unknown
    getSchema?: () => unknown
  }
  const body = reqAny.body
  const headersRaw = reqAny.headers
  const headers =
    typeof headersRaw === 'object' && headersRaw !== null
      ? (headersRaw as Record<string, unknown>)
      : {}
  const contentTypeRaw = headers['content-type'] ?? headers['Content-Type']
  const contentType =
    typeof contentTypeRaw === 'string' ? contentTypeRaw.toLowerCase() : ''

  // Платформа Chatium для multipart/form-data не заполняет req.body — текстовые
  // поля попадают в req.files (см. inner/docs/009-files.md). LifePay шлёт всё
  // тело webhook одним полем (обычно `data`), поэтому пробуем достать его и
  // развернуть как JSON.
  const filesField = reqAny.files
  const fieldsField = reqAny.fields
  const reqKeys = Object.keys(req as unknown as Record<string, unknown>).slice(0, 40)

  // Описать shape поля по ключу, чтобы понять, где именно Chatium прячет JSON.
  function describeField(holder: unknown, key: string): unknown {
    if (!holder || typeof holder !== 'object') return null
    const v = (holder as Record<string, unknown>)[key]
    if (v === undefined) return null
    if (typeof v === 'string') {
      return { type: 'string', length: v.length, preview: v.slice(0, 200) }
    }
    if (typeof v === 'object' && v !== null) {
      const keys = Object.keys(v as Record<string, unknown>).slice(0, 20)
      return { type: Array.isArray(v) ? 'array' : 'object', keys }
    }
    return { type: typeof v }
  }

  // Диагностика: какие свойства реально есть на req для multipart.
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] body_received`,
    payload: {
      bodyType: body === null ? 'null' : Array.isArray(body) ? 'array' : typeof body,
      bodyKeys:
        body && typeof body === 'object' && !Array.isArray(body)
          ? Object.keys(body as Record<string, unknown>).slice(0, 20)
          : [],
      bodyStringLength: typeof body === 'string' ? body.length : 0,
      contentType,
      hasRawHttpBody: !!reqAny.rawHttpBody || !!reqAny.rawBody,
      hasFiles: !!filesField,
      filesKeys:
        filesField && typeof filesField === 'object'
          ? Object.keys(filesField as Record<string, unknown>).slice(0, 20)
          : [],
      filesDataShape: describeField(filesField, 'data'),
      hasFields: !!fieldsField,
      fieldsKeys:
        fieldsField && typeof fieldsField === 'object'
          ? Object.keys(fieldsField as Record<string, unknown>).slice(0, 20)
          : [],
      fieldsDataShape: describeField(fieldsField, 'data'),
      reqKeys,
      // Дополнительно: req.getSchema (есть в reqKeys) — может вернуть
      // объявленную через `.body()` схему. Логируем тип результата, чтобы
      // понять, можно ли через него получить parsed body.
      getSchemaType:
        typeof reqAny.getSchema === 'function'
          ? (() => {
              try {
                const s = reqAny.getSchema!()
                if (s === null) return 'null'
                if (Array.isArray(s)) return 'array'
                return typeof s
              } catch {
                return 'threw'
              }
            })()
          : 'absent'
    }
  })

  // Сначала пробуем достать данные из multipart (req.files / req.fields для
  // текстовых частей). LifePay шлёт одно поле `data` с JSON-строкой.
  const bodyForUnwrap = extractMultipartTextPayload(filesField, fieldsField) ?? body

  // Развернуть тело в JSON-объект, учитывая form-urlencoded и {data: "<json>"}.
  const unwrapped = unwrapWebhookBody(bodyForUnwrap, contentType)
  const parsed = parseWebhookBody(unwrapped.payload)

  // rawBody: предпочтительно развёрнутый payload (JSON-объект). Для не-JSON
  // случаев — marker с preview исходного тела.
  let rawBodyForLog: unknown
  if (unwrapped.payload && typeof unwrapped.payload === 'object') {
    rawBodyForLog = prepareRawLog(unwrapped.payload)
  } else if (typeof body === 'string') {
    rawBodyForLog = {
      __nonJson: true,
      __contentType: contentType,
      __preview: body.slice(0, 1024)
    }
  } else if (body === null || body === undefined) {
    rawBodyForLog = { __noBody: true, __contentType: contentType }
  } else if (typeof body === 'object') {
    rawBodyForLog = prepareRawLog(body)
  } else {
    rawBodyForLog = {
      __nonJson: true,
      __contentType: contentType,
      __preview: String(body).slice(0, 1024)
    }
  }

  const rawQueryForLog = prepareRawLog(queryObj)

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] webhook_payload_parsed`,
    payload: {
      unwrapStrategy: unwrapped.strategy,
      number: parsed.number,
      type: parsed.type,
      status: parsed.status,
      method: parsed.method,
      orderNumber: parsed.orderNumber
    }
  })

  // Дедупликация (если number есть). Если number пустой — пропускаем дедуп.
  let dedupeResult: 'first' | 'duplicate' | 'no_number' = 'no_number'
  if (parsed.number) {
    try {
      dedupeResult = await webhookIdempRepo.tryRegister(ctx, parsed.number, Date.now())
    } catch (e) {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] idempotency_lookup_failed`,
        payload: { number: parsed.number, error: String(e) }
      })
      dedupeResult = 'no_number'
    }
  }

  try {
    await webhookLogRepo.create(ctx, {
      number: parsed.number,
      type: parsed.type,
      status: parsed.status,
      method: parsed.method,
      amount: parsed.amount,
      orderNumber: parsed.orderNumber,
      tokenValid: true,
      duplicate: dedupeResult === 'duplicate',
      processedAt: Date.now(),
      email: parsed.email,
      rawBody: rawBodyForLog,
      rawQuery: rawQueryForLog
    })
  } catch (e) {
    // Не валим ответ из-за ошибки записи в журнал — LifePay должен получить 200.
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] webhook_log_create_failed`,
      payload: { number: parsed.number, error: String(e) }
    })
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] webhook_done`,
    payload: { number: parsed.number, dedupeResult }
  })

  return {
    statusCode: 200,
    rawHttpBody: 'OK',
    headers: { 'Content-Type': 'text/plain' }
  }
})

export default webhookRoute
