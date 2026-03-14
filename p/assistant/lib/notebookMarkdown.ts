/**
 * Утилиты для работы с markdown заметок блокнота.
 * Чекбоксы: GitHub-style task list (- [ ] / - [x]).
 */

const PREVIEW_MAX_LEN = 120
const CHECKBOX_LINE_RE = /^(\s*[-*]\s+)\[([ x])\](.*)$/im

/**
 * Извлекает короткий превью-текст из markdown (без разметки, для списка заметок).
 */
export function extractPreview(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return ''
  const stripped = markdown
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s+\[[ x]\]\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
  if (stripped.length <= PREVIEW_MAX_LEN) return stripped
  return stripped.slice(0, PREVIEW_MAX_LEN) + '…'
}

/**
 * Нумерация чекбоксов: 0-based индекс по порядку появления в документе.
 * toggleCheckbox(markdown, index, checked) меняет состояние N-го чекбокса.
 */
export function toggleCheckbox(
  markdown: string,
  checkboxIndex: number,
  checked: boolean
): string {
  if (!markdown || typeof markdown !== 'string') return markdown
  if (checkboxIndex < 0) return markdown
  const lines = markdown.split('\n')
  let currentIndex = 0
  const newChar = checked ? 'x' : ' '
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(CHECKBOX_LINE_RE)
    if (m) {
      if (currentIndex === checkboxIndex) {
        lines[i] = m[1] + '[' + newChar + ']' + m[3]
        return lines.join('\n')
      }
      currentIndex++
    }
  }
  return markdown
}

/**
 * Возвращает количество чекбоксов в документе (для валидации index).
 */
export function countCheckboxes(markdown: string): number {
  if (!markdown || typeof markdown !== 'string') return 0
  const lines = markdown.split('\n')
  let count = 0
  for (const line of lines) {
    if (CHECKBOX_LINE_RE.test(line)) count++
  }
  return count
}
