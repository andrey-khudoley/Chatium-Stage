<script setup lang="ts">
defineProps<{
  visible: boolean
  theme?: 'dark' | 'light'
}>()
defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    v-if="visible"
    class="dc-sidebar-overlay"
    :class="theme ? `theme-${theme}` : ''"
    aria-hidden="true"
    @click="$emit('close')"
  />
</template>

<style scoped>
.dc-sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.6);
  animation: dc-sidebar-overlay-fade 0.2s ease;
}
.dc-sidebar-overlay.theme-light {
  background: rgba(0, 0, 0, 0.3);
}
@keyframes dc-sidebar-overlay-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
