<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Навигация -->
    <nav class="bg-white shadow-md border-b border-gray-200">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <a :href="indexPageRoute.url()" class="flex items-center space-x-2">
              <i class="fas fa-arrow-left text-primary"></i>
              <span class="text-gray-600 hover:text-primary">На главную</span>
            </a>
            <span class="text-gray-300">|</span>
            <div class="flex items-center space-x-2">
              <i class="fas fa-cog text-primary text-2xl"></i>
              <h1 class="text-2xl font-bold text-dark">Настройки агента</h1>
            </div>
          </div>
          
          <div v-if="ctx.user" class="text-gray-700">
            <i class="fas fa-user mr-2"></i>
            {{ ctx.user.displayName }}
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Основной контент -->
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Загрузка -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="spinner"></div>
        <p class="ml-4 text-gray-600">Загрузка...</p>
      </div>
      
      <!-- Ошибка -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center mb-4">
          <i class="fas fa-exclamation-circle text-red-500 text-2xl mr-3"></i>
          <div>
            <p class="text-red-700 font-semibold">Ошибка</p>
            <p class="text-red-600">{{ error }}</p>
          </div>
        </div>
        
        <div v-if="errorDetails" class="bg-white rounded p-4 text-left mb-4">
          <p class="text-sm text-gray-600 font-mono break-all whitespace-pre-wrap">{{ errorDetails }}</p>
        </div>
        
        <button 
          @click="loadData" 
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Попробовать снова
        </button>
      </div>
      
      <!-- Основная форма -->
      <div v-else>
        <!-- Список существующих агентов -->
        <div v-if="agents.length > 0" class="mb-6">
          <h2 class="text-xl font-bold text-dark mb-4">Созданные агенты</h2>
          
          <div class="space-y-3">
            <div 
              v-for="agent in agents" 
              :key="agent.id"
              class="bg-white rounded-lg shadow-lg p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-robot text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-dark">{{ agent.title }}</h3>
                    <p class="text-sm text-gray-500">Ключ: <code class="bg-gray-100 px-1 rounded">{{ agent.key }}</code></p>
                  </div>
                </div>
                
                <a 
                  :href="agent.url" 
                  target="_blank"
                  class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  <i class="fas fa-external-link-alt mr-2"></i>
                  Открыть
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div class="flex items-center">
            <i class="fas fa-info-circle text-yellow-600 text-2xl mr-3"></i>
            <p class="text-yellow-800">Агенты ещё не созданы. Заполните форму ниже и создайте первого агента.</p>
          </div>
        </div>
        
        <!-- Форма создания -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-bold text-dark mb-6">
            Создать нового агента
          </h2>
          
          <form @submit.prevent="createAgent">
            <!-- Ключ агента -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Ключ агента
              </label>
              <input 
                v-model="form.agentKey"
                type="text"
                placeholder="assistant"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p class="mt-1 text-sm text-gray-500">
                К ключу будет добавлен короткий рандомный хэш. Например: assistant_abc123
              </p>
            </div>
            
            <!-- Название -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Название агента
              </label>
              <input 
                v-model="form.title"
                type="text"
                :placeholder="config?.agentSettings?.name || 'AI Ассистент'"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p class="mt-1 text-sm text-gray-500">
                Оставьте пустым для использования значения из конфига: "{{ config?.agentSettings?.name }}"
              </p>
            </div>
            
            <!-- Выбор промпта -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Выберите промпт из конфига
              </label>
              <select 
                v-model="form.promptKey"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @change="onPromptKeyChange"
              >
                <option value="">-- Свой промпт --</option>
                <option value="default">По умолчанию (универсальный)</option>
                <option value="customerSupport">Поддержка клиентов</option>
                <option value="sales">Консультант по продажам</option>
              </select>
            </div>
            
            <!-- Системный промпт -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Системный промпт (инструкции для агента)
              </label>
              <textarea 
                v-model="form.instructions"
                rows="8"
                :placeholder="config?.agentSettings?.systemPrompt || 'Введите инструкции для агента...'"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              ></textarea>
              <p class="mt-1 text-sm text-gray-500">
                Инструкции определяют поведение и роль агента
              </p>
            </div>
            
            <!-- Сообщения об ошибках -->
            <div v-if="saveError" class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-red-700 text-sm">{{ saveError }}</p>
            </div>
            
            <!-- Сообщение об успехе -->
            <div v-if="saveSuccess" class="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p class="text-green-700 text-sm">✓ Агент успешно создан!</p>
              <p v-if="lastCreatedAgent" class="text-green-600 text-xs mt-1">
                Ключ: <code class="bg-green-100 px-1 rounded">{{ lastCreatedAgent.key }}</code>
              </p>
            </div>
            
            <!-- Кнопка -->
            <button 
              type="submit"
              :disabled="saving"
              class="w-full px-6 py-3 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fas fa-robot mr-2"></i>
              <span v-if="saving">Создание...</span>
              <span v-else>Создать агента</span>
            </button>
          </form>
        </div>
        
        <!-- Дополнительная информация -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-blue-900 mb-2">
            <i class="fas fa-info-circle mr-2"></i>
            Справка
          </h3>
          <ul class="text-sm text-blue-800 space-y-1">
            <li>• Укажите ключ агента (к нему добавится рандомный хэш)</li>
            <li>• Можно создать несколько агентов с разными ключами</li>
            <li>• Можно использовать готовые промпты из конфига или написать свой</li>
            <li>• После создания ссылка на агента появится в списке выше</li>
            <li><strong>• Если нужно изменить промпт - создайте нового агента с другим ключом</strong></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { indexPageRoute } from '../index'
