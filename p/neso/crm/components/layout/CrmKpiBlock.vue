<template>
  <article class="crm-kpi crm-kpi-block">
    <header class="crm-kpi-block-header">
      <span class="crm-kpi-label">{{ title }}</span>
      <p v-if="subtitle" class="crm-muted">{{ subtitle }}</p>
    </header>
    <div class="crm-kpi-block-content">
      <slot />
    </div>
  </article>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle?: string
}>(), {
  subtitle: ''
})
</script>

<style scoped>
.crm-kpi-block {
  justify-content: space-between;
}

.crm-kpi-block-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.crm-kpi-block-content {
  display: flex;
  flex-wrap: wrap;
  gap: var(--crm-space-2);
}
</style>
