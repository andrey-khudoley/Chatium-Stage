<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import { subscribeBootStaticReady, scheduleHideBootLoader } from '../shared/bootUi'
import { createComponentLogger } from '../shared/logger'
import type { TasksTreeDto, TaskClientDto, TaskProjectDto, TaskItemDto } from '../lib/tasks-types'

const log = createComponentLogger('TasksPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
  }
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl?: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  tasksTreeInitial: TasksTreeDto
  tasksTreeGetUrl: string
  taskClientCreateUrl: string
  taskClientUpdateUrl: string
  taskClientDeleteUrl: string
  taskProjectCreateUrl: string
  taskProjectUpdateUrl: string
  taskProjectDeleteUrl: string
  taskItemCreateUrl: string
  taskItemUpdateUrl: string
  taskItemDeleteUrl: string
  taskItemReorderUrl: string
}>()

const bootLoaderDone = ref(false)

const tree = ref<TasksTreeDto>({
  clients: [...(props.tasksTreeInitial?.clients ?? [])],
  projects: [...(props.tasksTreeInitial?.projects ?? [])],
  tasks: [...(props.tasksTreeInitial?.tasks ?? [])]
})

watch(
  () => props.tasksTreeInitial,
  (next) => {
    tree.value = {
      clients: [...(next?.clients ?? [])],
      projects: [...(next?.projects ?? [])],
      tasks: [...(next?.tasks ?? [])]
    }
  },
  { deep: true }
)

const selectedClientId = ref<string | null>(null)
const selectedProjectId = ref<string | null>(null)

const sortedClients = computed(() =>
  [...tree.value.clients].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
)

function projectsForClientId(clientId: string): TaskProjectDto[] {
  return [...tree.value.projects]
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

const projectsForClient = computed(() => {
  if (!selectedClientId.value) return [] as TaskProjectDto[]
  return projectsForClientId(selectedClientId.value)
})

const tasksForProject = computed(() => {
  if (!selectedProjectId.value) return [] as TaskItemDto[]
  return [...tree.value.tasks]
    .filter((t) => t.projectId === selectedProjectId.value)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
})

const selectedClient = computed(() =>
  selectedClientId.value ? tree.value.clients.find((c) => c.id === selectedClientId.value) ?? null : null
)

const selectedProject = computed(() =>
  selectedProjectId.value ? tree.value.projects.find((p) => p.id === selectedProjectId.value) ?? null : null
)

watch(sortedClients, (list) => {
  if (!list.length) {
    selectedClientId.value = null
    selectedProjectId.value = null
    return
  }
  if (!selectedClientId.value || !list.some((c) => c.id === selectedClientId.value)) {
    selectedClientId.value = list[0].id
  }
})

watch(projectsForClient, (list) => {
  if (!list.length) {
    selectedProjectId.value = null
    return
  }
  if (!selectedProjectId.value || !list.some((p) => p.id === selectedProjectId.value)) {
    selectedProjectId.value = list[0].id
  }
})

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Срочно',
  2: 'Высокий',
  3: 'Обычный',
  4: 'Низкий'
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Готово',
  cancelled: 'Отмена'
}

const globalError = ref('')
const loading = ref(false)

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  })
  return r.json() as Promise<T>
}

async function refreshTree() {
  if (!props.isAuthenticated) return
  loading.value = true
  globalError.value = ''
  try {
    const r = await fetch(props.tasksTreeGetUrl, { credentials: 'include' })
    const j = (await r.json()) as { success?: boolean; tree?: TasksTreeDto; error?: string }
    if (j.success && j.tree) {
      tree.value = j.tree
    } else {
      globalError.value = j.error ?? 'Не удалось загрузить данные'
    }
  } catch (e) {
    globalError.value = String(e)
  } finally {
    loading.value = false
  }
}

function selectClient(id: string) {
  selectedClientId.value = id
  selectedProjectId.value = null
  log.info('Client selected', { id })
}

function selectProject(id: string) {
  const row = tree.value.projects.find((x) => x.id === id)
  if (!row) return
  selectedClientId.value = row.clientId
  selectedProjectId.value = id
  log.info('Project selected', { id })
}

