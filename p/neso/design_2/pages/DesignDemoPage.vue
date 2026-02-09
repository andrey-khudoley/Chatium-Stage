<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createComponentLogger } from '../shared/logger'
import { DcDemoSidebar, DcPageHeader, type NavItem } from '../components'
import { DcAppShell, DcContent, DcMain } from '../layout'
import { getDefaultThemePresetId, getThemePresetOptions } from '../shared/themeCatalog'

const log = createComponentLogger('DesignDemoPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = withDefaults(
  defineProps<{
    theme: 'dark' | 'light'
    themePresetId?: string
    pageTitle: string
    breadcrumbs?: string[]
    logoUrl?: string
    indexUrl: string
    profileUrl: string
    loginUrl: string
    isAuthenticated: boolean
    isAdmin?: boolean
    adminUrl?: string
  }>(),
  {
    breadcrumbs: () => ['Main', 'Workspace']
  }
)

const locale = ref<'ru' | 'en'>('ru')
const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const activeSection = ref('overview')
const selectedPresetId = ref(props.themePresetId ?? getDefaultThemePresetId(props.theme))
const selectedInstanceId = ref('WF-3021')
const activeTableMode = ref<'compact' | 'standard' | 'audit'>('compact')
const activeChartMode = ref<'throughput' | 'sla' | 'bottlenecks'>('throughput')
const editorMode = ref<'markdown' | 'wysiwyg' | 'split'>('split')
const markdownDraft = ref(`### Incident summary\n\n- Trigger: SLA warning > 20 min\n- Root cause: manual approval queue\n- Action: add automation fallback and owner escalation`)

const copy = {
  ru: {
    home: 'Главная',
    workspace: 'BPM рабочее пространство',
    navTheme: 'Тема',
    navLanguage: 'Язык',
    openCatalog: 'Каталог',
    openLanding: 'Индекс',
    metrics: {
      active: 'Активные процессы',
      slaRisk: 'Риски SLA',
      autoCoverage: 'Автоматизация',
      bottleneck: 'Узкие места',
      cycle: 'Средний цикл'
    },
    processCenterTitle: 'Process inbox и flow instances',
    processCenterHint: 'Фильтры, сохранённые представления, статус, этап, SLA и ответственные.',
    filterAll: 'Все',
    filterAtRisk: 'Риск SLA',
    filterBlocked: 'Заблокировано',
    filterMyZone: 'Моя зона',
    viewOps: 'Ops priority',
    viewTeam: 'Team lead',
    viewAudit: 'Audit trail',
    tableCompact: 'Compact',
    tableStandard: 'Standard',
    tableAudit: 'Audit',
    colInstance: 'Инстанс',
    colProcess: 'Процесс',
    colStage: 'Этап',
    colStatus: 'Статус',
    colSla: 'SLA',
    colOwner: 'Owner',
    detailTitle: 'Детальная панель инстанса',
    detailHint: 'Контекст выполнения, ответственность, ближайшие шаги.',
    detailStage: 'Текущий этап',
    detailOwner: 'Ответственный',
    detailRule: 'Активное правило',
    detailAction: 'Следующее действие',
    detailEscalation: 'Эскалация через',
    kanbanTitle: 'Pipeline stages (Kanban)',
    kanbanHint: 'Карточки процесса двигаются по этапам исполнения.',
    stageBacklog: 'Backlog',
    stageActive: 'Execution',
    stageReview: 'Validation',
    stageDone: 'Done',
    timelineTitle: 'Execution timeline',
    timelineHint: 'События процесса, отклонения, эскалации и подтверждения.',
    builderTitle: 'Flow / Rules / Automation builder',
    builderHint: 'Визуальная сборка маршрута и правил без потери контекста выполнения.',
    analyticsTitle: 'Process analytics dashboard',
    analyticsHint: 'Режимы графиков и показатели производительности процессов.',
    chartThroughput: 'Throughput',
    chartSla: 'SLA pressure',
    chartBottlenecks: 'Bottlenecks',
    editorTitle: 'Knowledge editor (Markdown + WYSIWYG)',
    editorHint: 'Документация шага процесса и операционные заметки.',
    modeMarkdown: 'Markdown',
    modeWysiwyg: 'WYSIWYG',
    modeSplit: 'Split',
    flowMap: 'Flow map',
    ruleMatrix: 'Rules matrix',
    automationQueue: 'Automation queue',
    chartMode: 'Режим графика',
    tableMode: 'Режим таблицы',
    savedViews: 'Сохранённые view',
    sectionOpen: 'Открыть',
    sectionDocs: 'Документация'
  },
  en: {
    home: 'Home',
    workspace: 'BPM workspace',
    navTheme: 'Theme',
    navLanguage: 'Language',
    openCatalog: 'Catalog',
    openLanding: 'Index',
    metrics: {
      active: 'Active processes',
      slaRisk: 'SLA risks',
      autoCoverage: 'Automation',
      bottleneck: 'Bottlenecks',
      cycle: 'Avg cycle'
    },
    processCenterTitle: 'Process inbox and flow instances',
    processCenterHint: 'Filters, saved views, status, stage, SLA and ownership.',
    filterAll: 'All',
    filterAtRisk: 'SLA risk',
    filterBlocked: 'Blocked',
    filterMyZone: 'My zone',
    viewOps: 'Ops priority',
    viewTeam: 'Team lead',
    viewAudit: 'Audit trail',
    tableCompact: 'Compact',
    tableStandard: 'Standard',
    tableAudit: 'Audit',
    colInstance: 'Instance',
    colProcess: 'Process',
    colStage: 'Stage',
    colStatus: 'Status',
    colSla: 'SLA',
    colOwner: 'Owner',
    detailTitle: 'Instance detail panel',
    detailHint: 'Execution context, ownership and next actions.',
    detailStage: 'Current stage',
    detailOwner: 'Owner',
    detailRule: 'Active rule',
    detailAction: 'Next action',
    detailEscalation: 'Escalation in',
    kanbanTitle: 'Pipeline stages (Kanban)',
    kanbanHint: 'Process cards moving through execution stages.',
    stageBacklog: 'Backlog',
    stageActive: 'Execution',
    stageReview: 'Validation',
    stageDone: 'Done',
    timelineTitle: 'Execution timeline',
    timelineHint: 'Process events, deviations, escalations and confirmations.',
    builderTitle: 'Flow / Rules / Automation builder',
    builderHint: 'Visual route composition with live rule context.',
    analyticsTitle: 'Process analytics dashboard',
    analyticsHint: 'Chart modes and performance metrics for process control.',
    chartThroughput: 'Throughput',
    chartSla: 'SLA pressure',
    chartBottlenecks: 'Bottlenecks',
    editorTitle: 'Knowledge editor (Markdown + WYSIWYG)',
    editorHint: 'Step documentation and operational notes.',
    modeMarkdown: 'Markdown',
    modeWysiwyg: 'WYSIWYG',
    modeSplit: 'Split',
    flowMap: 'Flow map',
    ruleMatrix: 'Rules matrix',
    automationQueue: 'Automation queue',
    chartMode: 'Chart mode',
    tableMode: 'Table mode',
    savedViews: 'Saved views',
    sectionOpen: 'Open',
    sectionDocs: 'Docs'
  }
} as const

