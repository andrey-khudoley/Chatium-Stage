<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import SectionNav from '../components/SectionNav.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('MyDayPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

interface DayEntry {
  id: string
  date: string
  morningText: string
  dayText: string
  eveningText: string
  updatedAt: string
}

interface TaskItem {
  id: string
  section: string
  date: string | null
  folderId: string | null
  title: string
  completedAt: string | null
  sortOrder: number
}

interface FolderItem {
  id: string
  name: string
  sortOrder: number
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
const currentSection = 'my-day' as const

const apiBase = computed(() => (props.apiBase || '').replace(/\/$/, ''))

function todayYYYYMMDD(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const selectedDate = ref(todayYYYYMMDD())
const dayEntry = ref<DayEntry | null>(null)
const morningText = ref('')
const dayText = ref('')
const eveningText = ref('')
const mainTasks = ref<TaskItem[]>([])
const additionalTasks = ref<TaskItem[]>([])
const backlogTasks = ref<TaskItem[]>([])
const folders = ref<FolderItem[]>([])
const loading = ref(false)
const error = ref('')
const entryBusy = ref(false)
const newTaskTitle = ref<Record<string, string>>({ main: '', additional: '', backlog: '', 'folder-': '' })
const newFolderName = ref('')
const editingTaskId = ref<string | null>(null)
const editingTaskTitle = ref('')
const draggingTask = ref<{ task: TaskItem; fromSection: string; fromFolderId: string | null } | null>(null)

const backlogByFolder = computed(() => {
  const byFolder: Record<string, TaskItem[]> = { '': [] }
  for (const f of folders.value) byFolder[f.id] = []
  for (const t of backlogTasks.value) {
    const key = t.folderId || ''
    if (!byFolder[key]) byFolder[key] = []
    byFolder[key].push(t)
  }
  const noFolder = byFolder[''] || []
  const withFolders = folders.value.map((f) => ({ folder: f, tasks: byFolder[f.id] || [] }))
  return { noFolder, withFolders }
})

async function loadDayEntry() {
  entryBusy.value = true
  error.value = ''
  try {
    const r = await fetch(
      `${apiBase.value}/my-day/entries/get?date=${encodeURIComponent(selectedDate.value)}`
    )
    const data = await r.json()
    if (data.success) {
      dayEntry.value = data.entry
      morningText.value = data.entry?.morningText ?? ''
      dayText.value = data.entry?.dayText ?? ''
      eveningText.value = data.entry?.eveningText ?? ''
    } else error.value = data.error || 'Ошибка загрузки'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('loadDayEntry', e)
  } finally {
    entryBusy.value = false
  }
}

async function saveDayEntry() {
  entryBusy.value = true
  error.value = ''
  try {
    const r = await fetch(`${apiBase.value}/my-day/entries/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: selectedDate.value,
        morningText: morningText.value,
        dayText: dayText.value,
        eveningText: eveningText.value
      })
    })
    const data = await r.json()
    if (data.success) {
      dayEntry.value = data.entry
      morningText.value = data.entry?.morningText ?? ''
      dayText.value = data.entry?.dayText ?? ''
      eveningText.value = data.entry?.eveningText ?? ''
    } else error.value = data.error || 'Ошибка сохранения'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('saveDayEntry', e)
  } finally {
    entryBusy.value = false
  }
}

async function loadTasks() {
  loading.value = true
  error.value = ''
  try {
    const r = await fetch(
      `${apiBase.value}/my-day/tasks/list?date=${encodeURIComponent(selectedDate.value)}`
    )
    const data = await r.json()
    if (data.success) {
      mainTasks.value = data.mainTasks || []
      additionalTasks.value = data.additionalTasks || []
      backlogTasks.value = data.backlogTasks || []
      folders.value = data.folders || []
    } else error.value = data.error || 'Ошибка загрузки задач'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('loadTasks', e)
  } finally {
    loading.value = false
  }
}

function loadAll() {
  loadDayEntry()
  loadTasks()
}

async function addTask(
  section: 'main' | 'additional' | 'backlog',
  folderId?: string | null
) {
  const key = section === 'backlog' && folderId ? `folder-${folderId}` : section
  const title = (newTaskTitle.value[key] || '').trim()
  if (!title) return
  newTaskTitle.value[key] = ''
  try {
    const r = await fetch(`${apiBase.value}/my-day/tasks/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section,
        date: section !== 'backlog' ? selectedDate.value : undefined,
        folderId: section === 'backlog' ? folderId ?? null : undefined,
        title
      })
    })
    const data = await r.json()
    if (data.success) loadTasks()
    else error.value = data.error || 'Ошибка добавления'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('addTask', e)
  }
}

