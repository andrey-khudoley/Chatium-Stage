/**
 * Парсинг и обработка тела webhook LifePay
 * (apidoc.life-pay.ru/notification, implementation-plan §1.8.3).
 *
 * Сырое тело webhook сохраняется в `webhook_log.rawBody` (клиент — оператор ПД,
 * маскировать ничего не нужно). MD5-подпись **не** проверяется:
 * LifePay её не публикует (нет полей check/signature/hash).
 *
 * Эти функции вынесены отдельно от файлового роута для удобства юнит-тестов.
 */

export type ParsedWebhookFields = {
  number: string
  type: string
  status: string
  method: string
  amount: string
  orderNumber: string
  email: string
}

function safeString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

/**
 * Извлечь стандартные поля webhook из тела JSON.
 *
 * По live-документации apidoc.life-pay.ru/notification (POST + JSON):
 *   - `number` — transaction number LifePay (корень).
 *   - `original_number` — `number` исходной транзакции для refund; null для payment.
 *   - `type` (payment/refund), `status` (success/fail), `method`, `amount` — поля верхнего уровня.
 *   - `order.number` — наш orderNumber, во вложенном объекте `order`
 *     (поля `order`: `ext_id`, `number`, `name`, `phone`, `email`, `comment`, `barcode`).
 *   - `email` — у LifePay в корне или в `customer.email`.
 *   - Дополнительные поля (`phone`, `pan`, `cardholder`, `rrn`, `description`,
 *     `created`, `terminal_serial`, `purchase[]`, `add_fields`) сохраняются
 *     в `webhook_log.rawBody` целиком — для просмотра в модалке.
 *
 * Принимает **развёрнутый** payload (после `unwrapWebhookBody`) — без обёртки
 * `{data: ...}`.
 *
 * Если поле не найдено — возвращается пустая строка (не null), чтобы Heap-схема приняла строку.
 */
export function parseWebhookBody(body: unknown): ParsedWebhookFields {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      number: '',
      type: '',
      status: '',
      method: '',
      amount: '',
      orderNumber: '',
      email: ''
    }
  }
  const obj = body as Record<string, unknown>

  const number = safeString(obj.number)
  const type = safeString(obj.type)
  const status = safeString(obj.status)
  const method = safeString(obj.method)
  const amount = safeString(obj.amount)

  let orderNumber = ''
  const orderRaw = obj.order
  if (typeof orderRaw === 'object' && orderRaw !== null) {
    orderNumber = safeString((orderRaw as Record<string, unknown>).number)
  } else if (typeof orderRaw === 'string') {
    orderNumber = orderRaw
  }

  let email = ''
  if (typeof obj.email === 'string') {
    email = obj.email
  } else if (typeof obj.customer === 'object' && obj.customer !== null) {
    const c = obj.customer as Record<string, unknown>
    if (typeof c.email === 'string') email = c.email
  }

  return { number, type, status, method, amount, orderNumber, email }
}

/**
 * Сверить токен из query со значением в Heap. Точное равенство строк.
 * Расхождение / отсутствие → 401 / 403 без записи в webhook_log.
 *
 * @returns 'missing' если токена нет, 'mismatch' при расхождении, 'valid' при совпадении.
 */
export type TokenCheckResult = 'missing' | 'mismatch' | 'valid' | 'not_configured'

export function checkWebhookToken(
  tokenFromQuery: string | undefined | null,
  tokenFromSettings: string
): TokenCheckResult {
  if (!tokenFromSettings) return 'not_configured'
  if (!tokenFromQuery || typeof tokenFromQuery !== 'string') return 'missing'
  return tokenFromQuery === tokenFromSettings ? 'valid' : 'mismatch'
}

export type UnwrapStrategy =
  | 'object'
  | 'object_data_field'
  | 'json_string'
  | 'form_data_field_json'
  | 'form_flat'
  | 'noop'
  | 'failed'

export type UnwrappedBody = {
  payload: unknown
  strategy: UnwrapStrategy
}

function tryJsonParse(s: string): unknown | undefined {
  try {
    return JSON.parse(s)
  } catch {
    return undefined
  }
}

function parseFormUrlEncoded(s: string): Record<string, string> | undefined {
  if (!s || s.indexOf('=') < 0) return undefined
  const out: Record<string, string> = {}
  for (const pair of s.split('&')) {
    if (!pair) continue
    const eq = pair.indexOf('=')
    const rawKey = eq >= 0 ? pair.slice(0, eq) : pair
    const rawVal = eq >= 0 ? pair.slice(eq + 1) : ''
    let key: string
    let val: string
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '))
    } catch {
      key = rawKey
    }
    try {
      val = decodeURIComponent(rawVal.replace(/\+/g, ' '))
    } catch {
      val = rawVal
    }
    if (key) out[key] = val
  }
  return Object.keys(out).length > 0 ? out : undefined
}

/**
 * Развернуть «как пришло» тело webhook от LifePay в JSON-объект.
 *
 * LifePay (PHP/Guzzle) исторически может присылать тело в одном из видов:
 *   - `application/json` с прямым JSON-объектом (req.body уже разобран);
 *   - `application/x-www-form-urlencoded` со всеми полями плоско
 *     (req.body — объект с полями `number`, `type`, ...);
 *   - `application/x-www-form-urlencoded` с одним полем `data=<JSON-строка>`
 *     (req.body — `{ data: "<json>" }`);
 *   - text/plain или без Content-Type, но тело — JSON-строка (req.body — строка);
 *   - произвольная form-encoded строка (req.body — строка вида `a=1&b=2`).
 *
 * Возвращает развёрнутый payload (объект) + стратегию (для диагностики).
 * Если развернуть не удалось — `payload` совпадает с исходным `body`,
 * стратегия `failed` / `noop`.
 */
