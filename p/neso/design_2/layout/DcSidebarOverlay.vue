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
  <div v-if="visible" class="dc-sidebar-overlay" aria-hidden="true" @click="$emit('close')" />
</template>

<style scoped>
.dc-sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 32;
  background: var(--surface-overlay);
  backdrop-filter: blur(2px);
  animation: dc-sidebar-overlay-fade 0.2s ease;
}

@keyframes dc-sidebar-overlay-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