function prepareClientForNewProject(clientId: string) {
  if (!props.isAuthenticated) return
  selectedClientId.value = clientId
  selectedProjectId.value = null
  nextTick(() => openProjectCreate())
}

/** --- Модалки клиента --- */
const clientModal = ref<'create' | 'edit' | null>(null)
const clientFormName = ref('')
const clientEditId = ref<string | null>(null)
const clientSaving = ref(false)
const clientError = ref('')

function openClientCreate() {
  if (!props.isAuthenticated) return
  clientModal.value = 'create'
  clientFormName.value = ''
  clientError.value = ''
}

function openClientEdit(c: TaskClientDto) {
  clientModal.value = 'edit'
  clientEditId.value = c.id
  clientFormName.value = c.name
  clientError.value = ''
}

function closeClientModal() {
  clientModal.value = null
  clientEditId.value = null
}

async function submitClientModal() {
  clientSaving.value = true
  clientError.value = ''
  try {
    if (clientModal.value === 'create') {
      const j = await postJson<{ success: boolean; client?: TaskClientDto; error?: string }>(
        props.taskClientCreateUrl,
        { name: clientFormName.value }
      )
      if (!j.success || !j.client) {
        clientError.value = j.error ?? 'Ошибка'
        return
      }
      tree.value.clients.push(j.client)
      selectedClientId.value = j.client.id
      closeClientModal()
    } else if (clientModal.value === 'edit' && clientEditId.value) {
      const j = await postJson<{ success: boolean; client?: TaskClientDto; error?: string }>(
        props.taskClientUpdateUrl,
        { id: clientEditId.value, name: clientFormName.value }
      )
      if (!j.success || !j.client) {
        clientError.value = j.error ?? 'Ошибка'
        return
      }
      tree.value.clients = tree.value.clients.map((x) => (x.id === j.client!.id ? j.client! : x))
      closeClientModal()
    }
  } catch (e) {
    clientError.value = String(e)
  } finally {
    clientSaving.value = false
  }
}

const deleteTarget = ref<{ kind: 'client' | 'project' | 'task'; id: string; label: string } | null>(null)

function openDelete(kind: 'client' | 'project' | 'task', id: string, label: string) {
  deleteTarget.value = { kind, id, label }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const { kind, id } = deleteTarget.value
  deleteTarget.value = null
  try {
    if (kind === 'client') {
      const j = await postJson<{ success: boolean }>(props.taskClientDeleteUrl, { id })
      if (!j.success) return
      await refreshTree()
    } else if (kind === 'project') {
      const j = await postJson<{ success: boolean }>(props.taskProjectDeleteUrl, { id })
      if (!j.success) return
      selectedProjectId.value = null
      await refreshTree()
    } else {
      const j = await postJson<{ success: boolean }>(props.taskItemDeleteUrl, { id })
      if (!j.success) return
      tree.value.tasks = tree.value.tasks.filter((t) => t.id !== id)
    }
  } catch (e) {
    globalError.value = String(e)
  }
}

/** --- Проект --- */
const projectModal = ref<'create' | 'edit' | null>(null)
const projectFormName = ref('')
const projectEditId = ref<string | null>(null)
const projectSaving = ref(false)
const projectError = ref('')

function openProjectCreate() {
  if (!props.isAuthenticated || !selectedClientId.value) return
  projectModal.value = 'create'
  projectFormName.value = ''
  projectError.value = ''
}

function openProjectEdit(p: TaskProjectDto) {
  projectModal.value = 'edit'
  projectEditId.value = p.id
  projectFormName.value = p.name
  projectError.value = ''
}

function closeProjectModal() {
  projectModal.value = null
  projectEditId.value = null
}

