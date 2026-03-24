<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import JournalNotebookPane from '../components/journal/JournalNotebookPane.vue'
import JournalMonthPane from '../components/journal/JournalMonthPane.vue'
import JournalWeekPane from '../components/journal/JournalWeekPane.vue'
import JournalDayPane from '../components/journal/JournalDayPane.vue'
import type { TasksTreeDto } from '../lib/tasks-types'
import JournalHabitsPane from '../components/journal/JournalHabitsPane.vue'
import JournalDayInDevelopmentPane from '../components/journal/JournalDayInDevelopmentPane.vue'
import JournalNav from '../components/journal/JournalNav.vue'
import { subscribeBootStaticReady, scheduleHideBootLoader } from '../shared/bootUi'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('JournalPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
  }
}

type JournalTabId = 'notebook' | 'month' | 'week' | 'tasks' | 'day' | 'habits'

const TAB_QUERY_KEY = 'tab'

const JOURNAL_TAB_IDS: JournalTabId[] = ['notebook', 'month', 'week', 'tasks', 'day', 'habits']

function parseTabFromSearch(search: string): JournalTabId | null {
  const q = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(q)
  const raw = params.get(TAB_QUERY_KEY)
  if (!raw) return null
  return JOURNAL_TAB_IDS.includes(raw as JournalTabId) ? (raw as JournalTabId) : null
}

function applyTabToUrl(tab: JournalTabId) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (tab === 'notebook') {
    url.searchParams.delete(TAB_QUERY_KEY)
  } else {
    url.searchParams.set(TAB_QUERY_KEY, tab)
  }
  const next = url.pathname + url.search + url.hash
  const cur = window.location.pathname + window.location.search + window.location.hash
  if (next !== cur) {
    history.replaceState(null, '', next)
  }
}

type JournalNoteSummary = { id: string; title: string }
interface JournalPageProps {
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl?: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  journalNotesInitial?: JournalNoteSummary[]
  journalNotesCreateUrl?: string
  journalNotesGetUrl?: string
  journalNotesUpdateUrl?: string
  journalNotesDeleteUrl?: string
  journalDayGetUrl?: string
  journalDaySaveUrl?: string
  journalDayEntryInitial?: unknown
  journalWeekGetUrl?: string
  journalWeekSaveUrl?: string
  journalWeekSaveSummaryUrl?: string
  journalWeekEntryInitial?: unknown
  tasksTreeInitial?: TasksTreeDto
  tasksTreeGetUrl?: string
  taskItemReorderDayUrl?: string
  taskReleaseDayUrl?: string
  taskItemUpdateUrl?: string
  tasksPageUrl?: string
  pomodoroAssignTaskUrl?: string
  pomodoroStateGetUrl?: string
  pomodoroControlUrl?: string
  journalMonthDataUrl?: string
  // Вкладка из ?tab= при SSR; на клиенте приоритет у текущего window.location.
  journalTabInitial?: JournalTabId
}

const props = defineProps<JournalPageProps>()

const bootLoaderDone = ref(false)

const tabComponents: Record<JournalTabId, object> = {
  notebook: JournalNotebookPane,
  month: JournalMonthPane,
  week: JournalWeekPane,
  tasks: JournalDayPane,
  day: JournalDayInDevelopmentPane,
  habits: JournalHabitsPane,
}

const tabs: { id: JournalTabId; label: string }[] = [
  { id: 'tasks', label: 'Задачи' },
  { id: 'day', label: 'День' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'habits', label: 'Привычки' },
  { id: 'notebook', label: 'Блокнот' },
]

function resolveInitialTab(): JournalTabId {
  if (typeof window !== 'undefined') {
    const fromUrl = parseTabFromSearch(window.location.search)
    if (fromUrl) return fromUrl
  }
  return props.journalTabInitial ?? 'notebook'
}

const activeTab = ref<JournalTabId>(resolveInitialTab())

const journalNotes = ref<JournalNoteSummary[]>([...(props.journalNotesInitial ?? [])])

watch(
  () => props.journalNotesInitial,
  (next: JournalNoteSummary[] | undefined) => {
    journalNotes.value = [...(next ?? [])]
  }
)

const notebookOpenEditorTick = ref(0)
const notebookCreateError = ref('')

const showNotebookNavToolbar = computed(() => activeTab.value === 'notebook')
const hasTasksPageUrl = computed(() => Boolean(props.tasksPageUrl?.trim()))
const showTasksNavToolbar = computed(() => activeTab.value === 'tasks' && hasTasksPageUrl.value)

const notebookCreateTitle = computed(() =>
  props.isAuthenticated ? 'Открыть редактор новой заметки' : 'Войдите в аккаунт, чтобы создавать заметки'
)

function onCreateNotebookNote() {
  if (!props.isAuthenticated) return
  notebookCreateError.value = ''
  notebookOpenEditorTick.value += 1
  log.info('Запрос редактора новой заметки', { tick: notebookOpenEditorTick.value })
}

function onOpenAllTasks() {
  const targetUrl = props.tasksPageUrl?.trim()
  if (!targetUrl) return
  log.info('Переход к общему списку задач', { targetUrl })
  window.location.assign(targetUrl)
}

function onNotebookNoteCreated(note: JournalNoteSummary) {
  const id = note.id
  journalNotes.value = [note, ...journalNotes.value.filter((x) => x.id !== id)]
}

function onNotebookNoteUpdated(note: JournalNoteSummary) {
  journalNotes.value = journalNotes.value.map((x) => (x.id === note.id ? note : x))
}

function onNotebookNoteDeleted(id: string) {
  journalNotes.value = journalNotes.value.filter((x) => x.id !== id)
}

