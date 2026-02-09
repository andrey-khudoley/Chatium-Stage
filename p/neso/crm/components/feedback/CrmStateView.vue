<template>
  <section class="crm-surface crm-card crm-state-view" :class="`is-${state}`">
    <div class="crm-state-illustration">
      <i :class="iconClass" aria-hidden="true"></i>
    </div>
    <div class="crm-stack">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="crm-row">
      <slot name="actions" />
    </div>
    <slot v-if="state === 'filled'" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  state: 'empty' | 'loading' | 'error' | 'filled'
  title: string
  description: string
}>(), {
  state: 'empty'
})

const iconClass = computed(() => {
  if (props.state === 'loading') return 'fas fa-circle-notch fa-spin'
  if (props.state === 'error') return 'fas fa-triangle-exclamation'
  if (props.state === 'filled') return 'fas fa-circle-check'
  return 'fas fa-box-open'
})
</script>

<style scoped>
.crm-state-view {
  align-items: flex-start;
}

.crm-state-illustration {
  width: 2.7rem;
  height: 2.7rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--crm-accentSoft) 72%, transparent);
  color: var(--crm-accent);
  font-size: 1.15rem;
}

.crm-state-view.is-error .crm-state-illustration {
  color: var(--crm-danger);
  background: color-mix(in srgb, var(--crm-danger) 18%, transparent);
}

.crm-state-view.is-loading .crm-state-illustration {
  color: var(--crm-warning);
  background: color-mix(in srgb, var(--crm-warning) 20%, transparent);
}

.crm-state-view.is-filled .crm-state-illustration {
  color: var(--crm-success);
  background: color-mix(in srgb, var(--crm-success) 18%, transparent);
}
</style>