async function submitProjectModal() {
  if (!selectedClientId.value && projectModal.value === 'create') return
  projectSaving.value = true
  projectError.value = ''
  try {
    if (projectModal.value === 'create') {
      const j = await postJson<{ success: boolean; project?: TaskProjectDto; error?: string }>(
        props.taskProjectCreateUrl,
        { clientId: selectedClientId.value!, name: projectFormName.value }
      )
      if (!j.success || !j.project) {
        projectError.value = j.error ?? 'Ошибка'
        return
      }
      tree.value.projects.push(j.project)
      selectedProjectId.value = j.project.id
      closeProjectModal()
    } else if (projectModal.value === 'edit' && projectEditId.value) {
      const j = await postJson<{ success: boolean; project?: TaskProjectDto; error?: string }>(
        props.taskProjectUpdateUrl,
        {
          id: projectEditId.value,
          name: projectFormName.value,
          clientId: selectedClientId.value ?? undefined
        }
      )
      if (!j.success || !j.project) {
        projectError.value = j.error ?? 'Ошибка'
        return
      }
      tree.value.projects = tree.value.projects.map((x) => (x.id === j.project!.id ? j.project! : x))
      closeProjectModal()
    }
  } catch (e) {
    projectError.value = String(e)
  } finally {
    projectSaving.value = false
  }
}

/** --- Задача --- */
const taskModal = ref<'create' | 'edit' | null>(null)
const taskForm = ref({
  title: '',
  description: '',
  priority: 2,
  status: 'todo' as TaskItemDto['status'],
  projectId: '' as string
})
const taskEditId = ref<string | null>(null)
const taskSaving = ref(false)
const taskError = ref('')

function openTaskCreate() {
  if (!props.isAuthenticated || !selectedProjectId.value) return
  taskModal.value = 'create'
  taskForm.value = {
    title: '',
    description: '',
    priority: 2,
    status: 'todo',
    projectId: selectedProjectId.value
  }
  taskError.value = ''
}

function openTaskEdit(t: TaskItemDto) {
  taskModal.value = 'edit'
  taskEditId.value = t.id
  taskForm.value = {
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    projectId: t.projectId
  }
  taskError.value = ''
}

function closeTaskModal() {
  taskModal.value = null
  taskEditId.value = null
}

async function submitTaskModal() {
  taskSaving.value = true
  taskError.value = ''
  try {
    if (taskModal.value === 'create') {
      const j = await postJson<{ success: boolean; task?: TaskItemDto; error?: string }>(
        props.taskItemCreateUrl,
        {
          projectId: taskForm.value.projectId,
          title: taskForm.value.title,
          description: taskForm.value.description,
          priority: taskForm.value.priority,
          status: taskForm.value.status
        }
      )
      if (!j.success || !j.task) {
        taskError.value = j.error ?? 'Ошибка'
        return
      }
      tree.value.tasks.push(j.task)
      closeTaskModal()
    } else if (taskModal.value === 'edit' && taskEditId.value) {
      const j = await postJson<{ success: boolean; task?: TaskItemDto; error?: string }>(
        props.taskItemUpdateUrl,
        {
          id: taskEditId.value,
          title: taskForm.value.title,
          description: taskForm.value.description,
          priority: taskForm.value.priority,
          status: taskForm.value.status,
          projectId: taskForm.value.projectId
        }
      )
      if (!j.success || !j.task) {
        taskError.value = j.error ?? 'Ошибка'
        return
      }
      tree.value.tasks = tree.value.tasks.map((x) => (x.id === j.task!.id ? j.task! : x))
      closeTaskModal()
    }
  } catch (e) {
    taskError.value = String(e)
  } finally {
    taskSaving.value = false
  }
}

async function markTaskForDay(t: TaskItemDto) {
  if (!props.isAuthenticated) return
  const nextStatus: TaskItemDto['status'] = t.status === 'in_progress' ? 'todo' : 'in_progress'
  loading.value = true
  globalError.value = ''
  try {
    const j = await postJson<{ success: boolean; task?: TaskItemDto; error?: string }>(props.taskItemUpdateUrl, {
      id: t.id,
      status: nextStatus
    })
    if (!j.success || !j.task) {
      globalError.value = j.error ?? 'Не удалось обновить задачу'
      return
    }
    tree.value.tasks = tree.value.tasks.map((x) => (x.id === j.task!.id ? j.task! : x))
    log.info(nextStatus === 'in_progress' ? 'Task marked for day (in progress)' : 'Task back to todo', { id: t.id })
  } catch (e) {
    globalError.value = String(e)
  } finally {
    loading.value = false
  }
}

