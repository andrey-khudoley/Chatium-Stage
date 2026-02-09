<template>
  <section class="crm-surface crm-card crm-section" :class="sectionClass">
    <header v-if="title || $slots.actions" class="crm-card-title">
      <div class="crm-stack">
        <h2 v-if="title">{{ title }}</h2>
        <p v-if="subtitle" class="crm-card-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="crm-row">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  variant?: 'default' | 'raised'
}>(), {
  title: '',
  subtitle: '',
  variant: 'default'
})

const sectionClass = computed(() => props.variant === 'raised' ? 'crm-surface-raised' : '')
</script>
