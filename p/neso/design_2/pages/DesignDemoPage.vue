<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DcDemoSidebar, DcPageHeader, type NavItem } from '../components'
import { DcAppShell, DcContent, DcMain } from '../layout'
import { getDefaultThemePresetId, getThemePresetOptions } from '../shared/themeCatalog'
import { createComponentLogger } from '../shared/logger'
import { bpmCopy, type BpmLocale } from '../shared/bpmI18n'
import {
  getBpmAutomationJobs,
  getBpmBottlenecks,
  getBpmChartBars,
  getBpmChartModes,
  getBpmDetailTimeline,
  getBpmExecutionTimeline,
  getBpmInstanceRows,
  getBpmKanbanColumns,
  getBpmMetrics,
  getBpmRules,
  THEME_LABEL_BY_ID
} from '../shared/bpmDemoData'
import type { BpmChartMode, BpmEditorMode, BpmInstanceRow } from '../shared/bpmTypes'
import DcBpmAnalyticsPanel from '../components/bpm/DcBpmAnalyticsPanel.vue'
import DcBpmBuilderStudio from '../components/bpm/DcBpmBuilderStudio.vue'
import DcBpmExecutionTimeline from '../components/bpm/DcBpmExecutionTimeline.vue'
import DcBpmHeaderControls from '../components/bpm/DcBpmHeaderControls.vue'
import DcBpmInstanceDetail from '../components/bpm/DcBpmInstanceDetail.vue'
import DcBpmKanbanBoard from '../components/bpm/DcBpmKanbanBoard.vue'
import DcBpmKnowledgeEditor from '../components/bpm/DcBpmKnowledgeEditor.vue'
import DcBpmMetricGrid from '../components/bpm/DcBpmMetricGrid.vue'
import DcBpmProcessInbox from '../components/bpm/DcBpmProcessInbox.vue'

const log = createComponentLogger('DesignDemoPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  theme: 'dark' | 'light'
  themePresetId?: string
  logoUrl?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
}>()

const locale = ref<BpmLocale>('ru')
const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const activeSection = ref('overview')
const selectedPresetId = ref(props.themePresetId ?? getDefaultThemePresetId(props.theme))
const selectedInstanceId = ref('WF-3021')
const activeTableMode = ref<'compact' | 'standard' | 'audit'>('compact')
const activeChartMode = ref<BpmChartMode['id']>('throughput')
const editorMode = ref<BpmEditorMode['id']>('split')
const markdownDraft = ref(`### Incident summary\n\n- Trigger: SLA warning > 20 min\n- Root cause: manual approval queue\n- Action: add automation fallback and owner escalation`)

const ui = computed(() => bpmCopy[locale.value])
const themePresetOptions = computed(() => getThemePresetOptions(props.theme))
const breadcrumbs = computed(() => [ui.value.home, ui.value.workspace])

const menuItems = computed<NavItem[]>(() => [
  { id: 'overview', icon: 'fa-gauge-high', label: 'Overview' },
  {
    id: 'instances',
    icon: 'fa-timeline',
    label: 'Flow Instances',
    badge: 124,
    children: [
      { id: 'process-center', label: 'Process Inbox', icon: 'fa-inbox', badge: 32 },
      { id: 'kanban', label: 'Stages Board', icon: 'fa-table-columns' },
      { id: 'timeline', label: 'Execution Timeline', icon: 'fa-stream' }
    ]
  },
  {
    id: 'builder',
    icon: 'fa-diagram-project',
    label: 'Builder Studio',
    children: [{ id: 'builder', label: 'Flow / Rules / Automation', icon: 'fa-wand-magic-sparkles' }]
  },
  {
    id: 'analytics',
    icon: 'fa-chart-line',
    label: 'Process Analytics',
    children: [
      { id: 'analytics', label: 'Dashboard', icon: 'fa-chart-area' },
      { id: 'editor', label: 'Knowledge Base', icon: 'fa-book-open' }
    ]
  }
])

