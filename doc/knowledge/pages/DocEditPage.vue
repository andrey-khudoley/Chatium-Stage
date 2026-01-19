<template>
  <div class="doc-edit-page">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="header-title-section">
          <h1>
            <i v-if="isNewDoc" class="fas fa-file-circle-plus"></i>
            <i v-else class="fas fa-pen-to-square"></i>
            {{ isNewDoc ? 'Создать документ' : 'Редактировать' }}
          </h1>
          <p class="header-subtitle">
            {{ isNewDoc ? 'Новый markdown документ' : 'Редактирование документа' }}
          </p>
        </div>
        <div class="header-actions">
          <ThemeToggle />
          <a :href="backUrl" class="btn btn-ghost" title="Вернуться в список">
            <i class="fas fa-arrow-left"></i>
            <span class="btn-text">Назад</span>
          </a>
          <button class="btn btn-primary" @click="saveDoc" :disabled="saving || !hasChanges">
            <i class="fas fa-check-circle" v-if="!saving"></i>
            <i class="fas fa-spinner fa-spin" v-else></i>
            <span class="btn-text">{{ saving ? 'Сохраняется...' : 'Сохранить' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Контент -->
    <div class="container">
      <!-- Ошибка -->
      <div v-if="error" class="alert alert-error" style="margin-bottom: 1.5rem;">
        <i class="fas fa-circle-exclamation" style="flex-shrink: 0;"></i>
        <div>{{ error }}</div>
      </div>

      <!-- Успех -->
      <div v-if="saveSuccess" class="alert alert-success" style="margin-bottom: 1.5rem;">
        <i class="fas fa-circle-check" style="flex-shrink: 0;"></i>
        <div>✓ Документ успешно сохранён! {{ isNewDoc ? 'Переадресация...' : '' }}</div>
      </div>

      <!-- Skeleton Loader -->
      <div v-if="loading">
        <SkeletonLoader type="editor" />
      </div>

      <!-- Редактор -->
      <template v-else>
        <!-- Поле имени файла для нового документа -->
        <div v-if="isNewDoc" class="form-group">
          <label class="form-label">
            <i class="fas fa-file-name" style="margin-right: 0.5rem;"></i>
            Имя файла
          </label>
          <input 
            v-model="fileName" 
            type="text" 
            class="input" 
            placeholder="example.md"
            autocomplete="off"
          />
          <span class="form-hint">
            <i class="fas fa-info-circle" style="margin-right: 0.25rem;"></i>
            Введите имя с расширением (пример: guide.md, tutorial.markdown)
          </span>
        </div>

        <!-- Сетка редактор + превью -->
        <div class="page-grid">
          <!-- Левая колонка - редактор -->
          <div class="editor-section">
            <label class="editor-label">
              <i class="fas fa-keyboard" style="margin-right: 0.5rem;"></i>
              Редактор
            </label>
            <div class="editor-wrapper">
              <textarea
                v-model="content"
                @input="hasChanges = true"
                placeholder="Введите markdown здесь..."
                spellcheck="false"
              ></textarea>
            </div>
            <div class="editor-hint">
              <i class="fas fa-lightbulb" style="margin-right: 0.5rem;"></i>
              <span>Поддерживается markdown с синтаксисом GitHub</span>
            </div>
          </div>

          <!-- Правая колонка - превью -->
          <div class="preview-section">
            <label class="preview-label">
              <i class="fas fa-eye" style="margin-right: 0.5rem;"></i>
              Предпросмотр
            </label>
            <div class="preview-wrapper markdown-preview" v-html="renderedMarkdown"></div>
            <div class="preview-hint">
              <i class="fas fa-sync" style="margin-right: 0.5rem;"></i>
              <span>Обновляется автоматически</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Footer -->
    <Footer />

    <!-- Scroll to Top Button -->
    <ScrollToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getDocRoute, putDocRoute } from '../api/docs'
import { indexPageRoute } from '../index'
import ThemeToggle from '../shared/ThemeToggle.vue'
import SkeletonLoader from '../shared/SkeletonLoader.vue'
import Footer from '../shared/Footer.vue'
import ScrollToTop from '../shared/ScrollToTop.vue'

const props = defineProps<{
  documentFilename?: string
}>()

const content = ref('')
const originalContent = ref('')
const fileName = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const saveSuccess = ref(false)
const hasChanges = ref(false)
const renderTrigger = ref(0)

const isNewDoc = computed(() => !props.documentFilename)
const backUrl = computed(() => indexPageRoute.url())

const docFilename = computed(() => {
  if (!isNewDoc.value) {
    return props.documentFilename!
  }
  return fileName.value
})

const renderedMarkdown = computed(() => {
  renderTrigger.value
  if (!content.value) {
    return `<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
      <i class="fas fa-file-pen" style="font-size: 2rem; display: block; margin-bottom: 1rem; opacity: 0.5;"></i>
      Введите markdown текст слева
    </div>`
  }
  try {
    const marked = (window as any).marked
    if (!marked || typeof marked.parse !== 'function') {
      return `<div class="alert alert-info"><i class="fas fa-hourglass-start"></i> Инициализация...</div>`
    }
    return marked.parse(content.value)
  } catch (e) {
    return `<div class="alert alert-error"><i class="fas fa-circle-exclamation"></i> Ошибка: ${String(e)}</div>`
  }
})

async function loadDoc() {
  if (isNewDoc.value) return

  loading.value = true
  error.value = null

  try {
    const result = await getDocRoute.query({ filename: props.documentFilename }).run(ctx)
    if (result.success) {
      content.value = result.data
      originalContent.value = result.data
      hasChanges.value = false
    } else {
      error.value = result.error === 'NotFound' 
        ? 'Документ не найден' 
        : `Ошибка: ${result.error}`
    }
  } catch (e) {
    error.value = 'Ошибка загрузки: ' + String(e)
  } finally {
    loading.value = false
  }
}

async function saveDoc() {
  if (isNewDoc.value && !fileName.value) {
    error.value = '❌ Пожалуйста, укажите имя файла'
    return
  }

  if (!content.value) {
    error.value = '❌ Пожалуйста, введите содержимое документа'
    return
  }

  saving.value = true
  error.value = null
  saveSuccess.value = false

  try {
    const result = await putDocRoute.run(ctx, { 
      filename: docFilename.value, 
      markdown: content.value 
    })

    if (result.success) {
      originalContent.value = content.value
      hasChanges.value = false
      saveSuccess.value = true

      if (isNewDoc.value) {
        setTimeout(() => {
          window.location.href = indexPageRoute.url()
        }, 1500)
      } else {
        setTimeout(() => {
          saveSuccess.value = false
        }, 3000)
      }
    } else {
      const msg = result.error || 'Unknown error'
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        error.value = '🔐 Ошибка авторизации. Проверьте токен в настройках.'
      } else {
        error.value = `❌ ${msg}`
      }
    }
  } catch (e) {
    error.value = '❌ Ошибка: ' + String(e)
  } finally {
    saving.value = false
  }
}

