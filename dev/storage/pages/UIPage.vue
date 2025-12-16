<template>
  <div class="min-h-screen bg-gray-50">
    <div class="bg-white shadow-md border-b-4 border-blue-500">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center space-x-3">
          <i class="fas fa-database text-blue-500 text-2xl"></i>
          <div>
            <h1 class="text-2xl font-bold">Storage</h1>
            <p class="text-sm text-gray-600">Управление скриптами и стилями</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="container mx-auto px-4 py-8">
      <!-- Секция загрузки файлов -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">
          <i class="fas fa-upload text-blue-500 mr-2"></i>
          Загрузка файла
        </h2>
        
        <div 
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          :class="[
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
          ]"
        >
          <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
          <p class="text-gray-600 mb-2">
            Перетащите сюда файл .js или .css
          </p>
          <p class="text-sm text-gray-500 mb-4">
            или
          </p>
          <label class="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
            <i class="fas fa-folder-open mr-2"></i>
            Выбрать файл
            <input 
              type="file" 
              accept=".js,.css" 
              @change="handleFileSelect"
              class="hidden"
            />
          </label>
        </div>
        
        <!-- Прогресс загрузки -->
        <div v-if="uploading" class="mt-4">
          <div class="flex items-center justify-center">
            <i class="fas fa-spinner fa-spin text-blue-500 text-2xl mr-2"></i>
            <span class="text-gray-700">Загрузка файла...</span>
          </div>
        </div>
      </div>
      
      <!-- Список скриптов -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">
            <i class="fas fa-list text-blue-500 mr-2"></i>
            Скрипты ({{ scripts.length }})
          </h2>
          <button 
            @click="loadScripts"
            :disabled="loading"
            class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            <i v-if="loading" class="fas fa-sync fa-spin"></i>
            <i v-else class="fas fa-sync"></i>
            Загрузить
          </button>
        </div>
        
        <div v-if="loading" class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
          <p class="mt-2 text-gray-600">Загрузка...</p>
        </div>
        
        <div v-else-if="scripts.length === 0" class="text-center py-8">
          <i class="fas fa-inbox text-4xl text-gray-400 mb-2"></i>
          <p class="text-gray-500">Нет скриптов</p>
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="script in scripts" 
            :key="script.id" 
            class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <i v-if="script.type === 'script'" class="fas fa-file-code text-blue-500"></i>
                  <i v-else class="fas fa-file-css text-blue-500"></i>
                  <h3 class="font-semibold text-lg">{{ script.name }}</h3>
                  <span v-if="script.type === 'script'" class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">JS</span>
                  <span v-else class="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">CSS</span>
                </div>
                <p v-if="script.description" class="text-sm text-gray-600 mb-2">{{ script.description }}</p>
              </div>
              
              <div class="flex items-center gap-2 ml-4">
                <button 
                  @click="viewScript(script)"
                  class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  title="Просмотр"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  @click="editScript(script)"
                  class="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                  title="Редактировать"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  @click="copyEmbedLink(script)"
                  class="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                  title="Копировать ссылку"
                >
                  <i class="fas fa-link"></i>
                </button>
                <button 
                  @click="deleteScript(script)"
                  class="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  title="Удалить"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно просмотра -->
    <div v-if="viewModal && selectedScript" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeViewModal">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-xl font-bold">
            <i v-if="selectedScript.type === 'script'" class="fas fa-file-code text-blue-500 mr-2"></i>
            <i v-else class="fas fa-file-css text-blue-500 mr-2"></i>
            {{ selectedScript.name }}
          </h3>
          <button @click="closeViewModal" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">{{ selectedScript.description }}</p>
          </div>
          <div class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre class="text-sm font-mono">{{ selectedScript.content }}</pre>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно редактирования -->
    <div v-if="editModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeEditModal">
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b">
          <h3 class="text-xl font-bold">
            <i class="fas fa-edit text-green-500 mr-2"></i>
            Редактировать: {{ editForm.name }}
          </h3>
          <button @click="closeEditModal" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <input 
              v-model="editForm.description" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Описание скрипта"
            />
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Содержимое</label>
            <textarea 
              v-model="editForm.content" 
              rows="15"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Код скрипта или стиля"
            ></textarea>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 p-4 border-t">
          <button 
            @click="closeEditModal" 
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Отмена
          </button>
          <button 
            @click="saveEdit" 
            :disabled="saving"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          >
            <i v-if="saving" class="fas fa-spinner fa-spin mr-2"></i>
            <i v-else class="fas fa-save mr-2"></i>
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Уведомления -->
    <div 
      v-if="copyNotification" 
      class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in"
    >
      <i class="fas fa-check-circle mr-2"></i>
      {{ uploading ? 'Файл успешно загружен!' : 'Ссылка скопирована в буфер обмена!' }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiGetScriptsListRoute, apiUpdateScriptRoute, apiDeleteScriptRoute, apiUploadFileRoute } from '../api/scripts'