async function toggleComplete(task: TaskItem) {
  const completedAt = task.completedAt ? null : new Date().toISOString()
  try {
    const r = await fetch(`${apiBase.value}/my-day/tasks/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, completedAt })
    })
    const data = await r.json()
    if (data.success) {
      const list =
        task.section === 'main'
          ? mainTasks
          : task.section === 'additional'
            ? additionalTasks
            : backlogTasks
      const idx = list.value.findIndex((x) => x.id === task.id)
      if (idx >= 0) list.value[idx] = data.task
    } else error.value = data.error || 'Ошибка обновления'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('toggleComplete', e)
  }
}

function startEditTask(task: TaskItem) {
  editingTaskId.value = task.id
  editingTaskTitle.value = task.title
}

function cancelEditTask() {
  editingTaskId.value = null
  editingTaskTitle.value = ''
}

async function submitEditTask() {
  const id = editingTaskId.value
  if (!id) return
  const title = editingTaskTitle.value.trim() || 'Задача'
  cancelEditTask()
  try {
    const r = await fetch(`${apiBase.value}/my-day/tasks/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title })
    })
    const data = await r.json()
    if (data.success) loadTasks()
    else error.value = data.error || 'Ошибка обновления'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('submitEditTask', e)
  }
}

async function deleteTask(task: TaskItem) {
  try {
    const r = await fetch(`${apiBase.value}/my-day/tasks/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id })
    })
    const data = await r.json()
    if (data.success) loadTasks()
    else error.value = data.error || 'Ошибка удаления'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('deleteTask', e)
  }
}

async function createFolder() {
  const name = newFolderName.value.trim() || 'Папка'
  newFolderName.value = ''
  try {
    const r = await fetch(`${apiBase.value}/my-day/folders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await r.json()
    if (data.success) loadTasks()
    else error.value = data.error || 'Ошибка создания папки'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('createFolder', e)
  }
}

async function updateFolderName(folder: FolderItem, name: string) {
  const n = name.trim() || folder.name
  try {
    const r = await fetch(`${apiBase.value}/my-day/folders/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: folder.id, name: n })
    })
    const data = await r.json()
    if (data.success) loadTasks()
    else error.value = data.error || 'Ошибка переименования'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('updateFolderName', e)
  }
}

async function deleteFolder(folder: FolderItem) {
  try {
    const r = await fetch(`${apiBase.value}/my-day/folders/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: folder.id })
    })
    const data = await r.json()
    if (data.success) loadTasks()
    else error.value = data.error || 'Ошибка удаления папки'
  } catch (e) {
    error.value = 'Ошибка сети'
    log.error('deleteFolder', e)
  }
}

function dragStart(task: TaskItem, fromSection: string, fromFolderId: string | null) {
  draggingTask.value = { task, fromSection, fromFolderId }
}

function dragEnd() {
  draggingTask.value = null
}

function dragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

