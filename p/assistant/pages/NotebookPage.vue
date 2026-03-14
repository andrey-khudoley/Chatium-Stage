<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, computed } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import SectionNav from '../components/SectionNav.vue'
import { createComponentLogger } from '../shared/logger'
import { markdownToHtml } from '../shared/notebookMarkdownClient'

const log = createComponentLogger('NotebookPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

interface NoteItem {
  id: string
  title: string
  preview: string
  updatedAt: string
}

interface NoteFull {
  id: string
  title: string
  contentMarkdown: string
  createdAt: string
  updatedAt: string
}

const props = withDefaults(
  defineProps<{
    projectTitle: string
    indexUrl: string
    profileUrl: string
    loginUrl: string
    isAuthenticated: boolean
    isAdmin?: boolean
    adminUrl?: string
    testsUrl?: string
    calendarUrl: string
    myDayUrl: string
    weekUrl: string
    habitsUrl: string
    notebookUrl: string
    apiBase?: string
  }>(),
  { apiBase: '' }
)

const bootLoaderDone = ref(false)
const currentSection = 'notebook' as const

const routeMode = ref<'list' | 'view' | 'edit'>('list')
const routeId = ref<string | null>(null)

const notes = ref<NoteItem[]>([])
const note = ref<NoteFull | null>(null)
const loading = ref(false)
const error = ref('')
const saving = ref(false)
const editTitle = ref('')
const editContent = ref('')

const apiBase = computed(() => {
  const base = props.apiBase || ''
  return base.replace(/\/$/, '')
})

function parseHash(): { mode: 'list' | 'view' | 'edit'; id: string | null } {
  const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
  if (!hash) return { mode: 'list', id: null }
  const [mode, id] = hash.split('/')
  if (mode === 'view' && id) return { mode: 'view', id }
  if (mode === 'edit') return { mode: 'edit', id: id && id !== 'new' ? id : null }
  return { mode: 'list', id: null }
}

function applyHash() {
  const { mode, id } = parseHash()
  routeMode.value = mode
  routeId.value = id ?? null
}

function goList() {
  window.location.hash = ''
}
function goView(id: string) {
  window.location.hash = 'view/' + id
}
function goEdit(id: string | null) {
  window.location.hash = id ? 'edit/' + id : 'edit/new'
}

async function fetchList() {
  loading.value = true
  error.value = ''
  try {
    const r = await fetch(apiBase.value + '/notebook/list')
    const data = await r.json()
    if (data.success && Array.isArray(data.notes)) {
      notes.value = data.notes
    } else {
      error.value = data.error || 'Не удалось загрузить список'
    }
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('fetchList', e)
  } finally {
    loading.value = false
  }
}

async function fetchNote(id: string) {
  loading.value = true
  error.value = ''
  try {
    const r = await fetch(apiBase.value + '/notebook/get?id=' + encodeURIComponent(id))
    const data = await r.json()
    if (data.success && data.note) {
      note.value = data.note
      editTitle.value = data.note.title
      editContent.value = data.note.contentMarkdown ?? ''
    } else {
      error.value = data.error || 'Заметка не найдена'
      note.value = null
    }
  } catch (e) {
    error.value = 'Ошибка сети'
    note.value = null
    log.error('fetchNote', e)
  } finally {
    loading.value = false
  }
}

async function saveNote() {
  if (!editTitle.value.trim()) {
    error.value = 'Введите заголовок'
    return
  }
  saving.value = true
  error.value = ''
  try {
    const body: { title: string; contentMarkdown: string; id?: string } = {
      title: editTitle.value.trim(),
      contentMarkdown: editContent.value
    }
    if (routeId.value) body.id = routeId.value
    const r = await fetch(apiBase.value + '/notebook/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await r.json()
    if (data.success && data.note) {
      note.value = data.note
      if (!routeId.value) {
        goView(data.note.id)
      } else {
        editTitle.value = data.note.title
        editContent.value = data.note.contentMarkdown ?? ''
      }
    } else {
      error.value = data.error || 'Не удалось сохранить'
    }
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('saveNote', e)
  } finally {
    saving.value = false
  }
}

async function deleteNote() {
  if (!routeId.value) return
  if (!window.confirm('Удалить эту заметку?')) return
  saving.value = true
  error.value = ''
  try {
    const r = await fetch(apiBase.value + '/notebook/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: routeId.value })
    })
    const data = await r.json()
    if (data.success) {
      goList()
      await fetchList()
    } else {
      error.value = data.error || 'Не удалось удалить'
    }
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('deleteNote', e)
  } finally {
    saving.value = false
  }
}

async function toggleCheckbox(noteId: string, checkboxIndex: number, checked: boolean) {
  try {
    const r = await fetch(apiBase.value + '/notebook/toggleCheckbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId, checkboxIndex, checked })
    })
    const data = await r.json()
    if (data.success && data.note && note.value && note.value.id === noteId) {
      note.value = { ...note.value, contentMarkdown: data.note.contentMarkdown }
    }
  } catch (e) {
    log.error('toggleCheckbox', e)
  }
}