function applyTasksUrlQuery() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const qp = params.get('project')
  const qc = params.get('client')
  if (qp) {
    const proj = tree.value.projects.find((p) => p.id === qp)
    if (proj) {
      selectedClientId.value = proj.clientId
      selectedProjectId.value = proj.id
      return
    }
  }
  if (qc) {
    const c = tree.value.clients.find((x) => x.id === qc)
    if (c) selectedClientId.value = qc
  }
}

async function moveTask(t: TaskItemDto, dir: -1 | 1) {
  const list = tasksForProject.value
  const idx = list.findIndex((x) => x.id === t.id)
  const j = idx + dir
  if (idx < 0 || j < 0 || j >= list.length) return
  const orderedIds = list.map((x) => x.id)
  const tmp = orderedIds[idx]
  orderedIds[idx] = orderedIds[j]
  orderedIds[j] = tmp
  const r = await postJson<{ success: boolean }>(props.taskItemReorderUrl, {
    projectId: t.projectId,
    orderedIds
  })
  if (!r.success) return
  let o = 0
  for (const id of orderedIds) {
    const row = tree.value.tasks.find((x) => x.id === id)
    if (row) row.sortOrder = o
    o++
  }
}

const startAfterBoot = () => {
  bootLoaderDone.value = true
  scheduleHideBootLoader()
}

let unsubBootStatic: (() => void) | null = null

onMounted(() => {
  log.info('TasksPage mounted')
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
  unsubBootStatic = subscribeBootStaticReady(startAfterBoot)
  void nextTick(() => applyTasksUrlQuery())
})

watch(
  () => [tree.value.clients.length, tree.value.projects.length] as const,
  () => {
    applyTasksUrlQuery()
  }
)

onUnmounted(() => {
  unsubBootStatic?.()
})

const openChatiumLink = () => {
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}
</script>

