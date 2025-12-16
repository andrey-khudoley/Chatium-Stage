<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Заголовок -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <i class="fas fa-cog text-white text-2xl"></i>
          </div>
          <div>
            <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Настройки
            </h1>
            <p class="text-gray-400 text-sm mt-1">Конфигурация опроса Telegram</p>
          </div>
        </div>
        <a :href="indexPageRoute.url()" class="px-5 py-3 bg-gray-700/50 text-gray-200 rounded-xl hover:bg-gray-700 transition-all duration-300 border border-gray-600/50 flex items-center space-x-2">
          <i class="fas fa-arrow-left"></i>
          <span>Назад</span>
        </a>
      </div>

      <!-- Основная карточка -->
      <div class="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-8 space-y-8">
        <!-- Токены ботов -->
        <div class="space-y-3">
          <label class="flex items-center space-x-2 text-sm font-semibold text-gray-300">
            <i class="fas fa-key text-blue-400"></i>
            <span>Токены Telegram ботов</span>
          </label>
          <p class="text-xs text-gray-400 ml-7">
            Введите токены ботов, разделяя их переносами строк или запятыми. Каждый токен будет опрашиваться отдельно.
          </p>
          <textarea
            v-model="tokens"
            rows="6"
            class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200 font-mono text-sm placeholder-gray-500 transition-all duration-200"
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz&#10;987654321:XYZabcDEFghiJKLmnoPQRstuv"
          ></textarea>
        </div>

        <!-- Переключатель активности -->
        <div class="flex items-center justify-between p-6 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/50">
          <div class="flex-1">
            <label class="flex items-center space-x-2 text-sm font-semibold text-gray-300 mb-2">
              <i class="fas fa-power-off text-purple-400"></i>
              <span>Автоматический опрос</span>
            </label>
            <p class="text-xs text-gray-400 ml-7">
              При включении система будет автоматически опрашивать Telegram API каждые 15 секунд для каждого токена
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              v-model="isActive"
              @change="saveSettings"
              class="sr-only peer"
            />
            <div class="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600 shadow-lg"></div>
            <span class="ml-4 text-sm font-medium" :class="isActive ? 'text-green-400' : 'text-gray-400'">
              {{ isActive ? 'Включено' : 'Выключено' }}
            </span>
          </label>
        </div>

        <!-- Уровень логирования -->
        <div class="space-y-3">
          <label class="flex items-center space-x-2 text-sm font-semibold text-gray-300">
            <i class="fas fa-align-left text-purple-400"></i>
            <span>Уровень логирования</span>
          </label>
          <p class="text-xs text-gray-400 ml-7">
            Выберите уровень детализации логов. <strong class="text-gray-300">info</strong> - максимальная детализация, <strong class="text-gray-300">warn</strong> - предупреждения и ошибки, <strong class="text-gray-300">error</strong> - только ошибки.
          </p>
          <select
            v-model="logLevel"
            @change="saveSettings"
            class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200 transition-all duration-200"
          >
            <option value="info" class="bg-gray-800">Info - максимальная детализация</option>
            <option value="warn" class="bg-gray-800">Warn - предупреждения и ошибки</option>
            <option value="error" class="bg-gray-800">Error - только ошибки</option>
          </select>
        </div>

        <!-- Кнопки действий -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-700/50">
          <button
            @click="showDebugInfo"
            class="px-5 py-3 bg-gray-700/50 text-gray-200 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600/50 flex items-center space-x-2 hover:scale-105"
          >
            <i class="fas fa-bug"></i>
            <span>Диагностика</span>
          </button>
          <button
            @click="manualPoll"
            :disabled="polling"
            class="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
          >
            <i class="fas fa-play"></i>
            <span>{{ polling ? 'Опрос...' : 'Ручной опрос' }}</span>
          </button>
          <button
            @click="saveSettings"
            :disabled="saving"
            class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
          >
            <i class="fas fa-save"></i>
            <span>{{ saving ? 'Сохранение...' : 'Сохранить' }}</span>
          </button>
        </div>

        <!-- Сообщение об успехе/ошибке -->
        <div v-if="message" :class="messageType === 'success' ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/50 text-green-200' : 'bg-gradient-to-r from-red-900/50 to-rose-900/50 border-red-500/50 text-red-200'" class="p-4 rounded-xl border backdrop-blur-sm">
          <div class="flex items-center space-x-3">
            <i :class="messageType === 'success' ? 'fas fa-check-circle text-green-400' : 'fas fa-exclamation-circle text-red-400'" class="text-xl"></i>
            <span class="font-medium">{{ message }}</span>
          </div>
        </div>

        <!-- Диагностическая информация -->
        <div v-if="debugInfo" class="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-5 backdrop-blur-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-blue-300 flex items-center space-x-2">
              <i class="fas fa-info-circle"></i>
              <span>Информация о системе</span>
            </h3>
            <button @click="debugInfo = null" class="text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-gray-700/50 rounded-lg">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <pre class="bg-gray-950/80 p-4 rounded-lg border border-gray-700/50 overflow-auto text-xs text-gray-300 font-mono">{{ JSON.stringify(debugInfo, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiGetSettingsRoute, apiSaveSettingsRoute } from '../api/settings'
import { apiDebugRoute, apiManualPollRoute } from '../api/debug'
import { indexPageRoute } from '../index'

const tokens = ref('')
const isActive = ref(false)
const logLevel = ref('error')
const saving = ref(false)
const polling = ref(false)
const message = ref('')
const messageType = ref('success')
const debugInfo = ref(null)
const pollError = ref(null)
const pollSuccess = ref(null)
const pollLoading = ref(false)

async function loadSettings() {
  try {
    const result = await apiGetSettingsRoute.run(ctx, {})
    
    if (result.success) {
      tokens.value = result.settings.bot_tokens || ''
      isActive.value = result.settings.is_active === 'true'
      logLevel.value = result.settings.log_level || 'error'
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error)
    showMessage('Ошибка загрузки настроек', 'error')
  }
}

async function saveSettings() {
  saving.value = true
  message.value = ''
  
  try {
    const result = await apiSaveSettingsRoute.run(ctx, {
      tokens: tokens.value,
      isActive: isActive.value,
      logLevel: logLevel.value
    })
    
    if (result.success) {
      if (isActive.value) {
        showMessage('Настройки сохранены. Опрос Telegram запущен', 'success')
      } else {
        showMessage('Настройки успешно сохранены', 'success')
      }
    } else {
      showMessage('Ошибка сохранения настроек', 'error')
    }
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error)
    showMessage('Ошибка сохранения настроек', 'error')
  } finally {
    saving.value = false
  }
}

function showMessage(text, type) {
  message.value = text
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

async function loadDebugInfo() {
  try {
    const result = await apiDebugRoute.run(ctx)
    debugInfo.value = result
  } catch (error) {
    console.error('Ошибка получения диагностики:', error)
  }
}

async function showDebugInfo() {
  await loadDebugInfo()
}

async function manualPoll() {
  pollLoading.value = true
  pollError.value = null
  pollSuccess.value = null

  try {
    const response = await apiManualPollRoute.run(ctx, {})
    if (response.success) {
      pollSuccess.value = `${response.message}. Найдено обновлений: ${response.totalUpdates || 0}`
      if (response.results) {
        console.log('Результаты опроса:', response.results)
      }
      showMessage(pollSuccess.value, 'success')
      // Перезагружаем диагностику
      setTimeout(loadDebugInfo, 1000)
    } else {
      pollError.value = response.error || 'Неизвестная ошибка'
      showMessage('Ошибка: ' + pollError.value, 'error')
    }
  } catch (err) {
    pollError.value = String(err)
    showMessage('Ошибка: ' + pollError.value, 'error')
  } finally {
    pollLoading.value = false
    setTimeout(() => {
      polling.value = false
    }, 2000)
  }
}

onMounted(() => {
  loadSettings()
})
</script>