<template>
  <section class="crm-surface crm-card">
    <header class="crm-card-title">
      <div class="crm-stack">
        <h2>{{ title }}</h2>
        <p class="crm-card-subtitle">{{ subtitle }}</p>
      </div>
      <div class="crm-row">
        <button
          type="button"
          class="crm-btn crm-btn-ghost crm-btn-sm"
          :class="{ 'is-active': mode === 'markdown' }"
          @click="setMode('markdown')"
        >
          <i class="fas fa-code"></i>
          {{ markdownLabel }}
        </button>
        <button
          type="button"
          class="crm-btn crm-btn-ghost crm-btn-sm"
          :class="{ 'is-active': mode === 'wysiwyg' }"
          @click="setMode('wysiwyg')"
        >
          <i class="fas fa-pen-nib"></i>
          {{ wysiwygLabel }}
        </button>
      </div>
    </header>

    <div v-if="mode === 'wysiwyg'" class="crm-note-toolbar">
      <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="exec('bold')"><i class="fas fa-bold"></i></button>
      <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="exec('italic')"><i class="fas fa-italic"></i></button>
      <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="exec('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
      <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="insertHeading"><i class="fas fa-heading"></i></button>
      <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="insertCode"><i class="fas fa-terminal"></i></button>
      <button type="button" class="crm-btn crm-btn-ghost crm-btn-sm" @click="insertCheckbox"><i class="fas fa-check-square"></i></button>
    </div>

    <textarea
      v-if="mode === 'markdown'"
      class="crm-textarea crm-note-markdown"
      :placeholder="placeholder"
      :value="modelValue"
      @input="onTextareaInput"
    ></textarea>

    <div
      v-else
      ref="visualRef"
      class="crm-note-visual"
      contenteditable="true"
      @input="onVisualInput"
      @blur="onVisualBlur"
    ></div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  title?: string
  subtitle?: string
  placeholder?: string
  markdownLabel?: string
  wysiwygLabel?: string
}>(), {
  title: 'Rich Text Notes',
  subtitle: '',
  placeholder: 'Start writing...',
  markdownLabel: 'Markdown',
  wysiwygLabel: 'WYSIWYG'
})

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const mode = ref<'markdown' | 'wysiwyg'>('markdown')
const visualRef = ref<HTMLDivElement | null>(null)

watch(() => props.modelValue, (value) => {
  if (mode.value === 'wysiwyg' && visualRef.value && visualRef.value.innerText !== value) {
    visualRef.value.innerText = value
  }
})

onMounted(() => {
  if (visualRef.value) {
    visualRef.value.innerText = props.modelValue
  }
})

function setMode(next: 'markdown' | 'wysiwyg'): void {
  mode.value = next
  if (next === 'wysiwyg' && visualRef.value) {
    visualRef.value.innerText = props.modelValue
  }
}

function onTextareaInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function onVisualInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLDivElement).innerText)
}

function onVisualBlur(event: Event): void {
  emit('update:modelValue', (event.target as HTMLDivElement).innerText)
}

function exec(command: string): void {
  document.execCommand(command)
}

function insertHeading(): void {
  document.execCommand('formatBlock', false, 'h3')
}

function insertCode(): void {
  document.execCommand('insertText', false, '`code`')
}

function insertCheckbox(): void {
  document.execCommand('insertText', false, '- [ ] ')
}
</script>

<style scoped>
.crm-note-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.crm-note-markdown {
  min-height: 14rem;
  font-family: var(--crm-font-tables);
}

.crm-note-visual {
  min-height: 14rem;
  border-radius: var(--crm-radius-md);
  border: 1px solid color-mix(in srgb, var(--crm-borderStrong) 72%, transparent);
  background: color-mix(in srgb, var(--crm-surfaceRaised) 88%, transparent);
  padding: 0.85rem;
  line-height: 1.56;
  color: var(--crm-text);
  font-family: var(--crm-font-body);
  outline: none;
  white-space: pre-wrap;
}

.crm-note-visual:focus {
  border-color: var(--crm-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--crm-accentSoft) 60%, transparent);
}

.is-active {
  border-color: var(--crm-accent) !important;
  color: var(--crm-text) !important;
  background: color-mix(in srgb, var(--crm-accentSoft) 34%, transparent) !important;
}
</style>