const ui = computed(() => copy[locale.value])

const themeNameById = {
  'forest-night': { ru: 'Ночной лес', en: 'Night Forest' },
  'midnight-pine': { ru: 'Полночная сосна', en: 'Midnight Pine' },
  'sunrise-leaf': { ru: 'Солнечное утро', en: 'Sunrise Leaf' },
  'misty-daybreak': { ru: 'Туманное утро', en: 'Misty Daybreak' }
} as const

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
    children: [
      { id: 'builder', label: 'Flow / Rules / Automation', icon: 'fa-wand-magic-sparkles' }
    ]
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

const metrics = computed(() => [
  { id: 'active', label: ui.value.metrics.active, value: '124', delta: '+12', tone: 'info' },
  { id: 'sla', label: ui.value.metrics.slaRisk, value: '7', delta: '-3', tone: 'danger' },
  { id: 'automation', label: ui.value.metrics.autoCoverage, value: '68%', delta: '+6%', tone: 'success' },
  { id: 'bottlenecks', label: ui.value.metrics.bottleneck, value: '3', delta: '-1', tone: 'warning' },
  { id: 'cycle', label: ui.value.metrics.cycle, value: '2h 18m', delta: '-14m', tone: 'success' }
])

const instanceRows = computed(() => [
  {
    id: 'WF-3021',
    process: 'Order-to-Cash',
    stage: locale.value === 'ru' ? 'Подтверждение оплаты' : 'Payment validation',
    status: locale.value === 'ru' ? 'В работе' : 'In progress',
    sla: '00:42',
    owner: 'N. Smirnova',
    risk: 'warning'
  },
  {
    id: 'WF-3014',
    process: 'Incident Response',
    stage: locale.value === 'ru' ? 'Анализ первопричины' : 'Root cause review',
    status: locale.value === 'ru' ? 'Риск SLA' : 'SLA risk',
    sla: '00:11',
    owner: 'D. Johnson',
    risk: 'danger'
  },
  {
    id: 'WF-2978',
    process: 'Vendor Onboarding',
    stage: locale.value === 'ru' ? 'Проверка комплаенса' : 'Compliance check',
    status: locale.value === 'ru' ? 'На проверке' : 'In review',
    sla: '02:36',
    owner: 'A. Petrova',
    risk: 'info'
  },
  {
    id: 'WF-2962',
    process: 'Refund Approval',
    stage: locale.value === 'ru' ? 'Финальное подтверждение' : 'Final approval',
    status: locale.value === 'ru' ? 'Завершается' : 'Closing',
    sla: '03:12',
    owner: 'M. White',
    risk: 'success'
  },
  {
    id: 'WF-2920',
    process: 'Access Governance',
    stage: locale.value === 'ru' ? 'Назначение роли' : 'Role assignment',
    status: locale.value === 'ru' ? 'Ожидает' : 'Waiting',
    sla: '05:40',
    owner: 'S. Volkov',
    risk: 'neutral'
  }
])

