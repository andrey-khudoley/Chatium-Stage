<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
    <ThemeToggle />
    
    <div class="container py-6 max-w-4xl">
      <!-- Хлебные крошки -->
      <div class="mb-6">
        <a :href="homeUrl" class="text-[var(--color-primary)] hover:opacity-70 flex items-center gap-2">
          <i class="fas fa-arrow-left"></i>
          Назад к главной
        </a>
      </div>

      <!-- Заголовок -->
      <header class="text-center mb-8 mt-4">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
          <i class="fas fa-key text-2xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
          Настройки OAuth AmoCRM
        </h1>
        <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Настройте параметры для подключения к AmoCRM через OAuth 2.0
        </p>
      </header>

      <!-- Статус подключения и авторизация -->
      <div v-if="hasConfig && hasValidToken" class="card mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-shield-alt" style="color: var(--color-primary)"></i>
            Статус подключения и авторизация
          </h2>
          <button @click="checkStatus" class="text-[var(--color-primary)] hover:opacity-70">
            <i class="fas fa-sync" :class="{ 'animate-spin': checking }"></i>
          </button>
        </div>
        
        <div v-if="checking" class="text-center py-8">
          <i class="fas fa-spinner animate-spin text-3xl" style="color: var(--color-primary)"></i>
        </div>
        
        <div v-else>
          <!-- Статус -->
          <div class="flex items-center gap-4 mb-6 p-4 rounded-lg" :style="{ background: statusColor + '10', border: '2px solid ' + statusColor }">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center"
                 :style="{ background: statusColor + '20' }">
              <i class="fas text-2xl" :class="statusIcon" :style="{ color: statusColor }"></i>
            </div>
            <div class="flex-1">
              <p class="font-bold text-lg" :style="{ color: statusColor }">{{ statusText }}</p>
              <p class="text-sm text-[var(--color-text-secondary)]">{{ statusDescription }}</p>
              <p v-if="oauthStatus.expiresAt" class="text-xs text-[var(--color-text-secondary)] mt-1">
                Токен действителен до: {{ formatDate(oauthStatus.expiresAt) }}
              </p>
            </div>
          </div>
          
          <!-- Информация об автообновлении -->
          <div v-if="autoRefreshInfo.hasAutoRefresh" class="mb-4 p-4 rounded-lg" style="background-color: rgba(34, 197, 94, 0.1); border: 2px solid var(--color-success);">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-check-circle text-lg" style="color: var(--color-success)"></i>
              <p class="font-bold text-lg" style="color: var(--color-success)">
                Автообновление включено
              </p>
            </div>
            <p class="text-sm text-[var(--color-text-secondary)]">
              <i class="fas fa-clock mr-1"></i>
              Следующее обновление: {{ formatDate(autoRefreshInfo.nextRefreshAt) }}
            </p>
          </div>
          
          <!-- Кнопки управления -->
          <div class="flex gap-3 flex-wrap">
            <button @click="refreshToken" class="btn" style="background: var(--color-warning);" :disabled="authorizing">
              <i v-if="authorizing" class="fas fa-spinner animate-spin mr-2"></i>
              <i v-else class="fas fa-sync mr-2"></i>
              Обновить токен вручную
            </button>
            
            <button 
              v-if="!autoRefreshInfo.hasAutoRefresh"
              @click="startAutoRefresh" 
              class="btn" 
              style="background: var(--color-success);"
              :disabled="authorizing"
            >
              <i v-if="authorizing" class="fas fa-spinner animate-spin mr-2"></i>
              <i v-else class="fas fa-clock mr-2"></i>
              Включить автообновление
            </button>
            
            <button 
              v-if="autoRefreshInfo.hasAutoRefresh"
              @click="cancelAutoRefresh" 
              class="btn" 
              style="background: var(--color-danger);"
              :disabled="cancelling"
            >
              <i v-if="cancelling" class="fas fa-spinner animate-spin mr-2"></i>
              <i v-else class="fas fa-times mr-2"></i>
              Отменить автообновление
            </button>
          </div>
          
          <div v-if="!autoRefreshInfo.hasAutoRefresh" class="mt-4 p-3 rounded-lg" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
            <p class="text-sm text-[var(--color-text-secondary)]">
              <i class="fas fa-info-circle mr-1"></i>
              Автообновление будет обновлять токен каждые 8 часов автоматически
            </p>
          </div>
        </div>
      </div>

      <!-- Инструкция -->
      <div v-if="!hasValidToken" class="card mb-8 warning-card">
        <div class="flex items-start gap-4">
          <div class="warning-icon-box">
            <i class="fas fa-info-circle text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-3">
              Пошаговая инструкция по настройке OAuth
            </h3>
            
            <!-- Шаг 1: Создание интеграции -->
            <div class="mb-4">
              <h4 class="font-bold text-lg mb-2">Шаг 1: Создание интеграции в AmoCRM</h4>
              <ol class="space-y-2 pl-5 list-decimal opacity-90">
                <li>Войдите в свой аккаунт AmoCRM</li>
                <li>Перейдите в раздел <strong>"Настройки"</strong> → <strong>"Интеграции"</strong></li>
                <li>Нажмите <strong>"Создать интеграцию"</strong></li>
                <li>Заполните название и описание интеграции</li>
              </ol>
            </div>

            <!-- Шаг 2: Redirect URI -->
            <div class="mb-4">
              <h4 class="font-bold text-lg mb-2">Шаг 2: Укажите Redirect URI</h4>
              <p class="mb-2 text-sm opacity-90">
                В настройках интеграции в поле <strong>"Redirect URI"</strong> укажите следующий адрес:
              </p>
              <div class="bg-[var(--color-bg)] rounded-lg p-3 border border-[var(--color-border)] flex items-center gap-2">
                <code class="flex-1 text-sm break-all">{{ redirectUri }}</code>
                <button 
                  @click="copyToClipboard(redirectUri, 'Redirect URI скопирован!')"
                  class="px-3 py-1 rounded bg-[var(--color-primary)] text-white hover:opacity-80 transition-opacity text-sm"
                  :class="{ 'opacity-50': copying }"
                >
                  <i class="fas fa-copy mr-1"></i>
                  {{ copying ? 'Скопировано!' : 'Копировать' }}
                </button>
              </div>
            </div>

            <!-- Шаг 3: Получение ключей -->
            <div class="mb-4">
              <h4 class="font-bold text-lg mb-2">Шаг 3: Получите ключи доступа</h4>
              <p class="mb-2 text-sm opacity-90">
                После создания интеграции AmoCRM выдаст вам:
              </p>
              <ul class="space-y-1 pl-5 list-disc opacity-90">
                <li><strong>Integration ID</strong> (он же Client ID) — идентификатор интеграции</li>
                <li><strong>Secret Key</strong> (он же Client Secret) — секретный ключ</li>
              </ul>
              <p class="mt-2 text-sm opacity-90">
                💡 <strong>Важно:</strong> Secret Key показывается только один раз! Сохраните его в безопасном месте.
              </p>
            </div>

            <!-- Шаг 4: Заполнение формы -->
            <div class="mb-4">
              <h4 class="font-bold text-lg mb-2">Шаг 4: Заполните форму ниже</h4>
              <ul class="space-y-1 pl-5 list-disc opacity-90">
                <li><strong>Subdomain</strong> — ваш поддомен AmoCRM (например: <code>mycompany</code> из <code>mycompany.amocrm.ru</code>)</li>
                <li><strong>Client ID</strong> — Integration ID из предыдущего шага</li>
                <li><strong>Client Secret</strong> — Secret Key из предыдущего шага</li>
                <li><strong>Redirect URI</strong> — скопируйте из блока выше (он уже заполнен автоматически)</li>
              </ul>
            </div>

            <!-- Шаг 5: Авторизация -->
            <div>
              <h4 class="font-bold text-lg mb-2">Шаг 5: Авторизация</h4>
              <ol class="space-y-1 pl-5 list-decimal opacity-90">
                <li>После заполнения формы нажмите <strong>"Сохранить настройки"</strong></li>
                <li>Затем нажмите <strong>"Авторизоваться в AmoCRM"</strong></li>
                <li>Вы будете перенаправлены на страницу AmoCRM для подтверждения доступа</li>
                <li>После подтверждения вернётесь на эту страницу с активным подключением</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <!-- Форма настроек -->
      <div class="card mb-8">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <i class="fas fa-cog" style="color: var(--color-primary)"></i>
          Параметры подключения
        </h2>
        
        <form @submit.prevent="saveConfig">
          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">
              Subdomain AmoCRM <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="config.subdomain" 
              type="text" 
              class="input" 
              placeholder="your-domain"
              required
            />
            <p class="text-xs text-[var(--color-text-secondary)] mt-1">
              Только имя домена без .amocrm.ru (например: my-company)
            </p>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">
              Client ID <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="config.clientId" 
              type="text" 
              class="input" 
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
            />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">
              Client Secret <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="config.clientSecret" 
              type="password" 
              class="input" 
              placeholder="••••••••••••••••"
              required
            />
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-semibold mb-2">
              Redirect URI <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="config.redirectUri" 
              type="url" 
              class="input" 
              placeholder="https://your-domain.com/oauth/callback"
              required
            />
            <p class="text-xs text-[var(--color-text-secondary)] mt-1">
              URL должен совпадать с указанным в настройках интеграции AmoCRM
            </p>
          </div>
          
          <div v-if="error" class="mb-4 p-4 rounded-lg" style="background: var(--color-danger); color: white;">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            {{ error }}
          </div>
          
          <div v-if="success" class="mb-4 p-4 rounded-lg" style="background: var(--color-success); color: white;">
            <i class="fas fa-check-circle mr-2"></i>
            {{ success }}
          </div>
          
          <button type="submit" class="btn btn-primary w-full" :disabled="saving">
            <i v-if="saving" class="fas fa-spinner animate-spin mr-2"></i>
            <i v-else class="fas fa-save mr-2"></i>
            {{ saving ? 'Сохранение...' : 'Сохранить настройки' }}
          </button>
        </form>
      </div>

      <!-- Блок авторизации для первой авторизации -->
      <div v-if="hasConfig && !hasValidToken" class="card mb-8">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <i class="fas fa-lock-open" style="color: var(--color-primary)"></i>
          Авторизация
        </h2>
        
        <div class="space-y-4">
          <p class="text-[var(--color-text-secondary)]">
            Для получения доступа к API AmoCRM необходимо авторизоваться
          </p>
          
          <button @click="authorize" class="btn btn-primary w-full" :disabled="authorizing">
            <i v-if="authorizing" class="fas fa-spinner animate-spin mr-2"></i>
            <i v-else class="fas fa-sign-in-alt mr-2"></i>
            {{ authorizing ? 'Авторизация...' : 'Авторизоваться в AmoCRM' }}
          </button>
          
          <div v-if="authCode && authorizing" class="p-4 rounded-lg text-center" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
            <i class="fas fa-spinner animate-spin text-3xl mb-3" style="color: var(--color-primary)"></i>
            <p class="text-sm font-semibold">Обмениваем код на токен...</p>
            <p class="text-xs text-[var(--color-text-secondary)] mt-1">Пожалуйста, подождите</p>
          </div>
        </div>
      </div>

      <!-- Таблица настроек проекта -->
      <div class="card mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-table" style="color: var(--color-primary)"></i>
            Настройки проекта
          </h2>
          <button @click="showAddModal = true" class="btn btn-primary flex items-center gap-2">
            <i class="fas fa-plus"></i>
            Добавить
          </button>
        </div>
        
        <div v-if="loadingSettings" class="text-center py-12">
          <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
          <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка настроек...</p>
        </div>
        
        <div v-else-if="settingsError" class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger)"></i>
          <p style="color: var(--color-danger)">{{ settingsError }}</p>
        </div>
        
        <div v-else-if="settings.length === 0" class="text-center py-12">
          <i class="fas fa-inbox text-6xl text-[var(--color-text-secondary)] opacity-20 mb-4"></i>
          <p class="text-[var(--color-text-secondary)] text-lg">Настройки отсутствуют</p>
          <p class="text-sm text-[var(--color-text-secondary)] mt-2">Добавьте первую настройку, нажав кнопку "Добавить"</p>
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Ключ</th>
                <th>Значение</th>
                <th>Описание</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="setting in settings" :key="setting.id">
                <td>
                  <code class="badge">{{ setting.key }}</code>
                </td>
                <td>
                  <span class="font-mono text-sm">{{ setting.value }}</span>
                </td>
                <td class="text-[var(--color-text-secondary)]">
                  {{ setting.description || '—' }}
                </td>
                <td class="text-right">
                  <button 
                    @click="editSetting(setting)" 
                    class="mr-3 transition-opacity hover:opacity-70"
                    style="color: var(--color-primary)"
                    title="Редактировать"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    @click="deleteSetting(setting)" 
                    class="transition-opacity hover:opacity-70"
                    style="color: var(--color-danger)"
                    title="Удалить"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования настроек проекта -->
    <Transition name="fade">
      <div v-show="showAddModal" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-2xl font-bold">
              {{ editingId ? 'Редактировать настройку' : 'Добавить настройку' }}
            </h3>
            <button @click="closeModal" class="text-2xl text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form @submit.prevent="saveSetting">
            <div class="mb-4">
              <label class="block text-sm font-semibold mb-2">
                Ключ настройки <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="formSetting.key" 
                type="text" 
                class="input" 
                placeholder="api_key"
                required
                :disabled="editingId !== null"
              />
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-semibold mb-2">
                Значение <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="formSetting.value" 
                type="text" 
                class="input" 
                placeholder="your_api_key_here"
                required
              />
            </div>
            
            <div class="mb-6">
              <label class="block text-sm font-semibold mb-2">
                Описание
              </label>
              <textarea 
                v-model="formSetting.description" 
                class="input min-h-[100px]" 
                placeholder="Описание настройки..."
              ></textarea>
            </div>
            
            <div class="flex gap-3">
              <button type="submit" class="btn btn-primary flex-1" :disabled="submitting">
                <i v-if="submitting" class="fas fa-spinner animate-spin mr-2"></i>
                <i v-else class="fas fa-save mr-2"></i>
                {{ submitting ? 'Сохранение...' : 'Сохранить' }}
              </button>
              <button type="button" @click="closeModal" class="btn" style="background: var(--color-border);">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { oauthSettingsPageRoute } from '../oauthSettings'