const noteHtml = computed(() => {
  const n = note.value
  if (!n?.contentMarkdown) return ''
  return markdownToHtml(n.contentMarkdown)
})

function onContentViewClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest('.notebook-checkbox')
  if (!target || !note.value) return
  e.preventDefault()
  e.stopPropagation()
  const index = parseInt((target as HTMLElement).getAttribute('data-index') ?? '', 10)
  if (Number.isNaN(index)) return
  const currentlyChecked = (target as HTMLElement).classList.contains('checked')
  toggleCheckbox(note.value.id, index, !currentlyChecked)
}

watch(
  () => [routeMode.value, routeId.value],
  () => {
    if (routeMode.value === 'list') {
      fetchList()
      note.value = null
    } else if (routeMode.value === 'view' && routeId.value) {
      fetchNote(routeId.value)
    } else if (routeMode.value === 'edit') {
      if (routeId.value) {
        fetchNote(routeId.value)
      } else {
        note.value = null
        editTitle.value = ''
        editContent.value = ''
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  applyHash()
  window.addEventListener('hashchange', applyHash)
  if (window.hideAppLoader) window.hideAppLoader()
  if (window.bootLoaderComplete) {
    bootLoaderDone.value = true
  } else {
    window.addEventListener('bootloader-complete', () => {
      bootLoaderDone.value = true
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('hashchange', applyHash)
})

const openChatiumLink = () => {
  log.notice('Opening Chatium link')
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}

function insertAtCursor(prefix: string, suffix: string) {
  const ta = document.getElementById('notebook-edit-content') as HTMLTextAreaElement
  if (!ta) return
  const start = ta.selectionStart
  const end = ta.selectionEnd
  const text = ta.value
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)
  const newText = before + prefix + selected + suffix + after
  editContent.value = newText
  const newPos = start + prefix.length + selected.length
  setTimeout(() => {
    ta.focus()
    ta.setSelectionRange(newPos, newPos)
  }, 0)
}
</script>

<template>
  <div class="app-layout section-page-layout">
    <GlobalGlitch />
    <Header
      v-if="bootLoaderDone"
      :projectTitle="props.projectTitle"
      :indexUrl="props.indexUrl"
      :profileUrl="props.profileUrl"
      :loginUrl="props.loginUrl"
      :isAuthenticated="props.isAuthenticated"
      :isAdmin="props.isAdmin"
      :adminUrl="props.adminUrl"
      :testsUrl="props.testsUrl"
    />
    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner">
        <SectionNav
          :indexUrl="props.indexUrl"
          :calendarUrl="props.calendarUrl"
          :myDayUrl="props.myDayUrl"
          :weekUrl="props.weekUrl"
          :habitsUrl="props.habitsUrl"
          :notebookUrl="props.notebookUrl"
          :currentSection="currentSection"
        />
        <section class="section-content">
          <h1 class="section-heading">Блокнот</h1>

          <div v-if="error" class="notebook-error">{{ error }}</div>

          <!-- Список -->
          <template v-if="routeMode === 'list'">
            <div class="notebook-toolbar">
              <button type="button" class="notebook-btn primary" @click="goEdit(null)">
                <i class="fa-solid fa-plus"></i> Новая заметка
              </button>
            </div>
            <div v-if="loading" class="notebook-loading">Загрузка…</div>
            <ul v-else class="notebook-list">
              <li
                v-for="n in notes"
                :key="n.id"
                class="notebook-list-item"
              >
                <a href="#" class="notebook-list-link" @click.prevent="goView(n.id)">
                  <span class="notebook-list-title">{{ n.title }}</span>
                  <span class="notebook-list-preview">{{ n.preview }}</span>
                  <span class="notebook-list-date">{{ n.updatedAt }}</span>
                </a>
                <button type="button" class="notebook-btn icon" title="Редактировать" @click.prevent="goEdit(n.id)">
                  <i class="fa-solid fa-pen"></i>
                </button>
              </li>
              <li v-if="!loading && notes.length === 0" class="notebook-list-empty">
                Нет заметок. Создайте первую.
              </li>
            </ul>
          </template>

          <!-- Просмотр -->
          <template v-else-if="routeMode === 'view' && note">
            <div v-if="loading" class="notebook-loading">Загрузка…</div>
            <template v-else>
              <div class="notebook-view-toolbar">
                <button type="button" class="notebook-btn" @click="goList"><i class="fa-solid fa-arrow-left"></i> К списку</button>
                <button type="button" class="notebook-btn" @click="goEdit(note.id)"><i class="fa-solid fa-pen"></i> Редактировать</button>
                <button type="button" class="notebook-btn danger" @click="deleteNote"><i class="fa-solid fa-trash"></i> Удалить</button>
              </div>
              <h2 class="notebook-view-title">{{ note.title }}</h2>
              <div
                class="notebook-view-content markdown-body"
                v-html="noteHtml"
                @click="onContentViewClick"
              />
            </template>
          </template>

          <!-- Редактирование -->
          <template v-else-if="routeMode === 'edit'">
            <div class="notebook-edit-toolbar">
              <button type="button" class="notebook-btn" @click="routeId ? goView(routeId) : goList()">
                <i class="fa-solid fa-arrow-left"></i> Отмена
              </button>
              <button type="button" class="notebook-btn primary" :disabled="saving" @click="saveNote">
                <i class="fa-solid fa-check"></i> {{ saving ? 'Сохранение…' : 'Сохранить' }}
              </button>
              <button v-if="routeId" type="button" class="notebook-btn danger" :disabled="saving" @click="deleteNote">
                <i class="fa-solid fa-trash"></i> Удалить
              </button>
            </div>
            <div v-if="loading" class="notebook-loading">Загрузка…</div>
            <template v-else>
              <div class="notebook-edit-form">
                <label class="notebook-label">Заголовок</label>
                <input
                  v-model="editTitle"
                  type="text"
                  class="notebook-input"
                  placeholder="Название заметки"
                />
                <div class="notebook-format-toolbar">
                  <button type="button" class="notebook-fmt-btn" title="Жирный" @click="insertAtCursor('**', '**')"><i class="fa-solid fa-bold"></i></button>
                  <button type="button" class="notebook-fmt-btn" title="Курсив" @click="insertAtCursor('*', '*')"><i class="fa-solid fa-italic"></i></button>
                  <button type="button" class="notebook-fmt-btn" title="Код" @click="insertAtCursor('`', '`')"><i class="fa-solid fa-code"></i></button>
                  <button type="button" class="notebook-fmt-btn" title="Ссылка" @click="insertAtCursor('[', '](url)')"><i class="fa-solid fa-link"></i></button>
                  <button type="button" class="notebook-fmt-btn" title="Список" @click="insertAtCursor('\n- ', '')"><i class="fa-solid fa-list"></i></button>
                  <button type="button" class="notebook-fmt-btn" title="Чекбокс" @click="insertAtCursor('\n- [ ] ', '')"><i class="fa-solid fa-square-check"></i></button>
                </div>
                <label class="notebook-label">Текст (Markdown)</label>
                <textarea
                  id="notebook-edit-content"
                  v-model="editContent"
                  class="notebook-textarea"
                  placeholder="Текст заметки…"
                  rows="16"
                />
              </div>
            </template>
          </template>
        </section>
      </div>
    </main>
    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.section-page-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  padding: 1rem 0;
}

.content-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.section-content {
  padding: 0.5rem 0;
}

.section-heading {
  font-size: 1.75rem;
  font-weight: 400;
  margin: 0 0 0.75rem;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.notebook-error {
  color: var(--color-error, #e53e3e);
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.notebook-toolbar,
.notebook-view-toolbar,
.notebook-edit-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.notebook-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border, #333);
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
}

.notebook-btn:hover {
  background: var(--color-hover, #1a1a1a);
}

.notebook-btn.primary {
  border-color: var(--color-accent, #4a9);
  color: var(--color-accent, #4a9);
}

.notebook-btn.danger:hover {
  background: rgba(229, 62, 62, 0.15);
  border-color: #e53e3e;
  color: #e53e3e;
}

.notebook-btn.icon {
  padding: 0.35rem 0.5rem;
}

.notebook-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.notebook-loading {
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  margin: 0.5rem 0;
}

.notebook-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.notebook-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border, #222);
  padding: 0.5rem 0;
}

.notebook-list-link {
  flex: 1;
  text-decoration: none;
  color: inherit;
  display: block;
  min-width: 0;
}

.notebook-list-link:hover {
  color: var(--color-accent, #4a9);
}

.notebook-list-title {
  display: block;
  font-weight: 500;
  margin-bottom: 0.2rem;
}

.notebook-list-preview {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notebook-list-date {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.2rem;
}

.notebook-list-empty {
  color: var(--color-text-secondary);
  padding: 1rem 0;
  font-size: 0.9375rem;
}

.notebook-view-toolbar {
  margin-bottom: 0.75rem;
}

.notebook-view-title {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0 0 0.75rem;
}

.notebook-view-content {
  line-height: 1.6;
  font-size: 0.9375rem;
}

.notebook-view-content :deep(.markdown-body) {
  margin: 0;
}

.notebook-view-content :deep(p) {
  margin: 0 0 0.5rem;
}

.notebook-view-content :deep(h1) {
  font-size: 1.35rem;
  margin: 1rem 0 0.5rem;
}

.notebook-view-content :deep(h2) {
  font-size: 1.2rem;
  margin: 0.75rem 0 0.4rem;
}

.notebook-view-content :deep(h3) {
  font-size: 1.05rem;
  margin: 0.5rem 0 0.3rem;
}

.notebook-view-content :deep(ul),
.notebook-view-content :deep(ol) {
  margin: 0.25rem 0 0.5rem;
  padding-left: 1.5rem;
}

.notebook-view-content :deep(li) {
  margin: 0.2rem 0;
}

.notebook-view-content :deep(blockquote) {
  border-left: 3px solid var(--color-border, #333);
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: var(--color-text-secondary);
}

.notebook-view-content :deep(code) {
  background: rgba(255, 255, 255, 0.06);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-size: 0.9em;
}

.notebook-view-content :deep(a) {
  color: var(--color-accent, #4a9);
  text-decoration: none;
}

.notebook-view-content :deep(a:hover) {
  text-decoration: underline;
}

.notebook-task-list {
  list-style: none;
  padding-left: 0;
}

.notebook-task-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin: 0.35rem 0;
}

.notebook-checkbox {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid var(--color-border, #555);
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 3px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.notebook-checkbox.checked {
  background: var(--color-accent, #4a9);
  border-color: var(--color-accent, #4a9);
}

.notebook-task-label.notebook-task-done {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.notebook-edit-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notebook-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.notebook-input {
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  border: 1px solid var(--color-border, #333);
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 4px;
}

.notebook-format-toolbar {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.notebook-fmt-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border, #333);
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
}

.notebook-fmt-btn:hover {
  background: var(--color-hover, #1a1a1a);
}

.notebook-textarea {
  padding: 0.75rem;
  font-size: 0.9375rem;
  font-family: inherit;
  border: 1px solid var(--color-border, #333);
  background: var(--color-bg);
  color: var(--color-text);
  border-radius: 4px;
  resize: vertical;
  min-height: 200px;
}

@media (max-width: 768px) {
  .content-inner {
    padding: 0 1rem;
  }

  .section-heading {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .content-inner {
    padding: 0 0.75rem;
  }

  .section-heading {
    font-size: 1.25rem;
  }
}
</style>