const selectedInstance = computed(() => {
  return instanceRows.value.find((row) => row.id === selectedInstanceId.value) ?? instanceRows.value[0]
})

const detailTimeline = computed(() => [
  {
    time: '09:12',
    label: locale.value === 'ru' ? 'Инстанс перешёл в этап проверки платежа' : 'Instance moved to payment validation stage'
  },
  {
    time: '09:24',
    label: locale.value === 'ru' ? 'Сработало правило AMOUNT > 10k, назначен supervisor' : 'Rule AMOUNT > 10k fired, supervisor assigned'
  },
  {
    time: '09:38',
    label: locale.value === 'ru' ? 'Отправлена автоматическая задача на риск-проверку' : 'Automated risk check task dispatched'
  },
  {
    time: '09:49',
    label: locale.value === 'ru' ? 'Ожидание подтверждения фин. контролем' : 'Awaiting finance control confirmation'
  }
])

const kanbanColumns = computed(() => [
  {
    id: 'backlog',
    title: ui.value.stageBacklog,
    tone: 'backlog',
    cards: [
      { id: 'WF-3058', title: 'Contract Renewal', owner: 'E. Miller', sla: '04:12' },
      { id: 'WF-3052', title: 'Support Escalation', owner: 'I. Kim', sla: '03:26' }
    ]
  },
  {
    id: 'active',
    title: ui.value.stageActive,
    tone: 'active',
    cards: [
      { id: 'WF-3021', title: 'Order-to-Cash', owner: 'N. Smirnova', sla: '00:42' },
      { id: 'WF-3014', title: 'Incident Response', owner: 'D. Johnson', sla: '00:11' },
      { id: 'WF-2988', title: 'KYC Check', owner: 'A. Petrov', sla: '01:20' }
    ]
  },
  {
    id: 'review',
    title: ui.value.stageReview,
    tone: 'review',
    cards: [
      { id: 'WF-2978', title: 'Vendor Onboarding', owner: 'A. Petrova', sla: '02:36' },
      { id: 'WF-2969', title: 'Access Approval', owner: 'S. Hall', sla: '01:58' }
    ]
  },
  {
    id: 'done',
    title: ui.value.stageDone,
    tone: 'done',
    cards: [
      { id: 'WF-2962', title: 'Refund Approval', owner: 'M. White', sla: '03:12' },
      { id: 'WF-2951', title: 'Quality Re-check', owner: 'L. Novak', sla: '02:44' }
    ]
  }
])

const executionTimeline = computed(() => [
  {
    time: '10:03',
    type: 'info',
    text: locale.value === 'ru' ? 'Flow WF-3014: сработал маршрут эскалации в L2' : 'Flow WF-3014: escalation route to L2 triggered'
  },
  {
    time: '09:51',
    type: 'warning',
    text: locale.value === 'ru' ? 'WF-3021 приближается к порогу SLA (11 минут)' : 'WF-3021 approaching SLA threshold (11 min)'
  },
  {
    time: '09:37',
    type: 'success',
    text: locale.value === 'ru' ? 'WF-2962 завершён и отправлен в archive lane' : 'WF-2962 completed and moved to archive lane'
  },
  {
    time: '09:20',
    type: 'danger',
    text: locale.value === 'ru' ? 'WF-2988 отклонён правилом Compliance Rule #17' : 'WF-2988 rejected by Compliance Rule #17'
  }
])

const builderRules = computed(() => [
  {
    name: 'AMOUNT > 10000',
    action: locale.value === 'ru' ? 'Назначить Senior Reviewer' : 'Assign Senior Reviewer',
    state: 'active'
  },
  {
    name: 'COUNTRY in [IR, KP]',
    action: locale.value === 'ru' ? 'Блокировать и уведомить Compliance' : 'Block and notify Compliance',
    state: 'critical'
  },
  {
    name: 'CLIENT_SEGMENT = VIP',
    action: locale.value === 'ru' ? 'Сократить SLA до 20 минут' : 'Reduce SLA to 20 minutes',
    state: 'active'
  }
])

const automationQueue = computed(() => [
  {
    id: 'AUTO-778',
    title: locale.value === 'ru' ? 'Уведомление owner в Slack' : 'Owner notification to Slack',
    state: 'running'
  },
  {
    id: 'AUTO-774',
    title: locale.value === 'ru' ? 'Создать задачу в Jira' : 'Create Jira issue',
    state: 'queued'
  },
  {
    id: 'AUTO-769',
    title: locale.value === 'ru' ? 'Проверка документа KYC' : 'KYC document validation',
    state: 'done'
  }
])