import { indexPageRoute } from '../index'
import { 
  apiGetOAuthConfigRoute,
  apiSaveOAuthConfigRoute,
  apiGetOAuthStatusRoute,
  apiGetAuthUrlRoute,
  apiExchangeCodeRoute,
  apiRefreshTokenRoute,
  apiGetAutoRefreshInfoRoute
} from '../api/amocrm'
import { 
  apiStartTokenRefreshRoute,
  apiCancelTokenRefreshRoute
} from '../.functions/refreshAmoCRMToken'
import { apiGetSettingsRoute, apiUpdateSettingRoute, apiDeleteSettingRoute } from '../api/settings'

const config = ref({
  subdomain: '',
  clientId: '',
  clientSecret: '',
  redirectUri: ''
})

const oauthStatus = ref({
  status: 'offline',
  expiresAt: null
})

const autoRefreshInfo = ref({
  hasAutoRefresh: false,
  nextRefreshAt: null,
  taskId: null
})

const saving = ref(false)
const checking = ref(false)
const authorizing = ref(false)
const error = ref(null)
const success = ref(null)
const authCode = ref('')
const copying = ref(false)
const cancelling = ref(false)

// Переменные для работы с настройками проекта
const settings = ref([])
const loadingSettings = ref(true)
const settingsError = ref(null)
const showAddModal = ref(false)
const submitting = ref(false)
const editingId = ref(null)

