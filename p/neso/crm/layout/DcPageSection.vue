<script setup lang="ts">
defineProps<{
  /** hero | stats | default */
  variant?: 'hero' | 'stats' | 'default'
}>()
</script>

<template>
  <section
    class="dc-page-section"
    :class="variant ? `dc-page-section--${variant}` : ''"
  >
    <slot />
  </section>
</template>

<style scoped>
.dc-page-section {
  margin-bottom: 32px;
}
.dc-page-section--hero {
  margin-bottom: 32px;
}
.dc-page-section--stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
@media (max-width: 1024px) {
  .dc-page-section--stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .dc-page-section--stats {
    grid-template-columns: 1fr;
  }
}
</style>
