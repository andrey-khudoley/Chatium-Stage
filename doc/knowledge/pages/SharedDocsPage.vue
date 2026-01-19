<template>
  <div class="shared-docs-page">
    <!-- Header без элементов управления -->
    <div class="header">
      <div class="header-content">
        <div class="header-title-section">
          <h1><i class="fas fa-book-open"></i> Публичная документация</h1>
          <p class="header-subtitle">Доступные для всех документы</p>
        </div>
        <div class="header-actions">
          <ThemeToggle />
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="container">
      <!-- Ошибка -->
      <div v-if="error" class="alert alert-error" style="margin-bottom: 1.5rem;">
        <i class="fas fa-circle-exclamation" style="flex-shrink: 0;"></i>
        <div style="flex: 1;">
          <strong>Ошибка</strong>
          <p style="margin-top: 0.25rem;">{{ error }}</p>
        </div>
        <button class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" @click="loadDocs">
          Повторить
        </button>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="flex-center" style="padding: 4rem 2rem;">
        <div style="text-align: center;">
          <div class="loading" style="margin: 0 auto 1.5rem; width: 2rem; height: 2rem;"></div>
          <p style="font-size: 1rem; color: var(--text-secondary);">Загрузка документов...</p>
        </div>
      </div>

      <!-- Skeleton Loader -->
      <div v-else-if="loadingInitial">
        <SkeletonLoader type="list" :count="5" />
      </div>

      <!-- Пусто -->
      <template v-else-if="sortedDocuments.length === 0">
        <div style="text-align: center; padding: 4rem 2rem;">
          <i class="fas fa-inbox" style="font-size: 3.5rem; color: var(--text-tertiary); margin-bottom: 1rem; display: block;"></i>
          <h3 style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Нет публичных документов</h3>
          <p style="color: var(--text-tertiary);">Публичные документы появятся здесь, когда администратор добавит их</p>
        </div>
      </template>

      <!-- Таблица документов (только чтение) -->
      <table v-if="sortedDocuments.length > 0" class="table">
        <thead>
          <tr>
            <th style="width: 60%;">
              <i class="fas fa-file-lines" style="margin-right: 0.5rem;"></i>Название
            </th>
            <th class="hide-mobile" style="width: 15%;">Размер</th>
            <th class="hide-mobile" style="width: 25%;">Изменено</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="doc in sortedDocuments" 
            :key="doc.key" 
            class="doc-row"
          >
            <td class="doc-name-cell">
              <a :href="getViewUrl(doc.key)" class="doc-link">
                <i class="fas fa-file-lines"></i>
                <span>{{ getDocName(doc.key) }}</span>
              </a>
            </td>
            <td class="hide-mobile">
              <span class="doc-size">{{ formatSize(doc.size) }}</span>
            </td>
            <td class="hide-mobile">
              <span class="doc-date" :title="new Date(doc.lastModified).toLocaleString()">
                {{ formatDate(doc.lastModified) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
declare const ctx: any

import { ref, computed, onMounted } from 'vue'
import { listSharedDocsRoute } from '../api/docs'
import { docViewRoute } from '../index'
import ThemeToggle from '../shared/ThemeToggle.vue'
import SkeletonLoader from '../shared/SkeletonLoader.vue'
import Footer from '../shared/Footer.vue'

interface Document {
  key: string
  size: number
  lastModified: string
}

const documents = ref<Document[]>([])
const loading = ref(false)
const loadingInitial = ref(true)
const error = ref<string | null>(null)

const sortedDocuments = computed(() => {
  return documents.value
    .sort((a, b) => getDocName(a.key).localeCompare(getDocName(b.key)))
})

async function loadDocs() {
  loading.value = true
  error.value = null

  try {
    const result = await listSharedDocsRoute.run(ctx)
    if (result.success) {
      documents.value = result.data.items || []
    } else {
      error.value = result.error || 'Ошибка загрузки документов'
    }
  } catch (e) {
    error.value = 'Ошибка загрузки: ' + String(e)
  } finally {
    loading.value = false
    loadingInitial.value = false
  }
}

function getDocName(filename: string): string {
  return filename
}

function getViewUrl(filename: string): string {
  return docViewRoute.query({ filename, public: '1' }).url()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await loadDocs()
})
</script>

<style scoped>
.shared-docs-page {
  min-height: 100vh;
  background-color: var(--bg-secondary);
  transition: background-color 0.3s ease;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.doc-link {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--link-primary);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  position: relative;
}

.doc-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--link-primary);
  opacity: 0.08;
  border-radius: 0.5rem;
  transition: opacity 0.2s ease;
  z-index: -1;
}

.doc-link i {
  opacity: 0.9;
  transition: opacity 0.2s ease;
}

.doc-link:hover {
  color: var(--link-hover);
  transform: translateX(2px);
}

.doc-link:hover::before {
  opacity: 0.12;
}

.doc-link:hover i {
  opacity: 1;
}

.doc-link span {
  font-weight: 600;
  position: relative;
}

.doc-size,
.doc-date {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.doc-name-cell {
  vertical-align: middle;
  word-break: break-word;
}

.doc-row {
  user-select: none;
}

/* Скрываем колонки на мобильных */
@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