const chartBars = computed(() => {
  if (activeChartMode.value === 'sla') {
    return [
      { label: 'L1', value: 78 },
      { label: 'L2', value: 56 },
      { label: 'L3', value: 34 },
      { label: 'VIP', value: 88 }
    ]
  }

  if (activeChartMode.value === 'bottlenecks') {
    return [
      { label: 'Approval', value: 82 },
      { label: 'Compliance', value: 64 },
      { label: 'Docs', value: 47 },
      { label: 'Sync', value: 39 }
    ]
  }

  return [
    { label: 'Mon', value: 44 },
    { label: 'Tue', value: 53 },
    { label: 'Wed', value: 67 },
    { label: 'Thu', value: 71 },
    { label: 'Fri', value: 59 },
    { label: 'Sat', value: 48 },
    { label: 'Sun', value: 42 }
  ]
})

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

function setLocale(next: 'ru' | 'en') {
  locale.value = next
}

function selectPreset(id: string) {
  selectedPresetId.value = id
}

function onSidebarSelect(id: string) {
  activeSection.value = id
  closeSidebar()

  if (typeof document === 'undefined') return
  const section = document.getElementById(`section-${id}`)
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function presetLabel(id: string): string {
  const localized = themeNameById[id as keyof typeof themeNameById]
  if (localized) return localized[locale.value]
  return id
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
          <div class="dc-header-chip-group">
            <span class="dc-header-chip-label">{{ ui.navLanguage }}</span>
            <button type="button" class="dc-header-chip" :class="{ active: locale === 'ru' }" @click="setLocale('ru')">RU</button>
            <button type="button" class="dc-header-chip" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
          </div>

          <div class="dc-header-chip-group">
            <span class="dc-header-chip-label">{{ ui.navTheme }}</span>
            <button
              v-for="preset in themePresetOptions"
              :key="preset.id"
              type="button"
              class="dc-header-chip"
              :class="{ active: preset.id === selectedPresetId }"
              @click="selectPreset(preset.id)"
            >
              {{ presetLabel(preset.id) }}
            </button>
          </div>

          <a :href="indexUrl" class="dc-header-link">
            <i class="fas fa-compass"></i>
            {{ ui.openLanding }}
          </a>
        </template>
      </DcPageHeader>
    </template>

    <DcMain>
      <DcContent>
        <div class="bpm-workspace" :class="`table-mode-${activeTableMode}`">
          <section id="section-overview" class="metric-grid">
            <article v-for="item in metrics" :key="item.id" class="metric-card" :class="`tone-${item.tone}`">
              <p class="metric-label">{{ item.label }}</p>
              <div class="metric-value-row">
                <strong class="metric-value">{{ item.value }}</strong>
                <span class="metric-delta">{{ item.delta }}</span>
              </div>
            </article>
          </section>

          <section id="section-process-center" class="panel panel--split panel--process-center">
            <article class="panel-box">
              <header class="panel-header">
                <div>
                  <h2 class="panel-title">{{ ui.processCenterTitle }}</h2>
                  <p class="panel-hint">{{ ui.processCenterHint }}</p>
                </div>
                <a class="panel-link" :href="profileUrl">{{ ui.sectionOpen }}</a>
              </header>

              <div class="panel-toolbar">
                <button type="button" class="pill active">{{ ui.filterAll }}</button>
                <button type="button" class="pill">{{ ui.filterAtRisk }}</button>
                <button type="button" class="pill">{{ ui.filterBlocked }}</button>
                <button type="button" class="pill">{{ ui.filterMyZone }}</button>
              </div>

              <div class="panel-toolbar panel-toolbar--secondary">
                <span class="panel-toolbar-label">{{ ui.savedViews }}</span>
                <button type="button" class="pill">{{ ui.viewOps }}</button>
                <button type="button" class="pill">{{ ui.viewTeam }}</button>
                <button type="button" class="pill">{{ ui.viewAudit }}</button>

                <span class="panel-toolbar-label panel-toolbar-label--spaced">{{ ui.tableMode }}</span>
                <button
                  type="button"
                  class="pill"
                  :class="{ active: activeTableMode === 'compact' }"
                  @click="activeTableMode = 'compact'"
                >
                  {{ ui.tableCompact }}
                </button>
                <button
                  type="button"
                  class="pill"
                  :class="{ active: activeTableMode === 'standard' }"
                  @click="activeTableMode = 'standard'"
                >
                  {{ ui.tableStandard }}
                </button>
                <button
                  type="button"
                  class="pill"
                  :class="{ active: activeTableMode === 'audit' }"
                  @click="activeTableMode = 'audit'"
                >
                  {{ ui.tableAudit }}
                </button>
              </div>

              <div class="instance-table-wrap">
                <table class="instance-table">
                  <thead>
                    <tr>
                      <th>{{ ui.colInstance }}</th>
                      <th>{{ ui.colProcess }}</th>
                      <th>{{ ui.colStage }}</th>
                      <th>{{ ui.colStatus }}</th>
                      <th>{{ ui.colSla }}</th>
                      <th>{{ ui.colOwner }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in instanceRows"
                      :key="row.id"
                      :class="{ selected: selectedInstanceId === row.id }"
                      @click="selectedInstanceId = row.id"
                    >
                      <td><span class="mono">{{ row.id }}</span></td>
                      <td>{{ row.process }}</td>
                      <td>{{ row.stage }}</td>
                      <td>
                        <span class="status-chip" :class="`status-${row.risk}`">{{ row.status }}</span>
                      </td>
                      <td><span class="mono">{{ row.sla }}</span></td>
                      <td>{{ row.owner }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <aside class="panel-box panel-box--detail">
              <header class="panel-header">
                <div>
                  <h2 class="panel-title">{{ ui.detailTitle }}</h2>
                  <p class="panel-hint">{{ ui.detailHint }}</p>
                </div>
              </header>

              <div class="detail-grid" v-if="selectedInstance">
                <article class="detail-item">
                  <p class="detail-label">{{ ui.colInstance }}</p>
                  <p class="detail-value mono">{{ selectedInstance.id }}</p>
                </article>
                <article class="detail-item">
                  <p class="detail-label">{{ ui.detailStage }}</p>
                  <p class="detail-value">{{ selectedInstance.stage }}</p>
                </article>
                <article class="detail-item">
                  <p class="detail-label">{{ ui.detailOwner }}</p>
                  <p class="detail-value">{{ selectedInstance.owner }}</p>
                </article>
                <article class="detail-item">
                  <p class="detail-label">{{ ui.detailEscalation }}</p>
                  <p class="detail-value mono">11m</p>
                </article>
              </div>

              <div class="detail-note">
                <p class="detail-label">{{ ui.detailRule }}</p>
                <p class="detail-value mono">IF amount > 10k THEN assign_senior_reviewer</p>
              </div>

              <div class="detail-note">
                <p class="detail-label">{{ ui.detailAction }}</p>
                <p class="detail-value">Notify finance approver + sync ledger webhook</p>
              </div>

              <ul class="detail-timeline">
                <li v-for="item in detailTimeline" :key="`${item.time}-${item.label}`">
                  <span class="mono">{{ item.time }}</span>
                  <span>{{ item.label }}</span>
                </li>
              </ul>
            </aside>
          </section>

          <section id="section-kanban" class="panel">
            <header class="panel-header">
              <div>
                <h2 class="panel-title">{{ ui.kanbanTitle }}</h2>
                <p class="panel-hint">{{ ui.kanbanHint }}</p>
              </div>
            </header>

            <div class="kanban-board">
              <article v-for="column in kanbanColumns" :key="column.id" class="kanban-column" :class="`tone-${column.tone}`">
                <header class="kanban-column-head">
                  <h3>{{ column.title }}</h3>
                  <span>{{ column.cards.length }}</span>
                </header>

                <div class="kanban-cards">
                  <article v-for="card in column.cards" :key="card.id" class="kanban-card">
                    <p class="kanban-card-id mono">{{ card.id }}</p>
                    <h4>{{ card.title }}</h4>
                    <p>{{ card.owner }}</p>
                    <span class="kanban-sla mono">SLA {{ card.sla }}</span>
                  </article>
                </div>
              </article>
            </div>
          </section>

          <section id="section-timeline" class="panel panel--split panel--timeline">
            <article class="panel-box">
              <header class="panel-header">
                <div>
                  <h2 class="panel-title">{{ ui.timelineTitle }}</h2>
                  <p class="panel-hint">{{ ui.timelineHint }}</p>
                </div>
              </header>

              <ul class="execution-timeline">
                <li v-for="event in executionTimeline" :key="`${event.time}-${event.text}`" :class="`type-${event.type}`">
                  <span class="execution-time mono">{{ event.time }}</span>
                  <span class="execution-text">{{ event.text }}</span>
                </li>
              </ul>
            </article>

            <article id="section-builder" class="panel-box">
              <header class="panel-header">
                <div>
                  <h2 class="panel-title">{{ ui.builderTitle }}</h2>
                  <p class="panel-hint">{{ ui.builderHint }}</p>
                </div>
              </header>

              <div class="builder-layout">
                <div class="builder-block">
                  <p class="builder-title">{{ ui.flowMap }}</p>
                  <div class="flow-map">
                    <div class="flow-node">Trigger</div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-node">Rules Gate</div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-node">Task Queue</div>
                    <div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>
                    <div class="flow-node">Closure</div>
                  </div>
                </div>

                <div class="builder-block">
                  <p class="builder-title">{{ ui.ruleMatrix }}</p>
                  <ul class="rule-list">
                    <li v-for="rule in builderRules" :key="rule.name" :class="`state-${rule.state}`">
                      <span class="mono">{{ rule.name }}</span>
                      <span>{{ rule.action }}</span>
                    </li>
                  </ul>
                </div>

                <div class="builder-block">
                  <p class="builder-title">{{ ui.automationQueue }}</p>
                  <ul class="automation-list">
                    <li v-for="item in automationQueue" :key="item.id" :class="`state-${item.state}`">
                      <span class="mono">{{ item.id }}</span>
                      <span>{{ item.title }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </article>
          </section>

          <section id="section-analytics" class="panel panel--split panel--analytics">
            <article class="panel-box">
              <header class="panel-header">
                <div>
                  <h2 class="panel-title">{{ ui.analyticsTitle }}</h2>
                  <p class="panel-hint">{{ ui.analyticsHint }}</p>
                </div>
              </header>

              <div class="panel-toolbar panel-toolbar--secondary">
                <span class="panel-toolbar-label">{{ ui.chartMode }}</span>
                <button
                  type="button"
                  class="pill"
                  :class="{ active: activeChartMode === 'throughput' }"
                  @click="activeChartMode = 'throughput'"
                >
                  {{ ui.chartThroughput }}
                </button>
                <button
                  type="button"
                  class="pill"
                  :class="{ active: activeChartMode === 'sla' }"
                  @click="activeChartMode = 'sla'"
                >
                  {{ ui.chartSla }}
                </button>
                <button
                  type="button"
                  class="pill"
                  :class="{ active: activeChartMode === 'bottlenecks' }"
                  @click="activeChartMode = 'bottlenecks'"
                >
                  {{ ui.chartBottlenecks }}
                </button>
              </div>

              <div class="chart-grid">
                <article v-for="bar in chartBars" :key="bar.label" class="chart-item">
                  <div class="chart-bar-track">
                    <span class="chart-bar-fill" :style="{ height: `${bar.value}%` }"></span>
                  </div>
                  <p class="chart-label">{{ bar.label }}</p>
                </article>
              </div>
            </article>

            <article class="panel-box">
              <header class="panel-header">
                <div>
                  <h2 class="panel-title">Bottleneck matrix</h2>
                  <p class="panel-hint">Top constraints by stage and responsibility zone.</p>
                </div>
              </header>

              <div class="bottleneck-table">
                <div class="bottleneck-row">
                  <span>Approval queue</span>
                  <span class="mono">18m avg wait</span>
                  <span class="status-chip status-warning">Watch</span>
                </div>
                <div class="bottleneck-row">
                  <span>Compliance checks</span>
                  <span class="mono">24m avg wait</span>
                  <span class="status-chip status-danger">Critical</span>
                </div>
                <div class="bottleneck-row">
                  <span>Integration retries</span>
                  <span class="mono">7 incidents</span>
                  <span class="status-chip status-info">Monitor</span>
                </div>
                <div class="bottleneck-row">
                  <span>Manual reassignment</span>
                  <span class="mono">11 handoffs</span>
                  <span class="status-chip status-warning">Watch</span>
                </div>
              </div>
            </article>
          </section>

          <section id="section-editor" class="panel">
            <header class="panel-header">
              <div>
                <h2 class="panel-title">{{ ui.editorTitle }}</h2>
                <p class="panel-hint">{{ ui.editorHint }}</p>
              </div>
              <a class="panel-link" :href="indexUrl">{{ ui.sectionDocs }}</a>
            </header>

            <div class="panel-toolbar panel-toolbar--secondary">
              <button type="button" class="pill" :class="{ active: editorMode === 'markdown' }" @click="editorMode = 'markdown'">
                {{ ui.modeMarkdown }}
              </button>
              <button type="button" class="pill" :class="{ active: editorMode === 'wysiwyg' }" @click="editorMode = 'wysiwyg'">
                {{ ui.modeWysiwyg }}
              </button>
              <button type="button" class="pill" :class="{ active: editorMode === 'split' }" @click="editorMode = 'split'">
                {{ ui.modeSplit }}
              </button>
            </div>

            <div class="editor-layout" :class="`mode-${editorMode}`">
              <textarea
                v-if="editorMode !== 'wysiwyg'"
                v-model="markdownDraft"
                class="editor-markdown"
                spellcheck="false"
              ></textarea>

              <div
                v-if="editorMode !== 'markdown'"
                class="editor-wysiwyg"
                contenteditable="true"
              >
                <h3>Workflow playbook</h3>
                <p>Owner confirms SLA impact and acknowledges escalation path.</p>
                <ul>
                  <li>Notify role: <strong>Finance Approver</strong></li>
                  <li>Fallback route: <strong>Manual review queue</strong></li>
                  <li>Auto action: <strong>Push to incident channel</strong></li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </DcContent>
    </DcMain>
  </DcAppShell>
</template>

<style scoped>
.bpm-workspace {
  display: grid;
  gap: 12px;
  margin: 0 auto;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  padding: 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-2) 72%, transparent);
  box-shadow: var(--shadow-xs);
}

.metric-label {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.metric-value-row {
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.metric-value {
  font-size: 1.12rem;
  letter-spacing: 0.02em;
}

.metric-delta {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.metric-card.tone-success .metric-delta {
  color: var(--status-success);
}

.metric-card.tone-danger .metric-delta {
  color: var(--status-danger);
}

.metric-card.tone-warning .metric-delta {
  color: var(--status-warning);
}

.metric-card.tone-info .metric-delta {
  color: var(--status-info);
}

.panel {
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-1) 80%, transparent);
  box-shadow: var(--shadow-sm);
}

.panel--split {
  display: grid;
  grid-template-columns: minmax(0, 1.62fr) minmax(0, 1fr);
  gap: 10px;
}

.panel-box {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-2) 72%, transparent);
  padding: 9px;
  box-shadow: var(--shadow-xs);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.panel-title {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.panel-hint {
  margin: 3px 0 0;
  font-size: 0.74rem;
  color: var(--text-secondary);
}

.panel-link {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.72rem;
  white-space: nowrap;
}

.panel-link:hover {
  border-color: var(--border-accent);
  color: var(--text-primary);
}

.panel-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.panel-toolbar--secondary {
  padding: 6px;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 76%, transparent);
}

.panel-toolbar-label {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  text-transform: uppercase;
  padding-right: 4px;
}

.panel-toolbar-label--spaced {
  margin-left: auto;
}

.pill {
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 80%, transparent);
  color: var(--text-secondary);
  font-size: 0.68rem;
  letter-spacing: 0.02em;
}

.pill.active {
  color: var(--text-primary);
  border-color: var(--border-accent);
  background: color-mix(in srgb, var(--accent-soft) 78%, transparent);
  box-shadow: var(--focus-ring);
}

.instance-table-wrap {
  overflow: auto;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
}

.instance-table {
  width: 100%;
  border-collapse: collapse;
}

.instance-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  text-align: left;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px;
  background: color-mix(in srgb, var(--surface-3) 84%, transparent);
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-soft);
}

