<template>
  <div class="docs-list-page">
    <!-- Header с glassmorphism -->
    <div class="header">
      <div class="header-content">
        <div class="header-title-section">
          <h1><i class="fas fa-book"></i> Knowledge Base</h1>
          <p class="header-subtitle">Управление документацией вашего проекта</p>
        </div>
        <div class="header-actions">
          <ThemeToggle />
          <button class="btn btn-ghost" @click="showSettings = true" title="Настройки">
            <i class="fas fa-sliders-h"></i>
            <span class="btn-text">Настройки</span>
          </button>
          <button class="btn btn-primary" @click="createNew">
            <i class="fas fa-plus-circle"></i>
            <span class="btn-text">Создать</span>
          </button>
          <button class="btn btn-secondary" @click="triggerFileUpload">
            <i class="fas fa-cloud-upload-alt"></i>
            <span class="btn-text">Загрузить</span>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".md,.markdown,.txt"
            multiple
            style="display: none"
            @change="handleFileSelect"
          />
          <button class="btn btn-ghost" @click="loadDocs" :disabled="loading" title="Обновить">
            <i class="fas fa-rotate-right" :class="{ 'fa-spin': loading }"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div 
      class="container"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- Drag and Drop Overlay -->
      <div v-if="isDragging" class="drag-overlay">
        <div class="drag-content">
          <i class="fas fa-cloud-upload-alt"></i>
          <h2>Перетащите файлы сюда</h2>
          <p>Поддерживаются форматы .md, .markdown, .txt</p>
          <p style="font-size: 0.95rem; opacity: 0.85;">Можно загружать несколько файлов одновременно</p>
        </div>
      </div>

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

      <!-- Успех -->
      <div v-if="uploadSuccess" class="alert alert-success" style="margin-bottom: 1.5rem;">
        <i class="fas fa-circle-check" style="flex-shrink: 0;"></i>
        <div>{{ uploadSuccess }}</div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="flex-center" style="padding: 4rem 2rem;">
        <div style="text-align: center;">
          <div class="loading" style="margin: 0 auto 1.5rem; width: 2rem; height: 2rem;"></div>
          <p style="font-size: 1rem; color: var(--text-secondary);">Загружение документов...</p>
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
          <h3 style="font-size: 1.25rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Нет документов</h3>
          <p style="color: var(--text-tertiary); margin-bottom: 2rem;">Создайте первый документ или загрузите файлы</p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" @click="createNew">
              <i class="fas fa-plus-circle"></i> Создать документ
            </button>
            <button class="btn btn-secondary" @click="triggerFileUpload">
              <i class="fas fa-cloud-upload-alt"></i> Загрузить файлы
            </button>
          </div>
        </div>
      </template>

      <!-- Панель выбранных файлов -->
      <div v-if="selectedDocuments.size > 0" class="selection-panel">
        <div class="selection-info">
          <i class="fas fa-check-circle"></i>
          <span>Выбрано: {{ selectedDocuments.size }}</span>
        </div>
        <div class="selection-actions">
          <button class="btn btn-danger" @click="deleteSelected" :disabled="deleting">
            <i v-if="deleting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-trash-can"></i>
            <span>Удалить выбранные</span>
          </button>
          <button class="btn btn-ghost" @click="clearSelection">
            <i class="fas fa-times"></i>
            <span>Отменить выбор</span>
          </button>
        </div>
      </div>

      <!-- Таблица документов -->
      <table v-if="sortedDocuments.length > 0" class="table">
        <thead>
          <tr>
            <th style="width: 3rem;">
              <input 
                type="checkbox" 
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
                class="doc-checkbox"
                title="Выбрать все"
              />
            </th>
            <th style="width: 45%;">
              <i class="fas fa-file-lines" style="margin-right: 0.5rem;"></i>Название
            </th>
            <th class="hide-mobile" style="width: 15%;">Размер</th>
            <th class="hide-mobile" style="width: 20%;">Изменено</th>
            <th style="width: 12%; text-align: center;">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(doc, index) in sortedDocuments" 
            :key="doc.key" 
            class="doc-row"
            :class="{ 'selected': selectedDocuments.has(doc.key) }"
            @mousedown="handleRowMouseDown(index, $event)"
            @mouseenter="handleRowMouseEnter(index)"
          >
            <td class="doc-checkbox-cell">
              <input 
                type="checkbox" 
                :checked="selectedDocuments.has(doc.key)"
                @click.stop="toggleDocumentSelection(doc.key, index, $event)"
                class="doc-checkbox"
              />
            </td>
            <td class="doc-name-cell">
              <a :href="getViewUrl(doc.key)" class="doc-link" @click.stop @mousedown.stop>
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
            <td class="doc-actions-cell">
              <div class="doc-actions">
                <a :href="getEditUrl(doc.key)" class="action-btn" title="Редактировать" @click.stop @mousedown.stop>
                  <i class="fas fa-pen-to-square"></i>
                </a>
                <button
                  class="action-btn danger"
                  @click.stop="confirmDelete(doc)"
                  @mousedown.stop
                  title="Удалить"
                >
                  <i class="fas fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <Footer />

    <!-- Scroll to Top Button -->
    <ScrollToTop />

    <!-- Settings Modal -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal-content">
        <div class="modal-header">
          <i class="fas fa-sliders-h" style="margin-right: 0.75rem;"></i>
          Настройки
        </div>
        <div class="modal-body">
          <div v-if="settingsError" class="alert alert-error">
            <i class="fas fa-circle-exclamation"></i>
            {{ settingsError }}
          </div>
          <div v-if="settingsSaved" class="alert alert-success">
            <i class="fas fa-circle-check"></i>
            Настройки успешно сохранены!
          </div>

          <div class="form-group">
            <label class="form-label">📍 Base URL функции</label>
            <input v-model="baseUrl" type="text" class="input" placeholder="https://..." />
            <span class="form-hint">URL вашего Yandex Cloud Functions API Gateway</span>
          </div>

          <div class="form-group">
            <label class="form-label">🔐 Админский токен</label>
            <input v-model="adminToken" type="password" class="input" placeholder="Токен" />
            <span class="form-hint">Токен для доступа к S3 хранилищу</span>
          </div>

          <div class="form-group">
            <label class="form-label">🎨 Тема по умолчанию</label>
            <select v-model="defaultTheme" class="input">
              <option value="light">☀️ Светлая</option>
              <option value="dark">🌙 Тёмная</option>
            </select>
            <span class="form-hint">Тема для новых пользователей</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="showSettings = false">Отмена</button>
          <button class="btn btn-primary" @click="saveSettings" :disabled="savingSettings">
            <i class="fas fa-save" v-if="!savingSettings"></i>
            <i class="fas fa-spinner fa-spin" v-else></i>
            {{ savingSettings ? 'Сохраняется...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deleteConfirm" class="modal-overlay" @click.self="deleteConfirm = null">
      <div class="modal-content">
        <div class="modal-header">
          <i class="fas fa-triangle-exclamation" style="margin-right: 0.75rem; color: #ef4444;"></i>
          Удалить документ?
        </div>
        <div class="modal-body">
          <p>Вы действительно хотите удалить документ <strong>{{ getDocName(deleteConfirm.key) }}</strong>?</p>
          <p style="margin-top: 1rem; color: var(--text-tertiary); font-size: 0.875rem;">
            <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
            Это действие невозможно отменить.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="deleteConfirm = null">Отмена</button>
          <button class="btn btn-danger" @click="deleteDoc" :disabled="deleting">
            <i class="fas fa-trash-can" v-if="!deleting"></i>
            <i class="fas fa-spinner fa-spin" v-else></i>
            {{ deleting ? 'Удаляется...' : 'Удалить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDocRoute, listDocsRoute, putDocRoute, deleteDocRoute } from '../api/docs'
import { getSettingRoute, saveSettingRoute } from '../api/settings'
import { getDefaultThemeRoute, saveDefaultThemeRoute } from '../api/theme'
import { docViewRoute, docEditRoute, docCreateRoute } from '../index'
import ThemeToggle from '../shared/ThemeToggle.vue'
import SkeletonLoader from '../shared/SkeletonLoader.vue'
import Footer from '../shared/Footer.vue'
import ScrollToTop from '../shared/ScrollToTop.vue'

interface Document {
  key: string
  size: number
  lastModified: string
}

const documents = ref<Document[]>([])
const loading = ref(false)
const loadingInitial = ref(true)
const error = ref<string | null>(null)
const uploadSuccess = ref<string | null>(null)
const showSettings = ref(false)
const baseUrl = ref('https://d5dufuc4uj90lbcrvpac.4b4k4pg5.apigw.yandexcloud.net')
const adminToken = ref('123')
const defaultTheme = ref<'light' | 'dark'>('light')
const settingsError = ref<string | null>(null)
const settingsSaved = ref(false)
const savingSettings = ref(false)
const deleteConfirm = ref<Document | null>(null)
const deleting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const dragCounter = ref(0)
const uploading = ref(false)

// Множественный выбор
const selectedDocuments = ref<Set<string>>(new Set())
const lastSelectedIndex = ref<number>(-1)
const isMouseSelecting = ref(false)
const mouseSelectionStart = ref<number>(-1)

const isDragging = computed(() => dragCounter.value > 0)

const sortedDocuments = computed(() => {
  return documents.value
    .filter(doc => doc.size > 0 && !doc.key.endsWith('/'))
    .sort((a, b) => getDocName(a.key).localeCompare(getDocName(b.key)))
})

const allSelected = computed(() => {
  return sortedDocuments.value.length > 0 && 
         sortedDocuments.value.every(doc => selectedDocuments.value.has(doc.key))
})

const someSelected = computed(() => {
  return selectedDocuments.value.size > 0 && !allSelected.value
})

async function loadSettings() {
  try {
    const tokenRes = await getSettingRoute.query({ key: 'adminToken' }).run(ctx)
    if (tokenRes.success) {
      adminToken.value = tokenRes.value
    }
  } catch (e) {
    // Use default
  }

  try {
    const urlRes = await getSettingRoute.query({ key: 'baseUrl' }).run(ctx)
    if (urlRes.success) {
      baseUrl.value = urlRes.value
    }
  } catch (e) {
    // Use default
  }

  try {
    const themeRes = await getDefaultThemeRoute.query().run(ctx)
    if (themeRes.success && themeRes.theme) {
      defaultTheme.value = themeRes.theme
    }
  } catch (e) {
    // Use default
  }
}

async function saveSettings() {
  savingSettings.value = true
  settingsError.value = null
  settingsSaved.value = false

  try {
    await saveSettingRoute.run(ctx, { key: 'adminToken', value: adminToken.value })
    await saveSettingRoute.run(ctx, { key: 'baseUrl', value: baseUrl.value })
    await saveDefaultThemeRoute.run(ctx, { theme: defaultTheme.value })

    settingsSaved.value = true
    setTimeout(() => {
      showSettings.value = false
      loadDocs()
    }, 1500)
  } catch (e) {
    settingsError.value = String(e)
  } finally {
    savingSettings.value = false
  }
}

async function loadDocs() {
  loading.value = true
  error.value = null
  uploadSuccess.value = null

  try {
    const result = await listDocsRoute.run(ctx)
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
  return docViewRoute.query({ filename }).url()
}

function getEditUrl(filename: string): string {
  return docEditRoute.query({ filename }).url()
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

function createNew() {
  window.location.href = docCreateRoute.url()
}

function confirmDelete(doc: Document) {
  deleteConfirm.value = doc
}

async function deleteDoc() {
  if (!deleteConfirm.value) return

  deleting.value = true
  try {
    const result = await deleteDocRoute.run(ctx, { filename: deleteConfirm.value.key })
    if (result.success) {
      documents.value = documents.value.filter(d => d.key !== deleteConfirm.value!.key)
      deleteConfirm.value = null
      uploadSuccess.value = 'Документ успешно удален'
      setTimeout(() => {
        uploadSuccess.value = null
      }, 3000)
    } else {
      error.value = 'Ошибка удаления: ' + result.error
    }
  } catch (e) {
    error.value = 'Ошибка удаления: ' + String(e)
  } finally {
    deleting.value = false
  }
}

function triggerFileUpload() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    await uploadFiles(Array.from(input.files))
    input.value = ''
  }
}

function handleDragEnter(event: DragEvent) {
  dragCounter.value++
}

function handleDragOver(event: DragEvent) {
  // Prevent default to allow drop
}

function handleDragLeave(event: DragEvent) {
  dragCounter.value--
  if (dragCounter.value < 0) {
    dragCounter.value = 0
  }
}

async function handleDrop(event: DragEvent) {
  dragCounter.value = 0
  
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    await uploadFiles(Array.from(event.dataTransfer.files))
  }
}

async function uploadFiles(files: File[]) {
  if (files.length === 0) return
  
  uploading.value = true
  error.value = null
  uploadSuccess.value = null
  
  const allowedExtensions = ['.md', '.markdown', '.txt']
  const validFiles: File[] = []
  const invalidFiles: string[] = []
  
  for (const file of files) {
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if (hasValidExtension) {
      validFiles.push(file)
    } else {
      invalidFiles.push(file.name)
    }
  }
  
  if (invalidFiles.length > 0) {
    error.value = `❌ Неподдерживаемый формат: ${invalidFiles.join(', ')}. Разрешены только .md, .markdown, .txt`
    uploading.value = false
    if (validFiles.length === 0) return
  }
  
  try {
    let successCount = 0
    let failedFiles: string[] = []
    
    for (const file of validFiles) {
      try {
        const content = await readFileAsText(file)
        const result = await putDocRoute.run(ctx, { filename: file.name, markdown: content })
        if (result.success) {
          successCount++
        } else {
          failedFiles.push(file.name)
        }
      } catch (e) {
        failedFiles.push(file.name)
      }
    }
    
    await loadDocs()
    
    if (failedFiles.length > 0) {
      error.value = `✓ Загружено: ${successCount}. ❌ Ошибка: ${failedFiles.join(', ')}`
    } else {
      uploadSuccess.value = `✓ Успешно загружено ${successCount} файл(ов)`
      setTimeout(() => {
        uploadSuccess.value = null
      }, 3000)
    }
  } catch (e) {
    error.value = '❌ Ошибка загрузки: ' + String(e)
  } finally {
    uploading.value = false
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

// Множественный выбор
function toggleSelectAll() {
  if (allSelected.value) {
    selectedDocuments.value.clear()
  } else {
    sortedDocuments.value.forEach(doc => {
      selectedDocuments.value.add(doc.key)
    })
  }
}

function toggleDocumentSelection(key: string, index: number, event: MouseEvent) {
  if (event.shiftKey && lastSelectedIndex.value >= 0) {
    // Выбор диапазона через Shift
    const start = Math.min(lastSelectedIndex.value, index)
    const end = Math.max(lastSelectedIndex.value, index)
    
    for (let i = start; i <= end; i++) {
      if (i < sortedDocuments.value.length) {
        selectedDocuments.value.add(sortedDocuments.value[i].key)
      }
    }
  } else {
    // Обычный toggle
    if (selectedDocuments.value.has(key)) {
      selectedDocuments.value.delete(key)
    } else {
      selectedDocuments.value.add(key)
    }
  }
  
  lastSelectedIndex.value = index
}

function handleRowMouseDown(index: number, event: MouseEvent) {
  if (event.button === 0) { // Левая кнопка мыши
    isMouseSelecting.value = true
    mouseSelectionStart.value = index
    
    // Начинаем выбор
    const doc = sortedDocuments.value[index]
    if (doc && !event.shiftKey && !event.ctrlKey) {
      selectedDocuments.value.add(doc.key)
    }
  }
}

function handleRowMouseEnter(index: number) {
  if (isMouseSelecting.value && mouseSelectionStart.value >= 0) {
    // Выделяем все документы между начальным и текущим
    const start = Math.min(mouseSelectionStart.value, index)
    const end = Math.max(mouseSelectionStart.value, index)
    
    for (let i = start; i <= end; i++) {
      if (i < sortedDocuments.value.length) {
        selectedDocuments.value.add(sortedDocuments.value[i].key)
      }
    }
  }
}

function handleMouseUp() {
  isMouseSelecting.value = false
  mouseSelectionStart.value = -1
}

function clearSelection() {
  selectedDocuments.value.clear()
  lastSelectedIndex.value = -1
}

async function deleteSelected() {
  if (selectedDocuments.value.size === 0) return
  
  const count = selectedDocuments.value.size
  const confirmed = confirm(`Вы действительно хотите удалить ${count} документ(ов)?`)
  
  if (!confirmed) return
  
  deleting.value = true
  error.value = null
  
  try {
    let successCount = 0
    let failedFiles: string[] = []
    
    for (const filename of Array.from(selectedDocuments.value)) {
      try {
        const result = await deleteDocRoute.run(ctx, { filename })
        if (result.success) {
          successCount++
          documents.value = documents.value.filter(d => d.key !== filename)
        } else {
          failedFiles.push(filename)
        }
      } catch (e) {
        failedFiles.push(filename)
      }
    }
    
    selectedDocuments.value.clear()
    lastSelectedIndex.value = -1
    
    if (failedFiles.length > 0) {
      error.value = `✓ Удалено: ${successCount}. ❌ Ошибка: ${failedFiles.join(', ')}`
    } else {
      uploadSuccess.value = `✓ Успешно удалено ${successCount} документ(ов)`
      setTimeout(() => {
        uploadSuccess.value = null
      }, 3000)
    }
  } catch (e) {
    error.value = '❌ Ошибка удаления: ' + String(e)
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadSettings()
  await loadDocs()
  
  // Добавляем глобальный обработчик для завершения выбора мышью
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.docs-list-page {
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

.btn-text {
  display: inline;
}

@media (max-width: 968px) {
  .btn-text {
    display: none;
  }
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

.doc-actions-cell {
  vertical-align: middle;
  padding: 1rem;
}

.doc-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background-color: var(--bg-primary);
  border: 1.5px solid var(--border-secondary);
  color: var(--link-primary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  position: relative;
}

.action-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  color: white;
  border-color: transparent;
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.action-btn.danger {
  background-color: var(--bg-primary);
  border-color: rgba(220, 38, 38, 0.3);
  color: #dc2626;
}

.action-btn.danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px 0 rgba(220, 38, 38, 0.3);
}

/* Градиенты для тёмной темы */
[data-theme="dark"] .action-btn {
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
}

[data-theme="dark"] .action-btn.danger {
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
}

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.drag-content {
  text-align: center;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.drag-content h2 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.75rem;
}

.drag-content i {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.95;
}

.drag-content p {
  font-size: 1.125rem;
  opacity: 0.95;
  margin: 0.5rem 0;
}

/* Панель выбранных файлов */
.selection-panel {
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  border: 1.5px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
}

.selection-info i {
  color: var(--link-primary);
  font-size: 1.25rem;
}

.selection-actions {
  display: flex;
  gap: 0.75rem;
}

/* Checkbox стили */
.doc-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
  accent-color: var(--link-primary);
}

.doc-checkbox-cell {
  text-align: center;
  padding: 0.75rem;
}

/* Выбранная строка */
.doc-row.selected {
  background-color: rgba(59, 130, 246, 0.08);
}

.doc-row.selected:hover {
  background-color: rgba(59, 130, 246, 0.12);
}

/* Курсор при выборе мышью */
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

  .doc-actions {
    gap: 0.25rem;
  }

  .action-btn {
    width: 1.75rem;
    height: 1.75rem;
  }

  .selection-panel {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .selection-actions {
    flex-direction: column;
    width: 100%;
  }

  .selection-actions .btn {
    width: 100%;
  }
}
</style>