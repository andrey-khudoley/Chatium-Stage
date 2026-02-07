<script setup lang="ts">
</script>

<template>
  <div class="dc-main-grid">
    <slot />
  </div>
</template>

<style scoped>
.dc-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 48px;
}
.dc-main-grid :deep(.dc-main-grid-full) {
  grid-column: span 2;
}
@media (max-width: 1024px) {
  .dc-main-grid {
    grid-template-columns: 1fr;
  }
  .dc-main-grid :deep(.dc-main-grid-full) {
    grid-column: span 1;
  }
}
</style>
