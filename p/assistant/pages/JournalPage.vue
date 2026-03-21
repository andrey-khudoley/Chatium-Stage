<script setup lang="ts">
import { computed, markRaw, onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import JournalNotebookPane from '../components/journal/JournalNotebookPane.vue'
import JournalMonthPane from '../components/journal/JournalMonthPane.vue'
import JournalWeekPane from '../components/journal/JournalWeekPane.vue'
import JournalDayPane from '../components/journal/JournalDayPane.vue'
import JournalHabitsPane from '../components/journal/JournalHabitsPane.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('JournalPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
  }
}

type JournalTabId = 'notebook' | 'month' | 'week' | 'day' | 'habits'

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl?: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
}>()

const bootLoaderDone = ref(false)

const tabComponents: Record<JournalTabId, object> = {
  notebook: markRaw(JournalNotebookPane),
  month: markRaw(JournalMonthPane),
  week: markRaw(JournalWeekPane),
  day: markRaw(JournalDayPane),
  habits: markRaw(JournalHabitsPane),
}

const tabs: { id: JournalTabId; label: string }[] = [
  { id: 'notebook', label: 'Блокнот' },
  { id: 'month', label: 'Месяц' },
  { id: 'week', label: 'Неделя' },
  { id: 'day', label: 'День' },
  { id: 'habits', label: 'Привычки' },
]

const activeTab = ref<JournalTabId>('notebook')

const currentPane = computed(() => tabComponents[activeTab.value])

const selectTab = (id: JournalTabId) => {
  if (activeTab.value === id) return
  log.info('Journal tab changed', { from: activeTab.value, to: id })
  activeTab.value = id
}

const startAfterBoot = () => {
  log.info('Boot loader complete, showing journal page')
  bootLoaderDone.value = true
}

onMounted(() => {
  log.info('Component mounted')
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
  if ((window as unknown as { bootLoaderComplete?: boolean }).bootLoaderComplete) {
    startAfterBoot()
  } else {
    window.addEventListener('bootloader-complete', startAfterBoot)
  }
})

onUnmounted(() => {
  log.info('Component unmounted')
  window.removeEventListener('bootloader-complete', startAfterBoot)
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
    />

    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner journal-shell">
        <nav class="journal-nav" aria-label="Разделы журнала">
          <ul class="journal-nav-list" role="tablist">
            <li v-for="t in tabs" :key="t.id" class="journal-nav-item">
              <button
                type="button"
                role="tab"
                class="journal-nav-btn"
                :class="{ 'journal-nav-btn--active': activeTab === t.id }"
                :aria-selected="activeTab === t.id"
                @click="selectTab(t.id)"
              >
                {{ t.label }}
              </button>
            </li>
          </ul>
        </nav>

        <section class="journal-panel" aria-live="polite">
          <Transition name="journal-view" mode="out-in">
            <component :is="currentPane" :key="activeTab" />
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

.journal-nav {
  flex: 0 0 auto;
  width: 7.25rem;
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
  transition: var(--transition);
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

@media (max-width: 640px) {
  .journal-shell {
    flex-direction: column;
    align-items: stretch;
  }

  .journal-nav {
    width: 100%;
  }

  .journal-nav-list {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 0.25rem;
    overflow-x: auto;
    padding-bottom: 0.15rem;
    -webkit-overflow-scrolling: touch;
  }

  .journal-nav-btn {
    width: auto;
    flex: 0 0 auto;
    white-space: nowrap;
    border-left-width: 1px;
    border-bottom: 2px solid transparent;
    text-align: center;
    padding: 0.3rem 0.5rem;
  }

  .journal-nav-btn--active {
    border-left-color: var(--color-border-light);
    border-bottom-color: var(--color-accent);
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
