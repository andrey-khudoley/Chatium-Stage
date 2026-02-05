<template>
  <Transition name="modal">
    <div v-if="visible" class="logout-modal-overlay" @click="onCancel">
      <div class="logout-modal" @click.stop>
        <p class="logout-message">Выйти из аккаунта?</p>
        <div class="logout-buttons">
          <button type="button" class="logout-btn logout-btn-cancel" @click="onCancel">Нет</button>
          <button type="button" class="logout-btn logout-btn-confirm" @click="onConfirm">Да, выйти</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('LogoutModal')

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

watch(() => props.visible, (v) => {
  if (v) log.info('Logout modal displayed')
})

function onConfirm() {
  log.notice('Logout confirmed by user')
  emit('confirm')
}

function onCancel() {
  log.info('Logout cancelled by user')
  emit('cancel')
}

onMounted(() => {
  log.debug('Component mounted')
})
</script>

<style scoped>
.logout-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 46, 31, 0.4);
  backdrop-filter: blur(4px);
}

.logout-modal {
  background: var(--color-bg);
  border-radius: 12px;
  padding: 2rem 2.5rem;
  max-width: 380px;
  width: calc(100% - 2rem);
  box-shadow: 0 8px 32px rgba(26, 46, 31, 0.12);
  border: 1px solid var(--color-border);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .logout-modal,
.modal-leave-active .logout-modal {
  transition: transform 0.2s ease;
}
.modal-enter-from .logout-modal {
  transform: scale(0.96);
}
.modal-leave-to .logout-modal {
  transform: scale(0.98);
}

.logout-message {
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
  margin: 0 0 1.5rem 0;
}

.logout-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.logout-btn {
  min-width: 100px;
  padding: 0.625rem 1.25rem;
  font-family: 'Mulish', system-ui, sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.logout-btn-cancel {
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
}

.logout-btn-cancel:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
}

.logout-btn-confirm {
  color: var(--color-bg);
  background: var(--color-green);
  border: none;
}

.logout-btn-confirm:hover {
  background: var(--color-green-medium);
}

@media (max-width: 480px) {
  .logout-modal {
    padding: 1.5rem 1.25rem;
  }
  .logout-buttons {
    flex-direction: column;
  }
  .logout-btn {
    width: 100%;
    min-width: auto;
  }
}
</style>