async function dropOnSection(
  e: DragEvent,
  toSection: 'main' | 'additional' | 'backlog',
  toFolderId?: string | null
) {
  e.preventDefault()
  const d = draggingTask.value
  if (!d) return
  draggingTask.value = null
  const same =
    d.fromSection === toSection &&
    (toSection !== 'backlog' ? true : (d.fromFolderId ?? '') === (toFolderId ?? ''))
  try {
    if (same) {
      let list: TaskItem[]
      if (toSection === 'main') list = [...mainTasks.value]
      else if (toSection === 'additional') list = [...additionalTasks.value]
      else if (toSection === 'backlog') {
        if (toFolderId) {
          const found = backlogByFolder.value.withFolders.find((x) => x.folder.id === toFolderId)
          list = found ? [...found.tasks] : []
        } else list = [...backlogByFolder.value.noFolder]
      } else list = []
      const idx = list.findIndex((t) => t.id === d.task.id)
      if (idx < 0) return
      const reordered = list.map((t) => t.id)
      reordered.splice(idx, 1)
      reordered.push(d.task.id)
      const r = await fetch(`${apiBase.value}/my-day/tasks/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: toSection,
          date: toSection !== 'backlog' ? selectedDate.value : undefined,
          folderId: toSection === 'backlog' ? toFolderId ?? null : undefined,
          taskIds: reordered
        })
      })
      const data = await r.json()
      if (data.success) loadTasks()
      else error.value = data.error || 'Ошибка сортировки'
    } else {
      const r = await fetch(`${apiBase.value}/my-day/tasks/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: d.task.id,
          section: toSection,
          date: toSection !== 'backlog' ? selectedDate.value : undefined,
          folderId: toSection === 'backlog' ? toFolderId ?? null : undefined
        })
      })
      const data = await r.json()
      if (data.success) loadTasks()
      else {
        error.value = data.error || 'Ошибка перемещения'
        loadTasks()
      }
    }
  } catch (err) {
    error.value = 'Ошибка сети'
    log.error('dropOnSection', err)
    loadTasks()
  }
}

const startAnimations = () => {
  bootLoaderDone.value = true
  log.info('Boot loader complete')
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()
  loadAll()
  if (window.bootLoaderComplete) startAnimations()
  else window.addEventListener('bootloader-complete', startAnimations)
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
})

watch(selectedDate, () => {
  loadAll()
})

