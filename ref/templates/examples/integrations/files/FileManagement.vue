<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <a :href="indexPageRoute.url()" class="flex items-center text-blue-600 hover:text-blue-800">
            <i class="fas fa-arrow-left mr-2"></i>
            Главная
          </a>
          <h1 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-cloud-upload-alt mr-2 text-blue-600"></i>
            Работа с файлами
          </h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid gap-8">
        
        <!-- Single File Upload -->
        <ExampleSection title="Загрузка одного файла">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Выберите файл для загрузки
              </label>
              <input 
                type="file" 
                @change="handleFileSelect" 
                ref="fileInput"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div v-if="selectedFile" class="mb-4 p-3 bg-gray-50 rounded">
              <p class="text-sm">
                <strong>Имя:</strong> {{ selectedFile.name }}<br>
                <strong>Размер:</strong> {{ formatFileSize(selectedFile.size) }}<br>
                <strong>Тип:</strong> {{ selectedFile.type }}
              </p>
            </div>
            
            <button 
              @click="uploadSingleFile" 
              :disabled="!selectedFile || uploadLoading"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <i class="fas fa-upload mr-2"></i>
              {{ uploadLoading ? 'Загрузка...' : 'Загрузить' }}
            </button>
            
            <ApiResultCard 
              v-if="uploadResult"
              title="Загрузка файла"
              method="POST"
              endpoint="/api/files/upload"
              :response="uploadResult.success ? uploadResult : undefined"
              :error="!uploadResult.success ? uploadResult.message : undefined"
            />
          </div>
        </ExampleSection>

        <!-- Multiple Files Upload -->
        <ExampleSection title="Множественная загрузка">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Выберите несколько файлов
              </label>
              <input 
                type="file" 
                multiple 
                @change="handleMultipleFileSelect"
                ref="multipleFileInput"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div v-if="selectedFiles.length > 0" class="mb-4">
              <h4 class="font-medium mb-2">Выбранные файлы ({{ selectedFiles.length }}):</h4>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <div v-for="(file, index) in selectedFiles" :key="index" class="flex justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                  <span>{{ file.name }}</span>
                  <span class="text-gray-600">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
            </div>
            
            <button 
              @click="uploadMultipleFiles" 
              :disabled="selectedFiles.length === 0 || multipleUploadLoading"
              class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              <i class="fas fa-cloud-upload-alt mr-2"></i>
              {{ multipleUploadLoading ? 'Загрузка...' : `Загрузить ${selectedFiles.length} файлов` }}
            </button>
            
            <ApiResultCard 
              v-if="multipleUploadResult"
              title="Множественная загрузка"
              method="POST"
              endpoint="/api/files/upload-multiple"
              :response="multipleUploadResult.success ? multipleUploadResult : undefined"
              :error="!multipleUploadResult.success ? multipleUploadResult.message : undefined"
            />
          </div>
        </ExampleSection>

        <!-- Image Upload with Preview -->
        <ExampleSection title="Загрузка изображения с превью">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Выберите изображение (JPEG, PNG, GIF, WebP)
              </label>
              <input 
                type="file" 
                accept="image/*" 
                @change="handleImageSelect"
                ref="imageInput"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div v-if="selectedImage" class="mb-4">
              <h4 class="font-medium mb-2">Предпросмотр:</h4>
              <div class="max-w-md">
                <img 
                  :src="imagePreview" 
                  alt="Предпросмотр" 
                  class="max-w-full h-auto rounded border border-gray-300"
                />
              </div>
              <p class="text-sm mt-2 text-gray-600">
                Размер: {{ formatFileSize(selectedImage.size) }}
              </p>
            </div>
            
            <button 
              @click="uploadImage" 
              :disabled="!selectedImage || imageUploadLoading"
              class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <i class="fas fa-image mr-2"></i>
              {{ imageUploadLoading ? 'Загрузка...' : 'Загрузить изображение' }}
            </button>
            
            <div v-if="imageUploadResult && imageUploadResult.success && imageUploadResult.image" class="mt-4">
              <h4 class="font-medium mb-2">Загруженное изображение:</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-sm font-medium mb-1">Оригинал</p>
                  <img :src="imageUploadResult.image.originalUrl" alt="Оригинал" class="w-full rounded border" />
                </div>
                <div v-if="imageUploadResult.image.thumbnails.small">
                  <p class="text-sm font-medium mb-1">Маленькое (150x150)</p>
                  <img :src="imageUploadResult.image.thumbnails.small" alt="Маленькое" class="w-full rounded border" />
                </div>
                <div v-if="imageUploadResult.image.thumbnails.medium">
                  <p class="text-sm font-medium mb-1">Среднее (300x300)</p>
                  <img :src="imageUploadResult.image.thumbnails.medium" alt="Среднее" class="w-full rounded border" />
                </div>
              </div>
            </div>
            
            <ApiResultCard 
              v-if="imageUploadResult"
              title="Загрузка изображения"
              method="POST"
              endpoint="/api/files/upload-image"
              :response="imageUploadResult.success ? imageUploadResult : undefined"
              :error="!imageUploadResult.success ? imageUploadResult.message : undefined"
            />
          </div>
        </ExampleSection>

        <!-- File List -->
        <ExampleSection title="Список файлов">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Фильтр по типу:</label>
              <select 
                v-model="fileFilter" 
                @change="loadFiles"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все файлы</option>
                <option value="image">Изображения</option>
                <option value="document">Документы</option>
                <option value="video">Видео</option>
                <option value="audio">Аудио</option>
              </select>
            </div>
            
            <button 
              @click="loadFiles" 
              :disabled="filesLoading"
              class="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <i class="fas fa-sync mr-2"></i>
              {{ filesLoading ? 'Загрузка...' : 'Обновить список' }}
            </button>
            
            <div v-if="files.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
              <div v-for="file in files" :key="file.id" class="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                <div class="flex items-center space-x-3">
                  <i :class="getFileIcon(file)" class="text-2xl"></i>
                  <div>
                    <p class="font-medium">{{ file.name }}</p>
                    <p class="text-sm text-gray-600">{{ formatFileSize(file.size) }} • {{ file.type }}</p>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <a 
                    :href="`/api/files/${file.id}/download`" 
                    class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <i class="fas fa-download mr-1"></i>
                    Скачать
                  </a>
                  <button 
                    @click="deleteFile(file.id)" 
                    class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <i class="fas fa-trash mr-1"></i>
                    Удалить
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else-if="!filesLoading" class="text-center text-gray-500 py-8">
              <i class="fas fa-folder-open text-4xl mb-2"></i>
              <p>Файлы не найдены</p>
            </div>
            
            <ApiResultCard 
              v-if="filesResult"
              title="Список файлов"
              method="GET"
              endpoint="/api/files"
              :response="filesResult.success ? filesResult : undefined"
              :error="!filesResult.success ? filesResult.message : undefined"
            />
          </div>
        </ExampleSection>

        <!-- Image Processing -->
        <ExampleSection title="Обработка изображений">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <p class="text-sm text-gray-600 mb-4">
                Выберите изображение для обработки (ресайз, обрезка, качество)
              </p>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Выберите изображение:
              </label>
              <input 
                type="file" 
                accept="image/*" 
                @change="handleProcessImageSelect"
                ref="processImageInput"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div v-if="processSelectedImage" class="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 class="font-medium mb-2">Оригинал:</h4>
                <img :src="processImagePreview" alt="Оригинал" class="w-full rounded border" />
              </div>
              <div>
                <h4 class="font-medium mb-2">Обработанное:</h4>
                <div v-if="imageProcessingResult && imageProcessingResult.success" class="space-y-2">
                  <a :href="`/api/files/${imageProcessingResult.processedFileId}/download`" class="block">
                    <img :src="`/api/files/${imageProcessingResult.processedFileId}`" alt="Обработанное" class="w-full rounded border" />
                  </a>
                  <p class="text-sm text-gray-600">{{ JSON.stringify(imageProcessingResult.processing, null, 2) }}</p>
                </div>
                <div v-else class="bg-gray-100 rounded h-48 flex items-center justify-center text-gray-500">
                  <div class="text-center">
                    <i class="fas fa-magic text-2xl mb-2"></i>
                    <p>Загрузите и настройте параметры</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="processSelectedImage" class="space-y-4 mb-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Ширина (px)</label>
                  <input v-model="processOptions.width" type="number" placeholder="Оставить пустым для авто"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Высота (px)</label>
                  <input v-model="processOptions.height" type="number" placeholder="Оставить пустым для авто"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
              
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Качество (%)</label>
                  <input v-model="processOptions.quality" type="number" min="1" max="100" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Формат</label>
                  <select v-model="processOptions.format" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button 
              @click="processImage" 
              :disabled="!processSelectedImage || imageProcessingLoading"
              class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              <i class="fas fa-magic mr-2"></i>
              {{ imageProcessingLoading ? 'Обработка...' : 'Обработать' }}
            </button>
            
            <ApiResultCard 
              v-if="imageProcessingResult"
              title="Обработка изображения"
              method="POST"
              endpoint="/api/files/:id/process"
              :response="imageProcessingResult.success ? imageProcessingResult : undefined"
              :error="!imageProcessingResult.success ? imageProcessingResult.message : undefined"
            />
          </div>
        </ExampleSection>
      </div>
    </main>
  </div>
