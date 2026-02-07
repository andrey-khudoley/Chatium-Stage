<script setup lang="ts">
import { DcGlowDots, DcGridLayer, DcPageBackground, DcThemeGlobalStyles } from '../components'
import DcSidebarOverlay from './DcSidebarOverlay.vue'

/** Оболочка страницы: фон, слои, оверлей сайдбара, CSS-переменные темы */
defineProps<{
  theme?: 'dark' | 'light'
  /** Контент показан (после boot loader) */
  ready?: boolean
  /** Сайдбар свёрнут */
  sidebarCollapsed?: boolean
  /** Мобильное меню открыто */
  sidebarOpen?: boolean
}>()
defineEmits<{
  closeSidebar: []
}>()
</script>

<template>
  <DcThemeGlobalStyles :theme="theme" />
  <div
    class="dc-app-shell"
    :class="[
      `dc-app-shell--${theme ?? 'dark'}`,
      { 'dc-app-shell--ready': ready, 'dc-app-shell--sidebar-collapsed': sidebarCollapsed }
    ]"
  >
    <DcPageBackground :theme="theme" />
    <DcGridLayer :theme="theme" />
    <DcGlowDots :theme="theme" />
    <DcSidebarOverlay
      :visible="!!sidebarOpen"
      :theme="theme"
      @close="$emit('closeSidebar')"
    />
    <slot name="sidebar" />
    <div
      class="dc-app-shell__content"
      :class="{ 'dc-app-shell__content--collapsed': sidebarCollapsed }"
    >
      <div v-if="$slots.header" class="dc-app-shell__header-row">
        <slot name="header" />
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.dc-app-shell {
  display: flex;
  min-height: 100vh;
  color: var(--text);
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
  opacity: 0;
  transition: opacity 0.55s ease;
  isolation: isolate;
}
.dc-app-shell--ready {
  opacity: 1;
}
.dc-app-shell__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
}
.dc-app-shell__content--collapsed {
  margin-left: 72px;
}
@media (max-width: 768px) {
  .dc-app-shell__content {
    margin-left: 0;
  }
}
.dc-app-shell__header-row {
  position: relative;
  z-index: 20;
  flex-shrink: 0;
  padding: 32px 40px 0;
}
@media (max-width: 768px) {
  .dc-app-shell__header-row {
    padding: 24px 20px 0;
  }
}
.dc-app-shell--dark {
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.12);
  --radius: 12px;
  --glow-soft: rgba(175, 196, 95, 0.15);
}
.dc-app-shell--light {
  --accent: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --border: rgba(79, 111, 47, 0.12);
  --radius: 12px;
  --glow-soft: rgba(79, 111, 47, 0.15);
}
</style>