.instance-table tbody td {
  padding: 0 8px;
  height: var(--table-row-height, 34px);
  border-bottom: 1px solid color-mix(in srgb, var(--border-soft) 78%, transparent);
  font-size: 0.74rem;
}

.instance-table tbody tr {
  cursor: pointer;
}

.instance-table tbody tr:hover {
  background: color-mix(in srgb, var(--accent-soft) 44%, transparent);
}

.instance-table tbody tr.selected {
  background: color-mix(in srgb, var(--accent-soft) 76%, transparent);
}

.table-mode-compact {
  --table-row-height: 32px;
}

.table-mode-standard {
  --table-row-height: 38px;
}

.table-mode-audit {
  --table-row-height: 44px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  border: 1px solid transparent;
}

.status-warning {
  color: var(--status-warning);
  border-color: color-mix(in srgb, var(--status-warning) 56%, transparent);
  background: color-mix(in srgb, var(--status-warning) 20%, transparent);
}

.status-danger {
  color: var(--status-danger);
  border-color: color-mix(in srgb, var(--status-danger) 56%, transparent);
  background: color-mix(in srgb, var(--status-danger) 20%, transparent);
}

.status-success {
  color: var(--status-success);
  border-color: color-mix(in srgb, var(--status-success) 56%, transparent);
  background: color-mix(in srgb, var(--status-success) 20%, transparent);
}