<template>
  <div class="app-layout bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
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
      <div class="content-inner journal-shell tasks-page-shell">
        <aside class="tasks-sidebar" aria-label="Клиенты и проекты">
          <div class="tasks-sidebar-toolbar">
            <button
              type="button"
              class="tasks-sidebar-toolbar-btn tasks-sidebar-btn-subtle"
              :disabled="!props.isAuthenticated"
              title="Добавить клиента"
              @click="openClientCreate"
            >
              Новый клиент
            </button>
          </div>
          <div class="journal-nav-divider" aria-hidden="true" />
          <p v-if="!props.isAuthenticated" class="tasks-hint">Войдите, чтобы вести задачи.</p>
          <div v-else class="tasks-hierarchy">
            <p v-if="!sortedClients.length" class="tasks-hint tasks-hint--muted">Пока нет клиентов — создайте первого.</p>
            <div v-for="c in sortedClients" :key="c.id" class="tasks-client-block">
              <div class="tasks-client-row">
                <button
                  type="button"
                  class="tasks-client-select"
                  :class="{ 'tasks-client-select--active': selectedClientId === c.id }"
                  @click="selectClient(c.id)"
                >
                  {{ c.name }}
                </button>
                <div v-if="props.isAuthenticated" class="tasks-item-actions">
                  <button
                    type="button"
                    class="tasks-icon-btn"
                    title="Новый проект у этого клиента"
                    @click="prepareClientForNewProject(c.id)"
                  >
                    <i class="fas fa-folder-plus" aria-hidden="true" />
                  </button>
                  <button type="button" class="tasks-icon-btn" title="Переименовать" @click="openClientEdit(c)">
                    <i class="fas fa-pen" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="tasks-icon-btn tasks-icon-btn--danger"
                    title="Удалить клиента и всё внутри"
                    @click="openDelete('client', c.id, c.name)"
                  >
                    <i class="fas fa-trash" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <ul class="tasks-project-list" role="list">
                <li v-for="p in projectsForClientId(c.id)" :key="p.id" class="tasks-project-item">
                  <div class="tasks-project-row">
                    <button
                      type="button"
                      class="journal-nav-btn tasks-project-btn"
                      :class="{ 'journal-nav-btn--active': selectedProjectId === p.id }"
                      @click="selectProject(p.id)"
                    >
                      {{ p.name }}
                    </button>
                    <div v-if="props.isAuthenticated" class="tasks-item-actions">
                      <button type="button" class="tasks-icon-btn" title="Переименовать" @click="openProjectEdit(p)">
                        <i class="fas fa-pen" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        class="tasks-icon-btn tasks-icon-btn--danger"
                        title="Удалить проект"
                        @click="openDelete('project', p.id, p.name)"
                      >
                        <i class="fas fa-trash" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
              <p
                v-if="props.isAuthenticated && !projectsForClientId(c.id).length"
                class="tasks-project-empty"
              >
                Нет проектов
              </p>
            </div>
          </div>
        </aside>

        <section class="journal-panel tasks-panel" aria-live="polite">
          <div class="tasks-panel-head">
            <h2 class="tasks-panel-title">
              <template v-if="selectedProject && selectedClient">
                {{ selectedClient.name }} / {{ selectedProject.name }}
              </template>
              <template v-else>Задачи</template>
            </h2>
            <button
              type="button"
              class="journal-nav-action tasks-panel-add"
              :disabled="!props.isAuthenticated || !selectedProjectId"
              @click="openTaskCreate"
            >
              Новая задача
            </button>
          </div>
          <p v-if="globalError" class="tasks-global-err" role="alert">{{ globalError }}</p>
          <p v-if="loading" class="tasks-loading">Обновление…</p>

          <div v-if="!selectedProjectId" class="tasks-placeholder">Выберите проект, чтобы увидеть задачи.</div>

          <table v-else class="tasks-table">
            <thead>
              <tr>
                <th scope="col">Задача</th>
                <th scope="col">Приоритет</th>
                <th scope="col">Статус</th>
                <th scope="col">Порядок</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in tasksForProject" :key="t.id">
                <td>
                  <div class="tasks-title">{{ t.title }}</div>
                  <div v-if="t.description" class="tasks-desc">{{ t.description }}</div>
                </td>
                <td>
                  <span class="tasks-badge" :class="`tasks-badge--p${t.priority}`">
                    {{ PRIORITY_LABELS[t.priority] ?? t.priority }}
                  </span>
                </td>
                <td>{{ STATUS_LABELS[t.status] ?? t.status }}</td>
                <td class="tasks-reorder">
                  <button type="button" class="tasks-reorder-btn" title="Выше" @click="moveTask(t, -1)">
                    <i class="fas fa-chevron-up" aria-hidden="true" />
                  </button>
                  <button type="button" class="tasks-reorder-btn" title="Ниже" @click="moveTask(t, 1)">
                    <i class="fas fa-chevron-down" aria-hidden="true" />
                  </button>
                </td>
                <td class="tasks-row-actions">
                  <button
                    type="button"
                    class="tasks-icon-btn tasks-icon-btn--accent"
                    :class="{ 'tasks-icon-btn--in-progress': t.status === 'in_progress' }"
                    :title="
                      t.status === 'in_progress'
                        ? 'Вернуть в «К выполнению»'
                        : 'Отметить на день (статус «В работе»)'
                    "
                    :disabled="!props.isAuthenticated"
                    @click="markTaskForDay(t)"
                  >
                    <i class="fas fa-bookmark" aria-hidden="true" />
                  </button>
                  <button type="button" class="tasks-icon-btn" title="Изменить" @click="openTaskEdit(t)">
                    <i class="fas fa-pen" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="tasks-icon-btn tasks-icon-btn--danger"
                    title="Удалить"
                    @click="openDelete('task', t.id, t.title)"
                  >
                    <i class="fas fa-trash" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <p v-if="selectedProjectId && !tasksForProject.length" class="tasks-placeholder">В этом проекте пока нет задач.</p>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />

    <Teleport to="body">
      <Transition name="jn-modal">
        <div
          v-if="clientModal"
          class="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          @click.self="closeClientModal"
        >
          <div class="jn-modal" @click.stop>
            <h2 class="jn-modal-heading">{{ clientModal === 'create' ? 'Новый клиент' : 'Клиент' }}</h2>
            <label class="jn-label" for="tc-name">Название</label>
            <input id="tc-name" v-model="clientFormName" type="text" class="jn-input" maxlength="200" />
            <p v-if="clientError" class="jn-modal-error" role="alert">{{ clientError }}</p>
            <div class="jn-modal-actions">
              <button type="button" class="journal-nav-btn" @click="closeClientModal">Отмена</button>
              <button type="button" class="journal-nav-action" :disabled="clientSaving" @click="submitClientModal">
                {{ clientSaving ? '…' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="jn-modal">
        <div
          v-if="projectModal"
          class="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          @click.self="closeProjectModal"
        >
          <div class="jn-modal" @click.stop>
            <h2 class="jn-modal-heading">{{ projectModal === 'create' ? 'Новый проект' : 'Проект' }}</h2>
            <label class="jn-label" for="tp-name">Название</label>
            <input id="tp-name" v-model="projectFormName" type="text" class="jn-input" maxlength="200" />
            <p v-if="projectError" class="jn-modal-error" role="alert">{{ projectError }}</p>
            <div class="jn-modal-actions">
              <button type="button" class="journal-nav-btn" @click="closeProjectModal">Отмена</button>
              <button type="button" class="journal-nav-action" :disabled="projectSaving" @click="submitProjectModal">
                {{ projectSaving ? '…' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="jn-modal">
        <div
          v-if="taskModal"
          class="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          @click.self="closeTaskModal"
        >
          <div class="jn-modal jn-modal--wide" @click.stop>
            <h2 class="jn-modal-heading">{{ taskModal === 'create' ? 'Новая задача' : 'Задача' }}</h2>
            <label class="jn-label" for="tt-title">Заголовок</label>
            <input id="tt-title" v-model="taskForm.title" type="text" class="jn-input" maxlength="500" />
            <label class="jn-label" for="tt-desc">Описание</label>
            <textarea id="tt-desc" v-model="taskForm.description" class="jn-textarea" rows="5" />
            <label class="jn-label" for="tt-p">Приоритет</label>
            <select id="tt-p" v-model.number="taskForm.priority" class="jn-input">
              <option v-for="n in 4" :key="n" :value="n">{{ n }} — {{ PRIORITY_LABELS[n] }}</option>
            </select>
            <label class="jn-label" for="tt-s">Статус</label>
            <select id="tt-s" v-model="taskForm.status" class="jn-input">
              <option value="todo">К выполнению</option>
              <option value="in_progress">В работе</option>
              <option value="done">Готово</option>
              <option value="cancelled">Отмена</option>
            </select>
            <label class="jn-label" for="tt-pr">Проект</label>
            <select id="tt-pr" v-model="taskForm.projectId" class="jn-input">
              <option v-for="p in tree.projects.filter((x) => x.clientId === selectedClientId)" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
            <p v-if="taskError" class="jn-modal-error" role="alert">{{ taskError }}</p>
            <div class="jn-modal-actions">
              <button type="button" class="journal-nav-btn" @click="closeTaskModal">Отмена</button>
              <button type="button" class="journal-nav-action" :disabled="taskSaving" @click="submitTaskModal">
                {{ taskSaving ? '…' : 'Сохранить' }}
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
          @click.self="deleteTarget = null"
        >
          <div class="jn-modal jn-modal--compact" @click.stop>
            <h2 class="jn-modal-heading">Удалить «{{ deleteTarget.label }}»?</h2>
            <p v-if="deleteTarget.kind === 'client'" class="tasks-delete-warn">
              Будут удалены все проекты и задачи этого клиента.
            </p>
            <p v-else-if="deleteTarget.kind === 'project'" class="tasks-delete-warn">Будут удалены все задачи проекта.</p>
            <div class="jn-modal-actions">
              <button type="button" class="journal-nav-btn" @click="deleteTarget = null">Отмена</button>
              <button type="button" class="journal-nav-action" @click="confirmDelete">Удалить</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.tasks-page-shell {
  align-items: stretch;
}

.tasks-sidebar {
  flex: 0 1 min(340px, 38vw);
  min-width: min(280px, 100%);
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.5rem 0.65rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.28);
  max-height: calc(100vh - 8rem);
  overflow-x: hidden;
  overflow-y: auto;
}

.tasks-sidebar-toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.tasks-sidebar-toolbar-btn {
  width: 100%;
}

.tasks-sidebar-btn-subtle {
  margin: 0;
  padding: 0.32rem 0.45rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-align: center;
  line-height: 1.3;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.tasks-sidebar-btn-subtle:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-border-light);
  background: var(--color-bg-tertiary);
}

.tasks-sidebar-btn-subtle:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tasks-hierarchy {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.tasks-client-block {
  padding-bottom: 0.65rem;
  border-bottom: 1px solid var(--color-border);
}

.tasks-client-block:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.tasks-client-row {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
}

.tasks-client-select {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 0.4rem 0.5rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: left;
  line-height: 1.35;
  color: var(--color-text);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-left: 3px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.tasks-client-select:hover {
  border-color: var(--color-border-light);
  background: var(--color-bg-tertiary);
}

.tasks-client-select--active {
  border-left-color: var(--color-accent);
  background: var(--color-accent-light);
  box-shadow: 0 0 10px var(--color-accent-medium);
}

.tasks-item-actions {
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  gap: 0.2rem;
  align-items: flex-start;
  padding-top: 0.1rem;
}

.tasks-item-actions .tasks-icon-btn {
  width: 1.6rem;
  height: 1.6rem;
  font-size: 0.65rem;
}

.tasks-project-list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 0.65rem;
  border-left: 2px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.tasks-project-item {
  margin: 0;
}

.tasks-project-row {
  display: flex;
  align-items: stretch;
  gap: 0.3rem;
}

.tasks-project-btn {
  flex: 1 1 auto;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
  letter-spacing: 0.06em;
}

.tasks-project-empty {
  margin: 0.15rem 0 0 0.65rem;
  padding: 0;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

.tasks-hint {
  margin: 0;
  font-size: 0.62rem;
  line-height: 1.3;
  color: var(--color-text-secondary);
  letter-spacing: 0.06em;
}

.tasks-hint--muted {
  opacity: 0.85;
  padding: 0.25rem 0;
}

.tasks-icon-btn {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  width: 1.75rem;
  height: 1.75rem;
  cursor: pointer;
  border-radius: 2px;
  transition: var(--transition, all 0.2s ease);
}

.tasks-icon-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-light);
}

.tasks-icon-btn--accent {
  color: var(--color-text-secondary);
  border-color: var(--color-border-light);
}

.tasks-icon-btn--accent:hover:not(:disabled) {
  color: var(--color-accent-hover);
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}

.tasks-icon-btn--in-progress {
  color: #e53935;
  border-color: rgba(229, 57, 53, 0.65);
  background: rgba(229, 57, 53, 0.12);
  cursor: pointer;
  opacity: 1;
}

.tasks-icon-btn--accent.tasks-icon-btn--in-progress:hover {
  color: #c62828;
  border-color: rgba(229, 57, 53, 0.85);
  background: rgba(229, 57, 53, 0.18);
}

.tasks-icon-btn--danger:hover {
  color: var(--color-accent-hover);
  border-color: var(--color-accent);
}

.tasks-panel {
  display: flex;
  flex-direction: column;
  min-height: 280px;
}

.tasks-panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.2);
}

.tasks-panel-title {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.tasks-panel-add {
  width: auto;
  padding: 0.35rem 0.65rem;
}

.tasks-placeholder {
  padding: 1.5rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-align: center;
}

.tasks-global-err {
  margin: 0.5rem 0.85rem;
  font-size: 0.7rem;
  color: var(--color-accent-hover);
}

.tasks-loading {
  margin: 0.35rem 0.85rem;
  font-size: 0.65rem;
  color: var(--color-text-secondary);
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.72rem;
}

.tasks-table th,
.tasks-table td {
  padding: 0.5rem 0.65rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}

.tasks-table th {
  color: var(--color-text-tertiary);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.62rem;
}

.tasks-title {
  color: var(--color-text);
  font-weight: 500;
}

.tasks-desc {
  margin-top: 0.25rem;
  color: var(--color-text-secondary);
  font-size: 0.68rem;
  white-space: pre-wrap;
}

.tasks-badge {
  display: inline-block;
  padding: 0.15rem 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  font-size: 0.62rem;
  letter-spacing: 0.05em;
}

.tasks-badge--p1 {
  border-color: var(--color-accent);
  color: var(--color-accent-hover);
}
.tasks-badge--p2 {
  color: var(--color-text);
}
.tasks-badge--p3 {
  color: var(--color-text-secondary);
}
.tasks-badge--p4 {
  color: var(--color-text-tertiary);
}

.tasks-reorder {
  white-space: nowrap;
}

.tasks-reorder-btn {
  display: inline-block;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.15rem 0.35rem;
  margin-right: 0.2rem;
  border-radius: 2px;
}

.tasks-reorder-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-text);
}

