<template>
  <span class="crm-chip" :class="variantClass">
    <i v-if="icon" :class="icon" aria-hidden="true"></i>
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  icon?: string
}>(), {
  variant: 'default',
  icon: ''
})

const variantClass = computed(() => {
  if (props.variant === 'success') return 'is-success'
  if (props.variant === 'warning') return 'is-warning'
  if (props.variant === 'danger') return 'is-danger'
  if (props.variant === 'info') return 'is-info'
  return ''
})
</script>
