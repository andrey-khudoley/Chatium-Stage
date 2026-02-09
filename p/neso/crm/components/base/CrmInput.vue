<template>
  <label class="crm-field">
    <span v-if="label" class="crm-field-label">{{ label }}</span>
    <input
      v-if="!textarea"
      class="crm-input"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />
    <textarea
      v-else
      class="crm-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />
    <span v-if="hint" class="crm-muted">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
  type?: string
  textarea?: boolean
}>(), {
  label: '',
  hint: '',
  placeholder: '',
  disabled: false,
  type: 'text',
  textarea: false
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

function onInput(event: Event): void {
  const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value
  emit('update:modelValue', value)
}
</script>