const metrics = computed(() => getBpmMetrics(ui.value))
const instanceRows = computed(() => getBpmInstanceRows(locale.value))
const fallbackInstance: BpmInstanceRow = {
  id: 'WF-0000',
  process: 'No process',
  stage: 'No stage',
  status: 'No status',
  sla: '--:--',
  owner: 'Unknown',
  risk: 'neutral'
}
const selectedInstance = computed(
  () => instanceRows.value.find((row) => row.id === selectedInstanceId.value) ?? instanceRows.value[0] ?? fallbackInstance
)
const detailTimeline = computed(() => getBpmDetailTimeline(locale.value))
const kanbanColumns = computed(() => getBpmKanbanColumns(ui.value))
const executionTimeline = computed(() => getBpmExecutionTimeline(locale.value))
const builderRules = computed(() => getBpmRules(locale.value))
const automationJobs = computed(() => getBpmAutomationJobs(locale.value))
const chartModes = computed(() => getBpmChartModes(ui.value))
const chartBars = computed(() => getBpmChartBars(activeChartMode.value))
const bottlenecks = computed(() => getBpmBottlenecks())

const themeControlOptions = computed(() => {
  return themePresetOptions.value.map((preset) => ({
    id: preset.id,
    label: getThemeLabel(preset.id)
  }))
})

const tableModeOptions = computed(() => [
  { id: 'compact' as const, label: ui.value.tableCompact },
  { id: 'standard' as const, label: ui.value.tableStandard },
  { id: 'audit' as const, label: ui.value.tableAudit }
])

const editorModes = computed(() => [
  { id: 'markdown' as const, label: ui.value.modeMarkdown },
  { id: 'wysiwyg' as const, label: ui.value.modeWysiwyg },
  { id: 'split' as const, label: ui.value.modeSplit }
])

watch(
  () => props.theme,
  (nextTheme) => {
    const allowed = getThemePresetOptions(nextTheme)
    if (!allowed.some((preset) => preset.id === selectedPresetId.value)) {
      selectedPresetId.value = getDefaultThemePresetId(nextTheme)
    }
  }
)

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
  selectedPresetId.value = id
}

function onSidebarSelect(id: string) {
  activeSection.value = id
  closeSidebar()

  const section = document.getElementById(`section-${id}`)
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function getThemeLabel(id: string): string {
  const labels = THEME_LABEL_BY_ID[id as keyof typeof THEME_LABEL_BY_ID]
  if (!labels) return id
  return labels[locale.value]
}

function startAnimations() {
  log.info('Boot complete')
  bootLoaderDone.value = true
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()

  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
})
</script>

