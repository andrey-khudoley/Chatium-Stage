<script setup lang="ts">
import { computed, ref } from 'vue'
import { DcThemeGlobalStyles } from '../components'
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
  getBpmRules
} from '../shared/bpmDemoData'
import DcBpmAnalyticsPanel from '../components/bpm/DcBpmAnalyticsPanel.vue'
import DcBpmBuilderStudio from '../components/bpm/DcBpmBuilderStudio.vue'
import DcBpmExecutionTimeline from '../components/bpm/DcBpmExecutionTimeline.vue'
import DcBpmInstanceDetail from '../components/bpm/DcBpmInstanceDetail.vue'
import DcBpmKanbanBoard from '../components/bpm/DcBpmKanbanBoard.vue'
import DcBpmKnowledgeEditor from '../components/bpm/DcBpmKnowledgeEditor.vue'
import DcBpmMetricGrid from '../components/bpm/DcBpmMetricGrid.vue'
import DcBpmProcessInbox from '../components/bpm/DcBpmProcessInbox.vue'
import type { BpmInstanceRow } from '../shared/bpmTypes'

const props = defineProps<{
  theme: 'dark' | 'light'
  themePresetId: string
  indexUrl: string
  pageUrl: string
}>()

const locale = ref<BpmLocale>('ru')
const activeTableMode = ref<'compact' | 'standard' | 'audit'>('compact')
const activeChartMode = ref<'throughput' | 'sla' | 'bottlenecks'>('throughput')
const editorMode = ref<'markdown' | 'wysiwyg' | 'split'>('split')
const markdownDraft = ref('### BPM notes\n\n- Add escalation fallback\n- Sync retries with SLA tracking')

const ui = computed(() => bpmCopy[locale.value])
const metrics = computed(() => getBpmMetrics(ui.value))
const rows = computed(() => getBpmInstanceRows(locale.value))
const fallbackRow: BpmInstanceRow = {
  id: 'WF-0000',
  process: 'No process',
  stage: 'No stage',
  status: 'No status',
  sla: '--:--',
  owner: 'Unknown',
  risk: 'neutral'
}
const selectedRow = computed(() => rows.value[0] ?? fallbackRow)
const timeline = computed(() => getBpmExecutionTimeline(locale.value))
const detailTimeline = computed(() => getBpmDetailTimeline(locale.value))
const kanban = computed(() => getBpmKanbanColumns(ui.value))
const rules = computed(() => getBpmRules(locale.value))
const jobs = computed(() => getBpmAutomationJobs(locale.value))
const chartModes = computed(() => getBpmChartModes(ui.value))
const bars = computed(() => getBpmChartBars(activeChartMode.value))
const bottlenecks = computed(() => getBpmBottlenecks())
</script>