const currentPane = computed(() => tabComponents[activeTab.value])

const notebookPaneProps = computed(() => ({
  notes: journalNotes.value,
  isAuthenticated: props.isAuthenticated,
  journalNotesCreateUrl: props.journalNotesCreateUrl,
  journalNotesGetUrl: props.journalNotesGetUrl,
  journalNotesUpdateUrl: props.journalNotesUpdateUrl,
  journalNotesDeleteUrl: props.journalNotesDeleteUrl,
  openNotebookEditorRequest: notebookOpenEditorTick.value
}))

const tasksPaneProps = computed(() => ({
  isAuthenticated: props.isAuthenticated,
  tasksTreeInitial: props.tasksTreeInitial ?? { clients: [], projects: [], tasks: [] },
  tasksTreeGetUrl: props.tasksTreeGetUrl ?? '',
  taskItemReorderDayUrl: props.taskItemReorderDayUrl ?? '',
  taskReleaseDayUrl: props.taskReleaseDayUrl ?? '',
  taskItemUpdateUrl: props.taskItemUpdateUrl ?? '',
  tasksPageUrl: props.tasksPageUrl ?? '',
  pomodoroAssignTaskUrl: props.pomodoroAssignTaskUrl ?? ''
}))

const dayInDevelopmentPaneProps = computed(() => ({
  isAuthenticated: props.isAuthenticated,
  journalDayGetUrl: props.journalDayGetUrl ?? '',
  journalDaySaveUrl: props.journalDaySaveUrl ?? '',
  journalDayEntryInitial: props.journalDayEntryInitial ?? null
}))

const panePropsForTab = computed(() => {
  if (activeTab.value === 'notebook') return notebookPaneProps.value
  if (activeTab.value === 'tasks') return tasksPaneProps.value
  if (activeTab.value === 'day') return dayInDevelopmentPaneProps.value
  if (activeTab.value === 'week') {
    return {
      isAuthenticated: props.isAuthenticated,
      journalWeekGetUrl: props.journalWeekGetUrl ?? '',
      journalWeekSaveUrl: props.journalWeekSaveUrl ?? '',
      journalWeekSaveSummaryUrl: props.journalWeekSaveSummaryUrl ?? '',
      journalWeekEntryInitial: props.journalWeekEntryInitial ?? null
    }
  }
  if (activeTab.value === 'month') {
    return {
      isAuthenticated: props.isAuthenticated,
      journalMonthDataUrl: props.journalMonthDataUrl ?? '',
      journalDayGetUrl: props.journalDayGetUrl ?? '',
      journalDaySaveUrl: props.journalDaySaveUrl ?? '',
      journalWeekGetUrl: props.journalWeekGetUrl ?? '',
      journalWeekSaveUrl: props.journalWeekSaveUrl ?? ''
    }
  }
  return {}
})

const selectTab = (id: JournalTabId) => {
  if (activeTab.value === id) return
  log.info('Journal tab changed', { from: activeTab.value, to: id })
  notebookCreateError.value = ''
  activeTab.value = id
  applyTabToUrl(id)
}

function onSelectNavTab(tabId: string) {
  if (!JOURNAL_TAB_IDS.includes(tabId as JournalTabId)) return
  selectTab(tabId as JournalTabId)
}

function syncActiveTabFromLocation() {
  const fromUrl = parseTabFromSearch(window.location.search)
  const next = fromUrl ?? 'notebook'
  if (activeTab.value !== next) {
    notebookCreateError.value = ''
    activeTab.value = next
  }
}

const startAfterBoot = () => {
  log.info('Boot loader complete, showing journal page')
  bootLoaderDone.value = true
  scheduleHideBootLoader()
}

let unsubBootStatic: (() => void) | null = null

onMounted(() => {
  log.info('Component mounted')
  syncActiveTabFromLocation()
  window.addEventListener('popstate', syncActiveTabFromLocation)
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
  unsubBootStatic = subscribeBootStaticReady(startAfterBoot)
})

onUnmounted(() => {
  log.info('Component unmounted')
  unsubBootStatic?.()
  window.removeEventListener('popstate', syncActiveTabFromLocation)
})

const openChatiumLink = () => {
  log.notice('Opening Chatium link')
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
      :pomodoroStateGetUrl="props.pomodoroStateGetUrl"
      :pomodoroControlUrl="props.pomodoroControlUrl"
    />

    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner journal-shell">
        <JournalNav
          :tabs="tabs"
          :activeTab="activeTab"
          :showNotebookToolbar="showNotebookNavToolbar"
          :showTasksToolbar="showTasksNavToolbar"
          :isAuthenticated="props.isAuthenticated"
          :notebookCreateTitle="notebookCreateTitle"
          :notebookCreateError="notebookCreateError"
          @select-tab="onSelectNavTab"
          @create-note="onCreateNotebookNote"
          @open-all-tasks="onOpenAllTasks"
        />

        <section class="journal-panel" aria-live="polite">
          <Transition name="journal-view" mode="out-in">
            <component
              :is="currentPane"
              :key="activeTab"
              v-bind="panePropsForTab"
              @note-created="onNotebookNoteCreated"
              @note-updated="onNotebookNoteUpdated"
              @note-deleted="onNotebookNoteDeleted"
            />
          </Transition>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.journal-shell {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.75rem 1rem;
  max-width: 1200px;
  min-height: 40vh;
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

.journal-view-enter-active,
.journal-view-leave-active {
  transition:
    opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

.journal-view-enter-from {
  opacity: 0;
  transform: translateX(6px);
}

.journal-view-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

@media (max-width: 900px) {
  .journal-shell {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

<style>
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
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
</style>
