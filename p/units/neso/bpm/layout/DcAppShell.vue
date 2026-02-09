<script setup lang="ts">
import { DcGlowDots, DcGridLayer, DcPageBackground, DcThemeGlobalStyles } from '../components'
import DcSidebarOverlay from './DcSidebarOverlay.vue'

defineProps<{
  theme?: 'dark' | 'light'
  themePresetId?: string
  ready?: boolean
  sidebarCollapsed?: boolean
  sidebarOpen?: boolean
}>()

defineEmits<{
  closeSidebar: []
}>()
</script>

<template>
  <DcThemeGlobalStyles :theme="theme" :theme-preset-id="themePresetId" />

  <div
    class="dc-app-shell"
    :class="[
      `dc-app-shell--${theme ?? 'dark'}`,
      {
        'dc-app-shell--ready': ready,
        'dc-app-shell--sidebar-collapsed': sidebarCollapsed
      }
    ]"
  >
    <DcPageBackground :theme="theme" />
    <DcGridLayer :theme="theme" />
    <DcGlowDots :theme="theme" />

    <DcSidebarOverlay :visible="!!sidebarOpen" :theme="theme" @close="$emit('closeSidebar')" />

    <slot name="sidebar" />

    <div class="dc-app-shell__content" :class="{ 'dc-app-shell__content--collapsed': sidebarCollapsed }">
      <div v-if="$slots.header" class="dc-app-shell__header-row">
        <slot name="header" />
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dc-app-shell {
  position: relative;
  display: flex;
  min-height: 100vh;
  color: var(--text-primary);
  font-family: var(--font-sans);
  opacity: 0;
  transition: opacity 0.36s ease;
  isolation: isolate;
}

.dc-app-shell--ready {
  opacity: 1;
}

.dc-app-shell__content {
  position: relative;
  z-index: 12;
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  margin-left: var(--sidebar-width);
  transition: margin-left 0.28s ease;
}

.dc-app-shell__content--collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

.dc-app-shell__header-row {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: 14px 18px 0;
  backdrop-filter: blur(10px);
}

@media (max-width: 980px) {
  .dc-app-shell__content,
  .dc-app-shell__content--collapsed {
    margin-left: 0;
  }

  .dc-app-shell__header-row {
    padding: 12px 12px 0;
  }
}
</style>