.tasks-row-actions {
  white-space: nowrap;
}

.tasks-delete-warn {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0 0 0.5rem;
}

@media (max-width: 900px) {
  .tasks-page-shell {
    flex-direction: column;
  }

  .tasks-sidebar {
    flex: 1 1 auto;
    max-width: none;
    width: 100%;
    max-height: none;
  }
}
</style>

<style>
/* Модалки — как в блокноте */
.jn-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200000;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.jn-modal {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  padding: 1.25rem;
  border-radius: 2px;
  box-shadow: 0 0 24px rgba(211, 35, 75, 0.15);
}

.jn-modal--wide {
  max-width: 520px;
}

.jn-modal--compact {
  max-width: 380px;
}

.jn-modal-heading {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--color-text);
}

.jn-label {
  display: block;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: 0.35rem;
}

.jn-input,
.jn-textarea {
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0.6rem;
  font-family: inherit;
  font-size: 0.8rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  border-radius: 2px;
}

.jn-textarea {
  resize: vertical;
  min-height: 80px;
}

.jn-modal-error {
  color: var(--color-accent-hover);
  font-size: 0.72rem;
  margin: 0 0 0.5rem;
}

.jn-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.jn-modal-enter-active,
.jn-modal-leave-active {
  transition: opacity 0.2s ease;
}

