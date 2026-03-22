<template>
  <div class="journal-notebook">
    <p v-if="!props.isAuthenticated" class="journal-notebook-hint">
      Войдите в аккаунт, чтобы создавать и видеть свои заметки.
    </p>

    <template v-else>
      <p v-if="!props.notes.length" class="journal-notebook-empty">Заметок нет</p>
      <ul v-else class="journal-notebook-list" aria-label="Список заметок">
        <li
          v-for="n in props.notes"
          :key="n.id"
          class="journal-notebook-item"
          :class="{ 'journal-notebook-item--open': expandedId === n.id }"
        >
          <button
            type="button"
            class="journal-notebook-toggle"
            :aria-expanded="expandedId === n.id"
            @click="toggleNote(n.id)"
          >
            <i
              class="fa-solid fa-chevron-right journal-notebook-chevron"
              :class="{ 'journal-notebook-chevron--open': expandedId === n.id }"
              aria-hidden="true"
            />
            <span class="journal-notebook-item-title">{{ n.title }}</span>
          </button>

          <div v-if="expandedId === n.id" class="journal-notebook-expand" role="region">
            <p v-if="fetchErrorById[n.id]" class="journal-notebook-fetch-error" role="alert">
              {{ fetchErrorById[n.id] }}
            </p>
            <p v-else-if="loadingContentId === n.id" class="journal-notebook-loading">Загрузка…</p>
            <div v-else class="journal-notebook-read">
              <pre class="journal-notebook-content">{{ contentById[n.id] ?? '' }}</pre>
              <div class="journal-notebook-toolbar">
                <button type="button" class="journal-notebook-btn journal-notebook-btn--ghost" @click="openEditorEdit(n)">
                  <i class="fa-solid fa-pen-to-square" aria-hidden="true" />
                  Редактировать
                </button>
                <button
                  type="button"
                  class="journal-notebook-btn journal-notebook-btn--danger"
                  @click="openDeleteDialog(n)"
                >
                  <i class="fa-solid fa-trash-can" aria-hidden="true" />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <Teleport to="body">
      <Transition name="jn-modal">
        <div
          v-if="editorOpen"
          class="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="editorTitleId"
          @click.self="closeEditor"
        >
          <div class="jn-modal" @click.stop>
            <h2 :id="editorTitleId" class="jn-modal-heading">
              {{ editorMode === 'create' ? 'Новая заметка' : 'Редактировать заметку' }}
            </h2>
            <label class="jn-label" for="jn-input-title">Название</label>
            <input
              id="jn-input-title"
              v-model="editorTitle"
              type="text"
              class="jn-input"
              maxlength="500"
              autocomplete="off"
              placeholder="Заголовок"
            />
            <label class="jn-label" for="jn-input-body">Текст</label>
            <textarea
              id="jn-input-body"
              v-model="editorContent"
              class="jn-textarea"
              rows="12"
              placeholder="Содержимое заметки"
            />
            <p v-if="editorError" class="jn-modal-error" role="alert">{{ editorError }}</p>
            <div class="jn-modal-actions">
              <button type="button" class="journal-notebook-btn journal-notebook-btn--ghost" @click="closeEditor">
                Отмена
              </button>
              <button
                type="button"
                class="journal-notebook-btn journal-notebook-btn--primary"
                :disabled="editorSaving"
                @click="submitEditor"
              >
                <span v-if="editorSaving" class="jn-spinner" aria-hidden="true" />
                {{ editorSaving ? 'Сохранение…' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="jn-modal">
        <div
          v-if="deleteTarget"
          class="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="jn-delete-title"
          @click.self="closeDeleteDialog"
        >
          <div class="jn-modal jn-modal--compact" @click.stop>
            <h2 id="jn-delete-title" class="jn-modal-heading">Удалить заметку?</h2>
            <p class="jn-delete-preview">«{{ deleteTarget.title }}»</p>
            <p v-if="deleteError" class="jn-modal-error" role="alert">{{ deleteError }}</p>
            <div class="jn-modal-actions">
              <button type="button" class="journal-notebook-btn journal-notebook-btn--ghost" @click="closeDeleteDialog">
                Отмена
              </button>
              <button
                type="button"
                class="journal-notebook-btn journal-notebook-btn--danger"
                :disabled="deletePending"
                @click="confirmDelete"
              >
                <span v-if="deletePending" class="jn-spinner" aria-hidden="true" />
                {{ deletePending ? 'Удаление…' : 'Удалить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { createComponentLogger } from '../../shared/logger'

const log = createComponentLogger('JournalNotebookPane')

type NoteSummary = { id: string; title: string }

const props = defineProps<{
  notes: NoteSummary[]
  isAuthenticated: boolean
  journalNotesCreateUrl?: string
  journalNotesGetUrl?: string
  journalNotesUpdateUrl?: string
  journalNotesDeleteUrl?: string
  /** Увеличивается при каждом нажатии «Новая заметка» в родителе */
  openNotebookEditorRequest?: number
}>()

const emit = defineEmits<{
  noteCreated: [note: NoteSummary]
  noteUpdated: [note: NoteSummary]
  noteDeleted: [id: string]
}>()

const editorTitleId = 'jn-editor-title'

const expandedId = ref<string | null>(null)
const loadingContentId = ref<string | null>(null)
const contentById = reactive<Record<string, string>>({})
const fetchErrorById = reactive<Record<string, string>>({})

const editorOpen = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const editingNoteId = ref<string | null>(null)
const editorTitle = ref('')
const editorContent = ref('')
const editorError = ref('')
const editorSaving = ref(false)

const deleteTarget = ref<NoteSummary | null>(null)
const deleteError = ref('')
const deletePending = ref(false)

let lastEditorRequest = 0

watch(
  () => props.openNotebookEditorRequest,
  (n) => {
    if (!props.isAuthenticated || n === undefined || n === lastEditorRequest) return
    if (n <= 0) return
    lastEditorRequest = n
    openEditorCreate()
  }
)

function toggleNote(id: string) {
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  expandedId.value = id
  void ensureNoteContent(id)
}

async function ensureNoteContent(id: string) {
  if (contentById[id] !== undefined && !fetchErrorById[id]) {
    return
  }
  delete fetchErrorById[id]
  const url = props.journalNotesGetUrl
  if (!url) {
    fetchErrorById[id] = 'Не настроен адрес API'
    return
  }
  loadingContentId.value = id
  try {
    const res = await fetch(`${url}?id=${encodeURIComponent(id)}`, { method: 'GET', credentials: 'include' })
    const data = (await res.json()) as {
      success?: boolean
      note?: { id: string; title: string; content: string }
      error?: string
    }
    if (data.success && data.note) {
      contentById[id] = data.note.content
      delete fetchErrorById[id]
    } else {
      fetchErrorById[id] = data.error || 'Не удалось загрузить заметку'
    }
  } catch (e) {
    fetchErrorById[id] = 'Ошибка сети'
    log.error('Загрузка заметки', { id, error: String(e) })
  } finally {
    loadingContentId.value = null
  }
}

function openEditorCreate() {
  if (!props.journalNotesCreateUrl) {
    log.warn('Создание: нет createUrl')
    return
  }
  editorMode.value = 'create'
  editingNoteId.value = null
  editorTitle.value = ''
  editorContent.value = ''
  editorError.value = ''
  editorOpen.value = true
}

async function openEditorEdit(n: NoteSummary) {
  if (!props.journalNotesUpdateUrl) {
    log.warn('Редактирование: нет updateUrl')
    return
  }
  editorMode.value = 'edit'
  editingNoteId.value = n.id
  editorTitle.value = n.title
  editorError.value = ''
  editorOpen.value = true
  editorContent.value = contentById[n.id] ?? ''
  if (contentById[n.id] === undefined) {
    await ensureNoteContent(n.id)
    editorContent.value = contentById[n.id] ?? ''
  }
}

function closeEditor() {
  if (editorSaving.value) return
  editorOpen.value = false
}

type NoteApiPayload = { success?: boolean; note?: NoteSummary; error?: string }

/**
 * POST с разбором ответа и подробными логами (консоль + severity Error при сбое).
 */
async function postNoteJson(
  kind: 'create' | 'update',
  url: string,
  body: unknown
): Promise<{
  httpStatus: number
  httpOk: boolean
  contentType: string | null
  data: NoteApiPayload | null
  rawText: string
  parseError?: string
}> {
  const bodyStr = JSON.stringify(body)
  log.info(`${kind}: запрос POST`, {
    url,
    bodyLength: bodyStr.length,
    bodyPreview: bodyStr.length > 800 ? `${bodyStr.slice(0, 800)}…` : bodyStr
  })
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: bodyStr
  })
  const contentType = res.headers.get('content-type')
  const rawText = await res.text()
  log.info(`${kind}: ответ HTTP`, {
    httpStatus: res.status,
    httpStatusText: res.statusText,
    httpOk: res.ok,
    contentType,
    bodyLength: rawText.length
  })
  let data: NoteApiPayload | null = null
  let parseError: string | undefined
  const trimmed = rawText.trim()
  if (trimmed === '') {
    parseError = 'пустое тело ответа'
    log.error(`${kind}: пустое тело`, { url, httpStatus: res.status })
    return { httpStatus: res.status, httpOk: res.ok, contentType, data: null, rawText, parseError }
  }
  try {
    data = JSON.parse(rawText) as NoteApiPayload
    log.info(`${kind}: JSON`, {
      success: data?.success,
      hasNote: !!data?.note,
      apiError: data?.error
    })
  } catch (e) {
    parseError = String(e)
    log.error(`${kind}: ответ не JSON`, {
      parseError,
      httpStatus: res.status,
      rawPreview: rawText.slice(0, 2000)
    })
  }
  return { httpStatus: res.status, httpOk: res.ok, contentType, data, rawText, parseError }
}

async function submitEditor() {
  const title = editorTitle.value.trim()
  const content = editorContent.value
  editorError.value = ''
  if (!title) {
    editorError.value = 'Введите название заметки'
    return
  }
  editorSaving.value = true
  try {
    if (editorMode.value === 'create') {
      const url = props.journalNotesCreateUrl
      if (!url) {
        editorError.value = 'Не настроен адрес API'
        log.error('create: нет journalNotesCreateUrl')
        return
      }
      const { httpStatus, httpOk, data, rawText, parseError } = await postNoteJson('create', url, {
        title,
        content
      })
      if (parseError) {
        editorError.value = `Ответ сервера не JSON (${parseError}). HTTP ${httpStatus}. Подробности в консоли браузера.`
        log.error('create: итог', { httpStatus, parseError, tail: rawText.slice(-500) })
        return
      }
      if (data?.success && data.note) {
        emit('noteCreated', data.note)
        contentById[data.note.id] = content
        editorOpen.value = false
        log.info('Заметка создана', { id: data.note.id })
      } else {
        log.error('create: API вернул отказ', {
          httpStatus,
          httpOk,
          success: data?.success,
          apiError: data?.error,
          payloadKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          rawPreview: rawText.slice(0, 2500)
        })
        editorError.value =
          data?.error || `Не удалось сохранить (HTTP ${httpStatus}${httpOk ? '' : ', статус не OK'})`
      }
    } else {
      const id = editingNoteId.value
      const url = props.journalNotesUpdateUrl
      if (!id || !url) {
        editorError.value = 'Не настроен адрес API'
        log.error('update: нет id или journalNotesUpdateUrl', { id })
        return
      }
      const { httpStatus, httpOk, data, rawText, parseError } = await postNoteJson('update', url, {
        id,
        title,
        content
      })
      if (parseError) {
        editorError.value = `Ответ сервера не JSON (${parseError}). HTTP ${httpStatus}. Подробности в консоли браузера.`
        log.error('update: итог', { httpStatus, parseError, tail: rawText.slice(-500) })
        return
      }
      if (data?.success && data.note) {
        emit('noteUpdated', data.note)
        contentById[id] = content
        editorOpen.value = false
        log.info('Заметка обновлена', { id })
      } else {
        log.error('update: API вернул отказ', {
          httpStatus,
          httpOk,
          success: data?.success,
          apiError: data?.error,
          payloadKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          rawPreview: rawText.slice(0, 2500)
        })
        editorError.value =
          data?.error || `Не удалось сохранить (HTTP ${httpStatus}${httpOk ? '' : ', статус не OK'})`
      }
    }
  } catch (e) {
    editorError.value = 'Ошибка сети'
    log.error('Сохранение заметки: исключение', { error: String(e), stack: e instanceof Error ? e.stack : undefined })
  } finally {
    editorSaving.value = false
  }
}

function openDeleteDialog(n: NoteSummary) {
  if (!props.journalNotesDeleteUrl) {
    log.warn('Удаление: нет deleteUrl')
    return
  }
  deleteTarget.value = n
  deleteError.value = ''
}

function closeDeleteDialog() {
  if (deletePending.value) return
  deleteTarget.value = null
}

async function confirmDelete() {
  const n = deleteTarget.value
  const url = props.journalNotesDeleteUrl
  if (!n || !url) return
  deleteError.value = ''
  deletePending.value = true
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: n.id })
    })
    const data = (await res.json()) as { success?: boolean; error?: string }
    if (data.success) {
      emit('noteDeleted', n.id)
      if (expandedId.value === n.id) {
        expandedId.value = null
      }
      delete contentById[n.id]
      delete fetchErrorById[n.id]
      deleteTarget.value = null
      log.info('Заметка удалена', { id: n.id })
    } else {
      deleteError.value = data.error || 'Не удалось удалить'
    }
  } catch (e) {
    deleteError.value = 'Ошибка сети'
    log.error('Удаление заметки', { error: String(e) })
  } finally {
    deletePending.value = false
  }
}
</script>

