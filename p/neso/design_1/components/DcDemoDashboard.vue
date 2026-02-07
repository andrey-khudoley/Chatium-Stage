<script setup lang="ts">
import { ref, computed } from 'vue'
import DcBarChart from './DcBarChart.vue'
import DcButton from './DcButton.vue'
import DcCard from './DcCard.vue'
import DcChangelog from './DcChangelog.vue'
import DcHeroCard from './DcHeroCard.vue'
import DcLive from './DcLive.vue'
import DcPageTable from './DcPageTable.vue'
import DcQuickScenarios from './DcQuickScenarios.vue'
import DcStatCard from './DcStatCard.vue'
import type { BarItem } from './DcBarChart.vue'
import type { ChangelogItem } from './DcChangelog.vue'
import type { QuickItem } from './DcQuickScenarios.vue'
import type { TableColumn } from './DcPageTable.vue'
import { DcContent, DcMainGrid, DcPageSection } from '../layout'

defineProps<{
  theme?: 'dark' | 'light'
  profileUrl: string
  loginUrl: string
  indexUrl: string
  changelog: ChangelogItem[]
  tableRows: Record<string, unknown>[]
  tableColumns: TableColumn[]
  quickItems: QuickItem[]
  chartItems: BarItem[]
}>()

const activeChartTab = ref('week')
const chartTabs = computed(() => [
  { id: 'week', label: 'Неделя', active: activeChartTab.value === 'week' },
  { id: 'month', label: 'Месяц', active: activeChartTab.value === 'month' }
])
</script>

<template>
  <DcContent>
    <DcPageSection variant="hero">
      <DcHeroCard
        :theme="theme"
        title="Добрый день"
        desc="За сегодня обработано 12 обращений. 3 требуют ответа в течение часа."
      >
        <template #actions>
          <DcButton :theme="theme" variant="primary" :href="profileUrl">Перейти к обращениям</DcButton>
          <DcButton :theme="theme" variant="ghost" :href="loginUrl">Выйти</DcButton>
        </template>
      </DcHeroCard>
    </DcPageSection>

    <DcPageSection variant="stats">
      <DcStatCard :theme="theme" icon="fa-inbox" :value="12" label="Сегодня" />
      <DcStatCard :theme="theme" icon="fa-spinner" :value="5" label="В работе" />
      <DcStatCard :theme="theme" icon="fa-bell" :value="3" label="Новых" />
      <DcStatCard :theme="theme" icon="fa-check" :value="4" label="Закрыто" />
    </DcPageSection>

    <DcMainGrid>
      <DcCard :theme="theme" title="БЫСТРЫЕ СЦЕНАРИИ">
        <DcQuickScenarios :theme="theme" :items="quickItems" />
      </DcCard>

      <DcCard :theme="theme" title="ЖУРНАЛ ИЗМЕНЕНИЙ">
        <template #header-extra>
          <DcLive :theme="theme" badge-only />
        </template>
        <DcChangelog :theme="theme" :items="changelog" />
      </DcCard>

      <DcCard :theme="theme" title="ОБРАЩЕНИЯ ЗА НЕДЕЛЮ" class="dc-main-grid-full">
        <DcBarChart
          :theme="theme"
          :items="chartItems"
          :tabs="chartTabs"
          @tab-change="activeChartTab = $event"
        />
      </DcCard>
    </DcMainGrid>

    <DcPageTable
      :theme="theme"
      title="ПОСЛЕДНИЕ ОБРАЩЕНИЯ"
      :columns="tableColumns"
      :rows="tableRows"
    />
  </DcContent>
</template>
