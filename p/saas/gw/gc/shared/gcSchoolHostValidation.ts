// @shared

/**
 * Валидация хоста школы GetCourse для `gc_test_school_host` и заголовка `X-Gc-School-Host` (manual §2.5).
 * Без схемы и без порта в строке хоста; без пробелов и символов `/ \ ? # :`, длина ≤ 253.
 *
 * В `// @shared` нельзя тянуть `lib/logger.lib` — ошибки для сервера логируются в границе lib (`throwLoggedServerError` + `validateGcSchoolHostTrimmed`).
 */

/** Имя хоста школы не содержит порт — `:` запрещён вместе с остальными недопустимыми символами. */
const FORBIDDEN_IN_HOST = /[\s/\\?#:]/

/** Именованная ошибка валидации хоста (не `Error` без типа) — для `instanceof` в тестах и при необходимости на сервере. */
export class GcSchoolHostValidationError extends Error {
  override name = 'GcSchoolHostValidationError'
  constructor(message: string) {
    super(message)
  }
}

/**
 * Проверка хоста после `trim`. Возвращает текст ошибки или `null`, если значение допустимо.
 * Параметр может быть с пробелами по краям — внутри выполняется `trim`.
 */
export function validateGcSchoolHostTrimmed(host: string): string | null {
  const h = host.trim()
  if (!h) {
    return 'Хост тестовой школы не может быть пустым или из одних пробелов.'
  }
  if (h.length > 253) {
    return 'Хост тестовой школы: не более 253 символов.'
  }
  const lower = h.toLowerCase()
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return 'Укажите хост без схемы (без http:// и https://).'
  }
  if (FORBIDDEN_IN_HOST.test(h)) {
    return 'В хосте недопустимы пробелы, двоеточие (порт не задаётся в имени хоста) и символы / \\ ? #.'
  }

  return null
}

/**
 * Проверяет уже обрезанную строку хоста. Бросает {@link GcSchoolHostValidationError} с текстом для UI / совместимости.
 * @deprecated Предпочтительно {@link validateGcSchoolHostTrimmed} на сервере + `throwLoggedServerError`.
 */
export function assertValidGcSchoolHostTrimmed(host: string): void {
  const err = validateGcSchoolHostTrimmed(host)
  if (err) {
    throw new GcSchoolHostValidationError(err)
  }
}

/**
 * Нормализует значение из Heap/API: trim и проверки §2.5. Возвращает строку для записи.
 */
export function normalizeGcTestSchoolHost(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim()
  const err = validateGcSchoolHostTrimmed(s)
  if (err) {
    throw new GcSchoolHostValidationError(err)
  }
  return s
}

/** Для формы админки: `null` если значение допустимо, иначе текст ошибки. */
export function getGcSchoolHostFieldError(raw: string): string | null {
  return validateGcSchoolHostTrimmed(raw)
}