const formSetting = ref({
  key: '',
  value: '',
  description: ''
})

// Получаем текущий URL страницы для использования как Redirect URI
const redirectUri = computed(() => oauthSettingsPageRoute.url())

const hasConfig = computed(() => {
  return config.value.subdomain && config.value.clientId && 
         config.value.clientSecret && config.value.redirectUri
})

const hasValidToken = computed(() => {
  return oauthStatus.value.status === 'active'
})

const statusColor = computed(() => {
  switch (oauthStatus.value.status) {
    case 'active': return 'var(--color-success)'
    case 'expired': return 'var(--color-warning)'
    case 'offline': return 'var(--color-danger)'
    default: return 'var(--color-text-secondary)'
  }
})

const statusIcon = computed(() => {
  switch (oauthStatus.value.status) {
    case 'active': return 'fa-check-circle'
    case 'expired': return 'fa-exclamation-triangle'
    case 'offline': return 'fa-times-circle'
    default: return 'fa-question-circle'
  }
})

const statusText = computed(() => {
  switch (oauthStatus.value.status) {
    case 'active': return 'Активно'
    case 'expired': return 'Токен истёк'
    case 'offline': return 'Не подключено'
    default: return 'Неизвестно'
  }
})

const statusDescription = computed(() => {
  switch (oauthStatus.value.status) {
    case 'active': return 'Подключение к AmoCRM работает'
    case 'expired': return 'Необходимо обновить токен'
    case 'offline': return 'Требуется авторизация'
    default: return ''
  }
})

