<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import WysiwygToolbar from './WysiwygToolbar.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLElement | null>(null)
const toolbarRef = ref<InstanceType<typeof WysiwygToolbar> | null>(null)
const activeStates = ref<Record<string, boolean>>({})
const currentBlock = ref('p')
const isInTable = ref(false)

let savedRange: Range | null = null
let ignoreInput = false

function ensureHtml(raw: string): string {
  if (!raw) return '<p><br></p>'
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw
  return raw
    .split('\n')
    .map(line => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
    .join('')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

onMounted(() => {
  if (editorRef.value) {
    editorRef.value.innerHTML = ensureHtml(props.modelValue)
  }
  document.addEventListener('selectionchange', updateState)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', updateState)
})

watch(() => props.modelValue, (val) => {
  if (!editorRef.value) return
  if (editorRef.value.innerHTML !== val) {
    ignoreInput = true
    editorRef.value.innerHTML = ensureHtml(val)
  }
})

function onInput() {
  if (ignoreInput) {
    ignoreInput = false
    return
  }
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML)
  }
}

function saveSelection() {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && editorRef.value?.contains(sel.anchorNode)) {
    savedRange = sel.getRangeAt(0).cloneRange()
  }
}

function restoreSelection() {
  if (!savedRange) return
  const sel = window.getSelection()
  if (sel) {
    sel.removeAllRanges()
    sel.addRange(savedRange)
  }
}

function updateState() {
  const sel = window.getSelection()
  if (!sel || !editorRef.value || !editorRef.value.contains(sel.anchorNode)) return

  activeStates.value = {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    strikeThrough: document.queryCommandState('strikeThrough'),
    insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    insertOrderedList: document.queryCommandState('insertOrderedList'),
    justifyLeft: document.queryCommandState('justifyLeft'),
    justifyCenter: document.queryCommandState('justifyCenter'),
    justifyRight: document.queryCommandState('justifyRight'),
    justifyFull: document.queryCommandState('justifyFull'),
  }

  const block = document.queryCommandValue('formatBlock')
  currentBlock.value = block || 'p'

  let node: Node | null = sel.anchorNode
  isInTable.value = false
  while (node && node !== editorRef.value) {
    if (node instanceof HTMLElement && node.tagName === 'TABLE') {
      isInTable.value = true
      break
    }
    node = node.parentNode
  }
}

function execCommand(cmd: string, value?: string) {
  editorRef.value?.focus()
  restoreSelection()

  switch (cmd) {
    case 'formatBlock':
      document.execCommand('formatBlock', false, `<${value}>`)
      break
    case 'foreColor':
      document.execCommand('foreColor', false, value)
      break
    case 'createLink': {
      const data = JSON.parse(value || '{}')
      document.execCommand('createLink', false, data.href)
      const sel = window.getSelection()
      if (sel?.anchorNode) {
        let n: Node | null = sel.anchorNode
        while (n && n !== editorRef.value) {
          if (n instanceof HTMLAnchorElement) {
            n.target = data.target || '_blank'
            n.rel = 'noopener noreferrer'
            break
          }
          n = n.parentNode
        }
      }
      break
    }
    case 'insertTable': {
      const { rows, cols } = JSON.parse(value || '{}')
      insertTableHtml(rows, cols)
      break
    }
    case 'addRowAbove':
    case 'addRowBelow':
    case 'addColLeft':
    case 'addColRight':
    case 'deleteRow':
    case 'deleteCol':
      tableOp(cmd)
      break
    case 'insertHorizontalRule':
      document.execCommand('insertHorizontalRule', false)
      break
    case 'insertInlineCode':
      wrapInlineCode()
      break
    case 'insertCodeBlock':
      insertCodeBlockHtml()
      break
    case 'insertBlockquote':
      document.execCommand('formatBlock', false, '<blockquote>')
      break
    case 'removeFormat':
      document.execCommand('removeFormat', false)
      document.execCommand('formatBlock', false, '<p>')
      break
    default:
      document.execCommand(cmd, false, value)
  }

  nextTick(() => {
    onInput()
    updateState()
    saveSelection()
  })
}

function insertTableHtml(rows: number, cols: number) {
  let html = '<table><tbody>'
  for (let r = 0; r < rows; r++) {
    html += '<tr>'
    for (let c = 0; c < cols; c++) {
      html += '<td><br></td>'
    }
    html += '</tr>'
  }
  html += '</tbody></table><p><br></p>'
  document.execCommand('insertHTML', false, html)
}

function tableOp(op: string) {
  const sel = window.getSelection()
  if (!sel?.anchorNode) return
  let td: HTMLTableCellElement | null = null
  let node: Node | null = sel.anchorNode
  while (node && node !== editorRef.value) {
    if (node instanceof HTMLTableCellElement) { td = node; break }
    node = node.parentNode
  }
  if (!td) return
  const tr = td.closest('tr')
  const table = td.closest('table')
  if (!tr || !table) return
  const ci = td.cellIndex

  if (op === 'addRowAbove' || op === 'addRowBelow') {
    const nr = tr.cloneNode(true) as HTMLTableRowElement
    Array.from(nr.cells).forEach(c => { c.innerHTML = '<br>' })
    tr.parentNode?.insertBefore(nr, op === 'addRowAbove' ? tr : tr.nextSibling)
  } else if (op === 'addColLeft' || op === 'addColRight') {
    for (let i = 0; i < table.rows.length; i++) {
      const nc = document.createElement('td')
      nc.innerHTML = '<br>'
      const ref = table.rows[i].cells[ci]
      table.rows[i].insertBefore(nc, op === 'addColLeft' ? ref : ref?.nextSibling || null)
    }
  } else if (op === 'deleteRow') {
    table.rows.length <= 1 ? table.remove() : tr.remove()
  } else if (op === 'deleteCol') {
    if (tr.cells.length <= 1) {
      table.remove()
    } else {
      for (let i = table.rows.length - 1; i >= 0; i--) table.rows[i].deleteCell(ci)
    }
  }
}

