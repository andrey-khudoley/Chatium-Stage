<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
    <ThemeToggle />
    
    <div class="container py-6 max-w-6xl">
      <!-- Заголовок -->
      <header class="text-center mb-8 mt-8">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
          <i class="fas fa-plug text-2xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
          AmoCRM Connector
        </h1>
        <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Управление настройками интеграции с AmoCRM
        </p>
      </header>

      <!-- Статистика -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="card cursor-pointer" @click="refreshServices">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-[var(--color-text-secondary)] mb-1">Активных сервисов</p>
              <p class="text-3xl font-bold text-[var(--color-text)]">{{ activeServicesCount }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
              <i class="fas fa-cog text-[var(--color-primary)] text-xl"></i>
            </div>
          </div>
        </div>
        
        <button @click="openOAuthSettings" class="card hover:opacity-80 transition-opacity cursor-pointer w-full text-left">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-[var(--color-text-secondary)] mb-1">Статус OAuth</p>
              <p class="text-3xl font-bold" :style="{ color: oauthStatusColor }">
                {{ oauthStatusText }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" 
                 :style="{ background: oauthStatus.status === 'active' ? 'var(--color-primary-light)' : 'var(--color-bg)' }">
              <i class="fas text-xl" 
                 :class="oauthStatusIcon"
                 :style="{ color: oauthStatusColor }"></i>
            </div>
          </div>
        </button>
        
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-[var(--color-text-secondary)] mb-1">Последнее обновление</p>
              <p class="text-lg font-semibold text-[var(--color-text)]">{{ lastUpdate }}</p>
            </div>
            <div class="w-12 h-12 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
              <i class="fas fa-clock text-[var(--color-primary)] text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Таблица сервисов -->
      <div class="card mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-cogs" style="color: var(--color-primary)"></i>
            Сервисы
          </h2>
        </div>
        
        <div v-if="loadingServices" class="text-center py-12">
          <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
          <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка сервисов...</p>
        </div>
        
        <div v-else-if="servicesError" class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger)"></i>
          <p style="color: var(--color-danger)">{{ servicesError }}</p>
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Название</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="service in services" :key="service.id">
                <td>
                  <div class="flex items-center gap-2">
                    <i :class="service.id === 'webhook-service' ? 'fas fa-bolt' : 'fas fa-cog'" style="color: var(--color-primary)"></i>
                    <span class="font-semibold">{{ service.title }}</span>
                    <span v-if="service.id === 'webhook-service' && service.status === 'active'" 
                          class="badge"
                          style="background: var(--color-success-light); color: var(--color-success);">
                      Активен
                    </span>
                  </div>
                </td>
                <td class="text-right">
                  <a 
                    :href="service.id === 'webhook-service' ? webhookSettingsUrl : `/dev/amocrm-connector/service/${service.id}`" 
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style="background-color: var(--color-primary); color: white; font-weight: 500;"
                  >
                    Перейти
                  </a>
                </td>
              </tr>
              <!-- Дополнительные поля -->
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-list-alt" style="color: var(--color-primary)"></i>
                    <span class="font-semibold">Дополнительные поля AmoCRM</span>
                  </div>
                </td>
                <td class="text-right">
                  <a 
                    :href="customFieldsUrl" 
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style="background-color: var(--color-primary); color: white; font-weight: 500;"
                  >
                    Перейти
                  </a>
                </td>
              </tr>
              <!-- Обработка вебхуков -->
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-bolt" style="color: var(--color-primary)"></i>
                    <span class="font-semibold">Обработка вебхуков</span>
                    <span 
                      v-if="webhookEnabled" 
                      class="badge"
                      style="background: var(--color-success-light); color: var(--color-success);"
                    >
                      Активен
                    </span>
                    <span 
                      v-else 
                      class="badge"
                      style="background: var(--color-text-tertiary); color: var(--color-text-secondary);"
                    >
                      Неактивен
                    </span>
                  </div>
                </td>
                <td class="text-right">
                  <a 
                    :href="webhookSettingsUrl" 
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style="background-color: var(--color-primary); color: white; font-weight: 500;"
                  >
                    Перейти
                  </a>
                </td>
              </tr>
              <!-- Генерация ссылок на оплату -->
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-credit-card" style="color: var(--color-primary)"></i>
                    <span class="font-semibold">Генерация ссылок на оплату</span>
                    <span 
                      v-if="paymentServiceEnabled" 
                      class="badge"
                      style="background: var(--color-success-light); color: var(--color-success);"
                    >
                      Активен
                    </span>
                    <span 
                      v-else 
                      class="badge"
                      style="background: var(--color-text-tertiary); color: var(--color-text-secondary);"
                    >
                      Неактивен
                    </span>
                  </div>
                </td>
                <td class="text-right">
                  <a 
                    :href="paymentServiceUrl" 
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style="background-color: var(--color-primary); color: white; font-weight: 500;"
                  >
                    Перейти
                  </a>
                </td>
              </tr>
              <!-- Комментарии в AmoCRM -->
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-comment-dots" style="color: var(--color-primary)"></i>
                    <span class="font-semibold">Комментарии в AmoCRM</span>
                    <span 
                      v-if="commentServiceEnabled" 
                      class="badge"
                      style="background: var(--color-success-light); color: var(--color-success);"
                    >
                      Активен
                    </span>
                    <span 
                      v-else 
                      class="badge"
                      style="background: var(--color-text-tertiary); color: var(--color-text-secondary);"
                    >
                      Неактивен
                    </span>
                  </div>
                </td>
                <td class="text-right">
                  <a 
                    :href="commentServiceUrl" 
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
                    style="background-color: var(--color-primary); color: white; font-weight: 500;"
                  >
                    Перейти
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { apiGetServicesRoute } from '../api/services'
import { apiGetOAuthStatusRoute, apiGetWebhookSettingsRoute } from '../api/amocrm'
import { customFieldsPageRoute } from '../customFields'
import { webhookSettingsPageRoute } from '../webhookSettings'
import { paymentServicePageRoute } from '../paymentService'
import { commentServicePageRoute } from '../commentService'

const services = ref([])
const loadingServices = ref(true)
const servicesError = ref(null)

const oauthStatus = ref({
  status: 'offline',
  expiresAt: null
})

const paymentServiceEnabled = ref(false)
const webhookEnabled = ref(false)
const commentServiceEnabled = ref(false)

const oauthStatusColor = computed(() => {
  switch (oauthStatus.value.status) {
    case 'active': return 'var(--color-success)'
    case 'expired': return 'var(--color-warning)'
    case 'offline': return 'var(--color-danger)'
    default: return 'var(--color-text-secondary)'
  }
})

const oauthStatusIcon = computed(() => {
  switch (oauthStatus.value.status) {
    case 'active': return 'fa-check-circle'
    case 'expired': return 'fa-exclamation-triangle'
    case 'offline': return 'fa-times-circle'
    default: return 'fa-question-circle'
  }
})

const oauthStatusText = computed(() => {
  switch (oauthStatus.value.status) {
    case 'active': return 'Active'
    case 'expired': return 'Expired'
    case 'offline': return 'Offline'
    default: return 'Unknown'
  }
})

const lastUpdate = computed(() => {
  return new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Подсчет всех активных сервисов (динамические + статические)
const activeServicesCount = computed(() => {
  let count = services.value.length // динамические сервисы из API
  
  // Добавляем статический сервис "Генерация ссылок на оплату"
  if (paymentServiceEnabled.value) {
    count++
  }
  
  // Добавляем статический сервис "Настройки вебхуков"
  if (webhookEnabled.value) {
    count++
  }
  
  // Добавляем статический сервис "Комментарии в AmoCRM"
  if (commentServiceEnabled.value) {
    count++
  }
  
  return count
})

const customFieldsUrl = computed(() => customFieldsPageRoute.url())
const webhookSettingsUrl = computed(() => webhookSettingsPageRoute.url())
const paymentServiceUrl = computed(() => paymentServicePageRoute.url())
const commentServiceUrl = computed(() => commentServicePageRoute.url())

onMounted(async () => {
  await Promise.all([
    loadServices(), 
    loadOAuthStatus(), 
    loadPaymentServiceStatus(),
    loadWebhookStatus(),
    loadCommentServiceStatus()
  ])
  
  // Скрываем глобальный прелоадер после монтирования
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
})

async function loadServices() {
  loadingServices.value = true
  servicesError.value = null
  
  try {
    const response = await apiGetServicesRoute.run(ctx)
    if (response.success) {
      services.value = response.services
    } else {
      servicesError.value = response.error || 'Ошибка загрузки сервисов'
    }
  } catch (e) {
    servicesError.value = e.message || 'Ошибка сети'
  } finally {
    loadingServices.value = false
  }
}

async function refreshServices() {
  await Promise.all([
    loadServices(),
    loadPaymentServiceStatus(),
    loadWebhookStatus(),
    loadCommentServiceStatus()
  ])
}

async function loadOAuthStatus() {
  try {
    const response = await apiGetOAuthStatusRoute.run(ctx)
    if (response.success) {
      oauthStatus.value = {
        status: response.status,
        expiresAt: response.expiresAt
      }
    }
  } catch (e) {
    console.error('Ошибка загрузки статуса OAuth:', e)
  }
}

async function loadPaymentServiceStatus() {
  try {
    const response = await fetch('/dev/amocrm-connector/api/paymentService~payment-service/status')
    const data = await response.json()
    if (data.success) {
      paymentServiceEnabled.value = data.enabled
    }
  } catch (e) {
    console.error('Ошибка загрузки статуса Payment Service:', e)
  }
}

async function loadWebhookStatus() {
  try {
    const response = await apiGetWebhookSettingsRoute.run(ctx)
    if (response.success && response.settings) {
      // Вебхук активен, если webhook_status === 'subscribed'
      webhookEnabled.value = response.settings.webhook_status === 'subscribed'
    }
  } catch (e) {
    console.error('Ошибка загрузки статуса вебхука:', e)
  }
}

async function loadCommentServiceStatus() {
  try {
    const response = await fetch('/dev/amocrm-connector/api/commentService~status')
    const data = await response.json()
    if (data.success) {
      commentServiceEnabled.value = data.enabled
    }
  } catch (e) {
    console.error('Ошибка загрузки статуса Comment Service:', e)
  }
}

function openOAuthSettings() {
  window.location.href = '/dev/amocrm-connector/oauthSettings'
}
</script>