<script setup lang="ts">
</script>

<template>
  <main class="dc-main">
    <slot />
  </main>
</template>

<style scoped>
.dc-main {
  flex: 1;
  min-width: 0;
  padding: 32px 40px;
  overflow-y: auto;
  position: relative;
  z-index: 10;
}
@media (max-width: 768px) {
  .dc-main {
    padding: 24px 20px;
  }
}
</style>
