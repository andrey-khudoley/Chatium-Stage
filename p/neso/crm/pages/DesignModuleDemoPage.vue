<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import CrmStatCard from '../components/base/CrmStatCard.vue'
import CrmBadge from '../components/base/CrmBadge.vue'
import CrmMiniChart from '../components/data-display/CrmMiniChart.vue'
import CrmSmartTable from '../components/data-display/CrmSmartTable.vue'
import CrmNoteEditor from '../components/editors/CrmNoteEditor.vue'
import CrmStateView from '../components/feedback/CrmStateView.vue'
import { createComponentLogger } from '../shared/logger'
import { useUiI18n } from '../shared/design/i18n'

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

interface DemoModule {
  slug: string
  title: string
  group: string
  description: string
}

interface NeighborLink {
  title: string
  url: string
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  testsUrl?: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  initialLocale?: string
  module: DemoModule
  catalogUrl: string
  previous?: NeighborLink
  next?: NeighborLink
}>()

const log = createComponentLogger('DesignModuleDemoPage')
const { t } = useUiI18n(props.initialLocale || 'ru')

const bootLoaderDone = ref(false)
const noteText = ref(
  `# ${props.module.title}\n\n- Demo flow started\n- Layout tokens applied\n- Module-specific cards ready`
)

const seed = computed(() => props.module.slug.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))

const kpiItems = computed(() => [
  {
    label: `${props.module.title} velocity`,
    value: (seed.value % 160) + 24,
    icon: 'fas fa-gauge-high',
    status: 'info' as const
  },
  {
    label: 'Open items',
    value: (seed.value % 48) + 8,
    icon: 'fas fa-layer-group',
    status: 'warning' as const
  },
  {
    label: 'On track',
    value: (seed.value % 64) + 18,
    icon: 'fas fa-circle-check',
    status: 'success' as const
  },
  {
    label: 'Risks',
    value: (seed.value % 12) + 2,
    icon: 'fas fa-triangle-exclamation',
    status: 'danger' as const
  }
])

const chartData = computed(() => [
  { label: 'Mon', value: (seed.value % 70) + 18 },
  { label: 'Tue', value: (seed.value % 75) + 20 },
  { label: 'Wed', value: (seed.value % 66) + 16 },
  { label: 'Thu', value: (seed.value % 80) + 24 },
  { label: 'Fri', value: (seed.value % 74) + 19 },
  { label: 'Sat', value: (seed.value % 62) + 14 },
  { label: 'Sun', value: (seed.value % 77) + 22 }
])

const tableColumns = computed(() => [
  { key: 'name', label: 'Entity' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: t('common.status') },
  { key: 'updatedAt', label: t('common.lastUpdated') }
])

const tableRows = computed(() => [
  {
    id: `${props.module.slug}-1`,
    name: `${props.module.title} board`,
    owner: 'Design Ops',
    status: t('status.active'),
    updatedAt: '09:18'
  },
  {
    id: `${props.module.slug}-2`,
    name: `${props.module.title} backlog`,
    owner: 'Product Team',
    status: t('status.pending'),
    updatedAt: '08:44'
  },
  {
    id: `${props.module.slug}-3`,
    name: `${props.module.title} automation`,
    owner: 'Engineering',
    status: t('status.blocked'),
    updatedAt: '08:03'
  },
  {
    id: `${props.module.slug}-4`,
    name: `${props.module.title} report`,
    owner: 'Analytics',
    status: t('status.done'),
    updatedAt: '07:31'
  }
])

const tableLabels = computed(() => ({
  tableMode: t('common.tableMode'),
  compact: t('common.compact'),
  comfortable: t('common.comfortable'),
  columns: t('table.columns'),
  saveView: t('common.save'),
  savedView: t('table.savedView'),
  defaultView: t('common.view'),
  deleteView: t('common.clear'),
  cardMode: t('table.cardMode'),
  empty: t('common.empty')
}))

const stateMode = ref<'empty' | 'loading' | 'error' | 'filled'>('filled')

const stateTitle = computed(() => {
  if (stateMode.value === 'empty') return `${props.module.title} Empty State`
  if (stateMode.value === 'loading') return `${props.module.title} Loading State`
  if (stateMode.value === 'error') return `${props.module.title} Error State`
  return `${props.module.title} Filled State`
})

const stateDescription = computed(() => {
  if (stateMode.value === 'empty') return 'No records yet. Start by creating the first entity for this module.'
  if (stateMode.value === 'loading') return 'Data is syncing. Skeleton placeholders preserve structure and density.'
  if (stateMode.value === 'error') return 'Data source is temporarily unavailable. Retry and diagnostics actions are visible.'
  return 'Operational mode with full controls, filters, and secondary panel composition.'
})

