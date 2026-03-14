// @shared
/**
 * Клиентские утилиты для рендера markdown в блокноте.
 * Используются только в браузере (Vue-компоненты).
 * Ссылки: в href допускаются только http:, https: и относительные пути (защита от javascript:/data:).
 */

function escapeHtml(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return s.replace(/[&<>"']/g, (ch) => map[ch] ?? ch)
}

/** Допустимые протоколы для href; иначе подставляем # во избежание XSS. */
function safeHref(url: string): string {
  const t = url.trim().toLowerCase()
  if (t.startsWith('https://') || t.startsWith('http://')) return url.trim()
  if (t.startsWith('/') || t.startsWith('./') || t.startsWith('../')) return url.trim()
  if (t.startsWith('#')) return url.trim()
  return '#'
}

/**
 * Рендер markdown в HTML для режима просмотра.
 * Поддерживает: заголовки, жирный/курсив/код, ссылки, списки, чекбоксы.
 * Чекбоксы получают data-checkbox-index для обработки клика.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return ''
  const lines = markdown.split(/\r?\n/)
  const out: string[] = []
  let inList = false
  let inTaskList = false
  let listTag = ''
  let checkboxIndex = 0

  function flushList() {
    if (inList) {
      out.push(`</${listTag}>`)
      inList = false
      inTaskList = false
    }
  }

  function inlineToHtml(line: string): string {
    return line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => '<a href="' + escapeHtml(safeHref(url)) + '" target="_blank" rel="noopener">' + escapeHtml(text) + '</a>')
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const trimmed = raw.trimStart()
    const indent = raw.length - trimmed.length

    if (trimmed.startsWith('### ')) {
      flushList()
      out.push('<h3>' + escapeHtml(trimmed.slice(4)) + '</h3>')
      continue
    }
    if (trimmed.startsWith('## ')) {
      flushList()
      out.push('<h2>' + escapeHtml(trimmed.slice(3)) + '</h2>')
      continue
    }
    if (trimmed.startsWith('# ')) {
      flushList()
      out.push('<h1>' + escapeHtml(trimmed.slice(2)) + '</h1>')
      continue
    }
    if (trimmed.startsWith('> ')) {
      flushList()
      out.push('<blockquote>' + inlineToHtml(escapeHtml(trimmed.slice(2))) + '</blockquote>')
      continue
    }
    const taskMatch = trimmed.match(/^[-*]\s+\[([ x])\]\s*(.*)$/i)
    if (taskMatch) {
      if (!inTaskList || listTag !== 'ul') {
        flushList()
        out.push('<ul class="notebook-task-list">')
        inList = true
        inTaskList = true
        listTag = 'ul'
      }
      const checked = taskMatch[1].toLowerCase() === 'x'
      const label = inlineToHtml(escapeHtml(taskMatch[2]))
      const idx = checkboxIndex++
      out.push(
        '<li class="notebook-task-item" data-checkbox-index="' +
          idx +
          '">' +
          '<button type="button" class="notebook-checkbox ' +
          (checked ? 'checked' : '') +
          '" data-index="' +
          idx +
          '" aria-label="' +
          (checked ? 'Выполнено' : 'Не выполнено') +
          '">' +
          (checked ? '&#10003;' : '') +
          '</button>' +
          '<span class="notebook-task-label' +
          (checked ? ' notebook-task-done' : '') +
          '">' +
          label +
          '</span></li>'
      )
      continue
    }
    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const tag = /^\d+\.\s+/.test(trimmed) ? 'ol' : 'ul'
      if (!inList || listTag !== tag) {
        flushList()
        out.push('<' + tag + '>')
        inList = true
        inTaskList = false
        listTag = tag
      }
      const content = trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
      out.push('<li>' + inlineToHtml(escapeHtml(content)) + '</li>')
      continue
    }

    flushList()
    if (trimmed === '') {
      out.push('<br/>')
    } else {
      out.push('<p>' + inlineToHtml(escapeHtml(trimmed)) + '</p>')
    }
  }
  flushList()
  return out.join('')
}
