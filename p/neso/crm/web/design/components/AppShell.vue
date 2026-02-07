<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
import { createComponentLogger } from '../../../shared/logger'

const log = createComponentLogger('AppShell')

const STORAGE_KEY_SIDEBAR = 'neso-crm-sidebar-collapsed'

function getInitialSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SIDEBAR)
    if (stored === null) return true
    return stored === '1' || stored === 'true'
  } catch {
    return true
  }
}

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  pageTitle: string
  pageSubtitle?: string
  navItems: Array<{
    id: string
    icon: string
    label: string
    href?: string
    disabled?: boolean
    badge?: string | number
    badgeAriaLabel?: string
    trailingIcon?: string
    trailingText?: string
    ariaLabel?: string
  }>
  activeSection?: string
  userName?: string
  userRole?: string
  logoText?: string
}>()

const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(getInitialSidebarCollapsed())
const sidebarOpen = ref(false)

function toggleSidebarCollapsed() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  try {
    localStorage.setItem(STORAGE_KEY_SIDEBAR, sidebarCollapsed.value ? '1' : '0')
  } catch {
    // ignore
  }
}

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

const onBootComplete = () => startAnimations()

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()
  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', onBootComplete)
  }
})

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', onBootComplete)
})

function navigate(href?: string, disabled?: boolean) {
  if (!href || disabled) return
  window.location.href = href
}
</script>

<template>
  <div class="app" :class="{ 'app-ready': bootLoaderDone }">
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <div class="orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <div v-if="sidebarOpen" class="sidebar-overlay" aria-hidden="true" @click="closeSidebar"></div>

    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': sidebarOpen }">
      <div class="sidebar-layout">
        <div class="sidebar-header">
          <div class="logo" aria-label="Логотип CRM">
            <div class="logo-icon">
              <i class="fas fa-leaf"></i>
            </div>
            <div class="logo-text-wrap">
              <span class="logo-text">{{ props.logoText || 'NeSo CRM' }}</span>
            </div>
          </div>
          <button class="toggle-btn" @click="toggleSidebarCollapsed" aria-label="Свернуть меню" type="button">
            <i :class="sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
          </button>
        </div>

        <nav class="nav" aria-label="Основная навигация">
          <ul class="nav-list" role="list">
            <li v-for="item in props.navItems" :key="item.id" class="nav-list-item">
              <button
                class="nav-item"
                :class="{ active: props.activeSection === item.id }"
                :disabled="item.disabled || !item.href"
                :aria-current="props.activeSection === item.id ? 'page' : undefined"
                :aria-label="item.ariaLabel || item.label"
                :title="sidebarCollapsed ? item.label : ''"
                type="button"
                @click="navigate(item.href, item.disabled)"
              >
                <span class="nav-item-icon" aria-hidden="true">
                  <i :class="['fas', item.icon]"></i>
                </span>
                <span class="nav-item-main">
                  <span class="nav-item-label">{{ item.label }}</span>
                </span>
                <span
                  v-if="item.badge !== undefined || item.trailingIcon || item.trailingText"
                  class="nav-item-trailing"
                  :aria-label="item.badgeAriaLabel"
                >
                  <span v-if="item.badge !== undefined" class="nav-item-badge">{{ item.badge }}</span>
                  <span v-if="item.trailingText" class="nav-item-trailing-text">{{ item.trailingText }}</span>
                  <i v-if="item.trailingIcon" :class="['fas', item.trailingIcon]"></i>
                </span>
              </button>
            </li>
          </ul>
        </nav>

        <div class="sidebar-footer visible" :class="{ compact: sidebarCollapsed }">
          <div v-if="!sidebarCollapsed" class="user-pill">
            <div class="avatar">
              <i class="fas fa-user"></i>
            </div>
            <div class="user-info">
              <span class="name">{{ props.userName || 'Алексей' }}</span>
              <span class="role">{{ props.userRole || 'Admin' }}</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>

    <main class="main">
      <header class="header">
        <button class="menu-toggle" aria-label="Открыть меню" type="button" @click="toggleSidebarMobile">
          <i class="fas fa-bars"></i>
        </button>
        <div class="header-left">
          <h1 class="page-title">{{ props.pageTitle }}</h1>
          <p v-if="props.pageSubtitle" class="page-subtitle">{{ props.pageSubtitle }}</p>
        </div>
        <div class="header-actions">
          <slot name="headerActions">
            <button class="action-btn glass" type="button" disabled>
              <i class="fas fa-circle-info"></i>
            </button>
          </slot>
        </div>
      </header>

      <div class="content">
        <slot></slot>
      </div>
    </main>
  </div>
</template>
