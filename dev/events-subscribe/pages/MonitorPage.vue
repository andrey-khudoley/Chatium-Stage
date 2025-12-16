<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-4">
            <a :href="indexPageRoute.url()" class="text-gray-600 hover:text-primary">
              <i class="fas fa-arrow-left mr-2"></i>
              Назад
            </a>
            <i class="fas fa-tv text-primary text-2xl"></i>
            <span class="text-xl font-bold text-gray-800">Мониторинг событий</span>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <span 
                :class="[
                  'w-3 h-3 rounded-full mr-2',
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                ]"
              ></span>
              <span class="text-sm text-gray-600">
                {{ isConnected ? 'Подключено' : 'Отключено' }}
              </span>
            </div>
            <span class="text-sm text-gray-600">
              <i class="fas fa-user mr-1"></i>
              {{ ctx.user?.displayName }}
            </span>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div v-if="loading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-primary"></i>
        <p class="mt-4 text-gray-600">Инициализация мониторинга...</p>
      </div>

      <div v-else>
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">События в реальном времени</h2>
              <p class="text-gray-600">
                Всего событий: <span class="font-semibold text-primary">{{ events.length }}</span>
                <span v-if="subscriptions.length === 0" class="ml-4 text-orange-600">
                  <i class="fas fa-exclamation-triangle mr-1"></i>
                  У вас нет активных подписок
                </span>
              </p>
            </div>
            <div class="flex space-x-3">
              <button 
                @click="clearEvents"
                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                :disabled="events.length === 0"
              >
                <i class="fas fa-trash mr-2"></i>
                Очистить
              </button>
              <a 
                :href="settingsPageRoute.url()"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <i class="fas fa-cog mr-2"></i>
                Настройки
              </a>
            </div>
          </div>
        </div>

        <div v-if="subscriptions.length === 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <i class="fas fa-info-circle text-yellow-500 text-5xl mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Нет активных подписок</h3>
          <p class="text-gray-600 mb-6">
            Чтобы начать мониторинг событий, необходимо настроить подписки
          </p>
          <a 
            :href="settingsPageRoute.url()"
            class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <i class="fas fa-cog mr-2"></i>
            Перейти к настройкам
          </a>
        </div>

        <div v-else class="space-y-4">
          <div v-if="events.length === 0" class="bg-white rounded-lg shadow-lg p-12 text-center">
            <i class="fas fa-clock text-gray-400 text-6xl mb-4"></i>
            <p class="text-xl text-gray-600">Ожидаем событий...</p>
            <p class="text-sm text-gray-500 mt-2">События будут появляться здесь автоматически</p>
          </div>

          <div 
            v-for="(event, index) in sortedEvents" 
            :key="index"
            class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition animate-fade-in"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center space-x-3">
                <span 
                  :class="[
                    'px-3 py-1 rounded-full text-sm font-semibold',
                    event.subscriptionType === 'traffic' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  ]"
                >
                  <i :class="[
                    'fas mr-1',
                    event.subscriptionType === 'traffic' ? 'fa-chart-line' : 'fa-graduation-cap'
                  ]"></i>
                  {{ event.subscriptionType }}
                </span>
                <span class="font-semibold text-gray-800 text-lg">
                  {{ event.subscriptionName }}
                </span>
              </div>
              <div class="text-sm text-gray-500">
                <i class="fas fa-clock mr-1"></i>
                {{ formatDate(event.ts) }}
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div v-if="event.urlPath" class="text-sm">
                <span class="text-gray-600 font-medium">URL:</span>
                <div class="text-gray-800 break-all mt-1">{{ event.urlPath }}</div>
              </div>
              
              <div v-if="event.action" class="text-sm">
                <span class="text-gray-600 font-medium">Действие:</span>
                <div class="text-gray-800 mt-1">{{ event.action }}</div>
              </div>

              <div v-if="event.user_id" class="text-sm">
                <span class="text-gray-600 font-medium">User ID:</span>
                <div class="text-gray-800 mt-1 font-mono">{{ event.user_id }}</div>
              </div>

              <div v-if="event.user_email" class="text-sm">
                <span class="text-gray-600 font-medium">Email:</span>
                <div class="text-gray-800 mt-1">{{ event.user_email }}</div>
              </div>

              <div v-if="event.user_phone" class="text-sm">
                <span class="text-gray-600 font-medium">Телефон:</span>
                <div class="text-gray-800 mt-1">{{ event.user_phone }}</div>
              </div>

              <div v-if="event.title" class="text-sm">
                <span class="text-gray-600 font-medium">Заголовок:</span>
                <div class="text-gray-800 mt-1">{{ event.title }}</div>
              </div>
            </div>

            <div v-if="hasParams(event)" class="mt-4 pt-4 border-t border-gray-200">
              <details class="cursor-pointer">
                <summary class="text-sm font-medium text-gray-600 hover:text-gray-800">
                  <i class="fas fa-info-circle mr-1"></i>
                  Дополнительные параметры
                </summary>
                <div class="mt-3 space-y-1 text-sm">
                  <div v-if="event.action_param1" class="flex">
                    <span class="text-gray-600 w-32">param1:</span>
                    <span class="text-gray-800">{{ event.action_param1 }}</span>
                  </div>
                  <div v-if="event.action_param2" class="flex">
                    <span class="text-gray-600 w-32">param2:</span>
                    <span class="text-gray-800">{{ event.action_param2 }}</span>
                  </div>
                  <div v-if="event.action_param3" class="flex">
                    <span class="text-gray-600 w-32">param3:</span>
                    <span class="text-gray-800">{{ event.action_param3 }}</span>
                  </div>
                  <div v-if="event.action_param1_int" class="flex">
                    <span class="text-gray-600 w-32">param1_int:</span>
                    <span class="text-gray-800">{{ event.action_param1_int }}</span>
                  </div>
                  <div v-if="event.action_param1_float" class="flex">
                    <span class="text-gray-600 w-32">param1_float:</span>
                    <span class="text-gray-800">{{ event.action_param1_float }}</span>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import { indexPageRoute } from '../index'