</template>

<script setup>
// @shared
import { jsx } from "@app/html-jsx"
import { ExampleSection, ApiResultCard } from "../../shared/components"

const indexPageRoute = {
  url: () => '/examples'
}

// Состояния
const uploadLoading = ref(false)
const multipleUploadLoading = ref(false)
const imageUploadLoading = ref(false)
const filesLoading = ref(false)
const imageProcessingLoading = ref(false)

// Файлы
const selectedFile = ref(null)
const selectedFiles = ref([])
const selectedImage = ref(null)
const processSelectedImage = ref(null)

// Результаты
const uploadResult = ref(null)
const multipleUploadResult = ref(null)
const imageUploadResult = ref(null)
const filesResult = ref(null)
const imageProcessingResult = ref(null)

// Данные для списков
const files = ref([])
const fileFilter = ref('')

// Превью
const imagePreview = ref('')
const processImagePreview = ref('')

// Опции обработки
const processOptions = ref({
  width: '',
  height: '',
  quality: 80,
  format: 'jpeg'
})

// Обработчики выбора файлов
function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
  }
}

function handleMultipleFileSelect(event) {
  selectedFiles.value = Array.from(event.target.files)
}

function handleImageSelect(event) {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    selectedImage.value = file
    
    // Создаем превью
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

function handleProcessImageSelect(event) {
  const file = event.target.files[0]
  if (file && file.type.startsWith('image/')) {
    processSelectedImage.value = file
    
    // Создаем превью для обработки
    const reader = new FileReader()
    reader.onload = (e) => {
      processImagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Функции загрузки
async function uploadSingleFile() {
  if (!selectedFile.value) return
  
  uploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    })
    
    uploadResult.value = await response.json()
    
    // Сбрасываем выбрать файла и инпут
    selectedFile.value = null
    document.querySelector('#fileInput input').value = ''
  } catch (error) {
    uploadResult.value = {
      success: false,
      error: 'Ошибка при загрузке файла'
    }
  } finally {
    uploadLoading.value = false
  }
}

async function uploadMultipleFiles() {
  if (selectedFiles.value.length === 0) return
  
  multipleUploadLoading.value = true
  try {
    const formData = new FormData()
    selectedFiles.value.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
    
    const response = await fetch('/api/files/upload-multiple', {
      method: 'POST',
      body: formData
    })
    
    multipleUploadResult.value = await response.json()
    
    // Сбрасываем
    selectedFiles.value = []
    document.querySelector('#multipleFileInput input').value = ''
  } catch (error) {
    multipleUploadResult.value = {
      success: false,
      error: 'Ошибка при загрузке файлов'
    }
  } finally {
    multipleUploadLoading.value = false
  }
}

async function uploadImage() {
  if (!selectedImage.value) return
  
  imageUploadLoading.value = true
  try {
    const formData = new FormData()
    formData.append('image', selectedImage.value)
    
    const response = await fetch('/api/files/upload-image', {
      method: 'POST',
      body: formData
    })
    
    imageUploadResult.value = await response.json()
    
    // Сбрасываем
    selectedImage.value = null
    imagePreview.value = ''
    document.querySelector('#imageInput input').value = ''
  } catch (error) {
    imageUploadResult.value = {
      success: false,
      error: 'Ошибка при загрузке изображения'
    }
  } finally {
    imageUploadLoading.value = false
  }
}

async function loadFiles() {
  filesLoading.value = true
  try {
    const params = new URLSearchParams()
    if (fileFilter.value) {
      params.append('type', fileFilter.value)
    }
    
    const response = await fetch(`/api/files?${params}`)
    filesResult.value = await response.json()
    
    if (filesResult.value.success) {
      files.value = filesResult.value.files
    }
  } catch (error) {
    filesResult.value = {
      success: false,
      error: 'Ошибка при загрузке списка файлов'
    }
  } finally {
    filesLoading.value = false
  }
}

async function deleteFile(fileId) {
  if (!confirm('Вы уверены, что хотите удалить этот файл?')) return
  
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    
    if (result.success) {
      // Удаляем файл из списка
      files.value = files.value.filter(file => file.id !== fileId)
    }
  } catch (error) {
    console.error('Ошибка при удалении файла:', error)
  }
}

