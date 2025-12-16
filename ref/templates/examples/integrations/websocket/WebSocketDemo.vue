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
            <i class="fas fa-plug mr-2 text-blue-600"></i>
            WebSocket / Real-time
          </h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid gap-8">
        
        <!-- WebSocket Notifications -->
        <ExampleSection title="WebSocket Уведомления">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold">Статус соединения</h3>
                <StatusBadge :status="wsNotifications.connected ? 'success' : 'error'">
                  {{ wsNotifications.connected ? 'Подключено' : 'Отключено' }}
                </StatusBadge>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Каналы подписки:</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <label v-for="channel in availableChannels" :key="channel" class="flex items-center">
                    <input 
                      type="checkbox" 
                      :value="channel" 
                      v-model="wsNotifications.channels"
                      class="mr-2"
                    >
                    <span class="text-sm">{{ channel }}</span>
                  </label>
                </div>
              </div>
              
              <button 
                @click="toggleNotificationsWS"
                :disabled="wsNotifications.connecting"
                class="px-4 py-2 rounded-lg transition-colors"
                :class="wsNotifications.connected ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'"
              >
                <i :class="wsNotifications.connected ? 'fas fa-stop-circle' : 'fas fa-play-circle'" class="mr-2"></i>
                {{ wsNotifications.connecting ? 'Подключение...' : (wsNotifications.connected ? 'Отключиться' : 'Подключиться') }}
              </button>
            </div>
            
            <div class="space-y-2 max-h-60 overflow-y-auto">
              <div v-for="(notification, index) in wsNotifications.messages" :key="index" 
                   class="p-3 border rounded-lg" :class="getNotificationClass(notification.type)">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium text-sm">{{ notification.type }}</h4>
                    <p class="text-sm mt-1">{{ JSON.stringify(notification.data) }}</p>
                  </div>
                  <span class="text-xs text-gray-500">
                    {{ formatTime(notification.timestamp) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="mt-4 flex gap-2">
              <button @click="sendTestNotification" 
                      :disabled="!wsNotifications.connected"
                      class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400">
                <i class="fas fa-paper-plane mr-1"></i>
                Тестовое уведомление
              </button>
              <button @click="clearNotifications" 
                      class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                <i class="fas fa-trash mr-1"></i>
                Очистить
              </button>
            </div>
          </div>
        </ExampleSection>

        <!-- Chat Room -->
        <ExampleSection title="Многопользовательский чат">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Комната: {{ chat.roomId }}</h3>
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-4">
                  <input 
                    v-model="chat.username" 
                    placeholder="Ваше имя"
                    class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                  <StatusBadge :status="chat.connected ? 'success' : 'error'">
                    {{ chat.connected ? 'Онлайн' : 'Офлайн' }}
                  </StatusBadge>
                  <span v-if="chat.typingUsers.length > 0" class="text-sm text-gray-600">
                    {{ chat.typingUsers.join(', ') }} {{ chat.typingUsers.length > 1 ? 'печат...' : 'печат...' }}
                  </span>
                </div>
                <button 
                  @click="toggleChatWS"
                  :disabled="chat.connecting || !chat.username"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {{ chat.connecting ? 'Подключение...' : (chat.connected ? 'Отключиться' : 'Подключиться') }}
                </button>
              </div>
            </div>
            
            <div class="grid md:grid-cols-3 gap-4 mb-4">
              <div class="md:col-span-2">
                <div class="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
                  <div v-if="chat.messages.length === 0" class="text-center text-gray-500 py-8">
                    <i class="fas fa-comments text-3xl mb-2"></i>
                    <p>Комната пуста. Начните первым!</p>
                  </div>
                  <div v-for="message in chat.messages" :key="message.id" class="mb-3">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {{ message.username.charAt(0).toUpperCase() }}
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-medium text-sm">{{ message.username }}</span>
                          <span class="text-xs text-gray-500">{{ formatTime(message.timestamp) }}</span>
                        </div>
                        <div class="bg-white p-2 rounded-lg border">
                          <span class="text-sm">{{ message.text }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div class="border rounded-lg p-4 h-32 overflow-y-auto bg-gray-50">
                  <h4 class="font-medium text-sm mb-2">Участники онлайн:</h4>
                  <div class="text-sm text-gray-600">
                    {{ chat.connected ? chat.username : 'Подключитесь для просмотра' }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2">
              <input 
                v-model="chat.currentMessage"
                @input="handleTyping"
                @keyup.enter="sendMessage"
                placeholder="Введите сообщение..."
                :disabled="!chat.connected"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button 
                @click="sendMessage"
                :disabled="!chat.connected || !chat.currentMessage.trim()"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </ExampleSection>

        <!-- Real-time Data Updates -->
        <ExampleSection title="Real-time Обновления данных">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Мониторинг обновлений</h3>
              <div class="flex items-center gap-4 mb-4">
                <div class="flex flex-wrap gap-2">
                  <label v-for="entity in availableEntities" :key="entity" class="flex items-center">
                    <input 
                      type="checkbox" 
                      :value="entity" 
                      v-model="realtime.subscriptions"
                      @change="updateSubscriptions"
                      class="mr-2"
                    >
                    <span class="text-sm">{{ entity }}</span>
                  </label>
                </div>
                <StatusBadge :status="realtime.connected ? 'success' : 'error'">
                  {{ realtime.connected ? 'Подключено' : 'Отключено' }}
                </StatusBadge>
                <button 
                  @click="toggleRealtimeWS"
                  :disabled="realtime.connecting"
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                >
                  {{ realtime.connecting ? 'Подключение...' : (realtime.connected ? 'Отключиться' : 'Подключиться') }}
                </button>
              </div>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4 mb-4">
              <div class="space-y-3">
                <h4 class="font-medium">Обновления в реальном времени</h4>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  <div v-for="(update, index) in realtime.updates" :key="index" 
                       class="p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div class="flex justify-between items-start">
                      <div>
                        <span class="font-medium">{{ update.entity }}:</span>
                        <span class="text-gray-600 ml-1">{{ update.field }} = {{ update.newValue }}</span>
                      </div>
                      <span class="text-xs text-gray-500">{{ formatTime(update.timestamp) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="space-y-3">
                <h4 class="font-medium">Текущее состояние</h4>
                <div class="space-y-2">
                  <div v-for="entity in realtime.subscriptions" :key="entity" class="border rounded p-3">
                    <h5 class="font-medium text-sm mb-2">{{ entity }}</h5>
                    <div v-if="realtime.currentState[entity]" class="text-xs text-gray-600">
                      <pre>{{ JSON.stringify(realtime.currentState[entity], null, 2) }}</pre>
                    </div>
                    <div v-else class="text-xs text-gray-400">
                      Данные отсутствуют
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button 
                @click="triggerDataUpdate"
                :disabled="!realtime.connected"
                class="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:bg-gray-400">
                <i class="fas fa-sync mr-1"></i>
                Сымитировать обновление
              </button>
              <button 
                @click="clearRealtimeData"
                class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                <i class="fas fa-trash mr-1"></i>
                Очистить
              </button>
            </div>
          </div>
        </ExampleSection>

        <!-- System Monitor -->
        <ExampleSection title="Системный мониторинг">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Статистика WebSocket сервера</h3>
              <div class="flex items-center gap-4 mb-4">
                <StatusBadge :status="monitor.connected ? 'success' : 'error'">
                  {{ monitor.connected ? 'Подключено' : 'Отключено' }}
                </StatusBadge>
                <button 
                  @click="toggleMonitorWS"
                  :disabled="monitor.connecting"
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                >
                  {{ monitor.connecting ? 'Подключение...' : (monitor.connected ? 'Отключиться' : 'Подключиться') }}
                </button>
                <button 
                  @click="requestStats"
                  :disabled="!monitor.connected"
                  class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 text-sm"
                >
                  <i class="fas fa-chart-bar mr-1"></i>
                  Обновить статистику
                </button>
              </div>
            </div>
            
            <div v-if="monitor.stats" class="grid md:grid-cols-3 gap-4 mb-4">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <i class="fas fa-plug text-blue-600 mr-2"></i>
                  <span class="font-medium">WebSocket соединения</span>
                </div>
                <div class="text-2xl font-bold text-blue-600">{{ monitor.stats.websocket_connections }}</div>
              </div>
              
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <i class="fas fa-comments text-green-600 mr-2"></i>
                  <span class="font-medium">Активные чаты</span>
                </div>
                <div class="text-2xl font-bold text-green-600">{{ monitor.stats.chat_rooms }}</div>
              </div>
              
              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <i class="fas fa-memory text-purple-600 mr-2"></i>
                  <span class="font-medium">Память</span>
                </div>
                <div class="text-2xl font-bold text-purple-600">
                  {{ formatMemory(monitor.stats.memory_usage?.used) }}
                </div>
              </div>
            </div>
            
            <div v-if="monitor.stats?.chat_rooms_detail?.length > 0" class="mt-4">
              <h4 class="font-medium mb-2">Детализация по чатам:</h4>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <div v-for="room in monitor.stats.chat_rooms_detail" :key="room.roomId" 
                     class="flex justify-between text-sm bg-gray-50 p-2 rounded">
                  <span>Комната {{ room.roomId }}</span>
                  <span class="font-medium">{{ room.participants }} участников</span>
                </div>
              </div>
            </div>
          </div>
        </ExampleSection>
      </div>
    </main>
  </div>
</template>

<script setup>
// @shared
import { jsx } from "@app/html-jsx"
import { ExampleSection, StatusBadge } from "../../shared/components"

const indexPageRoute = {
  url: () => '/examples'
}

// WebSocket соединения
let notificationsWS = null
let chatWS = null
let realtimeWS = null
let monitorWS = null

// Состояния
const wsNotifications = ref({
  connected: false,
  connecting: false,
  channels: [],
  messages: []
})

const chat = ref({
  connected: false,
  connecting: false,
  roomId: 'general',
  username: '',
  messages: [],
  currentMessage: '',
  typingUsers: []
})

const realtime = ref({
  connected: false,
  connecting: false,
  subscriptions: ['users', 'products', 'orders'],
  updates: [],
  currentState: {}
})

const monitor = ref({
  connected: false,
  connecting: false,
  stats: null
})

// Данные
const availableChannels = ['notifications', 'alerts', 'system', 'marketing']
const availableEntities = ['users', 'products', 'orders']

// WebSocket функции
function toggleNotificationsWS() {
  if (wsNotifications.value.connected) {
    disconnectNotifications()
  } else {
    connectNotifications()
  }
}

function connectNotifications() {
  wsNotifications.value.connecting = true
  try {
    notificationsWS = new WebSocket('ws://localhost/ws/notifications')
    
    notificationsWS.onopen = () => {
      wsNotifications.value.connected = true
      wsNotifications.value.connecting = false
      
      // Подписываемся на каналы
      notificationsWS.send(JSON.stringify({
        type: 'subscribe',
        userId: 'demo-user',
        channels: wsNotifications.value.channels
      }))
    }
    
    notificationsWS.onmessage = (event) => {
      const data = JSON.parse(event.data)
      wsNotifications.value.messages.unshift({
        ...data,
        timestamp: new Date()
      })
      
      // Оставляем только последние 50 сообщений
      if (wsNotifications.value.messages.length > 50) {
        wsNotifications.value.messages.pop()
      }
    }
    
    notificationsWS.onclose = () => {
      wsNotifications.value.connected = false
      wsNotifications.value.connecting = false
      notificationsWS = null
    }
    
    notificationsWS.onerror = (error) => {
      console.error('WebSocket ошибка:', error)
      wsNotifications.value.connecting = false
    }
  } catch (error) {
    console.error('Ошибка подключения WebSocket:', error)
    wsNotifications.value.connecting = false
  }
}

function disconnectNotifications() {
  if (notificationsWS) {
    notificationsWS.close()
    notificationsWS = null
  }
  wsNotifications.value.connected = false
}

function toggleChatWS() {
  if (chat.value.connected) {
    disconnectChat()
  } else {
    connectChat()
  }
}

function connectChat() {
  if (!chat.value.username) {
    alert('Введите ваше имя')
    return
  }
  
  chat.value.connecting = true
  try {
    chatWS = new WebSocket(`ws://localhost/ws/chat/${chat.value.roomId}`)
    
    chatWS.onopen = () => {
      chat.value.connected = true
      chat.value.connecting = false
    }
    
    chatWS.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'history':
          chat.value.messages = data.messages || []
          break
        case 'message':
          chat.value.messages.push(data.message)
          break
        case 'typing':
          if (data.isTyping) {
            if (!chat.value.typingUsers.includes(data.username)) {
              chat.value.typingUsers.push(data.username)
            }
          } else {
            chat.value.typingUsers = chat.value.typingUsers.filter(u => u !== data.username)
          }
          
          // Убираем через 3 секунды
          setTimeout(() => {
            chat.value.typingUsers = chat.value.typingUsers.filter(u => u !== data.username)
          }, 3000)
          break
      }
    }
    
    chatWS.onclose = () => {
      chat.value.connected = false
      chat.value.connecting = false
      chatWS = null
    }
    
    chatWS.onerror = (error) => {
      console.error('Chat WebSocket ошибка:', error)
      chat.value.connecting = false
    }
  } catch (error) {
    console.error('Ошибка подключения к чату:', error)
    chat.value.connecting = false
  }
}

function disconnectChat() {
  if (chatWS) {
    chatWS.close()
    chatWS = null
  }
  chat.value.connected = false
  chat.value.messages = []
}

function toggleRealtimeWS() {
  if (realtime.value.connected) {
    disconnectRealtime()
  } else {
    connectRealtime()
  }
}

function connectRealtime() {
  realtime.value.connecting = true
  try {
    realtimeWS = new WebSocket('ws://localhost/ws/realtime')
    
    realtimeWS.onopen = () => {
      realtime.value.connected = true
      realtime.value.connecting = false
      
      // Подписываемся на обновления
      updateSubscriptions()
    }
    
    realtimeWS.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'state_update') {
        // Обновляем состояние
        realtime.value.currentState[data.entity] = data.data
        
        // Добавляем в историю обновлений
        realtime.value.updates.unshift({
          entity: data.entity,
          field: data.field,
          newValue: data.newValue,
          timestamp: new Date()
        })
        
        // Оставляем только последние 20 обновлений
        if (realtime.value.updates.length > 20) {
          realtime.value.updates.pop()
        }
      }
    }
    
    realtimeWS.onclose = () => {
      realtime.value.connected = false
      realtime.connecting = false
      realtimeWS = null
    }
    
    realtimeWS.onerror = (error) => {
      console.error('Realtime WebSocket ошибка:', error)
      realtime.value.connecting = false
    }
  } catch (error) {
    console.error('Ошибка подключения realtime:', error)
    realtime.value.connecting = false
  }
}

function disconnectRealtime() {
  if (realtimeWS) {
    realtimeWS.close()
    realtimeWS = null
  }
  realtime.value.connected = false
}

function toggleMonitorWS() {
  if (monitor.value.connected) {
    disconnectMonitor()
  } else {
    connectMonitor()
  }
}

function connectMonitor() {
  monitor.value.connecting = true
  try {
    monitorWS = new WebSocket('ws://localhost/ws/monitor')
    
    monitorWS.onopen = () => {
      monitor.value.connected = true
      monitor.value.connecting = false
      requestStats()
    }
    
    monitorWS.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'monitor_status' || data.type === 'monitor_stats') {
        monitor.value.stats = data.data
      }
    }
    
    monitorWS.onclose = () => {
      monitor.value.connected = false
      monitor.value.connecting = false
      monitorWS = null
    }
    
    monitorWS.onerror = (error) => {
      console.error('Monitor WebSocket ошибка:', error)
      monitor.value.connecting = false
    }
  } catch (error) {
    console.error('Ошибка подключения к монитору:', error)
    monitor.value.connecting = false
  }
}