const openChatiumLink = () => {
  log.notice('Opening Chatium link')
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
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
          <h1 class="section-heading">Мой день</h1>
          <p v-if="error" class="text-red-500 text-sm mb-2">{{ error }}</p>

          <div class="day-fields mb-6">
            <p class="text-sm text-gray-500 mb-1">Дата: {{ selectedDate }}</p>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Утро</label>
              <textarea
                v-model="morningText"
                class="w-full border rounded px-2 py-1 min-h-[80px] bg-white/5 border-gray-600 text-inherit"
                placeholder="Записи на утро"
                @blur="saveDayEntry()"
              />
            </div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">День</label>
              <textarea
                v-model="dayText"
                class="w-full border rounded px-2 py-1 min-h-[80px] bg-white/5 border-gray-600 text-inherit"
                placeholder="Записи на день"
                @blur="saveDayEntry()"
              />
            </div>
            <div class="mb-3">
              <label class="block text-sm font-medium mb-1">Вечер</label>
              <textarea
                v-model="eveningText"
                class="w-full border rounded px-2 py-1 min-h-[80px] bg-white/5 border-gray-600 text-inherit"
                placeholder="Записи на вечер"
                @blur="saveDayEntry()"
              />
            </div>
          </div>

          <div class="tasks-sections space-y-6">
            <div
              class="task-section rounded border border-gray-600 p-3 min-h-[80px]"
              @dragover="dragOver"
              @drop="dropOnSection($event, 'main')"
            >
              <h2 class="text-lg font-medium mb-2">Главные задачи</h2>
              <ul class="task-list space-y-1">
                <li
                  v-for="task in mainTasks"
                  :key="task.id"
                  class="flex items-center gap-2 py-1 border-b border-gray-700/50"
                  draggable="true"
                  @dragstart="dragStart(task, 'main', null)"
                  @dragend="dragEnd"
                >
                  <input
                    type="checkbox"
                    :checked="!!task.completedAt"
                    @change="toggleComplete(task)"
                    class="rounded"
                  />
                  <span
                    v-if="editingTaskId !== task.id"
                    class="flex-1 truncate"
                    :class="{ 'line-through opacity-70': task.completedAt }"
                    @dblclick="startEditTask(task)"
                  >
                    {{ task.title }}
                  </span>
                  <input
                    v-else
                    v-model="editingTaskTitle"
                    type="text"
                    class="flex-1 px-1 bg-white/10 rounded"
                    @keydown.enter="submitEditTask"
                    @keydown.escape="cancelEditTask"
                    @blur="submitEditTask"
                  />
                  <button
                    type="button"
                    class="text-red-400 text-sm"
                    @click="deleteTask(task)"
                    aria-label="Удалить"
                  >
                    ×
                  </button>
                </li>
              </ul>
              <div class="flex gap-2 mt-2">
                <input
                  v-model="newTaskTitle.main"
                  type="text"
                  class="flex-1 px-2 py-1 rounded border border-gray-600 bg-white/5 text-inherit"
                  placeholder="Новая задача"
                  @keydown.enter="addTask('main')"
                />
                <button
                  type="button"
                  class="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500"
                  @click="addTask('main')"
                >
                  Добавить
                </button>
              </div>
            </div>

            <div
              class="task-section rounded border border-gray-600 p-3 min-h-[80px]"
              @dragover="dragOver"
              @drop="dropOnSection($event, 'additional')"
            >
              <h2 class="text-lg font-medium mb-2">Дополнительные задачи</h2>
              <ul class="task-list space-y-1">
                <li
                  v-for="task in additionalTasks"
                  :key="task.id"
                  class="flex items-center gap-2 py-1 border-b border-gray-700/50"
                  draggable="true"
                  @dragstart="dragStart(task, 'additional', null)"
                  @dragend="dragEnd"
                >
                  <input
                    type="checkbox"
                    :checked="!!task.completedAt"
                    @change="toggleComplete(task)"
                    class="rounded"
                  />
                  <span
                    v-if="editingTaskId !== task.id"
                    class="flex-1 truncate"
                    :class="{ 'line-through opacity-70': task.completedAt }"
                    @dblclick="startEditTask(task)"
                  >
                    {{ task.title }}
                  </span>
                  <input
                    v-else
                    v-model="editingTaskTitle"
                    type="text"
                    class="flex-1 px-1 bg-white/10 rounded"
                    @keydown.enter="submitEditTask"
                    @keydown.escape="cancelEditTask"
                    @blur="submitEditTask"
                  />
                  <button
                    type="button"
                    class="text-red-400 text-sm"
                    @click="deleteTask(task)"
                    aria-label="Удалить"
                  >
                    ×
                  </button>
                </li>
              </ul>
              <div class="flex gap-2 mt-2">
                <input
                  v-model="newTaskTitle.additional"
                  type="text"
                  class="flex-1 px-2 py-1 rounded border border-gray-600 bg-white/5 text-inherit"
                  placeholder="Новая задача"
                  @keydown.enter="addTask('additional')"
                />
                <button
                  type="button"
                  class="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500"
                  @click="addTask('additional')"
                >
                  Добавить
                </button>
              </div>
            </div>

            <div class="task-section backlog rounded border border-gray-600 p-3">
              <h2 class="text-lg font-medium mb-2">Бэклог</h2>
              <div class="flex gap-2 mb-3">
                <input
                  v-model="newFolderName"
                  type="text"
                  class="flex-1 px-2 py-1 rounded border border-gray-600 bg-white/5 text-inherit"
                  placeholder="Новая папка"
                  @keydown.enter="createFolder"
                />
                <button
                  type="button"
                  class="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500"
                  @click="createFolder"
                >
                  Создать папку
                </button>
              </div>

              <div
                class="backlog-no-folder rounded p-2 mb-3 min-h-[60px] bg-black/20"
                @dragover="dragOver"
                @drop="dropOnSection($event, 'backlog', null)"
              >
                <p class="text-sm text-gray-400 mb-1">Без папки</p>
                <ul class="space-y-1">
                  <li
                    v-for="task in backlogByFolder.noFolder"
                    :key="task.id"
                    class="flex items-center gap-2 py-1"
                    draggable="true"
                    @dragstart="dragStart(task, 'backlog', null)"
                    @dragend="dragEnd"
                  >
                    <input
                      type="checkbox"
                      :checked="!!task.completedAt"
                      @change="toggleComplete(task)"
                      class="rounded"
                    />
                    <span
                      v-if="editingTaskId !== task.id"
                      class="flex-1 truncate"
                      :class="{ 'line-through opacity-70': task.completedAt }"
                      @dblclick="startEditTask(task)"
                    >
                      {{ task.title }}
                    </span>
                    <input
                      v-else
                      v-model="editingTaskTitle"
                      type="text"
                      class="flex-1 px-1 bg-white/10 rounded"
                      @keydown.enter="submitEditTask"
                      @keydown.escape="cancelEditTask"
                      @blur="submitEditTask"
                    />
                    <button type="button" class="text-red-400 text-sm" @click="deleteTask(task)" aria-label="Удалить">×</button>
                  </li>
                </ul>
                <div class="flex gap-2 mt-2">
                  <input
                    :value="newTaskTitle['folder-']"
                    type="text"
                    class="flex-1 px-2 py-1 rounded border border-gray-600 bg-white/5 text-inherit"
                    placeholder="Задача без папки"
                    @input="newTaskTitle['folder-'] = $event.target.value"
                    @keydown.enter="addTask('backlog', null)"
                  />
                  <button type="button" class="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500" @click="addTask('backlog', null)">
                    Добавить
                  </button>
                </div>
              </div>

              <div
                v-for="{ folder, tasks } in backlogByFolder.withFolders"
                :key="folder.id"
                class="backlog-folder rounded p-2 mb-3 min-h-[60px] bg-black/20"
                @dragover="dragOver"
                @drop="dropOnSection($event, 'backlog', folder.id)"
              >
                <p class="text-sm font-medium mb-1">{{ folder.name }}</p>
                <ul class="space-y-1">
                  <li
                    v-for="task in tasks"
                    :key="task.id"
                    class="flex items-center gap-2 py-1"
                    draggable="true"
                    @dragstart="dragStart(task, 'backlog', folder.id)"
                    @dragend="dragEnd"
                  >
                    <input
                      type="checkbox"
                      :checked="!!task.completedAt"
                      @change="toggleComplete(task)"
                      class="rounded"
                    />
                    <span
                      v-if="editingTaskId !== task.id"
                      class="flex-1 truncate"
                      :class="{ 'line-through opacity-70': task.completedAt }"
                      @dblclick="startEditTask(task)"
                    >
                      {{ task.title }}
                    </span>
                    <input
                      v-else
                      v-model="editingTaskTitle"
                      type="text"
                      class="flex-1 px-1 bg-white/10 rounded"
                      @keydown.enter="submitEditTask"
                      @keydown.escape="cancelEditTask"
                      @blur="submitEditTask"
                    />
                    <button type="button" class="text-red-400 text-sm" @click="deleteTask(task)" aria-label="Удалить">×</button>
                  </li>
                </ul>
                <div class="flex gap-2 mt-2">
                  <input
                    :value="newTaskTitle['folder-' + folder.id]"
                    type="text"
                    class="flex-1 px-2 py-1 rounded border border-gray-600 bg-white/5 text-inherit"
                    :placeholder="'Задача в ' + folder.name"
                    @input="newTaskTitle['folder-' + folder.id] = $event.target.value"
                    @keydown.enter="addTask('backlog', folder.id)"
                  />
                  <button type="button" class="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500" @click="addTask('backlog', folder.id)">
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          </div>
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

.day-fields textarea {
  resize: vertical;
}

.task-section[dragover] {
  outline: 2px dashed var(--color-text);
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
