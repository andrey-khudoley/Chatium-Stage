<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
    <ThemeToggle />
    
    <div class="container py-6 max-w-6xl">
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
          <i class="fas fa-list-alt text-2xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
          Дополнительные поля AmoCRM
        </h1>
        <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Список всех дополнительных полей в вашем аккаунте AmoCRM
        </p>
      </header>

      <!-- Статус подключения -->
      <div v-if="!hasValidToken" class="card mb-8 warning-card">
        <div class="flex items-start gap-4">
          <div class="warning-icon-box">
            <i class="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2">Требуется настройка подключения</h3>
            <p class="mb-4 opacity-90">
              Для получения списка дополнительных полей необходимо настроить OAuth подключение к AmoCRM.
            </p>
            <div class="space-y-3">
              <div class="flex items-start gap-2">
                <i class="fas fa-check mt-1"></i>
                <span>Перейдите на страницу настроек OAuth</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="fas fa-check mt-1"></i>
                <span>Заполните параметры подключения (Subdomain, Client ID, Client Secret, Redirect URI)</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="fas fa-check mt-1"></i>
                <span>Авторизуйтесь в AmoCRM для получения токена доступа</span>
              </div>
            </div>
            <div class="mt-6">
              <a :href="oauthSettingsUrl" class="btn card-action-btn">
                <i class="fas fa-cog mr-2"></i>
                Перейти к настройкам
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Сообщение об истечении токена -->
      <div v-else-if="tokenExpired" class="card mb-8 danger-card">
        <div class="flex items-start gap-4">
          <div class="danger-icon-box">
            <i class="fas fa-clock text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2">Токен доступа истёк</h3>
            <p class="mb-4 opacity-90">
              Срок действия токена доступа истёк. Необходимо обновить токен для продолжения работы.
            </p>
            <div class="mt-4">
              <a :href="oauthSettingsUrl" class="btn card-action-btn">
                <i class="fas fa-sync mr-2"></i>
                Обновить токен
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Список полей -->
      <div v-else class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-list" style="color: var(--color-primary)"></i>
            Список полей
          </h2>
          <button @click="loadFields" class="btn btn-primary" :disabled="loading">
            <i :class="['fas', 'mr-2', loading ? 'fa-spinner animate-spin' : 'fa-sync']"></i>
            {{ loading ? 'Загрузка...' : 'Обновить' }}
          </button>
        </div>
        
        <div v-if="loading" class="text-center py-12">
          <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
          <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка дополнительных полей...</p>
        </div>
        
        <div v-else-if="error" class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger)"></i>
          <p class="text-xl font-bold mb-2" style="color: var(--color-danger)">{{ error }}</p>
          <p class="text-[var(--color-text-secondary)] mb-4">
            Проверьте настройки подключения и попробуйте снова
          </p>
          <a :href="oauthSettingsUrl" class="btn btn-primary">
            <i class="fas fa-cog mr-2"></i>
            Настройки OAuth
          </a>
        </div>
        
        <div v-else-if="fields.length === 0" class="text-center py-12">
          <i class="fas fa-inbox text-6xl text-[var(--color-text-secondary)] opacity-20 mb-4"></i>
          <p class="text-[var(--color-text-secondary)] text-lg">Дополнительные поля не найдены</p>
          <p class="text-sm text-[var(--color-text-secondary)] mt-2">
            В вашем аккаунте AmoCRM пока нет дополнительных полей
          </p>
        </div>
        
        <div v-else>
          <!-- Фильтр -->
          <div class="mb-6">
            <input 
              v-model="searchQuery"
              type="text"
              class="input"
              placeholder="Поиск по названию или коду поля..."
            >
          </div>

          <!-- Статистика -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="p-4 rounded-lg" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
              <p class="text-sm text-[var(--color-text-secondary)] mb-1">Всего полей</p>
              <p class="text-2xl font-bold">{{ filteredFields.length }}</p>
            </div>
            <div class="p-4 rounded-lg" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
              <p class="text-sm text-[var(--color-text-secondary)] mb-1">Текстовые</p>
              <p class="text-2xl font-bold">{{ fieldsByType.text }}</p>
            </div>
            <div class="p-4 rounded-lg" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
              <p class="text-sm text-[var(--color-text-secondary)] mb-1">Списки</p>
              <p class="text-2xl font-bold">{{ fieldsByType.select }}</p>
            </div>
            <div class="p-4 rounded-lg" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
              <p class="text-sm text-[var(--color-text-secondary)] mb-1">Другие</p>
              <p class="text-2xl font-bold">{{ fieldsByType.other }}</p>
            </div>
          </div>
          
          <!-- Таблица полей -->
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Код</th>
                  <th>Тип</th>
                  <th>Обязательное</th>
                  <th>Доступно в карточках</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="field in filteredFields" :key="field.id">
                  <td>
                    <code class="badge">{{ field.id }}</code>
                  </td>
                  <td>
                    <span class="font-semibold">{{ field.name }}</span>
                  </td>
                  <td>
                    <code class="text-sm">{{ field.code || '—' }}</code>
                  </td>
                  <td>
                    <span class="badge" :style="{ background: getTypeColor(field.type), color: 'white' }">
                      {{ getTypeLabel(field.type) }}
                    </span>
                  </td>
                  <td class="text-center">
                    <i v-if="field.is_required" class="fas fa-check" style="color: var(--color-success)"></i>
                    <span v-else class="text-[var(--color-text-secondary)]">—</span>
                  </td>
                  <td class="text-center">
                    <i v-if="field.is_visible" class="fas fa-eye" style="color: var(--color-primary)"></i>
                    <i v-else class="fas fa-eye-slash text-[var(--color-text-secondary)]"></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { apiGetCustomFieldsRoute, apiGetOAuthStatusRoute } from '../api/amocrm'