import { apiGetAgentRoute, apiCreateAgentRoute, apiGetConfigRoute } from '../api/agent'

const loading = ref(true)
const error = ref(null)
const errorDetails = ref(null)
const agents = ref([])
const config = ref(null)

const saving = ref(false)
const saveError = ref(null)
const saveSuccess = ref(false)
const lastCreatedAgent = ref(null)

const form = ref({
  agentKey: '',
  title: '',
  instructions: '',
  promptKey: ''
})

async function loadData() {
  loading.value = true
  error.value = null
  errorDetails.value = null
  
  try {
    console.log('Loading agent info and config...')
    
    // Загружаем информацию об агентах
    const agentResponse = await apiGetAgentRoute.run(ctx)
    console.log('Agent response:', agentResponse)
    
    if (agentResponse.success) {
      agents.value = agentResponse.agents || []
    } else {
      error.value = agentResponse.error || 'Ошибка при загрузке информации об агентах'
      if (agentResponse.errorStack) {
        errorDetails.value = `${agentResponse.errorName}: ${agentResponse.error}\n\n${agentResponse.errorStack}`
      }
      return
    }
    
    // Загружаем конфигурацию
    const configResponse = await apiGetConfigRoute.run(ctx)
    console.log('Config response:', configResponse)
    
    if (configResponse.success) {
      config.value = configResponse.config
    } else {
      error.value = configResponse.error || 'Ошибка при загрузке конфигурации'
      if (configResponse.errorStack) {
        errorDetails.value = `${configResponse.errorName}: ${configResponse.error}\n\n${configResponse.errorStack}`
      }
    }
  } catch (e) {
    console.error('Exception caught:', e)
    error.value = e.message || 'Произошла ошибка при загрузке'
    errorDetails.value = e.stack || JSON.stringify(e, null, 2)
  } finally {
    loading.value = false
  }
}

function onPromptKeyChange() {
  if (form.value.promptKey && config.value?.prompts) {
    form.value.instructions = config.value.prompts[form.value.promptKey] || ''
  }
}

async function createAgent() {
  saving.value = true
  saveError.value = null
  saveSuccess.value = false
  lastCreatedAgent.value = null
  
  try {
    const response = await apiCreateAgentRoute.run(ctx, {
      agentKey: form.value.agentKey.trim() || undefined,
      title: form.value.title.trim() || undefined,
      instructions: form.value.instructions.trim() || undefined,
      promptKey: form.value.promptKey || undefined
    })
    
    if (response.success) {
      saveSuccess.value = true
      lastCreatedAgent.value = response.agent
      
      // Добавляем в список агентов
      agents.value.unshift(response.agent)
      
      // Очищаем форму
      form.value = {
        agentKey: '',
        title: '',
        instructions: '',
        promptKey: ''
      }
      
      // Скрываем сообщение об успехе через 5 секунд
      setTimeout(() => {
        saveSuccess.value = false
      }, 5000)
    } else {
      saveError.value = response.error || 'Не удалось создать агента'
    }
  } catch (e) {
    saveError.value = e.message || 'Произошла ошибка'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #E5E7EB;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

code {
  font-family: 'Courier New', monospace;
}
</style>

