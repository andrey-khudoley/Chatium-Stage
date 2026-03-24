<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
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

// Media overlay state
const selectedMedia = ref<HTMLElement | null>(null)
const bubbleMenuPos = ref({ x: 0, y: 0 })
const isResizing = ref(false)

const MEDIA_SELECTOR = '.wy-media-img, .wy-media-video, .wy-media-pdf, .wy-media-file'

const showBubbleMenu = computed(() => !!selectedMedia.value && !isResizing.value)
const isImageSelected = computed(() => selectedMedia.value?.classList.contains('wy-media-img') ?? false)
const isFileSelected = computed(() => selectedMedia.value?.classList.contains('wy-media-file') ?? false)

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
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  window.addEventListener('resize', onWindowScroll)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', updateState)
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('resize', onWindowScroll)
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

function insertMedia(type: 'image' | 'video' | 'pdf' | 'file', url: string, filename?: string) {
  // Clear any existing selection
  clearMediaSelection()
  
  editorRef.value?.focus()
  restoreSelection()

  const html = buildMediaHtml(type, url, filename)
  document.execCommand('insertHTML', false, html + '<p><br></p>')

  nextTick(() => {
    onInput()
    saveSelection()
    
    // Auto-select the newly inserted media
    const media = editorRef.value?.querySelector(`${MEDIA_SELECTOR}:last-of-type`) as HTMLElement | null
    if (!media) return
    
    // For images, wait for load to get correct dimensions
    if (type === 'image' && media instanceof HTMLImageElement) {
      const img = media as HTMLImageElement
      
      // If already loaded (cached), select immediately
      if (img.complete && img.naturalWidth > 0) {
        selectMedia(media)
        return
      }
      
      // Otherwise wait for load event
      const onLoad = () => {
        selectMedia(media)
        img.removeEventListener('load', onLoad)
        img.removeEventListener('error', onError)
      }
      const onError = () => {
        // Select anyway even if load failed
        selectMedia(media)
        img.removeEventListener('load', onLoad)
        img.removeEventListener('error', onError)
      }
      
      img.addEventListener('load', onLoad)
      img.addEventListener('error', onError)
      
      // Fallback: select after timeout even if not loaded
      setTimeout(() => {
        if (!selectedMedia.value) {
          selectMedia(media)
          img.removeEventListener('load', onLoad)
          img.removeEventListener('error', onError)
        }
      }, 300)
    } else {
      // For other types, use requestAnimationFrame to ensure DOM is rendered
      requestAnimationFrame(() => {
        selectMedia(media)
      })
    }
  })
}

function buildMediaHtml(type: 'image' | 'video' | 'pdf' | 'file', url: string, filename?: string): string {
  switch (type) {
    case 'image':
      return `<img src="${escapeHtml(url)}" class="wy-media-img" alt="${escapeHtml(filename || 'Изображение')}" />`
    case 'video':
      return `<video src="${escapeHtml(url)}" class="wy-media-video" controls preload="metadata"></video>`
    case 'pdf':
      return `<div class="wy-media-pdf"><iframe src="${escapeHtml(url)}" width="100%" height="500px" frameborder="0"></iframe><a href="${escapeHtml(url)}" target="_blank" class="wy-media-link">Открыть PDF</a></div>`
    case 'file':
    default:
      const ext = filename ? filename.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE'
      return `<div class="wy-media-file" data-filename="${escapeHtml(filename || 'file')}"><div class="wy-file-icon">${ext}</div><div class="wy-file-info"><div class="wy-file-name">${escapeHtml(filename || 'Файл')}</div><a href="${escapeHtml(url)}" target="_blank" download class="wy-file-link">Скачать</a></div></div>`
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

function onEditorClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const mediaEl = target.closest(MEDIA_SELECTOR) as HTMLElement | null
  
  // If clicked outside media, deselect
  if (!mediaEl) {
    clearMediaSelection()
    return
  }
  
  // Select the media element
  e.preventDefault()
  e.stopPropagation()
  selectMedia(mediaEl)
}

function selectMedia(el: HTMLElement) {
  // Remove selected class from previous
  if (selectedMedia.value) {
    selectedMedia.value.classList.remove('wy-media-selected')
  }
  // Add to new
  selectedMedia.value = el
  el.classList.add('wy-media-selected')
  updateBubbleMenuPosition()
}

function clearMediaSelection() {
  if (selectedMedia.value) {
    selectedMedia.value.classList.remove('wy-media-selected')
    selectedMedia.value = null
  }
}

function updateBubbleMenuPosition() {
  if (!selectedMedia.value) return
  
  const rect = selectedMedia.value.getBoundingClientRect()
  
  // Position bubble menu above the media (using viewport coordinates for fixed positioning)
  bubbleMenuPos.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 12
  }
}

function deleteSelectedMedia() {
  if (!selectedMedia.value) return
  selectedMedia.value.remove()
  clearMediaSelection()
  onInput()
}