export function unwrapWebhookBody(
  body: unknown,
  contentType: string
): UnwrappedBody {
  if (body === null || body === undefined) {
    return { payload: body, strategy: 'noop' }
  }

  if (typeof body === 'string') {
    const trimmed = body.trim()
    if (!trimmed) return { payload: body, strategy: 'noop' }
    // 1) Тело — JSON-строка.
    const asJson = tryJsonParse(trimmed)
    if (asJson && typeof asJson === 'object' && !Array.isArray(asJson)) {
      const dataField = (asJson as Record<string, unknown>).data
      // 1a) {"data": {<object>}} — JSON-обёртка LifePay (apidoc.life-pay).
      if (
        dataField &&
        typeof dataField === 'object' &&
        !Array.isArray(dataField) &&
        (asJson as Record<string, unknown>).number === undefined
      ) {
        return { payload: dataField, strategy: 'object_data_field' }
      }
      // 1b) {"data":"<json>"} — строка с вложенным JSON.
      if (typeof dataField === 'string') {
        const inner = tryJsonParse(dataField)
        if (inner && typeof inner === 'object') {
          return { payload: inner, strategy: 'form_data_field_json' }
        }
      }
      return { payload: asJson, strategy: 'json_string' }
    }
    // 2) Тело — form-urlencoded строка.
    const asForm = parseFormUrlEncoded(trimmed)
    if (asForm) {
      const dataField = asForm.data
      if (typeof dataField === 'string') {
        const inner = tryJsonParse(dataField)
        if (inner && typeof inner === 'object') {
          return { payload: inner, strategy: 'form_data_field_json' }
        }
      }
      return { payload: asForm, strategy: 'form_flat' }
    }
    return { payload: body, strategy: 'failed' }
  }

  if (typeof body === 'object' && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>
    // 3) Объект {data: <object>} (JSON-обёртка по контракту LifePay) → разворачиваем.
    if (
      obj.data &&
      typeof obj.data === 'object' &&
      !Array.isArray(obj.data) &&
      (obj as Record<string, unknown>).number === undefined
    ) {
      return { payload: obj.data, strategy: 'object_data_field' }
    }
    // 4) Объект {data: "<json>"} (form-encoded auto-parse) → парсим вложенный JSON.
    if (typeof obj.data === 'string' && Object.keys(obj).length <= 2) {
      const inner = tryJsonParse(obj.data)
      if (inner && typeof inner === 'object') {
        return { payload: inner, strategy: 'form_data_field_json' }
      }
    }
    return { payload: body, strategy: 'object' }
  }

  return { payload: body, strategy: 'noop' }
}

/**
 * Достать текстовый payload из multipart/form-data полей (`req.files` /
 * `req.fields`), если Chatium-платформа разобрала multipart, но не положила
 * текстовые поля в `req.body`.
 *
 * LifePay шлёт webhook как `multipart/form-data` с одним полем `data`,
 * содержащим JSON-строку транзакции. Возможные shape-ы в Chatium:
 *   - `req.files.data = "<json>"` (строка),
 *   - `req.files.data = { data: "<json>" }` (объект с полем),
 *   - `req.files.data = { content/data/value/text: "<json>" }` (поле в обёртке),
 *   - `req.fields.data = "<json>"` (если Chatium разделяет files и fields).
 *
 * Возвращает «как бы distinguished body» совместимое с `unwrapWebhookBody`:
 *   - если нашли одно текстовое поле — отдадим `{ <fieldName>: "<json>" }`
 *     (затем unwrap превратит в JSON-объект),
 *   - если поле уже выглядит JSON-объектом — отдадим объект напрямую,
 *   - если ничего полезного не нашлось — вернёт `undefined`.
 */
export function extractMultipartTextPayload(
  files: unknown,
  fields: unknown
): unknown | undefined {
  const candidates: Array<Record<string, unknown>> = []
  if (files && typeof files === 'object' && !Array.isArray(files)) {
    candidates.push(files as Record<string, unknown>)
  }
  if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
    candidates.push(fields as Record<string, unknown>)
  }
  if (candidates.length === 0) return undefined

  // Сначала ищем поле "data" — оно по контракту LifePay.
  for (const c of candidates) {
    const v = c.data
    const flattened = flattenMultipartField(v)
    if (flattened !== undefined) {
      return { data: flattened }
    }
  }

  // Иначе пробуем все ключи: если ровно одно поле — отдаём его как обёртку.
  for (const c of candidates) {
    const keys = Object.keys(c)
    if (keys.length === 1) {
      const k = keys[0]
      const flattened = flattenMultipartField(c[k])
      if (flattened !== undefined) {
        return { [k]: flattened }
      }
    }
  }

  // Если несколько полей и среди них нет "data" — отдаём весь объект как есть
  // (плоский form-like объект, unwrap пройдёт стратегией object/form_flat).
  for (const c of candidates) {
    if (Object.keys(c).length > 0) {
      return c
    }
  }

  return undefined
}

/**
 * Достать значение текстового multipart-поля независимо от того, отдала ли
 * платформа его как строку, Buffer-подобный объект или контейнер с полем
 * `data/content/value/text`.
 */
function flattenMultipartField(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as Record<string, unknown>
    // Buffer-like: { type: 'Buffer', data: number[] }
    if (Array.isArray(o.data) && (o.data as unknown[]).every((n) => typeof n === 'number')) {
      try {
        const bytes = (o.data as number[]).filter((n) => n >= 0 && n < 256)
        return String.fromCharCode(...bytes)
      } catch {
        // ignore
      }
    }
    for (const k of ['content', 'value', 'text', 'data', 'body', 'string']) {
      const inner = o[k]
      if (typeof inner === 'string') return inner
    }
  }
  return undefined
}
