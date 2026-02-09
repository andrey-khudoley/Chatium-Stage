<script setup lang="ts">
/** Текстовое поле с иконкой, поддерживает тему. Не сливается с тёмным фоном. */
defineProps<{
  theme?: 'dark' | 'light'
  modelValue: string
  placeholder?: string
  /** FontAwesome класс иконки (например fa-font) */
  icon?: string
  hasError?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div
    class="dc-input-text"
    :class="[
      `theme-${theme ?? 'dark'}`,
      { 'dc-input-text--error': hasError }
    ]"
  >
    <i v-if="icon" class="fas dc-input-text__icon" :class="icon"></i>
    <input
      type="text"
      class="dc-input-text__field"
      :placeholder="placeholder"
      :value="modelValue"
      @input="emit('update:modelValue', (($event.target as HTMLInputElement).value))"
    />
  </div>
</template>

<style scoped>
.dc-input-text {
  --radius: 12px;
  --accent: #afc45f;
  --text: #eef4eb;
  --text3: rgba(238, 244, 235, 0.5);
  --border: rgba(175, 196, 95, 0.16);
  --error: #e85555;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.25s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.dc-input-text.theme-light {
  --accent: #4f6f2f;
  --text: #243523;
  --text3: #5a6652;
  --border: rgba(79, 111, 47, 0.2);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.dc-input-text:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(175, 196, 95, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.dc-input-text.theme-light:focus-within {
  box-shadow: 0 0 0 2px rgba(79, 111, 47, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
.dc-input-text--error {
  border-color: var(--error);
}
.dc-input-text__icon {
  color: var(--text3);
  width: 20px;
  flex-shrink: 0;
}
.dc-input-text__field {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
}
.dc-input-text__field::placeholder {
  color: var(--text3);
}
</style>
