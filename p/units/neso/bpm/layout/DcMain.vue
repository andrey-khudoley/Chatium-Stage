<script setup lang="ts">
</script>

<template>
  <main class="dc-main">
    <slot />
  </main>
</template>

<style scoped>
.dc-main {
  position: relative;
  z-index: 16;
  display: flex;
  flex: 1;
  min-width: 0;
  justify-content: center;
  padding: 12px 18px 18px;
  overflow-y: auto;
}

@media (max-width: 980px) {
  .dc-main {
    padding: 10px 12px 14px;
  }
}
</style>