<template>
  <DcAppShell
    :theme="theme"
    :theme-preset-id="selectedPresetId"
    :ready="bootLoaderDone"
    :sidebar-collapsed="sidebarCollapsed"
    :sidebar-open="sidebarOpen"
    @close-sidebar="closeSidebar"
  >
    <template #sidebar>
      <DcDemoSidebar
        :theme="theme"
        logo-text="NeSo"
        :logo-image-url="logoUrl"
        user-name="Flow Operator"
        user-role="Workflow Admin"
        :logout-url="loginUrl"
        :items="menuItems"
        :collapsed="sidebarCollapsed"
        :mobile-open="sidebarOpen"
        :active-id="activeSection"
        @close="closeSidebar"
        @select="onSidebarSelect"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />
    </template>

    <template #header>
      <DcPageHeader :theme="theme" :title="ui.workspace" :breadcrumbs="breadcrumbs" :show-menu-toggle="true" @menu-toggle="toggleSidebarMobile">
        <template #actions>
          <DcBpmHeaderControls
            :language-label="ui.navLanguage"
            :theme-label="ui.navTheme"
            :locale="locale"
            :theme-options="themeControlOptions"
            :selected-theme-id="selectedPresetId"
            :open-index-label="ui.openLanding"
            :index-url="indexUrl"
            @change-locale="setLocale"
            @change-theme="onThemeChange"
          />
        </template>
      </DcPageHeader>
    </template>

    <DcMain>
      <DcContent>
        <div class="dc-bpm-workspace">
          <section id="section-overview">
            <DcBpmMetricGrid :metrics="metrics" />
          </section>

          <section id="section-process-center" class="dc-bpm-workspace__split">
            <DcBpmProcessInbox
              :title="ui.processCenterTitle"
              :hint="ui.processCenterHint"
              :link-label="ui.sectionOpen"
              :link-href="profileUrl"
              :filters="[ui.filterAll, ui.filterAtRisk, ui.filterBlocked, ui.filterMyZone]"
              :saved-view-label="ui.savedViews"
              :saved-views="[ui.viewOps, ui.viewTeam, ui.viewAudit]"
              :table-mode-label="ui.tableMode"
              :table-modes="tableModeOptions"
              :active-table-mode="activeTableMode"
              :columns="{
                instance: ui.colInstance,
                process: ui.colProcess,
                stage: ui.colStage,
                status: ui.colStatus,
                sla: ui.colSla,
                owner: ui.colOwner
              }"
              :rows="instanceRows"
              :selected-instance-id="selectedInstanceId"
              @select-instance="selectedInstanceId = $event"
              @change-table-mode="activeTableMode = $event"
            />

            <DcBpmInstanceDetail
              :title="ui.detailTitle"
              :hint="ui.detailHint"
              :labels="{
                instance: ui.colInstance,
                stage: ui.detailStage,
                owner: ui.detailOwner,
                escalation: ui.detailEscalation,
                rule: ui.detailRule,
                action: ui.detailAction
              }"
              :instance="selectedInstance"
              escalation-value="11m"
              rule-text="IF amount > 10k THEN assign_senior_reviewer"
              action-text="Notify finance approver + sync ledger webhook"
              :timeline="detailTimeline"
            />
          </section>

          <section id="section-kanban">
            <DcBpmKanbanBoard :title="ui.kanbanTitle" :hint="ui.kanbanHint" :columns="kanbanColumns" />
          </section>

          <section id="section-timeline" class="dc-bpm-workspace__split">
            <DcBpmExecutionTimeline :title="ui.timelineTitle" :hint="ui.timelineHint" :events="executionTimeline" />

            <div id="section-builder">
              <DcBpmBuilderStudio
                :title="ui.builderTitle"
                :hint="ui.builderHint"
                :flow-title="ui.flowMap"
                :rule-title="ui.ruleMatrix"
                :automation-title="ui.automationQueue"
                :rules="builderRules"
                :jobs="automationJobs"
              />
            </div>
          </section>

          <section id="section-analytics">
            <DcBpmAnalyticsPanel
              :title="ui.analyticsTitle"
              :hint="ui.analyticsHint"
              :chart-mode-label="ui.chartMode"
              :chart-modes="chartModes"
              :active-mode="activeChartMode"
              :bars="chartBars"
              bottleneck-title="Bottleneck matrix"
              bottleneck-hint="Top constraints by stage and responsibility zone."
              :bottlenecks="bottlenecks"
              @change-mode="activeChartMode = $event"
            />
          </section>

          <section id="section-editor">
            <DcBpmKnowledgeEditor
              :title="ui.editorTitle"
              :hint="ui.editorHint"
              :link-label="ui.sectionDocs"
              :link-href="indexUrl"
              :modes="editorModes"
              :active-mode="editorMode"
              :markdown-value="markdownDraft"
              @change-mode="editorMode = $event"
              @update-markdown="markdownDraft = $event"
            />
          </section>
        </div>
      </DcContent>
    </DcMain>
  </DcAppShell>
</template>

<style scoped>
.dc-bpm-workspace {
  display: grid;
  gap: 12px;
}

.dc-bpm-workspace__split {
  display: grid;
  grid-template-columns: minmax(0, 1.62fr) minmax(0, 1fr);
  gap: 10px;
}

@media (max-width: 980px) {
  .dc-bpm-workspace__split {
    grid-template-columns: 1fr;
  }
}
</style>