const fields = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const oauthStatus = ref({
  status: 'offline',
  expiresAt: null
})

const hasValidToken = computed(() => {
  return oauthStatus.value.status === 'active'
})

const tokenExpired = computed(() => {
  return oauthStatus.value.status === 'expired'
})

const filteredFields = computed(() => {
  if (!searchQuery.value) return fields.value
  
  const query = searchQuery.value.toLowerCase()
  return fields.value.filter(field => {
    return field.name.toLowerCase().includes(query) ||
           (field.code && field.code.toLowerCase().includes(query)) ||
           field.id.toString().includes(query)
  })
})

const fieldsByType = computed(() => {
  const types = {
    text: 0,
    select: 0,
    other: 0
  }
  
  fields.value.forEach(field => {
    if (field.type === 'text' || field.type === 'textarea') {
      types.text++
    } else if (field.type === 'select' || field.type === 'multiselect' || field.type === 'radiobutton') {
      types.select++
    } else {
      types.other++
    }
  })
  
  return types
})

const homeUrl = computed(() => '/dev/amocrm-connector')
const oauthSettingsUrl = computed(() => '/dev/amocrm-connector/oauthSettings')

onMounted(async () => {
  await checkStatus()
  if (hasValidToken.value) {
    await loadFields()
  }
  
  // Скрываем глобальный прелоадер после монтирования
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
})

async function checkStatus() {
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
  }
}

async function loadFields() {
  loading.value = true
  error.value = null
  
  try {
    const response = await apiGetCustomFieldsRoute.run(ctx)
    
    if (response.success) {
      fields.value = response.fields || []
    } else {
      if (response.needRefresh) {
        error.value = 'Токен истёк или недействителен'
      } else {
        error.value = response.error || 'Ошибка загрузки полей'
      }
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    loading.value = false
  }
}

function getTypeLabel(type) {
  const labels = {
    'text': 'Текст',
    'textarea': 'Текстовое поле',
    'numeric': 'Число',
    'select': 'Список',
    'multiselect': 'Мультисписок',
    'date': 'Дата',
    'url': 'URL',
    'checkbox': 'Флаг',
    'radiobutton': 'Переключатель',
    'streetaddress': 'Адрес',
    'smart_address': 'Адрес (умный)',
    'birthday': 'Дата рождения',
    'legal_entity': 'Юр. лицо',
    'price': 'Цена',
    'tracking_data': 'Данные трекинга'
  }
  
  return labels[type] || type
}

function getTypeColor(type) {
  const colors = {
    'text': '#3498db',
    'textarea': '#2980b9',
    'numeric': '#9b59b6',
    'select': '#e74c3c',
    'multiselect': '#c0392b',
    'date': '#1abc9c',
    'url': '#16a085',
    'checkbox': '#f39c12',
    'radiobutton': '#d35400',
    'streetaddress': '#34495e',
    'smart_address': '#2c3e50',
    'birthday': '#e67e22',
    'legal_entity': '#95a5a6',
    'price': '#27ae60',
    'tracking_data': '#8e44ad'
  }
  
  return colors[type] || '#7f8c8d'
}
</script>

<style>
/* Кнопка действия в карточках */
.card-action-btn {
  background: rgba(255, 255, 255, 0.85) !important;
  color: #1e293b !important;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
}

.card-action-btn:hover {
  background: rgba(255, 255, 255, 1) !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
}

.dark .card-action-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #f1f5f9 !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
}

.dark .card-action-btn:hover {
  background: rgba(255, 255, 255, 0.22) !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
}
</style>