function alignImage(align: 'left' | 'center' | 'right') {
  if (!selectedMedia.value || !isImageSelected.value) return
  
  const img = selectedMedia.value as HTMLImageElement
  img.style.float = align === 'center' ? 'none' : align
  img.style.marginLeft = align === 'right' || align === 'center' ? 'auto' : '0'
  img.style.marginRight = align === 'left' || align === 'center' ? 'auto' : '0'
  img.style.display = align === 'center' ? 'block' : 'block'
  
  if (align === 'center') {
    img.style.marginLeft = 'auto'
    img.style.marginRight = 'auto'
  }
  
  onInput()
}

function downloadFile() {
  if (!selectedMedia.value) return
  
  let url: string | null = null
  let filename = 'download'
  
  if (selectedMedia.value.classList.contains('wy-media-file')) {
    const link = selectedMedia.value.querySelector('.wy-file-link') as HTMLAnchorElement | null
    if (link) {
      url = link.href
      filename = selectedMedia.value.dataset.filename || 'download'
    }
  } else if (selectedMedia.value.classList.contains('wy-media-pdf')) {
    const link = selectedMedia.value.querySelector('.wy-media-link') as HTMLAnchorElement | null
    if (link) url = link.href
  } else if (selectedMedia.value.classList.contains('wy-media-img') || 
             selectedMedia.value.classList.contains('wy-media-video')) {
    const media = selectedMedia.value as HTMLImageElement | HTMLVideoElement
    url = media.src
    filename = media instanceof HTMLImageElement ? (media.alt || 'image') : 'video'
  }
  
  if (url) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    a.click()
  }
}

function startResize(e: MouseEvent, mediaEl: HTMLElement | null) {
  if (!mediaEl || !mediaEl.classList.contains('wy-media-img')) return
  
  isResizing.value = true
  const img = mediaEl as HTMLImageElement
  const startX = e.clientX
  const startWidth = img.offsetWidth
  const startHeight = img.offsetHeight
  const aspectRatio = startWidth / startHeight
  
  function onMouseMove(e: MouseEvent) {
    const deltaX = e.clientX - startX
    const newWidth = Math.max(100, Math.min(startWidth + deltaX, 800))
    img.style.width = `${newWidth}px`
    img.style.height = 'auto'
    updateBubbleMenuPosition()
  }
  
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    isResizing.value = false
    onInput()
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onEditorBlur(e: FocusEvent) {
  // Delay to allow clicking on bubble menu
  setTimeout(() => {
    const activeEl = document.activeElement
    const bubbleMenu = document.querySelector('.wy-media-bubble-menu')
    
    if (!bubbleMenu?.contains(activeEl) && !editorRef.value?.contains(activeEl)) {
      clearMediaSelection()
    }
  }, 150)
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  
  // Check if click is outside media, bubble menu and resize handle
  if (!target.closest(MEDIA_SELECTOR) && 
      !target.closest('.wy-media-bubble-menu') && 
      !target.closest('.wy-resize-handle')) {
    clearMediaSelection()
  }
}

function onWindowScroll() {
  // Update bubble menu and resize handle position on scroll
  if (selectedMedia.value) {
    updateBubbleMenuPosition()
  }
}
</script>

<template>
  <div class="wy-editor-wrap">
    <WysiwygToolbar
      ref="toolbarRef"
      :activeStates="activeStates"
      :currentBlock="currentBlock"
      :isInTable="isInTable"
      @exec="execCommand"
      @insertMedia="insertMedia"
    />
    <div class="wy-editor-area">
      <div
        ref="editorRef"
        class="wy-content"
        contenteditable="true"
        spellcheck="true"
        :data-placeholder="placeholder || 'Содержимое заметки'"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onEditorFocus"
        @blur="onEditorBlur"
        @mouseup="onEditorMouseup"
        @keyup="onEditorKeyup"
        @click="onEditorClick"
      />
      
      <!-- Bubble Menu for Media -->
      <Teleport to="body">
        <Transition name="wy-bubble-fade">
          <div
            v-if="showBubbleMenu"
            class="wy-media-bubble-menu"
            :style="{ left: bubbleMenuPos.x + 'px', top: bubbleMenuPos.y + 'px' }"
            @mousedown.prevent
          >
            <div class="wy-bubble-arrow" />
            <div class="wy-bubble-content">
              <!-- Image alignment buttons -->
              <template v-if="isImageSelected">
                <button
                  type="button"
                  class="wy-bubble-btn"
                  title="По левому краю"
                  @click="alignImage('left')"
                >
                  <i class="fa-solid fa-align-left" />
                </button>
                <button
                  type="button"
                  class="wy-bubble-btn"
                  title="По центру"
                  @click="alignImage('center')"
                >
                  <i class="fa-solid fa-align-center" />
                </button>
                <button
                  type="button"
                  class="wy-bubble-btn"
                  title="По правому краю"
                  @click="alignImage('right')"
                >
                  <i class="fa-solid fa-align-right" />
                </button>
                <div class="wy-bubble-sep" />
              </template>
              
              <!-- Download button for files -->
              <button
                v-if="isFileSelected || selectedMedia?.classList.contains('wy-media-pdf') || selectedMedia?.classList.contains('wy-media-img') || selectedMedia?.classList.contains('wy-media-video')"
                type="button"
                class="wy-bubble-btn"
                title="Скачать"
                @click="downloadFile"
              >
                <i class="fa-solid fa-download" />
              </button>
              
              <div v-if="isFileSelected || selectedMedia?.classList.contains('wy-media-pdf') || selectedMedia?.classList.contains('wy-media-img') || selectedMedia?.classList.contains('wy-media-video')" class="wy-bubble-sep" />
              
              <!-- Delete button -->
              <button
                type="button"
                class="wy-bubble-btn wy-bubble-btn--danger"
                title="Удалить"
                @click="deleteSelectedMedia"
              >
                <i class="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>
      
      <!-- Resize handle for selected image -->
      <Teleport to="body">
        <div
          v-if="isImageSelected && selectedMedia"
          class="wy-resize-handle"
          :style="{
            position: 'fixed',
            left: (selectedMedia.getBoundingClientRect().right - 6) + 'px',
            top: (selectedMedia.getBoundingClientRect().bottom - 6) + 'px'
          }"
          title="Изменить размер"
          @mousedown="startResize($event, selectedMedia)"
        />
      </Teleport>
    </div>
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

