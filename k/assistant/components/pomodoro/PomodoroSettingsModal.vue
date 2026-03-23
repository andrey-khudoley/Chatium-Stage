<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { PomodoroAfterLongRest } from '../../tables/pomodoro-state.table'

type SettingsDraft = {
  workMinutes: number
  restMinutes: number
  longRestMinutes: number
  cyclesUntilLongRest: number
  pauseAfterWork: boolean
  pauseAfterRest: boolean
  afterLongRest: PomodoroAfterLongRest
  autoStartRest: boolean
  autoStartNextCycle: boolean
}

const props = defineProps<{
  isOpen: boolean
  saving: boolean
  modelValue: SettingsDraft
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save', payload: SettingsDraft): void
}>()

const draft = reactive<SettingsDraft>({
  workMinutes: 25,
  restMinutes: 5,
  longRestMinutes: 20,
  cyclesUntilLongRest: 4,
  pauseAfterWork: false,
  pauseAfterRest: false,
  afterLongRest: 'pause',
  autoStartRest: false,
  autoStartNextCycle: false
})

function clamp(v: number, min: number, max: number): number {
  const n = Number.isFinite(v) ? Math.floor(v) : min
  return Math.max(min, Math.min(max, n))
}

function syncDraft(source: SettingsDraft): void {
  draft.workMinutes = clamp(source.workMinutes, 1, 180)
  draft.restMinutes = clamp(source.restMinutes, 1, 180)
  draft.longRestMinutes = clamp(source.longRestMinutes, 1, 180)
  draft.cyclesUntilLongRest = clamp(source.cyclesUntilLongRest, 1, 12)
  draft.pauseAfterWork = !!source.pauseAfterWork
  draft.pauseAfterRest = !!source.pauseAfterRest
  draft.afterLongRest = source.afterLongRest === 'stop' ? 'stop' : 'pause'
  draft.autoStartRest = !!source.autoStartRest
  draft.autoStartNextCycle = !!source.autoStartNextCycle
}

watch(
  () => props.modelValue,
  (value) => syncDraft(value),
  { immediate: true, deep: true }
)

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) syncDraft(props.modelValue)
  }
)

function onBackdropClick(event: MouseEvent): void {
  if (event.target !== event.currentTarget || props.saving) return
  emit('close')
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !props.saving) emit('close')
}

function submit(): void {
  emit('save', { ...draft })
}
</script>

<template>
  <teleport to="body">
    <div v-if="props.isOpen" class="settings-overlay" @click="onBackdropClick" @keydown="onKeyDown" tabindex="0">
      <section class="settings-modal">
        <header class="settings-head">
          <h3>Настройки Pomodoro</h3>
          <button class="modal-close" type="button" :disabled="props.saving" @click="emit('close')">
            <i class="fa-solid fa-xmark" />
          </button>
        </header>
        <div class="settings-grid">
          <label>Работа, мин <input v-model.number="draft.workMinutes" class="jn-input" type="number" min="1" max="180" /></label>
          <label>Отдых, мин <input v-model.number="draft.restMinutes" class="jn-input" type="number" min="1" max="180" /></label>
          <label>Длинный отдых, мин <input v-model.number="draft.longRestMinutes" class="jn-input" type="number" min="1" max="180" /></label>
          <label>Циклов до длинного <input v-model.number="draft.cyclesUntilLongRest" class="jn-input" type="number" min="1" max="12" /></label>
          <div class="settings-divider"></div>
          <label class="settings-section-title">Режим автопилота</label>
          <label><input v-model="draft.autoStartRest" type="checkbox" /> Автостарт отдыха</label>
          <label><input v-model="draft.autoStartNextCycle" type="checkbox" /> Автостарт следующего цикла</label>
          <div class="settings-divider"></div>
          <label class="settings-section-title">Ручные паузы</label>
          <label><input v-model="draft.pauseAfterWork" type="checkbox" /> Пауза после работы</label>
          <label><input v-model="draft.pauseAfterRest" type="checkbox" /> Пауза после отдыха</label>
          <label>После длинного отдыха
            <select v-model="draft.afterLongRest" class="jn-input">
              <option value="pause">Пауза</option>
              <option value="stop">Выключать</option>
            </select>
          </label>
        </div>
        <footer class="settings-actions">
          <button class="journal-nav-btn" type="button" :disabled="props.saving" @click="emit('close')">Отмена</button>
          <button class="journal-nav-action" type="button" :disabled="props.saving" @click="submit">
            {{ props.saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, .72);
  z-index: 80;
  display: grid;
  place-items: center;
  padding: .8rem;
}
.settings-modal {
  width: min(460px, 95vw);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  padding: .8rem;
}
.settings-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .6rem;
  margin-bottom: .65rem;
}
.settings-head h3 {
  margin: 0;
  font-size: .95rem;
  letter-spacing: .05em;
  text-transform: uppercase;
}
.modal-close {
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 8px;
  width: 2rem;
  height: 2rem;
}
.settings-grid {
  display: grid;
  gap: .55rem;
}
.settings-grid label {
  display: grid;
  gap: .3rem;
  font-size: .82rem;
}
.settings-actions {
  margin-top: .8rem;
  display: flex;
  justify-content: flex-end;
  gap: .45rem;
}
.settings-divider {
  height: 1px;
  background: var(--color-border);
  margin: .4rem 0;
  grid-column: 1 / -1;
}
.settings-section-title {
  font-weight: 600;
  text-transform: uppercase;
  font-size: .75rem;
  letter-spacing: .08em;
  color: var(--color-text);
  margin-top: .2rem;
  grid-column: 1 / -1;
}
</style>