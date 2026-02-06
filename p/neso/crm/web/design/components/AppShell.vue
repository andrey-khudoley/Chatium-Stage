<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
import { createComponentLogger } from '../../../shared/logger'

const log = createComponentLogger('AppShell')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  pageTitle: string
  pageSubtitle?: string
  navItems: Array<{ id: string; icon: string; label: string; href?: string }>
  activeSection?: string
  userName?: string
  userRole?: string
  logoText?: string
}>()

const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)

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

function navigate(href?: string) {
  if (!href) return
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
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <i class="fas fa-leaf"></i>
          </div>
          <span v-if="!sidebarCollapsed" class="logo-text">{{ props.logoText || 'NeSo' }}</span>
        </div>
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed" aria-label="Свернуть меню">
          <i :class="sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
        </button>
      </div>

      <nav class="nav">
        <button
          v-for="item in props.navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: props.activeSection === item.id }"
          @click="navigate(item.href)"
          :title="sidebarCollapsed ? item.label : ''"
          type="button"
        >
          <i :class="['fas', item.icon]"></i>
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </button>
      </nav>

      <div v-if="!sidebarCollapsed" class="sidebar-footer">
        <div class="user-pill">
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
    </aside>

    <main class="main">
      <header class="header">
        <button class="menu-toggle" aria-label="Открыть меню" @click="toggleSidebarMobile">
          <i class="fas fa-bars"></i>
        </button>
        <div class="header-left">
          <h1 class="page-title">{{ props.pageTitle }}</h1>
          <p v-if="props.pageSubtitle" class="page-subtitle">{{ props.pageSubtitle }}</p>
        </div>
        <div class="header-actions">
          <slot name="headerActions"></slot>
        </div>
      </header>

      <div class="content">
        <slot></slot>
      </div>
    </main>
  </div>
</template>
