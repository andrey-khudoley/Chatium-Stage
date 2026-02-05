<template>
  <LogoutModal
    :visible="showLogoutModal"
    @confirm="confirmLogout"
    @cancel="cancelLogout"
  />
  <header class="header" :class="{ 'header-hidden': showLogoutModal }">
    <div class="header-bar"></div>
    <div class="header-inner">
      <a :href="props.indexUrl" class="header-brand">
        <img
          v-if="props.logoUrl"
          :src="props.logoUrl"
          alt="Логотип"
          class="header-logo"
        />
        <span class="header-title">{{ projectTitle }}</span>
      </a>
      <nav class="header-nav">
        <span class="header-clock" aria-label="Текущее время">
          <i class="fas fa-clock" aria-hidden="true"></i>
          <span class="clock-time">{{ currentTime }}</span>
        </span>
        <a
          v-if="props.isAdmin && props.adminUrl"
          :href="props.adminUrl"
          class="header-link"
          title="Настройки"
        >
          <i class="fas fa-cog"></i>
          <span class="header-link-text">Настройки</span>
        </a>
        <a
          v-if="props.testsUrl"
          :href="props.testsUrl"
          class="header-link"
          title="Тесты"
        >
          <i class="fas fa-flask"></i>
          <span class="header-link-text">Тесты</span>
        </a>
        <a
          v-if="props.isAuthenticated"
          :href="props.profileUrl"
          class="header-link"
          title="Профиль"
        >
          <i class="fas fa-user"></i>
          <span class="header-link-text">Профиль</span>
        </a>
        <a
          v-if="!props.isAuthenticated"
          :href="props.loginUrl"
          class="header-cta"
          title="Войти"
        >
          Войти
        </a>
        <button
          v-if="props.isAuthenticated"
          type="button"
          @click="showLogoutModal = true"
          class="header-cta header-cta-outline"
          title="Выйти"
        >
          Выйти
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import LogoutModal from './LogoutModal.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('Header')

const props = defineProps<{
  projectTitle: string
  logoUrl?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
}>()

const showLogoutModal = ref(false)
const currentTime = ref('')

function updateTime() {
  const now = new Date()
  currentTime.value = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join(':')
}

let timeInterval: number | null = null
let escHandler: ((e: KeyboardEvent) => void) | null = null

watch(showLogoutModal, (visible) => {
  const appLayout = document.querySelector('.app-layout')
  const contentWrapper = document.querySelector('.content-wrapper')
  const footer = document.querySelector('.app-footer')
  if (visible) {
    if (appLayout) appLayout.classList.add('content-hidden')
    if (contentWrapper) contentWrapper.classList.add('hidden-for-modal')
    if (footer) footer.classList.add('hidden-for-modal')
  } else {
    if (appLayout) appLayout.classList.remove('content-hidden')
    if (contentWrapper) contentWrapper.classList.remove('hidden-for-modal')
    if (footer) footer.classList.remove('hidden-for-modal')
  }
})

onMounted(() => {
  log.info('Header mounted')
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
  escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showLogoutModal.value) {
      cancelLogout()
    }
  }
  window.addEventListener('keydown', escHandler)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (escHandler) window.removeEventListener('keydown', escHandler)
})

function confirmLogout() {
  log.critical('User confirmed logout')
  window.location.href = '/s/logout'
}

function cancelLogout() {
  showLogoutModal.value = false
  const appLayout = document.querySelector('.app-layout')
  const contentWrapper = document.querySelector('.content-wrapper')
  const footer = document.querySelector('.app-footer')
  if (appLayout) appLayout.classList.remove('content-hidden')
  if (contentWrapper) contentWrapper.classList.remove('hidden-for-modal')
  if (footer) footer.classList.remove('hidden-for-modal')
}
</script>

<style scoped>
.header {
  position: relative;
  z-index: 200;
  background: var(--color-bg);
  box-shadow: 0 1px 0 var(--color-border);
}

.header-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--color-green) 0%, var(--color-gold) 100%);
}

.header-hidden {
  opacity: 0;
  pointer-events: none;
}

.hidden-for-modal {
  opacity: 0 !important;
  pointer-events: none !important;
}

.content-hidden {
  transition: opacity 0.3s ease;
}

.header-inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--color-text);
  transition: color 0.2s ease;
}

.header-brand:hover {
  color: var(--color-green);
}

.header-logo {
  height: 2rem;
  width: auto;
  max-width: 160px;
  object-fit: contain;
}

.header-title {
  font-family: 'Old Standard TT', serif;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: 0.02em;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.header-clock {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.6rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
  margin-right: 0.5rem;
  border-right: 1px solid var(--color-border);
}

.header-clock i {
  color: var(--color-gold-medium);
}

.header-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: 8px;
  transition: color 0.2s ease, background 0.2s ease;
}

.header-link:hover {
  color: var(--color-green);
  background: var(--color-green-pale);
}

.header-link i {
  font-size: 0.9rem;
}

.header-link-text {
  display: none;
}

.header-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-bg);
  background: var(--color-green);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.header-cta:hover {
  background: var(--color-green-medium);
  box-shadow: 0 2px 8px rgba(70, 240, 210, 0.25);
}

.header-cta-outline {
  color: var(--color-green);
  background: transparent;
  border: 2px solid var(--color-green);
}

.header-cta-outline:hover {
  background: var(--color-green-pale);
  box-shadow: none;
}

@media (min-width: 640px) {
  .header-link-text {
    display: inline;
  }
}

@media (max-width: 640px) {
  .header-inner {
    padding: 0.75rem 1rem;
  }
  .header-title {
    font-size: 1rem;
  }
  .header-clock {
    margin-right: 0.25rem;
    padding: 0.25rem 0.4rem;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .header-clock {
    display: none;
    border-right: none;
  }
}
</style>
