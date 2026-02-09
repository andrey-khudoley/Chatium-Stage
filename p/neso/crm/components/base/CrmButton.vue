<template>
  <button
    type="button"
    class="crm-btn"
    :class="buttonClass"
    :disabled="disabled"
    @click="onClick"
  >
    <i v-if="icon" :class="icon" aria-hidden="true"></i>
    <span><slot /></span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: string
  disabled?: boolean
  block?: boolean
}>(), {
  variant: 'ghost',
  size: 'md',
  icon: '',
  disabled: false,
  block: false
})

const emit = defineEmits<{ click: [MouseEvent] }>()

const buttonClass = computed(() => [
  `crm-btn-${props.variant}`,
  props.size === 'sm' ? 'crm-btn-sm' : '',
  props.block ? 'crm-btn-block' : ''
])

function onClick(event: MouseEvent): void {
  if (props.disabled) return
  emit('click', event)
}
</script>

<style scoped>
.crm-btn-sm {
  min-height: calc(2rem * var(--crm-element-scale));
  padding: calc(0.52rem * var(--crm-element-scale)) calc(0.74rem * var(--crm-element-scale));
  font-size: 0.78rem;
}

.crm-btn-block {
  width: 100%;
}
</style>
