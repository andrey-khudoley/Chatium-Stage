<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import CrmStatCard from '../components/base/CrmStatCard.vue'
import CrmMiniChart from '../components/data-display/CrmMiniChart.vue'
import CrmSmartTable from '../components/data-display/CrmSmartTable.vue'
import CrmNoteEditor from '../components/editors/CrmNoteEditor.vue'
import CrmStateView from '../components/feedback/CrmStateView.vue'
import { createComponentLogger } from '../shared/logger'
import { useUiI18n } from '../shared/design/i18n'

const log = createComponentLogger('HomePage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    triggerGlobalGlitch?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectName: string
  projectTitle: string
  projectDescription: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
  initialLocale?: string
}>()

const { t } = useUiI18n(props.initialLocale || 'ru')
const bootLoaderDone = ref(false)
const noteContent = ref('')

const metrics = computed(() => [
  { label: t('home.metrics.modules'), value: 42, icon: 'fas fa-cubes', status: 'info' as const },
  { label: t('home.metrics.themes'), value: 6, icon: 'fas fa-palette', status: 'success' as const },
  { label: t('home.metrics.fonts'), value: 21, icon: 'fas fa-font', status: 'warning' as const },
  { label: t('home.metrics.states'), value: 4, icon: 'fas fa-layer-group', status: 'danger' as const }
])

const chartData = computed(() => [
  { label: 'Leads', value: 82 },
  { label: 'Deals', value: 56 },
  { label: 'Tasks', value: 68 },
  { label: 'Tickets', value: 34 },
  { label: 'Courses', value: 49 }
])

interface HomeTableColumn {
  key: string
  label: string
}

const tableColumns = computed<HomeTableColumn[]>(() => [
  { key: 'module', label: t('header.project') },
  { key: 'owner', label: t('header.profile') },
  { key: 'status', label: t('common.status') },
  { key: 'updatedAt', label: t('common.lastUpdated') }
])

const tableRows = computed(() => [
  { id: 'row-1', module: t('module.dashboard'), owner: t('team.ops'), status: t('status.active'), updatedAt: '09:12' },
  { id: 'row-2', module: t('module.leadsDeals'), owner: t('team.sales'), status: t('status.pending'), updatedAt: '08:46' },
  { id: 'row-3', module: t('module.knowledgeBase'), owner: t('team.enablement'), status: t('status.blocked'), updatedAt: '08:21' },
  { id: 'row-4', module: t('module.testsPage'), owner: t('team.qa'), status: t('status.done'), updatedAt: '07:58' }
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

function startAnimations(): void {
  bootLoaderDone.value = true
}

onMounted(() => {
  log.info('Home page mounted')
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }

  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
  log.info('Home page unmounted')
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
      <div class="crm-page">
        <section class="crm-hero crm-reveal">
          <article class="crm-surface-raised crm-card">
            <h1 class="home-hero-title">{{ t('home.heroTitle') }}</h1>
            <p>{{ t('home.heroDescription') }}</p>
            <div class="crm-row">
              <a
                v-if="props.isAdmin && props.adminUrl"
                :href="props.adminUrl"
                class="crm-btn crm-btn-primary"
              >
                <i class="fas fa-screwdriver-wrench"></i>
                {{ t('home.heroCtaPrimary') }}
              </a>
              <a
                v-if="props.testsUrl"
                :href="props.testsUrl"
                class="crm-btn crm-btn-ghost"
              >
                <i class="fas fa-flask"></i>
                {{ t('home.heroCtaSecondary') }}
              </a>
              <a v-if="!props.isAuthenticated" :href="props.loginUrl" class="crm-btn crm-btn-ghost">
                <i class="fas fa-arrow-right-to-bracket"></i>
                {{ t('home.ctaLogin') }}
              </a>
            </div>
          </article>

          <article class="crm-surface crm-card">
            <h2>{{ t('home.previewOpsTitle') }}</h2>
            <p>{{ t('home.previewOpsDesc') }}</p>
            <div class="crm-grid crm-grid-2">
              <div class="home-mini-item crm-surface-raised">
                <h3>{{ t('home.blocks.templates') }}</h3>
                <p>{{ t('home.blocks.templatesDesc') }}</p>
              </div>
              <div class="home-mini-item crm-surface-raised">
                <h3>{{ t('home.blocks.designSystem') }}</h3>
                <p>{{ t('home.blocks.designSystemDesc') }}</p>
              </div>
              <div class="home-mini-item crm-surface-raised">
                <h3>{{ t('home.blocks.customization') }}</h3>
                <p>{{ t('home.blocks.customizationDesc') }}</p>
              </div>
              <div class="home-mini-item crm-surface-raised">
                <h3>{{ t('home.previewEditorTitle') }}</h3>
                <p>{{ t('home.previewEditorDesc') }}</p>
              </div>
            </div>
          </article>
        </section>

        <section class="crm-grid crm-grid-4">
          <CrmStatCard
            v-for="metric in metrics"
            :key="metric.label"
            :label="metric.label"
            :value="metric.value"
            :icon="metric.icon"
            :status="metric.status"
          />
        </section>

        <CrmMiniChart
          :title="t('chart.title')"
          :subtitle="t('home.chartSubtitle')"
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
          :title="t('home.previewTableTitle')"
          :subtitle="t('home.previewTableDesc')"
          :rows="tableRows"
          :columns="tableColumns"
          storage-key="crm-home-preview-table"
          :labels="tableLabels"
        />

        <CrmNoteEditor
          v-model="noteContent"
          :title="t('editor.title')"
          :subtitle="t('home.previewEditorDesc')"
          :markdown-label="t('editor.modeMarkdown')"
          :wysiwyg-label="t('editor.modeVisual')"
          :placeholder="t('editor.placeholder')"
        />

        <CrmStateView
          state="filled"
          :title="t('home.blocks.designSystem')"
          :description="t('home.blocks.designSystemDesc')"
        >
          <div class="crm-grid crm-grid-3">
            <div class="home-capability crm-surface-raised">
              <strong>{{ t('table.title') }}</strong>
              <p>{{ t('home.previewTableDesc') }}</p>
            </div>
            <div class="home-capability crm-surface-raised">
              <strong>{{ t('editor.title') }}</strong>
              <p>{{ t('home.previewEditorDesc') }}</p>
            </div>
            <div class="home-capability crm-surface-raised">
              <strong>{{ t('chart.title') }}</strong>
              <p>{{ t('home.chartSubtitle') }}</p>
            </div>
          </div>
        </CrmStateView>
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

.home-hero-title {
  font-size: clamp(1.3rem, 3.2vw, 2.1rem);
}

.home-mini-item,
.home-capability {
  border-radius: var(--crm-radius-md);
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 70%, transparent);
  padding: var(--crm-space-3);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.home-capability strong {
  color: var(--crm-text);
  font-size: 0.92rem;
}
</style>