.status-info {
  color: var(--status-info);
  border-color: color-mix(in srgb, var(--status-info) 56%, transparent);
  background: color-mix(in srgb, var(--status-info) 20%, transparent);
}

.status-neutral {
  color: var(--text-secondary);
  border-color: var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 84%, transparent);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.detail-item,
.detail-note {
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 76%, transparent);
}

.detail-note {
  margin-bottom: 8px;
}

.detail-label {
  margin: 0;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.detail-value {
  margin: 4px 0 0;
  font-size: 0.76rem;
  color: var(--text-primary);
}

.detail-timeline {
  margin: 0;
  padding: 8px;
  list-style: none;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  display: grid;
  gap: 6px;
}

.detail-timeline li {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 6px;
  font-size: 0.72rem;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.kanban-column {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  padding: 8px;
  background: color-mix(in srgb, var(--surface-2) 76%, transparent);
}

.kanban-column.tone-backlog {
  background: linear-gradient(180deg, var(--kanban-backlog), color-mix(in srgb, var(--surface-2) 88%, transparent));
}

.kanban-column.tone-active {
  background: linear-gradient(180deg, var(--kanban-active), color-mix(in srgb, var(--surface-2) 88%, transparent));
}

.kanban-column.tone-review {
  background: linear-gradient(180deg, var(--kanban-review), color-mix(in srgb, var(--surface-2) 88%, transparent));
}

.kanban-column.tone-done {
  background: linear-gradient(180deg, var(--kanban-done), color-mix(in srgb, var(--surface-2) 88%, transparent));
}

.kanban-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.kanban-column-head h3 {
  margin: 0;
  font-size: 0.78rem;
}

.kanban-column-head span {
  font-size: 0.68rem;
  color: var(--text-tertiary);
}

.kanban-cards {
  display: grid;
  gap: 6px;
}

.kanban-card {
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 78%, transparent);
}

.kanban-card-id {
  margin: 0 0 3px;
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

.kanban-card h4 {
  margin: 0;
  font-size: 0.76rem;
}

.kanban-card p {
  margin: 3px 0 5px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.kanban-sla {
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

.execution-timeline {
  margin: 0;
  padding: 6px 0 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.execution-timeline li {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 78%, transparent);
  position: relative;
}

.execution-timeline li::before {
  content: '';
  position: absolute;
  left: 65px;
  top: -8px;
  bottom: -8px;
  width: 1px;
  background: var(--timeline-line);
  opacity: 0.6;
  pointer-events: none;
}

.execution-timeline li:first-child::before {
  top: 14px;
}

.execution-timeline li:last-child::before {
  bottom: 14px;
}

.execution-time {
  color: var(--text-tertiary);
  font-size: 0.68rem;
}

.execution-text {
  font-size: 0.74rem;
}

.execution-timeline li.type-warning {
  border-color: color-mix(in srgb, var(--status-warning) 42%, var(--border-soft));
}

.execution-timeline li.type-danger {
  border-color: color-mix(in srgb, var(--status-danger) 42%, var(--border-soft));
}

.execution-timeline li.type-success {
  border-color: color-mix(in srgb, var(--status-success) 42%, var(--border-soft));
}

.builder-layout {
  display: grid;
  gap: 8px;
}

.builder-block {
  padding: 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 78%, transparent);
}

.builder-title {
  margin: 0 0 8px;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.flow-map {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  align-items: center;
}

.flow-node {
  min-height: 34px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--accent-soft) 62%, transparent);
  display: grid;
  place-items: center;
  font-size: 0.66rem;
  text-align: center;
  padding: 4px;
}

.flow-arrow {
  display: grid;
  place-items: center;
  color: var(--text-tertiary);
  font-size: 0.66rem;
}

.rule-list,
.automation-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 5px;
}

.rule-list li,
.automation-list li {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xs);
  padding: 6px 7px;
  display: grid;
  gap: 2px;
  font-size: 0.7rem;
  background: color-mix(in srgb, var(--surface-2) 76%, transparent);
}

