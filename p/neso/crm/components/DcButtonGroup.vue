<script setup lang="ts">
/** Группа кнопок выбора одного значения (например уровень логирования). */
defineProps<{
  theme?: 'dark' | 'light'
  /** Текущее выбранное значение */
  modelValue: string
  /** Варианты: { value, label } */
  options: { value: string; label: string }[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="dc-button-group" :class="`theme-${theme ?? 'dark'}`">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="dc-button-group__btn"
      :class="{ 'dc-button-group__btn--active': modelValue === opt.value }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.dc-button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.dc-button-group__btn {
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --border: rgba(175, 196, 95, 0.16);
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.dc-button-group__btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}
.dc-button-group__btn--active {
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.35) 0%,
      transparent 40%,
      rgba(0, 0, 0, 0.06) 100%
    ),
    var(--accent);
  color: #05080a;
  border-color: transparent;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(175, 196, 95, 0.25);
}
.dc-button-group.theme-light .dc-button-group__btn {
  --accent: #4f6f2f;
  --text: #1f2f1d;
  --text2: #34432f;
  --border: rgba(79, 111, 47, 0.2);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text2);
}
.dc-button-group.theme-light .dc-button-group__btn--active {
  color: white;
  background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.5) 0%,
      transparent 40%,
      rgba(79, 111, 47, 0.2) 100%
    ),
    var(--accent);
  box-shadow: 0 4px 12px rgba(79, 111, 47, 0.2);
}
</style>