<template>
  <DcThemeGlobalStyles :theme="theme" :theme-preset-id="themePresetId" />

  <div class="dc-components-page" :class="`theme-${theme}`">
    <header class="dc-components-page__header">
      <nav class="dc-components-page__nav">
        <a :href="indexUrl">Index</a>
        <a :href="pageUrl">Workspace</a>
      </nav>
      <h1>BPM Components Catalog</h1>
      <p>Reusable sections extracted from the BPM workspace. Copy any component as an isolated block.</p>
      <div class="dc-components-page__locale">
        <button type="button" :class="{ active: locale === 'ru' }" @click="locale = 'ru'">RU</button>
        <button type="button" :class="{ active: locale === 'en' }" @click="locale = 'en'">EN</button>
      </div>
    </header>

    <main class="dc-components-page__content">
      <section class="dc-components-page__section">
        <h2>DcBpmMetricGrid</h2>
        <p class="dc-components-page__path">components/bpm/DcBpmMetricGrid.vue</p>
        <DcBpmMetricGrid :metrics="metrics" />
      </section>

      <section class="dc-components-page__section dc-components-page__split">
        <div>
          <h2>DcBpmProcessInbox</h2>
          <p class="dc-components-page__path">components/bpm/DcBpmProcessInbox.vue</p>
          <DcBpmProcessInbox
            :title="ui.processCenterTitle"
            :hint="ui.processCenterHint"
            :filters="[ui.filterAll, ui.filterAtRisk, ui.filterBlocked, ui.filterMyZone]"
            :saved-view-label="ui.savedViews"
            :saved-views="[ui.viewOps, ui.viewTeam, ui.viewAudit]"
            :table-mode-label="ui.tableMode"
            :table-modes="[
              { id: 'compact', label: ui.tableCompact },
              { id: 'standard', label: ui.tableStandard },
              { id: 'audit', label: ui.tableAudit }
            ]"
            :active-table-mode="activeTableMode"
            :columns="{
              instance: ui.colInstance,
              process: ui.colProcess,
              stage: ui.colStage,
              status: ui.colStatus,
              sla: ui.colSla,
              owner: ui.colOwner
            }"
            :rows="rows"
            :selected-instance-id="selectedRow.id"
            @change-table-mode="activeTableMode = $event"
          />
        </div>

        <div>
          <h2>DcBpmInstanceDetail</h2>
          <p class="dc-components-page__path">components/bpm/DcBpmInstanceDetail.vue</p>
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
            :instance="selectedRow"
            escalation-value="11m"
            rule-text="IF amount > 10k THEN assign_senior_reviewer"
            action-text="Notify finance approver + sync ledger webhook"
            :timeline="detailTimeline"
          />
        </div>
      </section>

      <section class="dc-components-page__section">
        <h2>DcBpmKanbanBoard</h2>
        <p class="dc-components-page__path">components/bpm/DcBpmKanbanBoard.vue</p>
        <DcBpmKanbanBoard :title="ui.kanbanTitle" :hint="ui.kanbanHint" :columns="kanban" />
      </section>

      <section class="dc-components-page__section dc-components-page__split">
        <div>
          <h2>DcBpmExecutionTimeline</h2>
          <p class="dc-components-page__path">components/bpm/DcBpmExecutionTimeline.vue</p>
          <DcBpmExecutionTimeline :title="ui.timelineTitle" :hint="ui.timelineHint" :events="timeline" />
        </div>

        <div>
          <h2>DcBpmBuilderStudio</h2>
          <p class="dc-components-page__path">components/bpm/DcBpmBuilderStudio.vue</p>
          <DcBpmBuilderStudio
            :title="ui.builderTitle"
            :hint="ui.builderHint"
            :flow-title="ui.flowMap"
            :rule-title="ui.ruleMatrix"
            :automation-title="ui.automationQueue"
            :rules="rules"
            :jobs="jobs"
          />
        </div>
      </section>

      <section class="dc-components-page__section">
        <h2>DcBpmAnalyticsPanel</h2>
        <p class="dc-components-page__path">components/bpm/DcBpmAnalyticsPanel.vue</p>
        <DcBpmAnalyticsPanel
          :title="ui.analyticsTitle"
          :hint="ui.analyticsHint"
          :chart-mode-label="ui.chartMode"
          :chart-modes="chartModes"
          :active-mode="activeChartMode"
          :bars="bars"
          bottleneck-title="Bottleneck matrix"
          bottleneck-hint="Top constraints by stage and responsibility zone."
          :bottlenecks="bottlenecks"
          @change-mode="activeChartMode = $event"
        />
      </section>

      <section class="dc-components-page__section">
        <h2>DcBpmKnowledgeEditor</h2>
        <p class="dc-components-page__path">components/bpm/DcBpmKnowledgeEditor.vue</p>
        <DcBpmKnowledgeEditor
          :title="ui.editorTitle"
          :hint="ui.editorHint"
          :modes="[
            { id: 'markdown', label: ui.modeMarkdown },
            { id: 'wysiwyg', label: ui.modeWysiwyg },
            { id: 'split', label: ui.modeSplit }
          ]"
          :active-mode="editorMode"
          :markdown-value="markdownDraft"
          @change-mode="editorMode = $event"
          @update-markdown="markdownDraft = $event"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.dc-components-page {
  min-height: 100vh;
  color: var(--text-primary);
  font-family: var(--font-sans);
  padding: 18px;
}

.dc-components-page__header {
  margin-bottom: 12px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 12px;
  background: color-mix(in srgb, var(--surface-1) 82%, transparent);
}

.dc-components-page__header h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.4rem;
}

.dc-components-page__header p {
  margin: 6px 0 0;
  font-size: 0.84rem;
  color: var(--text-secondary);
}

.dc-components-page__nav {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.dc-components-page__nav a {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  border: 1px solid var(--border-soft);
  color: var(--text-secondary);
  font-size: 0.72rem;
}

.dc-components-page__locale {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}

.dc-components-page__locale button {
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 80%, transparent);
  color: var(--text-secondary);
  font-size: 0.68rem;
}

.dc-components-page__locale button.active {
  border-color: var(--border-accent);
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent-soft) 78%, transparent);
}

.dc-components-page__content {
  display: grid;
  gap: 12px;
}

.dc-components-page__section {
  display: grid;
  gap: 6px;
}

.dc-components-page__section h2 {
  margin: 0;
  font-size: 0.92rem;
}

.dc-components-page__path {
  margin: 0;
  font-size: 0.68rem;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.dc-components-page__split {
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 980px) {
  .dc-components-page__split {
    grid-template-columns: 1fr;
  }
}
</style>
