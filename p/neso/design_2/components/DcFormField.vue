<script setup lang="ts">
defineProps<{
  theme?: 'dark' | 'light'
  label?: string
  error?: string
  hint?: string
  hasError?: boolean
  type?: 'text' | 'email' | 'textarea'
  placeholder?: string
  icon?: string
  iconPosition?: 'left' | 'right'
  rows?: number
}>()
</script>

<template>
  <label class="dc-field" :class="[`theme-${theme ?? 'dark'}`, { error: hasError }]">
    <span v-if="label" class="dc-field-label">{{ label }}</span>
    <div v-if="type !== 'textarea'" class="dc-input-wrap">
      <i v-if="icon && iconPosition !== 'right'" :class="['fas', icon]"></i>
      <input
        :type="type ?? 'text'"
        :placeholder="placeholder"
        class="dc-input"
      />
      <i v-if="icon && iconPosition === 'right'" :class="['fas', icon]"></i>
    </div>
    <textarea
      v-else
      :placeholder="placeholder"
      :rows="rows ?? 3"
      class="dc-textarea"
    ></textarea>
    <span v-if="error" class="dc-field-error">{{ error }}</span>
    <span v-if="hint && !error" class="dc-field-hint">{{ hint }}</span>
  </label>
</template>

<style scoped>
.dc-field {
  --radius: 12px;
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --error: #e85555;
  --border: rgba(175, 196, 95, 0.16);
  display: block;
}
.dc-field.theme-light {
  --accent: #4f6f2f;
  --text: #243523;
  --text2: #3d4a35;
  --text3: #5a6652;
  --error: #c53d3d;
  --border: rgba(79, 111, 47, 0.2);
}
.dc-field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.dc-input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.25s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.dc-field.theme-light .dc-input-wrap {
  background: rgba(255,255,255,0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.dc-input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(175, 196, 95, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.dc-field.theme-light .dc-input-wrap:focus-within {
  box-shadow: 0 0 0 2px rgba(79, 111, 47, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
.dc-field.error .dc-input-wrap { border-color: var(--error); }
.dc-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
}
.dc-input-wrap i { color: var(--text3); }
.dc-textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}
.dc-field.theme-light .dc-textarea {
  background: rgba(255,255,255,0.8);
}
.dc-textarea:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 2px rgba(175, 196, 95, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.dc-field-error { font-size: 0.8rem; color: var(--error); margin-top: 6px; display: block; }
.dc-field-hint { font-size: 0.8rem; color: var(--text3); margin-top: 6px; display: block; }
</style>
