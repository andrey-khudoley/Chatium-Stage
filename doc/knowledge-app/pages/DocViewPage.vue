<template>
  <div class="doc-view-page">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="header-title-section">
          <h1>
            <i class="fas fa-book-open-reader"></i>
            {{ docName }}
          </h1>
          <p class="header-subtitle">Просмотр документации</p>
        </div>
        <div class="header-actions">
          <ThemeToggle />
          <a :href="backUrl" class="btn btn-ghost" title="Вернуться в список">
            <i class="fas fa-arrow-left"></i>
            <span class="btn-text">Назад</span>
          </a>
          <a :href="editUrl" class="btn btn-primary">
            <i class="fas fa-pen-to-square"></i>
            <span class="btn-text">Редактировать</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Контент -->
    <div class="container">
      <!-- Ошибка -->
      <div v-if="error" class="alert alert-error" style="margin-bottom: 1.5rem;">
        <i class="fas fa-circle-exclamation" style="flex-shrink: 0;"></i>
        <div>
          <strong>Ошибка загрузки</strong>
          <p style="margin-top: 0.25rem;">{{ error }}</p>
        </div>
        <button class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" @click="loadDoc">
          Повторить
        </button>
      </div>

      <!-- Skeleton Loader -->
      <div v-if="loading">
        <SkeletonLoader type="document" />
      </div>

      <!-- Контент документа -->
      <div v-else-if="content" class="doc-content card markdown-preview" v-html="renderedMarkdown"></div>
    </div>

    <!-- Footer -->
    <Footer />

    <!-- Scroll to Top Button -->
    <ScrollToTop />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getDocRoute } from '../api/docs'
import { indexPageRoute, docEditRoute } from '../index'
import ThemeToggle from '../shared/ThemeToggle.vue'
import SkeletonLoader from '../shared/SkeletonLoader.vue'
import Footer from '../shared/Footer.vue'
import ScrollToTop from '../shared/ScrollToTop.vue'

const props = defineProps<{
  documentFilename: string
  ssrContent?: string
  ssrHtml?: string
  ssrError?: string
}>()

// Инициализируем из SSR данных
const content = ref(props.ssrContent || (window as any).__SSR_MARKDOWN__ || '')
const loading = ref(!content.value)
const error = ref<string | null>(props.ssrError || (window as any).__SSR_ERROR__ || null)
const renderTrigger = ref(0)

const docName = computed(() => {
  return props.documentFilename
})

const backUrl = computed(() => indexPageRoute.url())
const editUrl = computed(() => docEditRoute.query({ filename: props.documentFilename }).url())

const renderedMarkdown = computed(() => {
  renderTrigger.value
  if (!content.value) return ''
  
  try {
    const marked = (window as any).marked
    if (!marked || typeof marked.parse !== 'function') {
      // Используем SSR HTML пока marked не загружен
      const ssrHtml = props.ssrHtml || (window as any).__SSR_HTML__
      if (ssrHtml) return ssrHtml
      return `<div class="alert alert-info"><i class="fas fa-hourglass-start"></i> Инициализация рендеринга...</div>`
    }
    // Используем marked.js для более качественного рендеринга
    return marked.parse(content.value)
  } catch (e) {
    // Fallback на SSR HTML при ошибке
    const ssrHtml = props.ssrHtml || (window as any).__SSR_HTML__
    if (ssrHtml) return ssrHtml
    return `<div class="alert alert-error"><i class="fas fa-circle-exclamation"></i> Ошибка рендеринга: ${String(e)}</div>`
  }
})

async function loadDoc() {
  // Если уже есть SSR контент, не загружаем повторно
  if (content.value) {
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = null

  try {
    const result = await getDocRoute.query({ filename: props.documentFilename }).run(ctx)
    if (result.success) {
      content.value = result.data
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

onMounted(async () => {
  // Переключаемся на marked.js когда он загрузится (для лучшего рендеринга)
  const checkMarked = setInterval(() => {
    if ((window as any).marked && typeof (window as any).marked.parse === 'function') {
      renderTrigger.value++
      clearInterval(checkMarked)
    }
  }, 50)

  // Загружаем контент только если его нет из SSR
  await loadDoc()
})
</script>

<style scoped>
.doc-view-page {
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.doc-content {
  background: var(--bg-primary);
  margin-bottom: 2rem;
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
    white-space: normal;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .btn-text {
    display: inline;
  }
}
</style>