<style scoped>
.journal-notebook {
  padding: 1rem 1.1rem;
  min-height: 12rem;
  box-sizing: border-box;
}

.journal-notebook-hint {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
}

.journal-notebook-empty {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.journal-notebook-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.journal-notebook-item {
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.journal-notebook-item--open {
  border-color: var(--color-border-light);
  box-shadow: 0 0 14px rgba(211, 35, 75, 0.12);
}

.journal-notebook-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  margin: 0;
  padding: 0.55rem 0.65rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.88rem;
  color: var(--color-text);
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  letter-spacing: 0.04em;
  transition: var(--transition);
}

.journal-notebook-toggle:hover {
  background: rgba(211, 35, 75, 0.06);
}

.journal-notebook-chevron {
  font-size: 0.65rem;
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.journal-notebook-chevron--open {
  transform: rotate(90deg);
  color: var(--color-accent);
}

.journal-notebook-item-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journal-notebook-expand {
  padding: 0 0.65rem 0.65rem;
  border-top: 1px solid var(--color-border);
}

.journal-notebook-loading,
.journal-notebook-fetch-error {
  margin: 0.5rem 0 0;
  font-size: 0.78rem;
  color: var(--color-text-secondary);
}

.journal-notebook-fetch-error {
  color: var(--color-accent-hover);
}

.journal-notebook-read {
  margin-top: 0.5rem;
}

.journal-notebook-content {
  margin: 0 0 0.65rem;
  padding: 0.55rem 0.6rem;
  font-family: inherit;
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--color-text);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 50vh;
  overflow-y: auto;
}

.journal-notebook-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.journal-notebook-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  margin: 0;
  padding: 0.4rem 0.65rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 2px;
  cursor: pointer;
  transition: var(--transition);
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.journal-notebook-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.journal-notebook-btn--ghost:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-border-light);
  background: var(--color-bg-tertiary);
}

