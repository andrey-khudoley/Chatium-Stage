<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DcBpmHeaderControls,
  DcBpmSidebar,
  DcPageHeader,
  DcThemeGlobalStyles
} from '../components'
import { DcAppShell } from '../layout'
import { bpmCopy, type BpmLocale } from '../shared/bpmI18n'
import { getStoredSidebarCollapsed } from '../shared/sidebarStorage'
import { getStoredTheme, setStoredTheme } from '../shared/themeStorage'
import { getDefaultThemePresetId, getThemePresetById } from '../shared/themeCatalog'

const props = defineProps<{
  projectTitle: string
  homeUrl: string
  loginUrl: string
  adminUrl: string
  testsUrl: string
  designUrl: string
  clientsDialogsUrl: string
  scenarioCount: number
}>()

const sidebarCollapsed = ref(getStoredSidebarCollapsed())
const sidebarOpen = ref(false)
const locale = ref<BpmLocale>('ru')
const storedTheme = getStoredTheme()
const selectedPresetId = ref(getDefaultThemePresetId(storedTheme ?? 'light'))

const currentTheme = computed(() => getThemePresetById(selectedPresetId.value)?.mode ?? 'light')
const breadcrumbs = computed(() => [ui.value.home])

const ui = computed(() => bpmCopy[locale.value])

/** Контекст видимости меню. В демо передаём userRole: 'admin', чтобы отображался раздел «Админка»; в проде — роль из авторизации. */
const navVisibilityContext = computed(() => ({ userRole: 'admin' }))

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebarMobile() {
  sidebarOpen.value = !sidebarOpen.value
}

function setLocale(next: BpmLocale) {
  locale.value = next
}

function onThemeChange(id: string) {
  const mode = id === 'dark' ? 'dark' : 'light'
  setStoredTheme(mode)
  selectedPresetId.value = getDefaultThemePresetId(mode)
}
</script>

<template>
  <DcAppShell
    :theme="currentTheme"
    :theme-preset-id="selectedPresetId"
    :ready="true"
    :sidebar-collapsed="sidebarCollapsed"
    :sidebar-open="sidebarOpen"
    @close-sidebar="closeSidebar"
  >
    <template #sidebar>
      <DcBpmSidebar
        active-id="home"
        :home-url="homeUrl"
        :login-url="loginUrl"
        :admin-url="adminUrl"
        :tests-url="testsUrl"
        :design-url="designUrl"
        :clients-dialogs-url="clientsDialogsUrl"
        :scenario-count="scenarioCount"
        :visibility-context="navVisibilityContext"
        theme="light"
        logo-text="NeSo BPM"
        user-name="Guest"
        user-role="BPM Workspace"
        :collapsed="sidebarCollapsed"
        :mobile-open="sidebarOpen"
        @close="closeSidebar"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />
    </template>

    <template #header>
      <DcPageHeader
        :theme="currentTheme"
        :title="projectTitle"
        :breadcrumbs="breadcrumbs"
        :show-menu-toggle="true"
        @menu-toggle="toggleSidebarMobile"
      >
        <template #actions>
          <DcBpmHeaderControls
            :language-label="ui.navLanguage"
            :theme-label="ui.navTheme"
            :locale="locale"
            :theme-options="[]"
            :selected-theme-id="currentTheme"
            theme-variant="light-dark"
            :open-index-label="ui.openLanding"
            index-url="https://example.com/"
            :theme-light-aria-label="ui.themeLight"
            :theme-dark-aria-label="ui.themeDark"
            @change-locale="setLocale"
            @change-theme="onThemeChange"
          />
        </template>
      </DcPageHeader>
    </template>

  <div class="bpm-home-page">
    <header class="bpm-home-hero">
      <p class="bpm-home-hero__kicker">{{ ui.workspace }}</p>
      <h1>{{ projectTitle }}</h1>
      <p>{{ ui.heroDescription }}</p>
    </header>
  </div>
  </DcAppShell>
</template>

<style scoped>
.bpm-home-page {
  padding: 16px 18px;
  display: grid;
  gap: 14px;
  position: relative;
  z-index: 2;
}

@media (max-width: 980px) {
  .bpm-home-page {
    padding: 16px 12px;
  }
}

.bpm-home-hero {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-soft);
  padding: 14px;
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-1) 86%, transparent);
}

.bpm-home-hero__kicker {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.68rem;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.bpm-home-hero h1 {
  margin: 6px 0 0;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.4vw, 2.2rem);
}

.bpm-home-hero p {
  margin: 8px 0 0;
  max-width: 880px;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.5;
}
</style>
