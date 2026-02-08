<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { createComponentLogger } from '../shared/logger'
import {
  DcActivityFeed,
  DcCard,
  DcChecklistBoard,
  DcDataGrid,
  DcDemoSidebar,
  DcDonutBreakdown,
  DcFunnelChart,
  DcHeaderActions,
  DcKanbanBoard,
  DcLineTrendChart,
  DcMetricTiles,
  DcPageHeader,
  type ActivityFeedItem,
  type ChecklistTaskItem,
  type DataGridColumn,
  type DataGridRow,
  type DonutBreakdownItem,
  type FunnelStep,
  type KanbanColumn,
  type LineTrendPoint,
  type MetricTileItem,
  type NavItem
} from '../components'
import { DcAppShell, DcMain } from '../layout'

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
}>()

const theme = 'dark' as const
const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const activeSection = ref('inquiries')

const navIdToUrl = computed<Record<string, string>>(() => ({
  dashboard: props.indexUrl,
  inquiries: props.inquiriesUrl ?? '',
  profile: props.profileUrl,
  admin: props.adminUrl ?? '',
  tests: props.testsUrl ?? '',
  login: props.loginUrl
}))

const menuItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная' },
    { id: 'inquiries', icon: 'fa-layer-group', label: 'Компоненты' },
    { id: 'profile', icon: 'fa-user', label: 'Профиль' },
    { id: 'admin', icon: 'fa-gear', label: 'Админка' },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты' },
    { id: 'login', icon: 'fa-right-to-bracket', label: 'Логин' }
  ]
  return items.filter((item) => navIdToUrl.value[item.id])
})

const metrics: MetricTileItem[] = [
  {
    id: 'mrr',
    label: 'MRR',
    value: '₽ 3.4M',
    delta: '+12.8%',
    trend: 'up',
    target: '₽ 3.8M',
    progress: 89,
    icon: 'fa-ruble-sign'
  },
  {
    id: 'churn',
    label: 'Отток',
    value: '2.1%',
    delta: '-0.6 п.п.',
    trend: 'up',
    target: '< 3%',
    progress: 70,
    icon: 'fa-user-minus'
  },
  {
    id: 'sla',
    label: 'SLA 15m',
    value: '93%',
    delta: '-2%',
    trend: 'down',
    target: '95%',
    progress: 93,
    icon: 'fa-stopwatch'
  },
  {
    id: 'nps',
    label: 'NPS',
    value: 48,
    delta: '+3',
    trend: 'up',
    target: '50+',
    progress: 96,
    icon: 'fa-face-smile'
  }
]

const trendPoints: LineTrendPoint[] = [
  { label: 'Пн', value: 148 },
  { label: 'Вт', value: 172 },
  { label: 'Ср', value: 166 },
  { label: 'Чт', value: 194 },
  { label: 'Пт', value: 210 },
  { label: 'Сб', value: 154 },
  { label: 'Вс', value: 138 }
]

const breakdownItems: DonutBreakdownItem[] = [
  { id: 'whatsapp', label: 'WhatsApp', value: 358, color: '#77d7bf' },
  { id: 'telegram', label: 'Telegram', value: 412, color: '#85a8ff' },
  { id: 'email', label: 'Email', value: 176, color: '#f2bd5d' },
  { id: 'phone', label: 'Телефон', value: 94, color: '#afc45f' }
]

const funnelSteps: FunnelStep[] = [
  { id: 'lead', label: 'Лид', count: 1260, note: 'Все входящие лиды' },
  { id: 'qualified', label: 'Квалифицирован', count: 742, note: 'Проверка ICP' },
  { id: 'proposal', label: 'Коммерческое', count: 418, note: 'Отправлены условия' },
  { id: 'contract', label: 'Контракт', count: 186, note: 'Подписано NDA/договор' },
  { id: 'won', label: 'Won', count: 96, note: 'Оплаченные сделки' }
]

const kanbanColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'Backlog',
    wipLimit: 10,
    cards: [
      {
        id: 'k-1',
        title: 'Сегментация VIP клиентов',
        subtitle: 'Добавить сегмент в фильтры и отчёты',
        assignee: 'Ольга К.',
        sla: 'до 12:00',
        priority: 'medium',
        labels: [
          { text: 'Product', tone: 'accent' },
          { text: 'CRM', tone: 'neutral' }
        ]
      },
      {
        id: 'k-2',
        title: 'Шаблон ответа для повторных возвратов',
        subtitle: 'Согласовать с поддержкой',
        assignee: 'Дмитрий П.',
        sla: 'до 17:00',
        priority: 'low',
        labels: [{ text: 'Support', tone: 'success' }]
      }
    ]
  },
  {
    id: 'progress',
    title: 'In Progress',
    wipLimit: 8,
    cards: [
      {
        id: 'k-3',
        title: 'Автоназначение менеджера по источнику',
        subtitle: 'Правила роутинга заявок',
        assignee: 'Никита А.',
        sla: '1д 04ч',
        priority: 'high',
        labels: [
          { text: 'Automation', tone: 'warning' },
          { text: 'Risk', tone: 'danger' }
        ]
      },
      {
        id: 'k-4',
        title: 'A/B тест карточки сделки',
        subtitle: 'Сравнить CTR кнопки “Созвон”',
        assignee: 'Марина Л.',
        sla: '19ч',
        priority: 'medium',
        labels: [{ text: 'Experiment', tone: 'accent' }]
      }
    ]
  },
  {
    id: 'review',
    title: 'Review',
    wipLimit: 5,
    cards: [
      {
        id: 'k-5',
        title: 'Пайплайн лидов для B2B',
        subtitle: 'Финальная валидация этапов',
        assignee: 'Илья Т.',
        sla: '4ч',
        priority: 'high',
        labels: [
          { text: 'SalesOps', tone: 'accent' },
          { text: 'Approval', tone: 'warning' }
        ]
      }
    ]
  }
]

const dataGridColumns: DataGridColumn[] = [
  { key: 'name', header: 'Сделка', sortable: true },
  { key: 'owner', header: 'Менеджер', sortable: true },
  { key: 'status', header: 'Статус', format: 'status', sortable: true },
  { key: 'probability', header: 'Вероятность', format: 'percent', align: 'right', sortable: true },
  { key: 'amount', header: 'Сумма', format: 'currency', align: 'right', sortable: true }
]

const dataGridRows: DataGridRow[] = [
  { id: 'r1', name: 'NeSo x ORBITA', owner: 'Андрей', status: 'В работе', probability: 76, amount: 1450000 },
  { id: 'r2', name: 'Integra Support', owner: 'Валерия', status: 'Новый', probability: 42, amount: 640000 },
  { id: 'r3', name: 'GEO Partners', owner: 'Сергей', status: 'Risk', probability: 18, amount: 2350000 },
  { id: 'r4', name: 'Kronos Call', owner: 'Полина', status: 'Закрыт', probability: 100, amount: 920000 }
]

const activityItems: ActivityFeedItem[] = [
  {
    id: 'a1',
    title: 'Интеграция телефонии синхронизирована',
    details: 'Загружено 356 пропущенных вызовов за последние 24 часа.',
    actor: 'Сервисный бот',
    time: '2 мин назад',
    icon: 'fa-phone-volume',
    level: 'success'
  },
  {
    id: 'a2',
    title: 'SLA на этапе review превышен',
    details: '4 сделки находятся в review дольше 48 часов.',
    actor: 'Мониторинг SLA',
    time: '14 мин назад',
    icon: 'fa-triangle-exclamation',
    level: 'warning'
  },
  {
    id: 'a3',
    title: 'Переоценка вероятности сделки',
    details: 'Сделка GEO Partners обновлена: 31% -> 18%.',
    actor: 'Илья Т.',
    time: '31 мин назад',
    icon: 'fa-chart-line',
    level: 'info'
  },
  {
    id: 'a4',
    title: 'Ошибка webhooks delivery',
    details: 'Не отправлено 12 событий в внешний BI endpoint.',
    actor: 'Webhook Queue',
    time: '52 мин назад',
    icon: 'fa-plug-circle-xmark',
    level: 'error'
  }
]

const checklistItems: ChecklistTaskItem[] = [
  {
    id: 'c1',
    title: 'Проверить SLA-алерты в рабочем времени',
    done: true,
    owner: 'QA Team',
    due: 'сегодня',
    priority: 'medium'
  },
  {
    id: 'c2',
    title: 'Обновить матрицу ролей в CRM',
    done: false,
    owner: 'Security',
    due: 'завтра',
    priority: 'high'
  },
  {
    id: 'c3',
    title: 'Собрать weekly dashboard для sales',
    done: false,
    owner: 'Analytics',
    due: 'пт, 18:00',
    priority: 'medium'
  },
  {
    id: 'c4',
    title: 'Закрыть deprecated поля в карточке клиента',
    done: true,
    owner: 'Frontend',
    due: 'выполнено',
    priority: 'low'
  }
]

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebarMobile() {
  sidebarOpen.value = !sidebarOpen.value
}

