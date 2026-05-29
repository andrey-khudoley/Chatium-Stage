// @shared
/**
 * Парсинг whitelist'а доменов из строки настроек и проверка Origin запроса.
 *
 * Используется виджетными API-эндпоинтами (`api/widgets/*`) для контроля
 * cross-origin доступа со страниц магазина к нашим публичным эндпоинтам.
 * Origin запроса (заголовок `Origin` или `Referer`) сравнивается со списком
 * разрешённых доменов, заданных администратором через веб-панель.
 *
 * Содержит **только pure-функции** — не обращается к Heap, `ctx`, `req`.
 * Серверные обработчики извлекают заголовки сами и передают сюда
 * `Record<string, unknown>`.
 */

/** Результат CORS-проверки для логирования и формирования ответа. */
export type WidgetCorsResult = {
  /** Origin прошёл whitelist и можно ставить `Access-Control-Allow-Origin`. */
  allowed: boolean
  /** Origin запроса (как пришёл) или пустая строка, если заголовок отсутствует. */
  origin: string
  /** Hostname из Origin (для логирования и отображения в audit-логе). */
  hostname: string
}

/**
 * Извлекает значение заголовка по имени (case-insensitive). Возвращает пустую
 * строку, если заголовок отсутствует или непригоден для CORS-сравнения.
 */
function readHeaderValue(headers: Record<string, unknown>, name: string): string {
  const lower = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower) {
      const v = headers[key]
      if (typeof v === 'string') return v
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string') return v[0]
      return ''
    }
  }
  return ''
}

/**
 * Парсит whitelist-строку доменов в массив. Разделители — запятая, пробел,
 * перевод строки. Каждый элемент trim + toLowerCase. Пустые отбрасываются.
 * Поддерживает запись `example.com`, `https://example.com`, `https://example.com/path`.
 */
export function parseDomains(raw: string): string[] {
  if (typeof raw !== 'string' || raw.trim().length === 0) return []
  return raw
    .split(/[,\n\r\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)
}

/**
 * Извлекает hostname из строки Origin. Возвращает пустую строку при ошибке.
 * Поддерживает три формы: `https://example.com`, `https://example.com:8080`,
 * `example.com`.
 */
export function extractHostname(originValue: string): string {
  if (!originValue) return ''
  const trimmed = originValue.trim().toLowerCase()
  if (!trimmed) return ''
  // Защита от патологических вводов (длинные заголовки) перед regex.
  if (trimmed.length > 2048) return ''
  // Полный URL — `protocol://host[:port][/path]`
  const m = /^([a-z]+:\/\/)?([^/:\s]+)(:\d+)?/i.exec(trimmed)
  return m && m[2] ? m[2] : ''
}

/**
 * Сравнивает hostname Origin со списком разрешённых доменов. Каждый элемент
 * whitelist'а нормализуется через `extractHostname` (на случай если админ
 * прописал URL с протоколом). Сравнение — точное (без поддержки `*.subdomain`).
 */
export function isOriginAllowed(originHostname: string, allowedDomains: string[]): boolean {
  if (!originHostname) return false
  if (allowedDomains.length === 0) return false
  for (const candidate of allowedDomains) {
    const normalized = extractHostname(candidate) || candidate.trim().toLowerCase()
    if (normalized && normalized === originHostname) return true
  }
  return false
}

/**
 * Главная функция CORS-проверки виджетных эндпоинтов.
 *
 * Извлекает Origin (или Referer как fallback) из заголовков, парсит hostname,
 * сверяет со whitelist'ом. Возвращает структурированный результат, который
 * обработчик использует для формирования ответа и audit-лога.
 *
 * @param headers — объект заголовков запроса (уже извлечён из `req`).
 * @param allowedDomainsRaw — whitelist-строка из настроек виджета.
 */
export function checkWidgetOrigin(
  headers: Record<string, unknown>,
  allowedDomainsRaw: string
): WidgetCorsResult {
  const originRaw = readHeaderValue(headers, 'origin') || readHeaderValue(headers, 'referer')
  const origin = typeof originRaw === 'string' ? originRaw : ''
  const hostname = extractHostname(origin)
  const allowedDomains = parseDomains(allowedDomainsRaw)
  const allowed = isOriginAllowed(hostname, allowedDomains)
  return { allowed, origin, hostname }
}