async function processImage() {
  if (!processSelectedImage.value) return
  
  imageProcessingLoading.value = true
  try {
    // Сначала загружаем изображение
    const formData = new FormData()
    formData.append('image', processSelectedImage.value)
    
    const uploadResponse = await fetch('/api/files/upload-image', {
      method: 'POST',
      body: formData
    })
    
    const uploadResult = await uploadResponse.json()
    
    if (uploadResult.success) {
      // Затем обрабатываем его
      const response = await fetch(`/api/files/${uploadResult.image.id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processOptions.value)
      })
      
      imageProcessingResult.value = await response.json()
    }
  } catch (error) {
    imageProcessingResult.value = {
      success: false,
      error: 'Ошибка при обработке изображения'
    }
  } finally {
    imageProcessingLoading.value = false
  }
}

// Вспомогательные функции
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileIcon(file) {
  if (!file.type) return 'fas fa-file'
  
  if (file.type.startsWith('image/')) return 'fas fa-image text-green-600'
  if (file.type.startsWith('video/')) return 'fas fa-video text-purple-600'
  if (file.type.startsWith('audio/')) return 'fas fa-music text-pink-600'
  if (file.type.includes('pdf')) return 'fas fa-file-pdf text-red-600'
  if (file.type.includes('word')) return 'fas fa-file-word text-blue-600'
  if (file.type.includes('excel')) return 'fas fa-file-excel text-green-600'
  if (file.type.includes('powerpoint')) return 'fas fa-file-powerpoint text-orange-600'
  if (file.type.includes('zip') || file.type.includes('rar')) return 'fas fa-file-archive text-yellow-600'
  
  return 'fas fa-file text-gray-600'
}

// Инициализация - загружаем список файлов
onMounted(() => {
  loadFiles()
})
</script>