function wrapInlineCode() {
  const sel = window.getSelection()
  if (!sel?.rangeCount) return
  const range = sel.getRangeAt(0)
  if (range.collapsed) {
    document.execCommand('insertHTML', false, '<code>&nbsp;</code>')
    return
  }
  const code = document.createElement('code')
  try {
    range.surroundContents(code)
  } catch {
    const text = range.extractContents()
    code.appendChild(text)
    range.insertNode(code)
  }
}

function insertCodeBlockHtml() {
  document.execCommand('insertHTML', false, '<pre><code>\n</code></pre><p><br></p>')
}

function onKeydown(e: KeyboardEvent) {
  const sel = window.getSelection()
  if (!sel?.anchorNode) return

  let inPre = false
  let node: Node | null = sel.anchorNode
  while (node && node !== editorRef.value) {
    if (node instanceof HTMLElement && node.tagName === 'PRE') { inPre = true; break }
    node = node.parentNode
  }

  if (inPre && e.key === 'Tab') {
    e.preventDefault()
    document.execCommand('insertText', false, '  ')
  }
  if (inPre && e.key === 'Enter') {
    e.preventDefault()
    document.execCommand('insertText', false, '\n')
  }
}

function onEditorFocus() { saveSelection() }
function onEditorMouseup() { saveSelection() }
function onEditorKeyup() { saveSelection() }
</script>

<template>
  <div class="wy-editor-wrap">
    <WysiwygToolbar
      ref="toolbarRef"
      :activeStates="activeStates"
      :currentBlock="currentBlock"
      :isInTable="isInTable"
      @exec="execCommand"
    />
    <div
      ref="editorRef"
      class="wy-content"
      contenteditable="true"
      spellcheck="true"
      :data-placeholder="placeholder || 'Содержимое заметки'"
      @input="onInput"
      @keydown="onKeydown"
      @focus="onEditorFocus"
      @mouseup="onEditorMouseup"
      @keyup="onEditorKeyup"
    />
  </div>
</template>

<style scoped>
.wy-editor-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.wy-content {
  flex: 1;
  min-height: 16rem;
  padding: 0.6rem 0.7rem;
  font-family: inherit;
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
  overflow-y: auto;
  outline: none;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.wy-content:focus {
  box-shadow: inset 0 0 0 1px var(--color-accent);
}

.wy-content:empty::before {
  content: attr(data-placeholder);
  color: var(--color-text-tertiary);
  pointer-events: none;
  display: block;
}
</style>

<style>
.wy-content h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.6rem 0 0.3rem;
  color: var(--color-text);
  letter-spacing: 0.02em;
}
.wy-content h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0.5rem 0 0.25rem;
  color: var(--color-text);
}
.wy-content h3 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0.4rem 0 0.2rem;
  color: var(--color-text);
}
.wy-content p {
  margin: 0.25rem 0;
}
.wy-content ul,
.wy-content ol {
  margin: 0.3rem 0;
  padding-left: 1.5rem;
}
.wy-content ul { list-style-type: disc; }
.wy-content ol { list-style-type: decimal; }
.wy-content li { margin: 0.1rem 0; }
.wy-content ul ul,
.wy-content ol ol,
.wy-content ul ol,
.wy-content ol ul {
  margin: 0.1rem 0;
}

.wy-content blockquote {
  margin: 0.4rem 0;
  padding: 0.3rem 0.6rem;
  border-left: 3px solid var(--color-accent);
  background: rgba(211, 35, 75, 0.05);
  color: var(--color-text-secondary);
  font-style: italic;
}

.wy-content a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.wy-content a:hover {
  color: var(--color-accent-hover);
}

.wy-content code {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 0.78rem;
  padding: 0.1rem 0.3rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  color: var(--color-accent);
}

.wy-content pre {
  margin: 0.4rem 0;
  padding: 0.5rem 0.6rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 2px;
  overflow-x: auto;
  white-space: pre;
}
.wy-content pre code {
  padding: 0;
  background: transparent;
  border: none;
  color: var(--color-text);
  font-size: 0.75rem;
  line-height: 1.5;
}

.wy-content table {
  border-collapse: collapse;
  margin: 0.4rem 0;
  width: 100%;
}
.wy-content th,
.wy-content td {
  border: 1px solid var(--color-border-light);
  padding: 0.3rem 0.45rem;
  font-size: 0.78rem;
  min-width: 3rem;
  vertical-align: top;
}
.wy-content th {
  background: var(--color-bg-tertiary);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
}
.wy-content td {
  background: transparent;
}
.wy-content td:focus,
.wy-content th:focus {
  outline: 1px solid var(--color-accent);
  outline-offset: -1px;
}

.wy-content hr {
  border: none;
  border-top: 1px solid var(--color-border-light);
  margin: 0.5rem 0;
}

.wy-content img {
  max-width: 100%;
  height: auto;
}
</style>
