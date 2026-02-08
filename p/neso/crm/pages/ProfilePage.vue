<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { createComponentLogger } from '../shared/logger'
import { DcDemoSidebar, DcPageHeader } from '../components'
import { DcAppShell, DcMain } from '../layout'
import type { NavItem } from '../components'

const log = createComponentLogger('ProfilePage')

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
  user: {
    displayName?: string
    confirmedEmail?: string
    confirmedPhone?: string
  }
}>()

const theme = 'dark' as const
const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const activeSection = ref('profile')

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

const displayName = computed(() => props.user.displayName || 'Не указано')
const email = computed(() => props.user.confirmedEmail || 'Не подтвержден')
const phone = computed(() => props.user.confirmedPhone || 'Не подтвержден')

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
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()
  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})

log.info('Profile page rendered')
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
        :user-name="displayName"
        :user-role="props.isAdmin ? 'Admin' : 'User'"
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
        :breadcrumbs="['Главная', 'Профиль']"
        :show-menu-toggle="true"
        @menu-toggle="toggleSidebarMobile"
      >
        <template #actions>
          <button type="button" class="dc-header-action" @click="() => (window.location.href = indexUrl)">
            <i class="fas fa-house"></i>
          </button>
          <button type="button" class="dc-header-action dc-header-action--primary" @click="() => (window.location.href = '/s/logout')">
            <i class="fas fa-right-from-bracket"></i>
            <span>Выйти</span>
          </button>
        </template>
      </DcPageHeader>
    </template>

    <DcMain>
      <section class="showcase dc-content-area">
        <h2 class="section-title">Данные аккаунта</h2>
        <div class="showcase-grid">
          <div class="showcase-card wide">
            <h4 class="showcase-label">Профиль</h4>
            <div class="showcase-content column">
              <div class="input-group">
                <i class="fas fa-id-card"></i>
                <input type="text" :value="displayName" readonly />
              </div>
              <div class="input-group">
                <i class="fas fa-envelope"></i>
                <input type="text" :value="email" readonly />
              </div>
              <div class="input-group">
                <i class="fas fa-phone"></i>
                <input type="text" :value="phone" readonly />
              </div>
            </div>
          </div>
          <div class="showcase-card">
            <h4 class="showcase-label">Статус</h4>
            <div class="showcase-content column">
              <span class="tag">Аккаунт активен</span>
              <span class="tag tag-light">Доступ разрешён</span>
              <span class="tag tag-outline">Права: {{ props.isAdmin ? 'Admin' : 'User' }}</span>
            </div>
          </div>
        </div>
      </section>
    </DcMain>
  </DcAppShell>
</template>

<style scoped>
.showcase {
  padding: 0 24px 24px;
}
.section-title {
  font-family: 'Old Standard TT', serif;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: var(--text-primary, #eef4eb);
}
.showcase-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 768px) {
  .showcase-grid {
    grid-template-columns: 1fr;
  }
}
.showcase-card {
  background: var(--surface, #11191b);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(175, 196, 95, 0.12);
}
.showcase-card.wide {
  grid-column: 1 / -1;
}
.showcase-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary, rgba(238, 244, 235, 0.75));
  margin: 0 0 12px 0;
}
.showcase-content.column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(175, 196, 95, 0.1);
}
.input-group i {
  color: var(--accent, #afc45f);
  width: 20px;
}
.input-group input {
  flex: 1;
  background: none;
  border: none;
  color: var(--text-primary, #eef4eb);
  font-size: 0.95rem;
}
.tag {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(175, 196, 95, 0.15);
  color: var(--accent, #afc45f);
}
.tag-light {
  background: rgba(175, 196, 95, 0.08);
}
.tag-outline {
  background: transparent;
  border: 1px solid rgba(175, 196, 95, 0.25);
}
</style>
