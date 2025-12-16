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
            <i class="fas fa-cog text-primary text-2xl"></i>
            <span class="text-xl font-bold text-gray-800">Настройки подписок</span>
          </div>
          <div class="flex items-center">
            <span class="text-sm text-gray-600">
              <i class="fas fa-user mr-1"></i>
              {{ ctx.user?.displayName }}
            </span>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div v-if="loading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-primary"></i>
        <p class="mt-4 text-gray-600">Загрузка...</p>
      </div>

      <div v-else>
        <div v-if="message" 
          :class="[
            'mb-6 p-4 rounded-lg',
            messageType === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          ]"
        >
          <i :class="[
            'fas mr-2',
            messageType === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
          ]"></i>
          {{ message }}
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                <i class="fas fa-chart-line text-blue-500 mr-3"></i>
                События трафика
              </h2>
              <div class="flex gap-2">
                <button
                  @click="subscribeAll('traffic')"
                  class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition"
                  :disabled="processing"
                >
                  <i class="fas fa-check-double mr-1"></i>
                  Все
                </button>
                <button
                  @click="unsubscribeAll('traffic')"
                  class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition"
                  :disabled="processing"
                >
                  <i class="fas fa-times mr-1"></i>
                  Ни одного
                </button>
              </div>
            </div>
            
            <div class="space-y-3">
              <div 
                v-for="event in trafficEvents" 
                :key="event.name"
                class="border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div 
                  @click="toggleSpoiler(event.name)"
                  class="flex items-center justify-between p-4 cursor-pointer"
                >
                  <div>
                    <div class="font-semibold text-gray-800">{{ event.description }}</div>
                    <div class="text-sm text-gray-500">{{ event.name }}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click.stop="toggleSubscription('traffic', event.name)"
                      :class="[
                        'px-4 py-2 rounded-lg font-medium transition',
                        isSubscribed('traffic', event.name) 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      ]"
                      :disabled="processing"
                    >
                      <i :class="[
                        'fas mr-1',
                        isSubscribed('traffic', event.name) ? 'fa-times' : 'fa-plus'
                      ]"></i>
                      {{ isSubscribed('traffic', event.name) ? 'Отписаться' : 'Подписаться' }}
                    </button>
                    <i :class="[
                      'fas transition-transform',
                      expandedSpoilers.has(event.name) ? 'fa-chevron-up' : 'fa-chevron-down'
                    ]"></i>
                  </div>
                </div>
                
                <div 
                  v-if="expandedSpoilers.has(event.name)"
                  class="border-t border-gray-200 bg-gray-50 p-4"
                >
                  <div class="mb-3">
                    <h4 class="font-semibold text-gray-700 mb-2">Детальная информация о событии:</h4>
                    <div v-if="event.fields" class="space-y-2">
                      <div v-for="field in event.fields" :key="field.name" class="flex items-start gap-2">
                        <span class="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {{ field.type }}
                        </span>
                        <div class="flex-1">
                          <span class="font-semibold text-gray-700">{{ field.name }}</span>
                          <span v-if="field.required" class="text-red-500 ml-1">*</span>
                          <div class="text-sm text-gray-600">{{ field.description }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-500">Полей не определено</div>
                  </div>
                  
                  <div v-if="event.example" class="mt-3">
                    <h4 class="font-semibold text-gray-700 mb-2">Пример данных:</h4>
                    <pre class="bg-gray-900 text-green-400 p-3 rounded-md text-xs overflow-x-auto">{{ JSON.stringify(event.example, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-800 flex items-center">
                <i class="fas fa-graduation-cap text-purple-500 mr-3"></i>
                События GetCourse
              </h2>
              <div class="flex gap-2">
                <button
                  @click="subscribeAll('getcourse')"
                  class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition"
                  :disabled="processing"
                >
                  <i class="fas fa-check-double mr-1"></i>
                  Все
                </button>
                <button
                  @click="unsubscribeAll('getcourse')"
                  class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition"
                  :disabled="processing"
                >
                  <i class="fas fa-times mr-1"></i>
                  Ни одного
                </button>
              </div>
            </div>
            
            <div class="space-y-3">
              <div 
                v-for="event in getcourseEvents" 
                :key="event.name"
                class="border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div 
                  @click="toggleSpoiler(event.name)"
                  class="flex items-center justify-between p-4 cursor-pointer"
                >
                  <div>
                    <div class="font-semibold text-gray-800">{{ event.description }}</div>
                    <div class="text-sm text-gray-500">{{ event.name }}</div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      @click.stop="toggleSubscription('getcourse', event.name)"
                      :class="[
                        'px-4 py-2 rounded-lg font-medium transition',
                        isSubscribed('getcourse', event.name) 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      ]"
                      :disabled="processing"
                    >
                      <i :class="[
                        'fas mr-1',
                        isSubscribed('getcourse', event.name) ? 'fa-times' : 'fa-plus'
                      ]"></i>
                      {{ isSubscribed('getcourse', event.name) ? 'Отписаться' : 'Подписаться' }}
                    </button>
                    <i :class="[
                      'fas transition-transform',
                      expandedSpoilers.has(event.name) ? 'fa-chevron-up' : 'fa-chevron-down'
                    ]"></i>
                  </div>
                </div>
                
                <div 
                  v-if="expandedSpoilers.has(event.name)"
                  class="border-t border-gray-200 bg-gray-50 p-4"
                >
                  <div class="mb-3">
                    <h4 class="font-semibold text-gray-700 mb-2">Детальная информация о событии:</h4>
                    <div v-if="event.fields" class="space-y-2">
                      <div v-for="field in event.fields" :key="field.name" class="flex items-start gap-2">
                        <span class="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {{ field.type }}
                        </span>
                        <div class="flex-1">
                          <span class="font-semibold text-gray-700">{{ field.name }}</span>
                          <span v-if="field.required" class="text-red-500 ml-1">*</span>
                          <div class="text-sm text-gray-600">{{ field.description }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-500">Полей не определено</div>
                  </div>
                  
                  <div v-if="event.example" class="mt-3">
                    <h4 class="font-semibold text-gray-700 mb-2">Пример данных:</h4>
                    <pre class="bg-gray-900 text-green-400 p-3 rounded-md text-xs overflow-x-auto">{{ JSON.stringify(event.example, null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800 flex items-center">
              <i class="fas fa-list text-green-500 mr-3"></i>
              Активные подписки ({{ activeSubscriptions.length }})
            </h3>
            <div class="flex gap-2">
              <button
                @click="subscribeAll()"
                class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg text-white rounded-lg font-medium transition"
                :disabled="processing"
              >
                <i class="fas fa-star mr-2"></i>
                Подписаться на всё
              </button>
              <button
                @click="unsubscribeAll()"
                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition"
                :disabled="processing"
              >
                <i class="fas fa-trash-alt mr-2"></i>
                Отписаться от всех
              </button>
            </div>
          </div>
          
          <div v-if="activeSubscriptions.length === 0" class="text-center py-8 text-gray-500">
            <i class="fas fa-inbox text-4xl mb-3"></i>
            <p>У вас пока нет активных подписок</p>
          </div>
          
          <div v-else class="grid md:grid-cols-3 gap-4">
            <div 
              v-for="sub in activeSubscriptions" 
              :key="sub.id"
              class="p-4 border-2 border-green-200 rounded-lg bg-green-50"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-semibold text-gray-800">{{ getEventDescription(sub.eventType, sub.eventName) }}</div>
                  <div class="text-sm text-gray-600 mt-1">
                    <span :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      sub.eventType === 'traffic' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    ]">
                      {{ sub.eventType }}
                    </span>
                  </div>
                </div>
                <i class="fas fa-check-circle text-green-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 text-center">
          <a 
            :href="monitorPageRoute.url()"
            class="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition"
          >
            <i class="fas fa-tv mr-2"></i>
            Перейти к мониторингу событий
          </a>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { indexPageRoute } from '../index'
import { monitorPageRoute } from '../monitor'
import { 
  apiAvailableEventsRoute, 
  apiSubscriptionsListRoute,
  apiSubscribeRoute,
  apiUnsubscribeRoute,
  apiSubscribeAllRoute,
  apiUnsubscribeAllRoute
} from '../api/subscriptions'

const loading = ref(true)
const processing = ref(false)
const message = ref('')
const messageType = ref('success')
const availableEvents = ref([])
const subscriptions = ref([])
const expandedSpoilers = ref(new Set())

const trafficEvents = computed(() => availableEvents.value.filter(e => e.type === 'traffic'))
const getcourseEvents = computed(() => availableEvents.value.filter(e => e.type === 'getcourse'))
const activeSubscriptions = computed(() => subscriptions.value.filter(s => s.isActive))

function isSubscribed(eventType, eventName) {
  return subscriptions.value.some(s => 
    s.eventType === eventType && 
    s.eventName === eventName && 
    s.isActive
  )
}

function getEventDescription(eventType, eventName) {
  const event = availableEvents.value.find(e => e.type === eventType && e.name === eventName)
  return event ? event.description : eventName
}

function toggleSpoiler(eventName) {
  const newSpoilers = new Set(expandedSpoilers.value)
  if (newSpoilers.has(eventName)) {
    newSpoilers.delete(eventName)
  } else {
    newSpoilers.add(eventName)
  }
  expandedSpoilers.value = newSpoilers
}

async function toggleSubscription(eventType, eventName) {
  processing.value = true
  message.value = ''
  
  try {
    const subscribed = isSubscribed(eventType, eventName)
    
    if (subscribed) {
      const result = await apiUnsubscribeRoute.run(ctx, { eventType, eventName })
      message.value = result.message
      messageType.value = result.success ? 'success' : 'error'
    } else {
      const result = await apiSubscribeRoute.run(ctx, { eventType, eventName })
      message.value = result.message
      messageType.value = result.success ? 'success' : 'error'
    }
    
    await loadSubscriptions()
    
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    message.value = 'Произошла ошибка: ' + error.message
    messageType.value = 'error'
  } finally {
    processing.value = false
  }
}

async function loadAvailableEvents() {
  availableEvents.value = await apiAvailableEventsRoute.run(ctx)
}

async function loadSubscriptions() {
  subscriptions.value = await apiSubscriptionsListRoute.run(ctx)
}

async function subscribeAll(eventType) {
  processing.value = true
  message.value = ''
  
  try {
    const result = await apiSubscribeAllRoute.run(ctx, { eventType })
    message.value = result.message
    messageType.value = 'success'
    
    await loadSubscriptions()
    
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    message.value = 'Произошла ошибка: ' + error.message
    messageType.value = 'error'
  } finally {
    processing.value = false
  }
}

async function unsubscribeAll(eventType) {
  processing.value = true
  message.value = ''
  
  try {
    const result = await apiUnsubscribeAllRoute.run(ctx, { eventType })
    message.value = result.message
    messageType.value = 'success'
    
    await loadSubscriptions()
    
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    message.value = 'Произошла ошибка: ' + error.message
    messageType.value = 'error'
  } finally {
    processing.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      loadAvailableEvents(),
      loadSubscriptions()
    ])
  } catch (error) {
    message.value = 'Ошибка загрузки данных: ' + error.message
    messageType.value = 'error'
  } finally {
    loading.value = false
  }
})
</script>