<template>
  <label class="crm-field">
    <span v-if="label" class="crm-field-label">{{ label }}</span>
    <select class="crm-select" :value="modelValue" :disabled="disabled" @change="onChange">
      <option
        v-for="item in options"
        :key="item.value"
        :value="item.value"
      >
        {{ item.label }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
export interface CrmSelectOption {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  disabled?: boolean
  options: CrmSelectOption[]
}>(), {
  label: '',
  disabled: false
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value)
}
</script>
