<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
}>()
</script>

<template>
  <div class="dc-grid-layer" :class="`dc-grid-layer--${theme ?? 'dark'}`" aria-hidden="true" />
</template>

<style scoped>
.dc-grid-layer {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-size: 48px 48px;
}

.dc-grid-layer--dark {
  background-image: none;
}

.dc-grid-layer--light {
  background-image: none;
}
</style>