const scripts = ref([])
const loading = ref(false)
const viewModal = ref(false)
const editModal = ref(false)
const selectedScript = ref(null)
const saving = ref(false)
const copyNotification = ref(false)
const isDragging = ref(false)
const uploading = ref(false)

const editForm = ref({
  id: '',
  name: '',
  description: '',
  content: ''
})

async function loadScripts() {
  loading.value = true
  try {
    const result = await apiGetScriptsListRoute.run(ctx)
    if (result.success) {
      scripts.value = result.scripts || []
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function viewScript(script) {
  selectedScript.value = script
  viewModal.value = true
}

function closeViewModal() {
  viewModal.value = false
  selectedScript.value = null
}

function editScript(script) {
  editForm.value = {
    id: script.id,
    name: script.name,
    description: script.description || '',
    content: script.content || ''
  }
  editModal.value = true
}

function closeEditModal() {
  editModal.value = false
  editForm.value = {
    id: '',
    name: '',
    description: '',
    content: ''
  }
}

async function saveEdit() {
  if (!editForm.value.id) return
  
  saving.value = true
  try {
    const result = await apiUpdateScriptRoute.run(ctx, {
      id: editForm.value.id,
      description: editForm.value.description,
      content: editForm.value.content
    })
    
    if (result.success) {
      await loadScripts()
      closeEditModal()
    } else {
      alert('Ошибка при сохранении: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    console.error(error)
    alert('Ошибка при сохранении')
  } finally {
    saving.value = false
  }
}

async function deleteScript(script) {
  if (!confirm('Удалить скрипт "' + script.name + '"?')) return
  
  try {
    const result = await apiDeleteScriptRoute.run(ctx, {
      id: script.id
    })
    
    if (result.success) {
      await loadScripts()
    } else {
      alert('Ошибка при удалении: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    console.error(error)
    alert('Ошибка при удалении')
  }
}

function copyEmbedLink(script) {
  const extension = script.type === 'script' ? '.js' : '.css'
  const url = ctx.account.url('/dev/storage/serve~') + script.name + extension
  
  // Формируем HTML код для встраивания
  const embedCode = script.type === 'script' 
    ? '<' + 'script src="' + url + '"><' + '/script>'
    : '<' + 'link rel="stylesheet" href="' + url + '" />'
  
  // Копируем в буфер обмена
  navigator.clipboard.writeText(embedCode).then(() => {
    copyNotification.value = true
    setTimeout(() => {
      copyNotification.value = false
    }, 3000)
  }).catch(err => {
    console.error('Ошибка копирования:', err)
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea')
    textArea.value = embedCode
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    
    copyNotification.value = true
    setTimeout(() => {
      copyNotification.value = false
    }, 3000)
  })
}

// Обработка drag-and-drop
async function handleDrop(e) {
  isDragging.value = false
  
  const files = e.dataTransfer.files
  if (files.length > 0) {
    await uploadFile(files[0])
  }
}

// Обработка выбора файла через кнопку
async function handleFileSelect(e) {
  const files = e.target.files
  if (files.length > 0) {
    await uploadFile(files[0])
  }
  // Сбрасываем input чтобы можно было загрузить тот же файл снова
  e.target.value = ''
}

// Загрузка файла на сервер
async function uploadFile(file) {
  // Проверка расширения
  const extension = file.name.toLowerCase().split('.').pop()
  if (extension !== 'js' && extension !== 'css') {
    alert('Поддерживаются только файлы .js и .css')
    return
  }
  
  uploading.value = true
  
  try {
    // Читаем содержимое файла
    const content = await readFileContent(file)
    
    // Отправляем на сервер
    const result = await apiUploadFileRoute.run(ctx, {
      filename: file.name,
      content
    })
    
    if (result.success) {
      // Показываем уведомление
      copyNotification.value = true
      setTimeout(() => {
        copyNotification.value = false
      }, 3000)
      
      // Перезагружаем список
      await loadScripts()
    } else {
      alert('Ошибка загрузки: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (error) {
    console.error(error)
    alert('Ошибка при чтении файла')
  } finally {
    uploading.value = false
  }
}

// Чтение содержимого файла
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve(e.target.result)
    }
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'))
    }
    
    reader.readAsText(file)
  })
}

onMounted(() => {
  loadScripts()
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
