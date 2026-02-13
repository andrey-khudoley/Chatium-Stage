<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DcBpmExecutionTimeline,
  DcBpmHeaderControls,
  DcBpmKanbanBoard,
  DcBpmMetricGrid,
  DcBpmSidebar,
  DcPageHeader,
  DcThemeGlobalStyles
} from '../components'
import { DcAppShell } from '../layout'
import { bpmCopy, type BpmLocale } from '../shared/bpmI18n'
import {
  getBpmExecutionTimeline,
  getBpmKanbanColumns,
  getBpmMetrics
} from '../shared/bpmDemoData'
import { getDefaultThemePresetId, getThemePresetById } from '../shared/themeCatalog'

interface FeaturedScenario {
  slug: string
  title: string
  description: string
  url: string
}

const props = defineProps<{
  projectTitle: string
  homeUrl: string
  loginUrl: string
  adminUrl: string
  testsUrl: string
  designUrl: string
  clientsDialogsUrl: string
  scenarioCount: number
  featuredScenarios: FeaturedScenario[]
}>()

const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const locale = ref<BpmLocale>('ru')
const selectedPresetId = ref(getDefaultThemePresetId('light'))

const currentTheme = computed(() => getThemePresetById(selectedPresetId.value)?.mode ?? 'light')
const breadcrumbs = computed(() => [ui.value.home])

const ui = computed(() => bpmCopy[locale.value])
const metrics = computed(() => getBpmMetrics(ui.value))
const kanbanColumns = computed(() => getBpmKanbanColumns(ui.value))
const timeline = computed(() => getBpmExecutionTimeline(locale.value))

/** Контекст видимости меню. В демо передаём userRole: 'admin', чтобы отображался раздел «Админка»; в проде — роль из авторизации. */
const navVisibilityContext = computed(() => ({ userRole: 'admin' }))

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebarMobile() {
  sidebarOpen.value = !sidebarOpen.value
}

function setLocale(next: BpmLocale) {
  locale.value = next
}

function onThemeChange(id: string) {
  const mode = id === 'dark' ? 'dark' : 'light'
  selectedPresetId.value = getDefaultThemePresetId(mode)
}
</script>

<template>
  <DcAppShell
    :theme="currentTheme"
    :theme-preset-id="selectedPresetId"
    :ready="true"
    :sidebar-collapsed="sidebarCollapsed"
    :sidebar-open="sidebarOpen"
    @close-sidebar="closeSidebar"
  >
    <template #sidebar>
      <DcBpmSidebar
        active-id="home"
        :home-url="homeUrl"
        :login-url="loginUrl"
        :admin-url="adminUrl"
        :tests-url="testsUrl"
        :design-url="designUrl"
        :clients-dialogs-url="clientsDialogsUrl"
        :scenario-count="scenarioCount"
        :visibility-context="navVisibilityContext"
        theme="light"
        logo-text="NeSo BPM"
        user-name="Guest"
        user-role="BPM Workspace"
        :collapsed="sidebarCollapsed"
        :mobile-open="sidebarOpen"
        @close="closeSidebar"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />
    </template>

    <template #header>
      <DcPageHeader
        :theme="currentTheme"
        :title="projectTitle"
        :breadcrumbs="breadcrumbs"
        :show-menu-toggle="true"
        @menu-toggle="toggleSidebarMobile"
      >
        <template #actions>
          <DcBpmHeaderControls
            :language-label="ui.navLanguage"
            :theme-label="ui.navTheme"
            :locale="locale"
            :theme-options="[]"
            :selected-theme-id="currentTheme"
            theme-variant="light-dark"
            :open-index-label="ui.openLanding"
            index-url="https://example.com/"
            :theme-light-aria-label="ui.themeLight"
            :theme-dark-aria-label="ui.themeDark"
            @change-locale="setLocale"
            @change-theme="onThemeChange"
          />
        </template>
      </DcPageHeader>
    </template>

  <div class="bpm-home-page">
    <header class="bpm-home-hero">
      <p class="bpm-home-hero__kicker">{{ ui.workspace }}</p>
      <h1>{{ projectTitle }}</h1>
      <p>{{ ui.heroDescription }}</p>
    </header>

    <section class="bpm-home-section">
      <DcBpmMetricGrid :metrics="metrics" />
    </section>

    <section class="bpm-home-grid">
      <DcBpmKanbanBoard
        :title="ui.kanbanTitle"
        :hint="ui.kanbanHint"
        :columns="kanbanColumns"
      />

      <DcBpmExecutionTimeline
        :title="ui.timelineTitle"
        :hint="ui.timelineHint"
        :events="timeline"
      />
    </section>

    <section class="bpm-home-section">
      <h2>{{ ui.featuredScenariosTitle }}</h2>
      <div class="bpm-home-scenarios">
        <a v-for="scenario in featuredScenarios" :key="scenario.slug" :href="scenario.url" class="bpm-home-scenario-card">
          <h3>{{ scenario.title }}</h3>
          <p>{{ scenario.description }}</p>
          <span>{{ scenario.slug }}</span>
        </a>
      </div>
    </section>
  </div>
  </DcAppShell>
</template>

<style scoped>
.bpm-home-page {
  max-width: 1340px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 14px;
  position: relative;
  z-index: 2;
}

.bpm-home-hero {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-soft);
  padding: 14px;
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-1) 86%, transparent);
}

.bpm-home-hero__kicker {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.68rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.bpm-home-hero h1 {
  margin: 6px 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.4vw, 2.2rem);
}

.bpm-home-hero p {
  margin: 8px 0 0;
  max-width: 880px;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.5;
}

.bpm-home-section {
  display: grid;
  gap: 10px;
}

.bpm-home-section h2 {
  margin: 0;
  font-size: 1rem;
}

.bpm-home-grid {
  display: grid;
  grid-template-columns: 1.34fr 1fr;
  gap: 10px;
}

.bpm-home-scenarios {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.bpm-home-scenario-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  padding: 10px;
  text-decoration: none;
  color: inherit;
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-2) 82%, transparent);
}

.bpm-home-scenario-card h3 {
  margin: 0;
  font-size: 0.83rem;
}

.bpm-home-scenario-card p {
  margin: 6px 0 0;
  font-size: 0.73rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.bpm-home-scenario-card span {
  display: inline-flex;
  margin-top: 8px;
  height: 21px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  color: var(--text-tertiary);
  font-size: 0.65rem;
  font-family: var(--font-mono);
}

@media (max-width: 1080px) {
  .bpm-home-grid,
  .bpm-home-scenarios {
    grid-template-columns: 1fr;
  }
}
</style>