function disconnectMonitor() {
  if (monitorWS) {
    monitorWS.close()
    monitorWS = null
  }
  monitor.value.connected = false
}

// API вызовы
async function sendTestNotification() {
  try {
    const response = await fetch('/api/ws/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test',
        data: { message: 'Тестовое уведомление', timestamp: new Date() },
        channels: wsNotifications.value.channels.length > 0 ? wsNotifications.value.channels : ['test']
      })
    })
    
    const result = await response.json()
    console.log('Test notification result:', result)
  } catch (error) {
    console.error('Ошибка отправки тестового уведомления:', error)
  }
}

async function sendMessage() {
  if (!chat.currentMessage.trim()) return
  
  try {
    const response = await fetch('/api/ws/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: chat.value.roomId,
        userId: 'demo-user',
        username: chat.value.username,
        text: chat.value.currentMessage
      })
    })
    
    // Также отправляем через WebSocket для мгновенного отображения
    if (chatWS) {
      chatWS.send(JSON.stringify({
        type: 'message',
        userId: 'demo-user',
        username: chat.value.username,
        text: chat.value.currentMessage
      }))
    }
    
    chat.value.currentMessage = ''
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error)
  }
}

async function triggerDataUpdate() {
  const entities = ['users', 'products', 'orders']
  const entity = entities[Math.floor(Math.random() * entities.length)]
  const fields = {
    users: ['name', 'email', 'status'],
    products: ['name', 'price', 'stock'],
    orders: ['status', 'total']
  }
  const entityFields = fields[entity]
  const field = entityFields[Math.floor(Math.random() * entityFields.length)]
  const value = Math.random().toString(36).substring(7)
  
  try {
    const response = await fetch('/api/ws/send-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity,
        entityId: `demo-${entity}-${Date.now()}`,
        data: { [field]: value },
        fieldsUpdated: [field]
      })
    })
    
  } catch (error) {
    console.error('Ошибка имитации обновления:', error)
  }
}

