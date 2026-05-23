<script setup lang="ts">
defineProps<{
  title: string
  hint?: string
  linkLabel?: string
  linkHref?: string
}>()
</script>

<template>
  <section class="dc-bpm-panel">
    <header class="dc-bpm-panel__header">
      <div>
        <h2 class="dc-bpm-panel__title">{{ title }}</h2>
        <p v-if="hint" class="dc-bpm-panel__hint">{{ hint }}</p>
      </div>

      <a v-if="linkLabel" class="dc-bpm-panel__link" :href="linkHref ?? '#'">
        {{ linkLabel }}
      </a>
    </header>

    <slot />
  </section>
</template>

<style scoped>
.dc-bpm-panel {
  padding: 10px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  background:
    var(--gradient-glass),
    color-mix(in srgb, var(--surface-1) 80%, transparent);
  box-shadow: var(--shadow-sm);
}

.dc-bpm-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.dc-bpm-panel__title {
  margin: 0;
  font-size: 0.94rem;
  letter-spacing: 0.01em;
}

.dc-bpm-panel__hint {
  margin: 3px 0 0;
  font-size: 0.74rem;
  color: var(--text-secondary);
}

.dc-bpm-panel__link {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-soft);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.72rem;
  white-space: nowrap;
}

.dc-bpm-panel__link:hover {
  border-color: var(--border-accent);
  color: var(--text-primary);
}
</style>