.rule-list li.state-critical,
.automation-list li.state-running {
  border-color: color-mix(in srgb, var(--status-warning) 44%, var(--border-soft));
}

.automation-list li.state-done {
  border-color: color-mix(in srgb, var(--status-success) 44%, var(--border-soft));
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  align-items: end;
  min-height: 170px;
  padding: 8px;
}

.chart-item {
  display: grid;
  gap: 6px;
  justify-items: center;
}

.chart-bar-track {
  width: 100%;
  height: 130px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 74%, transparent);
  display: flex;
  align-items: flex-end;
  padding: 4px;
}

.chart-bar-fill {
  width: 100%;
  border-radius: calc(var(--radius-sm) - 2px);
  background: linear-gradient(180deg, var(--chart-2), var(--chart-1));
  box-shadow: var(--glow-accent);
}

.chart-label {
  margin: 0;
  font-size: 0.68rem;
  color: var(--text-secondary);
}

.bottleneck-table {
  display: grid;
  gap: 6px;
}

.bottleneck-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  font-size: 0.72rem;
  background: color-mix(in srgb, var(--surface-3) 78%, transparent);
}

.editor-layout {
  display: grid;
  gap: 8px;
}

.editor-layout.mode-split {
  grid-template-columns: 1fr 1fr;
}

