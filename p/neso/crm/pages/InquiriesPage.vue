<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import CrmStatCard from '../components/base/CrmStatCard.vue'
import CrmMiniChart from '../components/data-display/CrmMiniChart.vue'
import CrmSmartTable from '../components/data-display/CrmSmartTable.vue'
import CrmStateView from '../components/feedback/CrmStateView.vue'
import CrmSection from '../components/layout/CrmSection.vue'
import CrmShell from '../components/layout/CrmShell.vue'
import CrmSidebarNav from '../components/layout/CrmSidebarNav.vue'
import type { CrmSidebarItem } from '../components/layout/CrmSidebarNav.vue'
import type { CrmTableColumn } from '../components/data-display/CrmSmartTable.vue'
import { createComponentLogger } from '../shared/logger'
import { useUiI18n } from '../shared/design/i18n'

const log = createComponentLogger('InquiriesPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl?: string
  inquiriesUrl?: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  initialLocale?: string
}>()

const { t } = useUiI18n(props.initialLocale || 'ru')
const bootLoaderDone = ref(false)

const sidebarItems = computed<CrmSidebarItem[]>(() => {
  const items: CrmSidebarItem[] = [
    {
      href: props.indexUrl,
      label: t('header.home'),
      icon: 'fas fa-house',
      active: !props.inquiriesUrl
    },
    {
      href: props.inquiriesUrl || '#',
      label: 'Inquiries',
      icon: 'fas fa-inbox',
      active: !!props.inquiriesUrl
    }
  ]

  if (props.testsUrl) {
    items.push({ href: props.testsUrl, label: t('header.tests'), icon: 'fas fa-flask' })
  }

  if (props.isAdmin && props.adminUrl) {
    items.push({ href: props.adminUrl, label: t('header.admin'), icon: 'fas fa-shield-halved' })
  }

  return items
})

const metrics = computed(() => [
  { label: 'Open inquiries', value: 128, icon: 'fas fa-inbox', status: 'warning' as const },
  { label: 'SLA on time', value: '93%', icon: 'fas fa-stopwatch', status: 'success' as const },
  { label: 'Escalations', value: 11, icon: 'fas fa-triangle-exclamation', status: 'danger' as const },
  { label: 'Resolved today', value: 54, icon: 'fas fa-check-circle', status: 'info' as const }
])

const chartData = computed(() => [
  { label: 'Mon', value: 66 },
  { label: 'Tue', value: 71 },
  { label: 'Wed', value: 58 },
  { label: 'Thu', value: 79 },
  { label: 'Fri', value: 84 },
  { label: 'Sat', value: 52 },
  { label: 'Sun', value: 47 }
])

const tableColumns = computed<CrmTableColumn[]>(() => [
  { key: 'ticket', label: 'Ticket' },
  { key: 'owner', label: t('header.profile') },
  { key: 'status', label: t('common.status') },
  { key: 'updatedAt', label: t('common.lastUpdated') }
])

const tableRows = computed(() => [
  { id: 'inq-1', ticket: 'INC-4528', owner: 'Ops', status: t('status.active'), updatedAt: '09:42' },
  { id: 'inq-2', ticket: 'INC-4522', owner: 'Sales', status: t('status.pending'), updatedAt: '09:17' },
  { id: 'inq-3', ticket: 'INC-4511', owner: 'Support', status: t('status.blocked'), updatedAt: '08:51' },
  { id: 'inq-4', ticket: 'INC-4507', owner: 'QA', status: t('status.done'), updatedAt: '08:13' }
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
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }

  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }

  log.info('Inquiries page mounted')
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
  log.info('Inquiries page unmounted')
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
      <CrmShell>
        <template #brand>
          <span class="crm-shell-brand-title">Inquiries</span>
        </template>

        <template #sidebar>
          <CrmSidebarNav :items="sidebarItems" />
        </template>

        <template #header>
          <div class="crm-row">
            <h1 class="inquiries-title">{{ t('home.previewOpsTitle') }}</h1>
          </div>
        </template>

        <CrmSection :title="t('home.previewOpsTitle')" :subtitle="t('home.previewOpsDesc')" class="crm-reveal">
          <div class="crm-grid crm-grid-4">
            <CrmStatCard
              v-for="metric in metrics"
              :key="metric.label"
              :label="metric.label"
              :value="metric.value"
              :icon="metric.icon"
              :status="metric.status"
            />
          </div>
        </CrmSection>

        <CrmMiniChart
          :title="t('chart.title')"
          subtitle="Inquiry load by weekday"
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
          title="Inquiry Queue"
          subtitle="Current operational queue with saved views"
          :rows="tableRows"
          :columns="tableColumns"
          storage-key="crm-inquiries-table"
          :labels="tableLabels"
        />

        <CrmStateView
          state="filled"
          title="Ops Summary"
          description="This page uses the current reusable CRM design system components."
        />
      </CrmShell>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  min-height: 0;
}

.inquiries-title {
  margin: 0;
  font-size: 1.08rem;
}
</style>
