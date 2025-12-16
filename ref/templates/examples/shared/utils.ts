// @shared

/**
 * Форматирует размер файла в читаемый формат
 * @param bytes Размер в байтах
 * @returns Форматированная строка размера
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Форматирует числовое значение в валюту
 * @param amount Сумма
 * @param currency Код валюты (RUB, USD, EUR)
 * @returns Отформатированная строка с валютой
 */
export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Форматирует дату в строку
 * @param date Дата или строка с датой
 * @param format Формат вывода (short, long, full, time)
 * @returns Отформатированная дата
 */
export function formatDate(date: Date | string, format: string = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' } as const,
    long: { day: 'numeric', month: 'long', year: 'numeric' } as const,
    full: { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' } as const,
    time: { hour: '2-digit', minute: '2-digit' } as const
  }
  
  return dateObj.toLocaleDateString('ru-RU', options[format] || options.short)
}

/**
 * Форматирует номер телефона в стандартный вид
 * @param phone Номер телефона
 * @returns Отформатированный номер
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    if (cleaned.startsWith('7') || cleaned.startsWith('8')) {
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`
    }
  }
  
  return phone
}

// ============== VALIDATION UTILITIES ==============

/**
 * Проверяет валидность email адреса
 * @param email Email для проверки
 * @returns true если email валиден
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Проверяет валидность номера телефона
 * @param phone Номер телефона для проверки
 * @returns true если номер валиден
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[7|8][\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/
  return phoneRegex.test(phone) || /^[0-9]{10,15}$/.test(phone.replace(/\D/g, ''))
}

/**
 * Проверяет валидность URL
 * @param url URL для проверки
 * @returns true если URL валиден
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ============== STRING UTILITIES ==============

/**
 * Преобразует строку в slug (для URL)
 * @param text Исходная строка
 * @returns Slug версия строки
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Обрезает текст до максимальной длины
 * @param text Исходный текст
 * @param length Максимальная длина
 * @param suffix Суффикс для обрезанного текста
 * @returns Обрезанный текст
 */
export function truncate(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + suffix
}

/**
 * Капитализирует первый символ строки
 * @param text Исходная строка
 * @returns Строка с капитализированным первым символом
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Генерирует случайную строку
 * @param length Длина строки
 * @returns Случайная строка
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ============== DATE UTILITIES ==============

/**
 * Добавляет дни к дате
 * @param date Исходная дата
 * @param days Количество дней
 * @returns Новая дата
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Вычитает дни из даты
 * @param date Исходная дата
 * @param days Количество дней
 * @returns Новая дата
 */
export function subDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

/**
 * Проверяет, находится ли дата в будущем
 * @param date Дата для проверки
 * @returns true если дата в будущем
 */
export function isDateInFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj > new Date()
}

/**
 * Проверяет, находится ли дата в прошлом
 * @param date Дата для проверки
 * @returns true если дата в прошлом
 */
export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj < new Date()
}

/**
 * Вычисляет количество дней между двумя датами
 * @param startDate Начальная дата
 * @param endDate Конечная дата
 * @returns Количество дней
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============== ARRAY UTILITIES ==============

/**
 * Возвращает уникальные элементы массива
 * @param array Исходный массив
 * @returns Массив с уникальными элементами
 */
export function uniqueItems<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Группирует элементы массива по ключу
 * @param array Исходный массив
 * @param key Ключ для группировки
 * @returns Объект с сгруппированными элементами
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Сортирует массив по ключу
 * @param array Исходный массив
 * @param key Ключ для сортировки
 * @param order Порядок сортировки (asc или desc)
 * @returns Отсортированный массив
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

// ============== OBJECT UTILITIES ==============

/**
 * Удаляет свойства из объекта
 * @param obj Исходный объект
 * @param keys Ключи для удаления
 * @returns Новый объект без указанных ключей
 */
export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

/**
 * Выбирает свойства из объекта
 * @param obj Исходный объект
 * @param keys Ключи для выбора
 * @returns Новый объект только с выбранными ключами
 */
export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

/**
 * Проверяет, пуста ли переменная
 * @param value Значение для проверки
 * @returns true если значение пусто
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  if (typeof value === 'string') return value.trim().length === 0
  return false
}

// ============== PERFORMANCE UTILITIES ==============

/**
 * Создает debounced версию функции
 * @param func Исходная функция
 * @param wait Задержка в миллисекундах
 * @returns Debounced функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Создает throttled версию функции
 * @param func Исходная функция
 * @param limit Период в миллисекундах
 * @returns Throttled функция
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// ============== STORAGE UTILITIES ==============

/**
 * Сохраняет значение в localStorage
 * @param key Ключ для сохранения
 * @param value Значение для сохранения
 */
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

/**
 * Получает значение из localStorage
 * @param key Ключ для получения
 * @param defaultValue Значение по умолчанию
 * @returns Сохраненное значение или значение по умолчанию
 */
export function getLocalStorage<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue || null
  } catch (error) {
    return defaultValue || null
  }
}

/**
 * Удаляет значение из localStorage
 * @param key Ключ для удаления
 */
export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}

// ============== COLOR UTILITIES ==============

/**
 * Преобразует HEX цвет в RGB
 * @param hex HEX строка цвета
 * @returns Объект с RGB компонентами или null
 */
export function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Преобразует RGB в HEX цвет
 * @param r Красный компонент
 * @param g Зеленый компонент
 * @param b Синий компонент
 * @returns HEX строка цвета
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

/**
 * Определяет, является ли цвет темным
 * @param hex HEX строка цвета
 * @returns true если цвет темный
 */
export function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex)
  if (!rgb) return false
  
  const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000
  return yiq < 128
}
