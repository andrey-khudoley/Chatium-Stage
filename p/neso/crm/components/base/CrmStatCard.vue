<template>
  <article class="crm-kpi">
    <div class="crm-inline">
      <i v-if="icon" :class="icon" aria-hidden="true"></i>
      <span class="crm-kpi-label">{{ label }}</span>
    </div>
    <div class="crm-kpi-value" :class="statusClass">
      {{ value }}
    </div>
    <p v-if="hint" class="crm-muted">{{ hint }}</p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value: string | number
  hint?: string
  icon?: string
  status?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}>(), {
  hint: '',
  icon: '',
  status: 'default'
})

const statusClass = computed(() => {
  if (props.status === 'success') return 'crm-status-success'
  if (props.status === 'warning') return 'crm-status-warning'
  if (props.status === 'danger') return 'crm-status-danger'
  if (props.status === 'info') return 'crm-status-info'
  return ''
})
</script>
