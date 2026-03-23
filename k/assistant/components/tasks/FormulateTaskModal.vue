<template>
  <Teleport to="body">
    <div
      v-if="props.show"
      class="formulate-modal-backdrop"
      @click.self="onCancel"
    >
      <div class="crt-form-panel formulate-modal">
        <button
          type="button"
          class="formulate-modal-close"
          aria-label="Закрыть"
          @click="onCancel"
        >
          <i class="fas fa-times" aria-hidden="true" />
        </button>

        <h3 class="formulate-modal-title">Сформулировать задачу</h3>
        
        <p class="formulate-modal-desc">
          Опишите работу, которую нужно выполнить в рамках проекта.
          AI проанализирует запрос и создаст структуру задач.
        </p>

        <textarea
          ref="queryInput"
          v-model="query"
          class="formulate-modal-textarea"
          placeholder="Например: Нужно реализовать авторизацию пользователя через email и пароль, с возможностью восстановления пароля"
          rows="8"
          :disabled="loading"
        />

        <div v-if="error" class="formulate-modal-error">
          {{ error }}
        </div>

        <div class="formulate-modal-actions">
          <button
            type="button"
            class="formulate-modal-btn formulate-modal-btn--secondary"
            :disabled="loading"
            @click="onCancel"
          >
            Отмена
          </button>
          <button
            type="button"
            class="formulate-modal-btn formulate-modal-btn--primary"
            :disabled="loading || !query.trim()"
            @click="onSubmit"
          >
            <span v-if="!loading">Сформулировать</span>
            <span v-else>
              <i class="fas fa-spinner fa-spin" aria-hidden="true" />
              Обработка...
            </span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  submit: [query: string]
  cancel: []
}>()

const query = ref('')
const loading = ref(false)
const error = ref('')
const queryInput = ref<HTMLTextAreaElement | null>(null)

watch(() => props.show, async (newVal) => {
  if (newVal) {
    query.value = ''
    error.value = ''
    await nextTick()
    queryInput.value?.focus()
  }
})

function onCancel() {
  if (loading.value) return
  emit('cancel')
}

function onSubmit() {
  const q = query.value.trim()
  if (!q || loading.value) return
  
  error.value = ''
  loading.value = true
  
  emit('submit', q)
}

function setLoading(val: boolean) {
  loading.value = val
}

function setError(msg: string) {
  error.value = msg
  loading.value = false
}

defineExpose({ setLoading, setError })
</script>

<style scoped>
.formulate-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.formulate-modal {
  max-width: 600px;
  width: 100%;
  position: relative;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.formulate-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #ff3366;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
  transition: transform 0.2s;
  z-index: 1;
}

.formulate-modal-close:hover {
  transform: scale(1.1);
}

.formulate-modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-right: 2rem;
}

.formulate-modal-desc {
  color: #a0a0a0;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.formulate-modal-textarea {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 51, 102, 0.3);
  border-radius: 4px;
  color: #ffffff;
  font-family: inherit;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.formulate-modal-textarea:focus {
  outline: none;
  border-color: #ff3366;
  box-shadow: 0 0 0 3px rgba(255, 51, 102, 0.1);
}

.formulate-modal-textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.formulate-modal-textarea::placeholder {
  color: #666;
}

.formulate-modal-error {
  color: #ff3366;
  margin: 1rem 0 0 0;
  padding: 0.75rem;
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid rgba(255, 51, 102, 0.3);
  border-radius: 4px;
  font-size: 0.9rem;
}

.formulate-modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.formulate-modal-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: auto;
}

.formulate-modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.formulate-modal-btn--secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.formulate-modal-btn--secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.formulate-modal-btn--primary {
  background: #ff3366;
  color: #ffffff;
}

.formulate-modal-btn--primary:hover:not(:disabled) {
  background: #ff1a4d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 51, 102, 0.3);
}

@media (max-width: 640px) {
  .formulate-modal {
    max-width: 100%;
  }
  
  .formulate-modal-actions {
    flex-direction: column;
  }
  
  .formulate-modal-btn {
    width: 100%;
  }
}
</style>