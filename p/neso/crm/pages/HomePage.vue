<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
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

const log = createComponentLogger('HomePage')

declare global {
  interface Window {
    hideAppLoader?: () => void
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
  inquiriesUrl?: string
}>()

const theme = 'dark' as const
const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const activeSection = ref('dashboard')

const navIdToUrl = computed<Record<string, string>>(() => ({
  dashboard: props.indexUrl,
  profile: props.profileUrl,
  admin: props.adminUrl ?? '',
  tests: props.testsUrl ?? '',
  login: props.loginUrl
}))

const menuItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная' },
    { id: 'profile', icon: 'fa-user', label: 'Профиль' },
    { id: 'admin', icon: 'fa-gear', label: 'Админка' },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты' },
    { id: 'login', icon: 'fa-right-to-bracket', label: 'Логин' }
  ]
  return items.filter((item) => navIdToUrl.value[item.id])
})

const changelog: ChangelogItem[] = [
  { role: 'CRM', text: 'Заготовка NeSo CRM в новом дизайне', time: 'только что' },
  { role: 'DS', text: 'Подключена дизайн-система «Ночной лес»', time: 'только что' }
]

const tableRows = [
  { client: '—', channel: '—', status: '—', sla: '—' }
]

const tableColumns: TableColumn[] = [
  { key: 'client', header: 'Клиент' },
  { key: 'channel', header: 'Канал' },
  { key: 'status', header: 'Статус', badge: true },
  { key: 'sla', header: 'SLA' }
]

const quickItems = computed<QuickItem[]>(() => [
  { icon: 'fa-house', label: 'Главная', href: props.indexUrl },
  { icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
  { icon: 'fa-gear', label: 'Админка', href: props.adminUrl ?? props.indexUrl },
  { icon: 'fa-flask', label: 'Тесты', href: props.testsUrl ?? props.indexUrl },
  { icon: 'fa-right-to-bracket', label: 'Логин', href: props.loginUrl }
])

const chartItems: BarItem[] = [
  { label: 'Пн', value: 40 },
  { label: 'Вт', value: 65 },
  { label: 'Ср', value: 50 },
  { label: 'Чт', value: 80, active: true },
  { label: 'Пт', value: 55 },
  { label: 'Сб', value: 30 },
  { label: 'Вс', value: 20 }
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
        :breadcrumbs="['Главная', 'Сводка']"
        :show-menu-toggle="true"
        @menu-toggle="toggleSidebarMobile"
      >
        <template #actions>
          <DcHeaderActions :theme="theme" :index-url="indexUrl" :notification-count="0" />
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