const homeUrl = computed(() => indexPageRoute.url())

onMounted(async () => {
  await Promise.all([loadConfig(), checkStatus(), loadAutoRefreshInfo(), loadSettings()])
  
  // Автоматически устанавливаем Redirect URI
  if (!config.value.redirectUri) {
    config.value.redirectUri = redirectUri.value
  }
  
  // Проверяем URL на наличие кода авторизации
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  if (code) {
    authCode.value = code
    // Автоматически обмениваем код на токен
    await exchangeCode()
  }
  
  // Скрываем глобальный прелоадер после монтирования
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
})

async function copyToClipboard(text, message) {
  try {
    await navigator.clipboard.writeText(text)
    copying.value = true
    success.value = message || 'Скопировано в буфер обмена'
    
    setTimeout(() => {
      copying.value = false
      success.value = null
    }, 2000)
  } catch (err) {
    error.value = 'Не удалось скопировать в буфер обмена'
    setTimeout(() => {
      error.value = null
    }, 3000)
  }
}

async function loadConfig() {
  try {
    const response = await apiGetOAuthConfigRoute.run(ctx)
    if (response.success && response.config) {
      config.value = response.config
    }
  } catch (e) {
    console.error('Ошибка загрузки конфигурации:', e)
  }
}

async function checkStatus() {
  checking.value = true
  try {
    const response = await apiGetOAuthStatusRoute.run(ctx)
    if (response.success) {
      oauthStatus.value = {
        status: response.status,
        expiresAt: response.expiresAt
      }
    }
  } catch (e) {
    console.error('Ошибка проверки статуса:', e)
  } finally {
    checking.value = false
  }
}