.journal-notebook-btn--primary {
  background: var(--color-accent-light);
  border-color: var(--color-accent);
  color: var(--color-text);
}

.journal-notebook-btn--primary:hover:not(:disabled) {
  background: var(--color-accent-medium);
  border-color: var(--color-accent-hover);
  color: #fff;
}

.journal-notebook-btn--danger {
  border-color: rgba(211, 35, 75, 0.45);
  color: var(--color-accent-hover);
  background: rgba(211, 35, 75, 0.08);
}

.journal-notebook-btn--danger:hover:not(:disabled) {
  background: var(--color-accent-medium);
  border-color: var(--color-accent-hover);
  color: #fff;
}

.jn-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.88);
  box-sizing: border-box;
}

.jn-modal {
  width: min(32rem, 100%);
  max-height: min(90vh, 40rem);
  overflow-y: auto;
  padding: 1.35rem 1.25rem;
  box-sizing: border-box;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 2px solid var(--color-accent);
  border-radius: 2px;
  box-shadow:
    0 0 40px rgba(211, 35, 75, 0.35),
    0 0 80px rgba(211, 35, 75, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.jn-modal--compact {
  max-width: 22rem;
}

.jn-modal-heading {
  margin: 0 0 1rem;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text);
}

.jn-label {
  display: block;
  margin: 0 0 0.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.jn-input,
.jn-textarea {
  width: 100%;
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.55rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 2px;
}

.jn-textarea {
  resize: vertical;
  min-height: 10rem;
  line-height: 1.4;
}

.jn-input:focus,
.jn-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px var(--color-accent-medium);
}

.jn-modal-error {
  margin: 0 0 0.65rem;
  font-size: 0.72rem;
  color: var(--color-accent-hover);
  letter-spacing: 0.03em;
}

.jn-modal-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.25rem;
}

.jn-delete-preview {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  word-break: break-word;
}

.jn-spinner {
  width: 0.55rem;
  height: 0.55rem;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: jn-spin 0.7s linear infinite;
}

@keyframes jn-spin {
  to {
    transform: rotate(360deg);
  }
}

.jn-modal-enter-active,
.jn-modal-leave-active {
  transition: opacity 0.25s ease;
}

.jn-modal-enter-from,
.jn-modal-leave-to {
  opacity: 0;
}
</style>
