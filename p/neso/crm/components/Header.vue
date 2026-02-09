<template>
  <LogoutModal :visible="showLogoutModal" @confirm="confirmLogout" @cancel="cancelLogout" />

  <header class="crm-topbar crm-surface" :class="{ 'crm-topbar-hidden': showLogoutModal }">
    <div class="crm-topbar-main">
      <div class="crm-topbar-left">
        <a :href="props.indexUrl" class="crm-topbar-brand">
          <img
            src="https://fs-thb03.getcourse.ru/fileservice/file/thumbnail/h/246c9167ba22ef571b50a2a795ee1186.png/s/300x/a/565681/sc/95"
            alt="CRM"
            class="crm-topbar-logo"
          />
          <span class="crm-topbar-title">{{ projectTitle }}</span>
        </a>

        <nav class="crm-topbar-nav">
          <a :href="props.indexUrl" class="crm-topbar-link">
            <i class="fas fa-house"></i>
            {{ t('header.home') }}
          </a>
          <a v-if="props.testsUrl" :href="props.testsUrl" class="crm-topbar-link">
            <i class="fas fa-flask"></i>
            {{ t('header.tests') }}
          </a>
          <a v-if="props.isAdmin && props.adminUrl" :href="props.adminUrl" class="crm-topbar-link">
            <i class="fas fa-screwdriver-wrench"></i>
            {{ t('header.admin') }}
          </a>
          <a v-if="props.isAuthenticated" :href="props.profileUrl" class="crm-topbar-link">
            <i class="fas fa-id-badge"></i>
            {{ t('header.profile') }}
          </a>
          <a v-else :href="props.loginUrl" class="crm-topbar-link">
            <i class="fas fa-arrow-right-to-bracket"></i>
            {{ t('header.profile') }}
          </a>
        </nav>
      </div>

      <div class="crm-topbar-right">
        <span class="crm-topbar-clock crm-chip">
          <i class="fas fa-clock"></i>
          {{ currentTime }}
        </span>

        <CrmThemeSwitcher :initial-theme-id="preferences.themeId" />
        <CrmLanguageSwitcher :initial-locale="initialLocale" @changed="onLocaleChanged" />

        <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="togglePreloader">
          <i class="fas" :class="preferences.preloaderEnabled ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
          {{ preferences.preloaderEnabled ? t('header.preloaderOn') : t('header.preloaderOff') }}
        </button>

        <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="triggerGlitch" :title="t('header.chatium')">
          <i class="fas fa-bolt"></i>
        </button>

        <button type="button" class="crm-btn crm-btn-danger crm-btn-sm" @click="handleCloseClick" :title="t('header.logout')">
          <i class="fas fa-right-from-bracket"></i>
        </button>
      </div>
    </div>

    <div class="crm-topbar-hint">
      <span>{{ t('header.searchHint') }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import LogoutModal from './LogoutModal.vue'
import CrmLanguageSwitcher from './navigation/CrmLanguageSwitcher.vue'
import CrmThemeSwitcher from './navigation/CrmThemeSwitcher.vue'
import { createComponentLogger } from '../shared/logger'
import { useDesignSystem } from '../shared/design/useDesignSystem'
import { useUiI18n, type UiLocale } from '../shared/design/i18n'

const log = createComponentLogger('Header')

const props = defineProps<{
  projectTitle: string
  pageName?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
  initialLocale?: string
}>()

const projectTitle = computed(() => props.projectTitle)
const currentTime = ref('00:00:00')
const showLogoutModal = ref(false)
const isGlitching = ref(false)

const initialLocale = computed(() => props.initialLocale || 'ru')
const { t, setLocale } = useUiI18n(initialLocale.value)
const { preferences, setPreloaderEnabled } = useDesignSystem()

let timer: number | null = null
let escHandler: ((event: KeyboardEvent) => void) | null = null

function updateClock(): void {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${h}:${m}:${s}`
}

onMounted(() => {
  updateClock()
  timer = window.setInterval(updateClock, 1000)

  escHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showLogoutModal.value) {
      cancelLogout()
    }
  }

  window.addEventListener('keydown', escHandler)
  log.info('Header mounted')
})

onUnmounted(() => {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
  if (escHandler) {
    window.removeEventListener('keydown', escHandler)
    escHandler = null
  }
  log.info('Header unmounted')
})

function onLocaleChanged(locale: UiLocale): void {
  setLocale(locale)
}

function triggerGlitch(): void {
  if (isGlitching.value) return

  isGlitching.value = true
  const appLayout = document.querySelector('.app-layout')
  if (appLayout) {
    appLayout.classList.add('global-glitch-active')
    setTimeout(() => {
      appLayout.classList.remove('global-glitch-active')
      isGlitching.value = false
    }, 500)
  } else {
    isGlitching.value = false
  }
}

function handleCloseClick(): void {
  if (props.isAuthenticated) {
    showLogoutModal.value = true

    const appLayout = document.querySelector('.app-layout')
    const contentWrapper = document.querySelector('.content-wrapper')
    const footer = document.querySelector('.app-footer')

    if (appLayout) appLayout.classList.add('content-hidden')
    if (contentWrapper) contentWrapper.classList.add('hidden-for-modal')
    if (footer) footer.classList.add('hidden-for-modal')
    return
  }

  triggerGlitch()
}

function togglePreloader(): void {
  setPreloaderEnabled(!preferences.value.preloaderEnabled)
}

function confirmLogout(): void {
  window.location.href = '/s/logout'
}

function cancelLogout(): void {
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
.crm-topbar {
  margin: var(--crm-space-3) auto var(--crm-space-3);
  width: min(1400px, calc(100% - 2.5rem));
  border-radius: var(--crm-radius-xl);
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 75%, transparent);
  padding: var(--crm-space-3) var(--crm-space-4);
  position: relative;
  z-index: 40;
}

.crm-topbar-hidden {
  opacity: 0;
  pointer-events: none;
}

.crm-topbar-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--crm-space-3);
}

.crm-topbar-left {
  display: flex;
  align-items: center;
  gap: var(--crm-space-4);
  min-width: 0;
}

.crm-topbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  text-decoration: none;
}

.crm-topbar-logo {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.6rem;
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 70%, transparent);
}

.crm-topbar-title {
  font-family: var(--crm-font-heading);
  color: var(--crm-text);
  font-weight: 700;
  font-size: 0.96rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crm-topbar-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.crm-topbar-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--crm-font-navigation);
  font-size: 0.8rem;
  color: var(--crm-textMuted);
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  padding: 0.42rem 0.62rem;
  transition: all 0.2s ease;
}

.crm-topbar-link:hover {
  color: var(--crm-text);
  border-color: color-mix(in srgb, var(--crm-borderStrong) 75%, transparent);
  background: color-mix(in srgb, var(--crm-accentSoft) 24%, transparent);
}

.crm-topbar-right {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.crm-topbar-clock {
  font-family: var(--crm-font-tables);
}

.crm-topbar-hint {
  padding-top: 0.55rem;
  color: var(--crm-textDim);
  font-size: 0.72rem;
  text-align: right;
  font-family: var(--crm-font-tables);
}

.hidden-for-modal {
  opacity: 0 !important;
  pointer-events: none !important;
}

.content-hidden {
  opacity: 0.2;
}

@media (max-width: 1180px) {
  .crm-topbar {
    width: min(100% - 1rem, 1400px);
    padding: var(--crm-space-3);
  }

  .crm-topbar-main {
    flex-direction: column;
    align-items: stretch;
  }

  .crm-topbar-left,
  .crm-topbar-right {
    width: 100%;
  }

  .crm-topbar-hint {
    text-align: left;
  }
}
</style>