function startAnimations(): void {
  bootLoaderDone.value = true
}

onMounted(() => {
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }

  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }

  log.info('Design module demo mounted', props.module.slug)
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
  log.info('Design module demo unmounted', props.module.slug)
})

function openChatiumLink(): void {
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}
</script>

<template>
  <div class="app-layout crm-app">
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
      :initialLocale="props.initialLocale"
    />

    <main class="content-wrapper">
      <div class="crm-page crm-reveal">
        <section class="crm-surface-raised crm-card">
          <div class="crm-row module-demo-meta">
            <CrmBadge variant="info" icon="fas fa-layer-group">{{ props.module.group }}</CrmBadge>
            <CrmBadge variant="success" icon="fas fa-route">/{{ props.module.slug }}</CrmBadge>
          </div>

          <h1 class="module-demo-title">{{ props.module.title }} · Demo</h1>
          <p>{{ props.module.description }}</p>

          <div class="crm-row">
            <a :href="props.catalogUrl" class="crm-btn crm-btn-ghost">
              <i class="fas fa-arrow-left"></i>
              Back to catalog
            </a>
            <a v-if="props.previous" :href="props.previous.url" class="crm-btn crm-btn-ghost">
              <i class="fas fa-chevron-left"></i>
              {{ props.previous.title }}
            </a>
            <a v-if="props.next" :href="props.next.url" class="crm-btn crm-btn-primary">
              {{ props.next.title }}
              <i class="fas fa-chevron-right"></i>
            </a>
          </div>
        </section>

        <section class="crm-grid crm-grid-4">
          <CrmStatCard
            v-for="item in kpiItems"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :icon="item.icon"
            :status="item.status"
          />
        </section>

        <CrmMiniChart
          :title="`${props.module.title} trend`"
          subtitle="Demo performance signal for layout testing"
          :data="chartData"
          :labels="{
            showLegend: t('common.show') + ' ' + t('common.legend').toLowerCase(),
            hideLegend: t('common.hide') + ' ' + t('common.legend').toLowerCase(),
            showValues: t('common.show') + ' ' + t('common.values').toLowerCase(),
            hideValues: t('common.hide') + ' ' + t('common.values').toLowerCase(),
            modeBars: t('chart.modeBars'),
            modeLine: t('chart.modeLine')
          }"
        />

        <CrmSmartTable
          :title="`${props.module.title} entities`"
          subtitle="Demo list with columns, saved views, and card mode"
          :rows="tableRows"
          :columns="tableColumns"
          :storage-key="`crm-design-demo-table-${props.module.slug}`"
          :labels="tableLabels"
        />

        <CrmNoteEditor
          v-model="noteText"
          :title="`${props.module.title} notes`"
          subtitle="Markdown + WYSIWYG demonstration"
          :markdown-label="t('editor.modeMarkdown')"
          :wysiwyg-label="t('editor.modeVisual')"
          :placeholder="t('editor.placeholder')"
        />

        <section class="crm-surface crm-card">
          <header class="crm-card-title">
            <h2>State Preview</h2>
          </header>
          <div class="crm-row">
            <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" :class="{ 'module-state-active': stateMode === 'empty' }" @click="stateMode = 'empty'">empty</button>
            <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" :class="{ 'module-state-active': stateMode === 'loading' }" @click="stateMode = 'loading'">loading</button>
            <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" :class="{ 'module-state-active': stateMode === 'error' }" @click="stateMode = 'error'">error</button>
            <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" :class="{ 'module-state-active': stateMode === 'filled' }" @click="stateMode = 'filled'">filled</button>
          </div>
          <CrmStateView :state="stateMode" :title="stateTitle" :description="stateDescription">
            <template #actions>
              <button type="button" class="crm-btn crm-btn-primary crm-btn-sm">{{ t('common.retry') }}</button>
              <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm">Open logs</button>
            </template>
          </CrmStateView>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  min-height: 0;
}

.module-demo-title {
  font-size: clamp(1.24rem, 2.2vw, 1.9rem);
}

.module-demo-meta {
  margin-bottom: 0.2rem;
}

.module-state-active {
  border-color: color-mix(in srgb, var(--crm-accent) 75%, transparent) !important;
  background: color-mix(in srgb, var(--crm-accentSoft) 36%, transparent) !important;
  color: var(--crm-text) !important;
}
</style>