function onSidebarSelect(id: string) {
  const url = navIdToUrl.value[id]
  if (url) window.location.href = url
}

function startAnimations() {
  bootLoaderDone.value = true
  log.info('Component library visible')
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()

  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
})
</script>

<template>
  <DcAppShell
    :theme="theme"
    :ready="bootLoaderDone"
    :sidebar-collapsed="sidebarCollapsed"
    :sidebar-open="sidebarOpen"
    @close-sidebar="closeSidebar"
  >
    <template #sidebar>
      <DcDemoSidebar
        :theme="theme"
        logo-text="NeSo CRM"
        :user-name="props.isAuthenticated ? 'Пользователь' : 'Гость'"
        :user-role="props.isAuthenticated ? (props.isAdmin ? 'Admin' : 'User') : 'Guest'"
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
      <DcPageHeader
        :theme="theme"
        :title="projectTitle"
        :breadcrumbs="['Главная', 'Библиотека компонентов']"
        :show-menu-toggle="true"
        @menu-toggle="toggleSidebarMobile"
      >
        <template #actions>
          <DcHeaderActions :theme="theme" :index-url="indexUrl" :notification-count="7" />
        </template>
      </DcPageHeader>
    </template>

    <DcMain>
      <section class="components-library">
        <header class="components-library-intro">
          <h2>CRM UI Kit vNext</h2>
          <p>
            Дополнительные компоненты для CRM-сценариев: аналитика, воронка, канбан, расширенные
            таблицы и operational-виджеты.
          </p>
        </header>

        <section class="components-block">
          <h3 class="components-block-title">Счётчики и KPI</h3>
          <DcMetricTiles :theme="theme" :items="metrics" />
        </section>

        <section class="components-block">
          <h3 class="components-block-title">Графики</h3>
          <div class="components-grid analytics-grid">
            <DcCard :theme="theme" title="Динамика входящих обращений">
              <DcLineTrendChart :theme="theme" :points="trendPoints" value-suffix="" />
            </DcCard>

            <DcCard :theme="theme" title="Распределение каналов коммуникации">
              <DcDonutBreakdown :theme="theme" :items="breakdownItems" center-label="Обращений" />
            </DcCard>

            <DcCard :theme="theme" title="Воронка продаж">
              <DcFunnelChart :theme="theme" :steps="funnelSteps" />
            </DcCard>
          </div>
        </section>

        <section class="components-block">
          <h3 class="components-block-title">Kanban</h3>
          <DcKanbanBoard :theme="theme" :columns="kanbanColumns" />
        </section>

        <section class="components-block">
          <h3 class="components-block-title">Таблицы и списки</h3>
          <div class="components-grid data-grid">
            <DcCard :theme="theme" title="Pipeline Table Pro" class="span-2">
              <DcDataGrid :theme="theme" :columns="dataGridColumns" :rows="dataGridRows" />
            </DcCard>

            <DcCard :theme="theme" title="Activity Feed">
              <DcActivityFeed :theme="theme" :items="activityItems" />
            </DcCard>

            <DcCard :theme="theme" title="Release Checklist">
              <DcChecklistBoard :theme="theme" :items="checklistItems" />
            </DcCard>
          </div>
        </section>
      </section>
    </DcMain>
  </DcAppShell>
</template>

<style scoped>
.components-library {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 24px 24px;
}

.components-library-intro {
  border: 1px solid rgba(175, 196, 95, 0.2);
  border-radius: 16px;
  padding: 18px;
  background: linear-gradient(140deg, rgba(175, 196, 95, 0.13) 0%, rgba(10, 18, 20, 0.65) 100%);
}

.components-library-intro h2 {
  margin: 0 0 8px;
  font-family: 'Old Standard TT', serif;
  font-size: 1.5rem;
  color: var(--text-primary, #eef4eb);
}

.components-library-intro p {
  margin: 0;
  max-width: 880px;
  color: var(--text-secondary, rgba(238, 244, 235, 0.78));
  font-size: 0.95rem;
}

.components-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.components-block-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(238, 244, 235, 0.75));
}

.components-library :deep(.dc-card-title) {
  font-size: 1.12rem;
  letter-spacing: 0.01em;
  font-weight: 700;
  color: rgba(238, 244, 235, 0.92);
}

.components-grid {
  display: grid;
  gap: 14px;
}

.analytics-grid {
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
}

.data-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .components-library {
    padding: 0 14px 18px;
    gap: 18px;
  }

  .analytics-grid,
  .data-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .components-library-intro {
    padding: 14px;
  }

  .components-library-intro h2 {
    font-size: 1.25rem;
  }
}
</style>