async function requestStats() {
  try {
    if (monitorWS) {
      monitorWS.send(JSON.stringify({
        type: 'get_stats'
      }))
    }
  } catch (error) {
    console.error('Ошибка запроса статистики:', error)
  }
}

// Обработчики
function handleTyping() {
  if (chatWS && chat.value.currentMessage.length > 0) {
    chatWS.send(JSON.stringify({
      type: 'typing',
      userId: 'demo-user',
      username: chat.value.username,
      isTyping: true
    }))
    
    // Отправляем остановку через 3 секунды
    setTimeout(() => {
      if (chatWS) {
        chatWS.send(JSON.stringify({
          type: 'typing',
          userId: 'demo-user',
          username: chat.value.username,
          isTyping: false
        }))
      }
    }, 3000)
  }
}

function updateSubscriptions() {
  if (realtimeWS && realtime.value.connected) {
    realtimeWS.send(JSON.stringify({
      type: 'subscribe_updates',
      entities: realtime.value.subscriptions
    }))
  }
}

// Очистка данных
function clearNotifications() {
  wsNotifications.value.messages = []
}

function clearRealtimeData() {
  realtime.value.updates = []
  realtime.value.currentState = {}
}

// Вспомогательные функции
function formatTime(date) {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatMemory(bytes) {
  if (!bytes) return 'N/A'
  const mb = bytes / 1024 / 1024
  return mb.toFixed(1) + ' MB'
}

function getNotificationClass(type) {
  const typeClasses = {
    'test': 'bg-blue-50 border-blue-200',
    'system': 'bg-yellow-50 border-yellow-200',
    'alert': 'bg-red-50 border-red-200',
    'marketing': 'bg-purple-50 border-purple-200',
    'welcome': 'bg-green-50 border-green-200'
  }
  return typeClasses[type] || 'bg-gray-50 border-gray-200'
}

// Инициализация
onMounted(() => {
  // Автоподключение к уведомлениям
  connectNotifications()
})

// Очистка при размонтировании
onUnmounted(() => {
  disconnectNotifications()
  disconnectChat()
  disconnectRealtime()
  disconnectMonitor()
})
</script>