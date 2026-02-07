<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createComponentLogger } from '../shared/logger'
import {
  DcDemoDashboard,
  DcDemoSidebar,
  DcHeaderActions,
  DcPageHeader,
  type BarItem,
  type ChangelogItem,
  type QuickItem,
  type NavItem,
  type TableColumn
} from '../components'
import { DcAppShell, DcMain } from '../layout'

const log = createComponentLogger('DesignDemoDarkPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  pageTitle: string
  breadcrumbs?: string[]
  logoUrl?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
}>()

const theme = 'dark' as const
const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const activeSection = ref('dashboard')

const menuItems: NavItem[] = [
  { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
  { id: 'profile', icon: 'fa-user', label: 'Профиль' },
  { id: 'admin', icon: 'fa-gear', label: 'Админка' },
  { id: 'login', icon: 'fa-right-to-bracket', label: 'Логин' }
]

const changelog: ChangelogItem[] = [
  { role: 'UX', text: 'Обновлён layout карточек обращений', time: '4 мин назад' },
  { role: 'DS', text: 'Добавлены токены focus/loading/error', time: '11 мин назад' },
  { role: 'QA', text: 'Проверен desktop-first сценарий', time: '26 мин назад' }
]

const tableRows = [
  { client: 'Мария Петрова', channel: 'WhatsApp', status: 'В работе', sla: '01:24' },
  { client: 'Иван Смирнов', channel: 'Telegram', status: 'Новый', sla: '00:41' },
  { client: 'Анна Орлова', channel: 'Email', status: 'Закрыт', sla: '03:12' }
]

const tableColumns: TableColumn[] = [
  { key: 'client', header: 'Клиент' },
  { key: 'channel', header: 'Канал' },
  { key: 'status', header: 'Статус', badge: true, mutedWhen: (v) => v === 'Закрыт' },
  { key: 'sla', header: 'SLA' }
]

const quickItems: QuickItem[] = [
  { icon: 'fa-house', label: 'Dashboard', href: props.indexUrl },
  { icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
  { icon: 'fa-gear', label: 'Админка', href: props.adminUrl ?? props.indexUrl },
  { icon: 'fa-right-to-bracket', label: 'Логин', href: props.loginUrl }
]

const chartItems: BarItem[] = [
  { label: 'Пн', value: 60 },
  { label: 'Вт', value: 80 },
  { label: 'Ср', value: 45 },
  { label: 'Чт', value: 90, active: true },
  { label: 'Пт', value: 70 },
  { label: 'Сб', value: 55 },
  { label: 'Вс', value: 40 }
]

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebarMobile() {
  sidebarOpen.value = !sidebarOpen.value
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
        logo-text="NeSo"
        user-name="Алексей"
        user-role="Admin"
        :items="menuItems"
        :collapsed="sidebarCollapsed"
        :mobile-open="sidebarOpen"
        :active-id="activeSection"
        @close="closeSidebar"
        @select="activeSection = $event"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />
    </template>
    <template #header>
      <DcPageHeader
        :theme="theme"
        :title="pageTitle"
        :breadcrumbs="breadcrumbs"
        :show-menu-toggle="true"
        @menu-toggle="toggleSidebarMobile"
      >
        <template #actions>
          <DcHeaderActions :theme="theme" :index-url="indexUrl" :notification-count="3" />
        </template>
      </DcPageHeader>
    </template>

    <DcMain>
      <DcDemoDashboard
        :theme="theme"
        :profile-url="profileUrl"
        :login-url="loginUrl"
        :index-url="indexUrl"
        :changelog="changelog"
        :table-rows="tableRows"
        :table-columns="tableColumns"
        :quick-items="quickItems"
        :chart-items="chartItems"
      />
    </DcMain>
  </DcAppShell>
</template>