import { settingsPageRoute } from '../settings'
import { apiSubscriptionsListRoute } from '../api/subscriptions'
import { apiStartMonitoringRoute } from '../api/events'

const loading = ref(true)
const isConnected = ref(false)
const events = ref([])
const subscriptions = ref([])
const lastTimestamp = ref(null)
let socketClient = null
let subscription = null

const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    const dateA = new Date(a.ts)
    const dateB = new Date(b.ts)
    return dateB - dateA
  })
})

function formatDate(timestamp) {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function hasParams(event) {
  return event.action_param1 || 
         event.action_param2 || 
         event.action_param3 ||
         event.action_param1_int ||
         event.action_param1_float
}

function clearEvents() {
  events.value = []
  // Устанавливаем текущий timestamp, чтобы игнорировать старые события
  lastTimestamp.value = new Date().toISOString()
}

async function initMonitoring() {
  try {
    subscriptions.value = await apiSubscriptionsListRoute.run(ctx)
    
    const result = await apiStartMonitoringRoute.run(ctx, {})
    
    if (result.success) {
      socketClient = await getOrCreateBrowserSocketClient()
      subscription = socketClient.subscribeToData(result.socketId)
      
      subscription.listen(data => {
        if (data.type === 'events-update' && data.data) {
          // Обновляем lastTimestamp
          if (data.lastTimestamp) {
            lastTimestamp.value = data.lastTimestamp
          }
          
          // Фильтруем события по lastTimestamp (игнорируем старые после очистки)
          const newEvents = data.data.filter(newEvent => {
            // Проверяем дубликаты
            const isDuplicate = events.value.some(existing => 
              existing.ts === newEvent.ts && 
              existing.urlPath === newEvent.urlPath &&
              existing.user_id === newEvent.user_id
            )
            
            return !isDuplicate
          })
          
          if (newEvents.length > 0) {
            events.value = [...newEvents, ...events.value]
            
            // Ограничиваем количество событий на странице
            if (events.value.length > 100) {
              events.value = events.value.slice(0, 100)
            }
          }
        }
      })
      
      isConnected.value = true
    }
  } catch (error) {
    console.error('Ошибка инициализации мониторинга:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await initMonitoring()
})

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe()
  }
  isConnected.value = false
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