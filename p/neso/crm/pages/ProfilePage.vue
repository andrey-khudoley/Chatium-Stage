<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '../web/design/components/AppShell.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('ProfilePage')

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl?: string
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

const navItems = computed(() =>
  [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная', href: props.indexUrl },
    { id: 'profile', icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
    { id: 'admin', icon: 'fa-gear', label: 'Админка', href: props.adminUrl },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты', href: props.testsUrl }
  ].filter((item) => item.href)
)

const displayName = computed(() => props.user.displayName || 'Не указано')
const email = computed(() => props.user.confirmedEmail || 'Не подтвержден')
const phone = computed(() => props.user.confirmedPhone || 'Не подтвержден')

log.info('Profile page rendered')
</script>

<template>
  <AppShell
    :pageTitle="'Профиль'"
    :pageSubtitle="displayName"
    :navItems="navItems"
    activeSection="profile"
    :userName="displayName"
    :userRole="props.isAdmin ? 'Admin' : 'User'"
  >
    <template #headerActions>
      <button class="action-btn glass" type="button" @click="() => (window.location.href = props.indexUrl)">
        <i class="fas fa-house"></i>
      </button>
      <button class="action-btn primary" type="button" @click="() => (window.location.href = '/s/logout')">
        <i class="fas fa-right-from-bracket"></i>
        <span>Выйти</span>
      </button>
    </template>

    <section class="showcase">
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
  </AppShell>
</template>