.editor-markdown,
.editor-wysiwyg {
  min-height: 220px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 82%, transparent);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 10px;
}

.editor-markdown {
  resize: vertical;
}

.editor-wysiwyg {
  font-family: var(--font-sans);
  font-size: 0.76rem;
  overflow: auto;
}

.editor-wysiwyg h3 {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 0.96rem;
}

.editor-wysiwyg p {
  margin: 0 0 8px;
}

.editor-wysiwyg ul {
  margin: 0;
  padding-left: 18px;
}

.dc-header-chip-group {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  background: color-mix(in srgb, var(--surface-3) 82%, transparent);
}

.dc-header-chip-label {
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding-left: 4px;
  padding-right: 2px;
}

.dc-header-chip {
  height: 24px;
  border-radius: var(--radius-xs);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.68rem;
  padding: 0 8px;
}

.dc-header-chip.active {
  border-color: var(--border-accent);
  color: var(--text-primary);
  background: color-mix(in srgb, var(--accent-soft) 76%, transparent);
}

.dc-header-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.7rem;
}

.dc-header-link:hover {
  color: var(--text-primary);
  border-color: var(--border-accent);
}

.mono {
  font-family: var(--font-mono);
}

@media (max-width: 1400px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .kanban-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .metric-grid,
  .kanban-board,
  .panel--split,
  .editor-layout.mode-split,
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .panel-toolbar-label--spaced {
    margin-left: 0;
  }

  .flow-map {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .flow-arrow {
    transform: rotate(90deg);
  }

  .bottleneck-row {
    grid-template-columns: 1fr;
    justify-items: start;
  }
}
</style>