.jn-modal-enter-from,
.jn-modal-leave-to {
  opacity: 0;
}

:root {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-bg-tertiary: #1a1a1a;
  --color-text: #e8e8e8;
  --color-text-secondary: #a0a0a0;
  --color-text-tertiary: #707070;
  --color-border: #2a2a2a;
  --color-border-light: #3a3a3a;
  --color-accent: #d3234b;
  --color-accent-hover: #e6395f;
  --color-accent-light: rgba(211, 35, 75, 0.1);
  --color-accent-medium: rgba(211, 35, 75, 0.2);
}

body {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  margin: 0;
  background: var(--color-bg);
  letter-spacing: 0.03em;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  position: relative;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 100;
  padding: 2rem 0;
}

.content-inner {
  width: 100%;
  max-width: 1200px;
  padding: 0 1.5rem;
  margin: 0 auto;
  position: relative;
  z-index: 10;
}

.journal-shell {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.75rem 1rem;
  max-width: 1200px;
  min-height: 40vh;
}

.journal-nav-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
}

.journal-nav-divider {
  height: 0;
  margin: 0.1rem 0;
  border: 0;
  border-top: 1px solid var(--color-border-light);
  opacity: 0.85;
}

.journal-nav-action {
  width: 100%;
  margin: 0;
  padding: 0.35rem 0.4rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.62rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  line-height: 1.3;
  color: var(--color-text);
  background: var(--color-accent-light);
  border: 1px solid var(--color-accent);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.journal-nav-action:hover:not(:disabled) {
  background: var(--color-accent-medium);
  border-color: var(--color-accent-hover);
  color: #fff;
}

.journal-nav-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.journal-nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.journal-nav-item {
  margin: 0;
}

.journal-nav-btn {
  width: 100%;
  margin: 0;
  padding: 0.35rem 0.45rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-align: left;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1.25;
}

.journal-nav-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-light);
  background: var(--color-bg-tertiary);
}

.journal-nav-btn--active {
  color: var(--color-text);
  border-color: var(--color-border-light);
  border-left-color: var(--color-accent);
  background: var(--color-accent-light);
  box-shadow: 0 0 12px var(--color-accent-medium);
}

.journal-panel {
  flex: 1;
  min-width: 0;
  position: relative;
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(20, 20, 20, 0.6) 100%);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}
</style>