async function loadAutoRefreshInfo() {
  try {
    const response = await apiGetAutoRefreshInfoRoute.run(ctx)
    if (response.success) {
      autoRefreshInfo.value = {
        hasAutoRefresh: response.hasAutoRefresh,
        nextRefreshAt: response.nextRefreshAt,
        taskId: response.taskId
      }
    }
  } catch (e) {
    console.error('Ошибка загрузки информации об автообновлении:', e)
  }
}

async function saveConfig() {
  saving.value = true
  error.value = null
  success.value = null
  
  try {
    const response = await apiSaveOAuthConfigRoute.run(ctx, config.value)
    
    if (response.success) {
      success.value = 'Настройки успешно сохранены'
      setTimeout(() => { success.value = null }, 3000)
    } else {
      error.value = response.error || 'Ошибка сохранения'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    saving.value = false
  }
}

async function authorize() {
  authorizing.value = true
  error.value = null
  
  try {
    const response = await apiGetAuthUrlRoute.run(ctx)
    
    if (response.success && response.authUrl) {
      // Открываем окно авторизации
      window.location.href = response.authUrl
    } else {
      error.value = response.error || 'Ошибка генерации URL'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    authorizing.value = false
  }
}

async function exchangeCode() {
  authorizing.value = true
  error.value = null
  success.value = null
  
  try {
    const response = await apiExchangeCodeRoute.run(ctx, { code: authCode.value })
    
    if (response.success) {
      success.value = 'Авторизация успешна!'
      authCode.value = ''
      await checkStatus()
      
      // Очищаем URL от кода
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      error.value = response.error || 'Ошибка обмена кода'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    authorizing.value = false
  }
}

async function refreshToken() {
  authorizing.value = true
  error.value = null
  success.value = null
  
  try {
    const response = await apiRefreshTokenRoute.run(ctx)
    
    if (response.success) {
      success.value = 'Токен успешно обновлён'
      await checkStatus()
    } else {
      error.value = response.error || 'Ошибка обновления токена'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    authorizing.value = false
  }
}

async function startAutoRefresh() {
  authorizing.value = true
  error.value = null
  success.value = null
  
  try {
    const response = await apiStartTokenRefreshRoute.run(ctx)
    
    console.log('Ответ от apiStartTokenRefreshRoute:', response)
    
    if (response.success) {
      success.value = 'Автообновление токена запущено! Токен будет обновляться каждые 8 часов автоматически.'
      await Promise.all([checkStatus(), loadAutoRefreshInfo()])
    } else {
      error.value = response.error || 'Ошибка запуска автообновления'
      console.error('Ошибка при запуске автообновления:', response)
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
    console.error('Исключение при запуске автообновления:', e)
  } finally {
    authorizing.value = false
  }
}

async function cancelAutoRefresh() {
  cancelling.value = true
  error.value = null
  success.value = null
  
  try {
    const response = await apiCancelTokenRefreshRoute.run(ctx)
    
    if (response.success) {
      success.value = 'Автообновление токена отменено'
      await loadAutoRefreshInfo()
    } else {
      error.value = response.error || 'Ошибка отмены автообновления'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    cancelling.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Функции для работы с настройками проекта
async function loadSettings() {
  loadingSettings.value = true
  settingsError.value = null
  
  try {
    const response = await apiGetSettingsRoute.run(ctx)
    if (response.success) {
      settings.value = response.settings
    } else {
      settingsError.value = response.error || 'Ошибка загрузки настроек'
    }
  } catch (e) {
    settingsError.value = e.message || 'Ошибка сети'
  } finally {
    loadingSettings.value = false
  }
}

function editSetting(setting) {
  editingId.value = setting.id
  formSetting.value = {
    key: setting.key,
    value: setting.value,
    description: setting.description || ''
  }
  showAddModal.value = true
}

async function saveSetting() {
  submitting.value = true
  
  try {
    const response = await apiUpdateSettingRoute.run(ctx, formSetting.value)
    
    if (response.success) {
      await loadSettings()
      closeModal()
    } else {
      settingsError.value = response.error || 'Ошибка сохранения'
    }
  } catch (e) {
    settingsError.value = e.message || 'Ошибка сети'
  } finally {
    submitting.value = false
  }
}

async function deleteSetting(setting) {
  if (!confirm(`Удалить настройку "${setting.key}"?`)) {
    return
  }
  
  try {
    const response = await apiDeleteSettingRoute.run(ctx, { key: setting.key })
    
    if (response.success) {
      await loadSettings()
    } else {
      settingsError.value = response.error || 'Ошибка удаления'
    }
  } catch (e) {
    settingsError.value = e.message || 'Ошибка сети'
  }
}

function closeModal() {
  showAddModal.value = false
  editingId.value = null
  formSetting.value = {
    key: '',
    value: '',
    description: ''
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg) 100%);
  border: 1.5px solid var(--color-border);
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