.wy-editor-area {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
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

/* Bubble Menu - CRT Style */
.wy-media-bubble-menu {
  position: fixed;
  z-index: 1000;
  transform: translate(-50%, -100%);
  pointer-events: auto;
}

.wy-bubble-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid var(--color-bg-secondary);
}

.wy-bubble-content {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0.3rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 2px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  position: relative;
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
}

.wy-bubble-content::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
  opacity: 0.5;
}

.wy-bubble-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.wy-bubble-btn:hover {
  color: var(--color-text);
  background: var(--color-accent-light);
  border-color: var(--color-accent);
}

.wy-bubble-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.wy-bubble-btn--danger {
  color: var(--color-accent-hover);
}

.wy-bubble-btn--danger:hover {
  background: rgba(211, 35, 75, 0.2);
  border-color: var(--color-accent-hover);
}

.wy-bubble-sep {
  width: 1px;
  height: 1.2rem;
  background: var(--color-border);
  margin: 0 0.1rem;
}

/* Resize Handle */
.wy-resize-handle {
  position: fixed;
  width: 12px;
  height: 12px;
  background: var(--color-accent);
  border: 2px solid var(--color-bg);
  border-radius: 50%;
  cursor: nwse-resize;
  z-index: 1001;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  pointer-events: auto;
}

.wy-resize-handle:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px var(--color-accent);
}

/* Transitions */
.wy-bubble-fade-enter-active,
.wy-bubble-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.wy-bubble-fade-enter-from,
.wy-bubble-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) translateY(5px);
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

/* Media elements styling */
.wy-content .wy-media-img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--color-border-light);
  margin: 0.5rem 0;
}

.wy-content .wy-media-video {
  display: block;
  max-width: 100%;
  width: 100%;
  max-height: 500px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px var(--color-border-light);
  margin: 0.5rem 0;
  background: var(--color-bg-secondary);
}

.wy-content .wy-media-pdf {
  position: relative;
  margin: 0.5rem 0;
  border: 1px solid var(--color-border-light);
  border-radius: 2px;
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.wy-content .wy-media-pdf iframe {
  display: block;
  background: var(--color-bg);
}

.wy-content .wy-media-link {
  display: block;
  padding: 0.4rem 0.6rem;
  font-size: 0.7rem;
  color: var(--color-accent);
  text-align: center;
  text-decoration: none;
  background: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border-light);
  transition: background 0.15s ease;
}

.wy-content .wy-media-link:hover {
  background: var(--color-accent-light);
}

.wy-content .wy-media-file {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  margin: 0.5rem 0;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
  transition: border-color 0.15s ease;
}

.wy-content .wy-media-file:hover {
  border-color: var(--color-accent);
}

.wy-content .wy-file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.wy-content .wy-file-info {
  flex: 1;
  min-width: 0;
}

.wy-content .wy-file-name {
  font-size: 0.75rem;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.15rem;
}

.wy-content .wy-file-link {
  font-size: 0.6rem;
  color: var(--color-accent);
  text-decoration: none;
}

.wy-content .wy-file-link:hover {
  text-decoration: underline;
}

/* Media hover delete button - removed, using bubble menu instead */
.wy-content .wy-media-img,
.wy-content .wy-media-video,
.wy-content .wy-media-pdf,
.wy-content .wy-media-file {
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

/* Selected state for media elements */
.wy-content .wy-media-img.wy-media-selected,
.wy-content .wy-media-video.wy-media-selected,
.wy-content .wy-media-pdf.wy-media-selected,
.wy-content .wy-media-file.wy-media-selected {
  box-shadow: 0 0 0 2px var(--color-accent), 0 0 12px rgba(211, 35, 75, 0.4);
}

/* Focus outline for media elements */
.wy-content .wy-media-img:focus,
.wy-content .wy-media-video:focus,
.wy-content .wy-media-pdf:focus,
.wy-content .wy-media-file:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-accent);
}
</style>