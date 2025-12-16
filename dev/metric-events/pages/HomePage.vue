<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Хедер -->
    <div class="bg-white shadow-md">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <i class="fas fa-bell text-blue-600 text-2xl"></i>
            <div>
              <h1 class="text-xl font-bold text-gray-800">Metric Events</h1>
              <p class="text-xs text-gray-500">Подписка на события GetCourse</p>
            </div>
          </div>
          
          <div v-if="ctx.user" class="text-sm text-gray-700">
            <i class="fas fa-user mr-1"></i>
            {{ ctx.user.displayName }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- Основной контент -->
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Карточка управления подпиской -->
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            <i class="fas fa-cog mr-2 text-blue-600"></i>
            Управление подпиской
          </h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-semibold text-gray-800 mb-1">Подписка на все события</h3>
                <p class="text-sm text-gray-600">
                  Подписаться на все доступные события GetCourse без детализации
                </p>
              </div>
              <button
                @click="subscribeToAll"
                :disabled="loading"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <i class="fas fa-bell mr-2"></i>
                <span>Подписаться на все события</span>
              </button>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="font-semibold text-gray-800 mb-1">Отписка от всех событий</h3>
                <p class="text-sm text-gray-600">
                  Отписаться от всех событий GetCourse
                </p>
              </div>
              <button
                @click="unsubscribeFromAll"
                :disabled="loading"
                class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <i class="fas fa-bell-slash mr-2"></i>
                <span>Отписаться от всех событий</span>
              </button>
            </div>
          </div>
          
          <!-- Сообщение о результате -->
          <div v-if="message" :class="[
            'mt-4 p-4 rounded-lg',
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          ]">
            <div class="flex items-center">
              <i :class="[
                'mr-2',
                messageType === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
              ]"></i>
              <span>{{ message }}</span>
            </div>
          </div>
        </div>
        
        <!-- Карточка настройки уровня логирования -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            <i class="fas fa-sliders-h mr-2 text-purple-600"></i>
            Уровень логирования
          </h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Выберите уровень логирования событий:
              </label>
              <select
                v-model="selectedLogLevel"
                @change="updateLogLevel"
                :disabled="loading"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="info">Info - логировать все события</option>
                <option value="warn">Warn - логировать только предупреждения и ошибки</option>
                <option value="error">Error - логировать только ошибки</option>
              </select>
            </div>
            
            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-start">
                <i class="fas fa-info-circle text-blue-600 mr-2 mt-1"></i>
                <div class="text-sm text-blue-800">
                  <p class="font-semibold mb-1">Текущий уровень: <span class="font-bold">{{ selectedLogLevel.toUpperCase() }}</span></p>
                  <p class="text-xs">
                    Все входящие события будут логироваться согласно выбранному уровню.
                    События с уровнем ниже выбранного не будут записываться в логи.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiSubscribeToAllEventsRoute, apiUnsubscribeFromAllEventsRoute } from '../api/subscribe'
import { apiGetLogLevelRoute, apiSetLogLevelRoute } from '../api/settings'

const loading = ref(false)
const message = ref('')
const messageType = ref('success')
const selectedLogLevel = ref('info')

// Загрузить текущий уровень логирования
onMounted(async () => {
  try {
    const result = await apiGetLogLevelRoute.run(ctx)
    if (result.success) {
      selectedLogLevel.value = result.level || 'info'
    }
  } catch (error) {
    console.error('Ошибка загрузки уровня логирования:', error)
  }
})

// Подписаться на все события
async function subscribeToAll() {
  try {
    loading.value = true
    message.value = ''
    
    const result = await apiSubscribeToAllEventsRoute.run(ctx)
    
    if (result.success) {
      message.value = result.message || 'Подписка на все события активирована'
      messageType.value = 'success'
    } else {
      message.value = result.error || 'Ошибка при подписке на события'
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = 'Ошибка при подписке на события: ' + (error?.message || error)
    messageType.value = 'error'
  } finally {
    loading.value = false
    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
      message.value = ''
    }, 5000)
  }
}

// Отписаться от всех событий
async function unsubscribeFromAll() {
  if (!confirm('Вы уверены, что хотите отписаться от всех событий?')) {
    return
  }
  
  try {
    loading.value = true
    message.value = ''
    
    const result = await apiUnsubscribeFromAllEventsRoute.run(ctx)
    
    if (result.success) {
      message.value = result.message || 'Отписка от всех событий выполнена'
      messageType.value = 'success'
    } else {
      message.value = result.error || 'Ошибка при отписке от событий'
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = 'Ошибка при отписке от событий: ' + (error?.message || error)
    messageType.value = 'error'
  } finally {
    loading.value = false
    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
      message.value = ''
    }, 5000)
  }
}

// Обновить уровень логирования
async function updateLogLevel() {
  try {
    loading.value = true
    
    const requestData = {
      level: selectedLogLevel.value
    }
    
    console.log('DEBUG: Отправка запроса на обновление уровня логирования', {
      level: selectedLogLevel.value,
      requestData,
      ctxExists: !!ctx,
      ctxType: typeof ctx,
      apiSetLogLevelRouteExists: !!apiSetLogLevelRoute,
      apiSetLogLevelRouteType: typeof apiSetLogLevelRoute,
    })
    
    const result = await apiSetLogLevelRoute.run(ctx, requestData)
    
    console.log('DEBUG: Результат обновления уровня логирования', {
      result,
      success: result?.success,
      error: result?.error,
    })
    
    if (result.success) {
      message.value = result.message || 'Уровень логирования обновлён'
      messageType.value = 'success'
    } else {
      message.value = result.error || 'Ошибка при обновлении уровня логирования'
      messageType.value = 'error'
      // Восстанавливаем предыдущее значение
      const currentResult = await apiGetLogLevelRoute.run(ctx)
      if (currentResult.success) {
        selectedLogLevel.value = currentResult.level || 'info'
      }
    }
  } catch (error) {
    console.error('ERROR: Исключение при обновлении уровня логирования', {
      error,
      errorMessage: error?.message,
      errorStack: error?.stack,
      level: selectedLogLevel.value,
    })
    message.value = 'Ошибка при обновлении уровня логирования: ' + (error?.message || error)
    messageType.value = 'error'
    // Восстанавливаем предыдущее значение
    try {
      const currentResult = await apiGetLogLevelRoute.run(ctx)
      if (currentResult.success) {
        selectedLogLevel.value = currentResult.level || 'info'
      }
    } catch (restoreError) {
      console.error('ERROR: Не удалось восстановить уровень логирования', restoreError)
    }
  } finally {
    loading.value = false
    // Скрываем сообщение через 5 секунд
    setTimeout(() => {
      message.value = ''
    }, 5000)
  }
}
</script>
