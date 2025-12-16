<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- Хедер -->
    <div class="bg-white shadow-md">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <i class="fas fa-robot text-primary text-2xl"></i>
            <div>
              <h1 class="text-xl font-bold text-dark">AI Ассистент</h1>
              <p class="text-xs text-gray-500">Интеллектуальный помощник на базе искусственного интеллекта, готовый ответить на ваши вопросы и помочь в решении задач</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <a 
              v-if="ctx.user && isAdmin" 
              :href="adminPageRoute.url()" 
              class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <i class="fas fa-cog mr-1"></i>
              Админка
            </a>
            
            <div v-if="ctx.user" class="text-sm text-gray-700">
              <i class="fas fa-user mr-1"></i>
              {{ ctx.user.displayName }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Основной контейнер -->
    <div class="container mx-auto px-4 py-6">
      <div class="max-w-5xl mx-auto">
        <!-- Если не авторизован -->
        <div v-if="!ctx.user" class="bg-white rounded-lg shadow-lg p-8 text-center">
          <i class="fas fa-lock text-gray-400 text-5xl mb-4"></i>
          <h2 class="text-2xl font-bold text-dark mb-2">Требуется авторизация</h2>
          <p class="text-gray-600">Для использования чата необходимо войти в систему</p>
        </div>
        
        <!-- Чат -->
        <div v-else class="bg-white rounded-lg shadow-lg overflow-hidden">
          <!-- Панель инструментов -->
          <div class="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 flex-1">
                <label class="text-sm font-medium text-gray-700">Агент:</label>
                <select 
                  v-model="selectedAgentId" 
                  @change="onAgentChange"
                  class="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  :disabled="loading"
                >
                  <option value="">Выберите агента...</option>
                  <option 
                    v-for="agent in agents" 
                    :key="agent.id" 
                    :value="agent.id"
                  >
                    {{ agent.title }}
                  </option>
                </select>
              </div>
              
              <div class="flex items-center space-x-2">
                <button
                  @click="clearChat"
                  :disabled="!selectedAgentId || loading"
                  class="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Очистить окно чата"
                >
                  <i class="fas fa-eraser"></i>
                </button>
                <button
                  @click="resetContext"
                  :disabled="!selectedAgentId || loading"
                  class="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Сбросить контекст (начать новый диалог)"
                >
                  <i class="fas fa-redo"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Область сообщений -->
          <div 
            ref="messagesContainer"
            class="h-[500px] overflow-y-auto p-4 space-y-4"
          >
            <!-- Заглушка если агент не выбран -->
            <div v-if="!selectedAgentId" class="flex items-center justify-center h-full text-gray-400">
              <div class="text-center">
                <i class="fas fa-comments text-5xl mb-3"></i>
                <p class="text-lg">Выберите агента для начала диалога</p>
              </div>
            </div>
            
            <!-- Сообщения -->
            <template v-else>
              <div 
                v-for="(msg, index) in messages" 
                :key="msg.id"
              >
                <!-- Маркер сброса контекста -->
                <div v-if="msg.isContextReset" class="flex items-center justify-center my-6">
                  <div class="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm">
                    <i class="fas fa-redo"></i>
                    <span>{{ msg.content }}</span>
                  </div>
                </div>
                
                <!-- Маркер смены агента -->
                <div v-else-if="msg.isAgentChange" class="flex items-center justify-center my-6">
                  <div class="flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm">
                    <i class="fas fa-exchange-alt"></i>
                    <span>{{ msg.content }}</span>
                  </div>
                </div>
                
                <!-- Обычное сообщение -->
                <div 
                  v-else
                  :class="[
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  ]"
                >
                  <div 
                    :class="[
                      'max-w-[70%] rounded-lg px-4 py-3 shadow-sm',
                      msg.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    <div v-if="msg.role === 'assistant'" class="flex items-center space-x-2 mb-1">
                      <i class="fas fa-robot text-sm"></i>
                      <span class="text-xs font-semibold">AI Ассистент</span>
                    </div>
                    <p class="whitespace-pre-wrap break-words">{{ msg.content }}</p>
                    <div 
                      :class="[
                        'text-xs mt-1 opacity-70',
                        msg.role === 'user' ? 'text-right' : 'text-left'
                      ]"
                    >
                      {{ formatTime(msg.createdAt) }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Индикатор набора текста -->
              <div v-if="isTyping" class="flex justify-start">
                <div class="bg-gray-100 rounded-lg px-4 py-3 shadow-sm">
                  <div class="flex items-center space-x-2">
                    <i class="fas fa-robot text-sm text-gray-600"></i>
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                      <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          
          <!-- Поле ввода -->
          <div class="border-t border-gray-200 p-4">
            <div class="flex space-x-3">
              <input
                v-model="newMessage"
                @keyup.enter="sendMessage"
                :disabled="!selectedAgentId || loading || isTyping"
                type="text"
                placeholder="Введите сообщение..."
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                @click="sendMessage"
                :disabled="!selectedAgentId || !newMessage.trim() || loading || isTyping"
                class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <i class="fas fa-paper-plane"></i>
                <span>Отправить</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import { adminPageRoute } from '../admin'
import { 
  apiGetAgentsListRoute,
  apiGetChatHistoryRoute,
  apiSendMessageRoute,
  apiClearChatRoute,
  apiResetContextRoute,
  apiGetSocketIdRoute
} from '../api/chat'

const agents = ref([])
const selectedAgentId = ref('')
const messages = ref([])
const newMessage = ref('')
const loading = ref(false)
const isTyping = ref(false)
const messagesContainer = ref(null)
const currentChainKey = ref('')
const socketSubscription = ref(null)

// Проверка прав администратора
const isAdmin = computed(() => {
  if (!ctx.user) {
    return false
  }
  return ctx.user.is('Admin')
})

// Инициализация
onMounted(async () => {
  if (!ctx.user) return
  
  await loadAgents()
})

// Загрузить список агентов
async function loadAgents() {
  try {
    loading.value = true
    const result = await apiGetAgentsListRoute.run(ctx)
    
    if (result.success) {
      agents.value = result.agents || []
      
      // Автоматически выбираем первого агента
      if (agents.value.length > 0) {
        selectedAgentId.value = agents.value[0].id
        await onAgentChange()
      }
    }
  } catch (error) {
    console.error('Error loading agents:', error)
  } finally {
    loading.value = false
  }
}

// Смена агента
async function onAgentChange() {
  if (!selectedAgentId.value) return
  
  const selectedAgent = agents.value.find(a => a.id === selectedAgentId.value)
  
  // КРИТИЧЕСКИ ВАЖНО: Отключаем индикатор печати при смене агента
  // чтобы он не висел, если предыдущий агент генерировал ответ
  isTyping.value = false
  
  // Пытаемся загрузить сохранённый chainKey из localStorage
  const storageKey = `chainKey-${ctx.user.id}-${selectedAgentId.value}`
  let savedChainKey = null
  try {
    savedChainKey = localStorage.getItem(storageKey)
  } catch (e) {
    console.warn('Не удалось прочитать chainKey из localStorage:', e)
  }
  
  // Если есть сохранённый chainKey - используем его, иначе создаём новый
  if (savedChainKey) {
    console.log('📦 Используем сохранённый chainKey:', savedChainKey)
    currentChainKey.value = savedChainKey
  } else {
    console.log('🆕 Создаём новый chainKey')
    currentChainKey.value = `${ctx.user.id}-${selectedAgentId.value}-${Date.now()}`
    // Сохраняем новый chainKey в localStorage
    try {
      localStorage.setItem(storageKey, currentChainKey.value)
    } catch (e) {
      console.warn('Не удалось сохранить chainKey в localStorage:', e)
    }
  }
  
  // Загружаем историю сообщений
  await loadChatHistory()
  
  // Если история пустая, показываем маркер смены агента
  if (messages.value.length === 0) {
    messages.value = [{
      id: `agent-change-${Date.now()}`,
      content: `Выбран агент: ${selectedAgent?.title || 'Неизвестный'}`,
      role: 'system',
      isAgentChange: true,
      createdAt: new Date()
    }]
  }
  
  // Подписываемся на WebSocket
  await subscribeToSocket()
}

// Загрузить историю чата
async function loadChatHistory() {
  if (!selectedAgentId.value || !currentChainKey.value) return
  
  try {
    // ВАЖНО: для GET запросов используем .query() для передачи параметров
    const result = await apiGetChatHistoryRoute.query({
      chainKey: currentChainKey.value,
      agentId: selectedAgentId.value
    }).run(ctx)
    
    if (result.success && result.messages) {
      messages.value.push(...result.messages)
      scrollToBottom()
    }
  } catch (error) {
    console.error('Error loading chat history:', error)
  }
}

// Подписка на WebSocket
async function subscribeToSocket() {
  if (!selectedAgentId.value || !currentChainKey.value) return
  
  try {
    console.log('🔌 Subscribing to WebSocket...', {
      chainKey: currentChainKey.value,
      agentId: selectedAgentId.value,
      userId: ctx.user.id
    })
    
    // Отписываемся от предыдущего
    if (socketSubscription.value) {
      console.log('🔌 Unsubscribing from previous socket')
      if (typeof socketSubscription.value.unsubscribe === 'function') {
        socketSubscription.value.unsubscribe()
      }
      socketSubscription.value = null
    }
    
    // Получаем encodedSocketId
    // ВАЖНО: для GET запросов используем .query() для передачи параметров
    const result = await apiGetSocketIdRoute.query({
      chainKey: currentChainKey.value,
      agentId: selectedAgentId.value
    }).run(ctx)
    
    if (!result.success) {
      console.error('❌ Failed to get socket ID:', result.error)
      return
    }
    
    console.log('✅ Got encodedSocketId:', result.encodedSocketId)
    
    // Создаём подписку
    const socketClient = await getOrCreateBrowserSocketClient()
    socketSubscription.value = socketClient.subscribeToData(result.encodedSocketId)
    
    console.log('✅ Created WebSocket subscription')
    
    // Слушаем обновления
    socketSubscription.value.listen(data => {
      console.log('📩 Received WebSocket data:', data)
      
      if (data.type === 'assistant-message') {
        console.log('💬 Assistant message received:', data.data.content)
        isTyping.value = false
        
        messages.value.push({
          id: data.data.id || `msg-${Date.now()}`,
          role: 'assistant',
          content: data.data.content,
          createdAt: data.data.timestamp || new Date()
        })
        
        scrollToBottom()
      } else if (data.type === 'typing') {
        console.log('⌨️ Typing indicator:', data.data.isTyping)
        isTyping.value = data.data.isTyping
      }
    })
  } catch (error) {
    console.error('❌ Error subscribing to socket:', error)
  }
}

// Отправить сообщение
async function sendMessage() {
  if (!newMessage.value.trim() || !selectedAgentId.value || loading.value) return
  
  const messageText = newMessage.value.trim()
  newMessage.value = ''
  
  try {
    loading.value = true
    isTyping.value = true
    
    console.log('📤 Sending message...', {
      chainKey: currentChainKey.value,
      agentId: selectedAgentId.value,
      userId: ctx.user.id,
      messageLength: messageText.length
    })
    
    // Добавляем сообщение пользователя в UI
    messages.value.push({
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date()
    })
    
    scrollToBottom()
    
    const selectedAgent = agents.value.find(a => a.id === selectedAgentId.value)
    
    // Отправляем на сервер
    const result = await apiSendMessageRoute.run(ctx, {
      message: messageText,
      chainKey: currentChainKey.value,
      agentId: selectedAgentId.value,
      agentKey: selectedAgent?.key || ''
    })
    
    console.log('📤 Message sent, result:', result)
    
    if (!result.success) {
      console.error('❌ Message sending failed:', result.error)
      isTyping.value = false
      messages.value.push({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Ошибка: ${result.error}`,
        createdAt: new Date()
      })
    } else {
      console.log('✅ Message sent successfully, waiting for agent response...')
    }
  } catch (error) {
    isTyping.value = false
    console.error('❌ Error sending message:', error)
  } finally {
    loading.value = false
  }
}

// Очистить чат
async function clearChat() {
  if (!confirm('Очистить окно чата? История сохранится на сервере.')) return
  
  try {
    loading.value = true
    
    const result = await apiClearChatRoute.run(ctx, {
      chainKey: currentChainKey.value,
      agentId: selectedAgentId.value
    })
    
    if (result.success) {
      const selectedAgent = agents.value.find(a => a.id === selectedAgentId.value)
      messages.value = [{
        id: `cleared-${Date.now()}`,
        content: `Чат очищен. Агент: ${selectedAgent?.title || 'Неизвестный'}`,
        role: 'system',
        isAgentChange: true,
        createdAt: new Date()
      }]
    }
  } catch (error) {
    console.error('Error clearing chat:', error)
  } finally {
    loading.value = false
  }
}

// Сбросить контекст
async function resetContext() {
  if (!confirm('Сбросить контекст? Начнётся новый диалог.')) return
  
  try {
    loading.value = true
    
    // КРИТИЧЕСКИ ВАЖНО: Отключаем индикатор печати, т.к. агент может генерировать ответ на старый chainKey
    // и мы не получим событие typing:false после переподписки на новый socket
    isTyping.value = false
    
    const result = await apiResetContextRoute.run(ctx, {
      agentId: selectedAgentId.value
    })
    
    if (result.success) {
      currentChainKey.value = result.newChainKey
      
      // Сохраняем новый chainKey в localStorage
      const storageKey = `chainKey-${ctx.user.id}-${selectedAgentId.value}`
      try {
        localStorage.setItem(storageKey, currentChainKey.value)
        console.log('💾 Сохранён новый chainKey после сброса контекста:', currentChainKey.value)
      } catch (e) {
        console.warn('Не удалось сохранить chainKey в localStorage:', e)
      }
      
      messages.value.push({
        id: `reset-${Date.now()}`,
        content: 'Контекст сброшен. Начат новый диалог.',
        role: 'system',
        isContextReset: true,
        createdAt: new Date()
      })
      
      // Переподписываемся на новый socket
      await subscribeToSocket()
      
      scrollToBottom()
    }
  } catch (error) {
    console.error('Error resetting context:', error)
  } finally {
    loading.value = false
  }
}

// Прокрутка вниз
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Форматирование времени
function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
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

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>