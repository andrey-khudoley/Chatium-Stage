<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Заголовок с градиентом -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <i class="fas fa-list-alt text-white text-2xl"></i>
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Последние события Telegram
            </h1>
            <p class="text-gray-400 text-sm mt-1">Мониторинг вебхуков в реальном времени</p>
          </div>
        </div>
        <a :href="settingsRoute.url()" class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
          <i class="fas fa-cog"></i>
          <span>Настройки</span>
        </a>
      </div>

      <!-- Карточка с таблицей -->
      <div class="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gradient-to-r from-gray-700/50 to-gray-800/50 border-b border-gray-700">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">ID</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Токен бота</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Update ID</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Время получения</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700/50">
              <tr v-for="webhook in webhooks" :key="webhook.id" class="hover:bg-gray-700/30 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-200">{{ webhook.id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{{ webhook.botToken }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-400 font-semibold">{{ webhook.updateId }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{{ formatDate(webhook.receivedAt) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    @click.prevent="openModal(webhook.id)"
                    class="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors duration-200 transform hover:scale-110"
                    title="Просмотр деталей"
                    type="button"
                  >
                    <i class="fas fa-info-circle text-lg"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="webhooks.length === 0">
                <td colspan="5" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center space-y-3">
                    <i class="fas fa-inbox text-4xl text-gray-600"></i>
                    <p class="text-gray-400 text-lg">Нет событий</p>
                    <p class="text-gray-500 text-sm">События появятся здесь после настройки токенов</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div v-if="total > limit" class="px-6 py-4 border-t border-gray-700/50 flex items-center justify-between bg-gray-800/50">
          <div class="text-sm text-gray-400">
            Показано <span class="text-blue-400 font-semibold">{{ offset + 1 }}</span> - 
            <span class="text-blue-400 font-semibold">{{ Math.min(offset + limit, total) }}</span> из 
            <span class="text-purple-400 font-semibold">{{ total }}</span>
          </div>
          <div class="flex gap-3">
            <button
              @click="loadPage(offset - limit)"
              :disabled="offset === 0"
              class="px-5 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 disabled:hover:bg-gray-700"
            >
              <i class="fas fa-chevron-left"></i>
              <span>Назад</span>
            </button>
            <button
              @click="loadPage(offset + limit)"
              :disabled="offset + limit >= total"
              class="px-5 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 disabled:hover:bg-gray-700"
            >
              <span>Вперед</span>
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно -->
    <div
      v-if="selectedWebhook"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      @click.self="closeModal"
    >
      <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700/50 animate-slideUp">
        <div class="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gray-800/50">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <i class="fas fa-info-circle text-white"></i>
            </div>
            <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Детали вебхука
            </h3>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-gray-700 rounded-lg">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div class="mb-6 space-y-3">
            <div class="flex items-center p-3 bg-gray-700/30 rounded-lg border border-gray-700/50">
              <span class="font-semibold text-gray-400 w-32">ID:</span>
              <span class="text-gray-200 font-mono">{{ selectedWebhook.id }}</span>
            </div>
            <div class="flex items-center p-3 bg-gray-700/30 rounded-lg border border-gray-700/50">
              <span class="font-semibold text-gray-400 w-32">Update ID:</span>
              <span class="text-blue-400 font-semibold">{{ selectedWebhook.updateId }}</span>
            </div>
            <div class="flex items-center p-3 bg-gray-700/30 rounded-lg border border-gray-700/50">
              <span class="font-semibold text-gray-400 w-32">Время:</span>
              <span class="text-gray-200">{{ formatDate(selectedWebhook.receivedAt) }}</span>
            </div>
          </div>
          <div class="mt-6">
            <div class="mb-3 flex items-center space-x-2">
              <i class="fas fa-code text-purple-400"></i>
              <label class="font-semibold text-gray-300">Данные вебхука:</label>
            </div>
            <div class="bg-gray-950 border border-gray-700/50 rounded-xl p-5 overflow-x-auto shadow-inner">
              <pre class="text-sm font-mono" v-html="formattedJson"></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiGetWebhooksRoute } from '../api/webhooks'
import { settingsRoute } from '../settings'

const props = defineProps({
  apiUrls: {
    type: Object,
    required: true
  }
})

const webhooks = ref([])
const total = ref(0)
const limit = ref(50)
const offset = ref(0)
const selectedWebhook = ref(null)

async function loadWebhooks() {
  try {
    const result = await apiGetWebhooksRoute
      .query({
        limit: String(limit.value),
        offset: String(offset.value)
      })
      .run(ctx)
    
    if (result.success) {
      webhooks.value = result.webhooks
      total.value = result.total
    }
  } catch (error) {
    console.error('Ошибка загрузки вебхуков:', error)
  }
}

async function openModal(webhookId) {
  try {
    console.log('Открытие модального окна для вебхука:', webhookId)
    console.log('apiUrls из props:', props.apiUrls)
    console.log('Шаблон URL из props:', props.apiUrls.getWebhook)
    
    // Используем шаблон URL из props, заменяя :id на реальный ID
    // Шаблон - это относительный путь с тильдой, начинающийся с /
    let apiUrl = props.apiUrls.getWebhook
    if (apiUrl && apiUrl.includes(':id')) {
      apiUrl = apiUrl.replace(':id', String(webhookId))
      console.log('URL после замены :id:', apiUrl)
    } else {
      // Fallback, если URL не передан или не содержит :id
      apiUrl = `/personal/testing/telegram/get_webhooks/api/webhooks~${webhookId}`
      console.log('Используется fallback URL:', apiUrl)
    }
    
    // Убеждаемся, что URL начинается с / (относительный путь от корня)
    if (!apiUrl.startsWith('/')) {
      apiUrl = '/' + apiUrl
      console.log('URL после добавления /:', apiUrl)
    }
    
    console.log('Финальный URL для запроса:', apiUrl)
    console.log('Полный URL будет:', window.location.origin + apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    })
    
    console.log('Ответ получен, статус:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ошибка HTTP:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const result = await response.json()
    console.log('Результат загрузки вебхука:', result)
    
    if (result && result.success) {
      console.log('Устанавливаем selectedWebhook.value:', result.webhook)
      selectedWebhook.value = result.webhook
      console.log('selectedWebhook.value установлен:', selectedWebhook.value)
      console.log('Модальное окно должно открыться, selectedWebhook:', selectedWebhook.value)
    } else {
      const errorMsg = result?.error || 'Неизвестная ошибка'
      console.error('Ошибка загрузки вебхука:', errorMsg)
      alert('Ошибка загрузки вебхука: ' + errorMsg)
    }
  } catch (error) {
    console.error('Ошибка загрузки вебхука:', error)
    alert('Ошибка загрузки вебхука: ' + String(error))
  }
}

function closeModal() {
  selectedWebhook.value = null
}

function loadPage(newOffset) {
  if (newOffset >= 0 && newOffset < total.value) {
    offset.value = newOffset
    loadWebhooks()
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatJson(obj) {
  try {
    const jsonString = JSON.stringify(obj, null, 2)
    return escapeHtml(jsonString)
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'text-gray-300'
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-300'
          } else {
            cls = 'text-green-400'
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-400'
        } else if (/null/.test(match)) {
          cls = 'text-gray-400'
        } else {
          cls = 'text-yellow-400'
        }
        return `<span class="${cls}">${match}</span>`
      })
  } catch (error) {
    return escapeHtml(String(obj))
  }
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const formattedJson = computed(() => {
  if (!selectedWebhook.value) {
    console.log('formattedJson: selectedWebhook.value is null')
    return ''
  }
  if (!selectedWebhook.value.data) {
    console.log('formattedJson: selectedWebhook.value.data is null', selectedWebhook.value)
    return ''
  }
  console.log('formattedJson: форматирование данных', selectedWebhook.value.data)
  return formatJson(selectedWebhook.value.data)
})

function toggleExpandAll() {
  // Просто перерисовываем JSON
  if (selectedWebhook.value) {
    const data = selectedWebhook.value.data
    selectedWebhook.value = { ...selectedWebhook.value }
    setTimeout(() => {
      selectedWebhook.value.data = data
    }, 0)
  }
}

onMounted(() => {
  loadWebhooks()
  // Автообновление каждые 5 секунд
  setInterval(() => {
    if (!selectedWebhook.value) {
      loadWebhooks()
    }
  }, 5000)
})
</script>