watch(content, () => {
  if (content.value !== originalContent.value) {
    hasChanges.value = true
  }
})

onMounted(async () => {
  const checkMarked = setInterval(() => {
    if ((window as any).marked && typeof (window as any).marked.parse === 'function') {
      renderTrigger.value++
      clearInterval(checkMarked)
    }
  }, 50)

  if (!isNewDoc.value) {
    await loadDoc()
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.doc-edit-page {
  min-height: 100vh;
  background-color: var(--bg-secondary);
  transition: background-color 0.3s ease;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.header h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.875rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-text {
  display: inline;
}

@media (max-width: 968px) {
  .btn-text {
    display: none;
  }
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-hint {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  margin-top: 0.375rem;
}

.page-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.editor-section,
.preview-section {
  display: flex;
  flex-direction: column;
}

.editor-label,
.preview-label {
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.editor-wrapper {
  position: relative;
  flex: 1;
  border: 1.5px solid var(--border-secondary);
  border-radius: 0.75rem;
  overflow: hidden;
  background: var(--input-bg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.editor-wrapper:focus-within {
  border-color: var(--input-focus-border);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.editor-wrapper textarea {
  width: 100%;
  height: 600px;
  border: none;
  padding: 1.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  resize: none;
  background: var(--input-bg);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.editor-wrapper textarea:focus {
  outline: none;
}

.editor-hint,
.preview-hint {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.preview-wrapper {
  border: 1.5px solid var(--border-secondary);
  border-radius: 0.75rem;
  padding: 1.5rem;
  overflow-y: auto;
  height: 600px;
  background: var(--bg-primary);
  font-size: 0.95rem;
  line-height: 1.8;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

@media (max-width: 1024px) {
  .page-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .preview-wrapper,
  .editor-wrapper textarea {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 1rem 0;
    margin-bottom: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .btn-text {
    display: inline;
  }

  .page-grid {
    grid-template-columns: 1fr;
  }

  .preview-wrapper,
  .editor-wrapper textarea {
    height: 300px;
  }
}
</style>