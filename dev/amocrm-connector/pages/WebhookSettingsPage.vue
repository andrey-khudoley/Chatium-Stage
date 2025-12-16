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
          <i class="fas fa-bolt text-2xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
          Настройки вебхуков
        </h1>
        <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Автоматическая обработка сделок при обновлении полей в AmoCRM
        </p>
      </header>

      <!-- Таблица входящих вебхуков -->
      <div class="mb-8">
        <WebhooksTable 
          :events="webhookEvents" 
          :loading="loadingWebhookEvents"
          @refresh="loadWebhookEvents"
        />
      </div>

      <!-- Статус подключения OAuth -->
      <div v-if="!hasValidToken" class="card mb-8 warning-card">
        <div class="flex items-start gap-4">
          <div class="warning-icon-box">
            <i class="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2">Требуется настройка подключения</h3>
            <p class="mb-4 opacity-90">
              Для работы с вебхуками необходимо настроить OAuth подключение к AmoCRM.
            </p>
            <div class="mt-6">
              <a :href="oauthSettingsUrl" class="btn card-action-btn">
                <i class="fas fa-cog mr-2"></i>
                Перейти к настройкам OAuth
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Блок управления вебхуками -->
      <div v-else class="card mb-8">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <i class="fas fa-plug" style="color: var(--color-primary)"></i>
          Управление вебхуками
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="p-4 rounded-lg" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
            <p class="text-sm text-[var(--color-text-secondary)] mb-2">Статус подписки</p>
            <p class="text-2xl font-bold" :style="{ color: subscriptionStatusColor }">
              {{ subscriptionStatusText }}
            </p>
          </div>
          <div class="p-4 rounded-lg" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border);">
            <p class="text-sm text-[var(--color-text-secondary)] mb-2">Активных вебхуков</p>
            <p class="text-2xl font-bold">{{ activeWebhooksCount }}</p>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-semibold mb-2">URL вебхука</label>
          <div class="flex gap-2">
            <input 
              type="text" 
              :value="webhookUrl" 
              readonly 
              class="input flex-1 font-mono text-sm bg-[var(--color-bg-secondary)]"
            />
            <button @click="copyWebhookUrl" class="btn" style="background: var(--color-border);">
              <i class="fas fa-copy mr-2"></i>
              Копировать
            </button>
          </div>
        </div>

        <div class="flex gap-4">
          <button 
            v-if="!isSubscribed" 
            @click="subscribeWebhook" 
            :disabled="subscribing"
            class="btn btn-primary"
          >
            <i :class="['fas', 'mr-2', subscribing ? 'fa-spinner animate-spin' : 'fa-check']"></i>
            {{ subscribing ? 'Подписка...' : 'Подписаться на события' }}
          </button>
          <button 
            v-else 
            @click="unsubscribeWebhook" 
            :disabled="unsubscribing"
            class="btn"
            style="background: var(--color-danger); color: white;"
          >
            <i :class="['fas', 'mr-2', unsubscribing ? 'fa-spinner animate-spin' : 'fa-times']"></i>
            {{ unsubscribing ? 'Отписка...' : 'Отписаться' }}
          </button>
          <button 
            @click="loadWebhooks" 
            :disabled="loadingWebhooks"
            class="btn"
            style="background: var(--color-border);"
          >
            <i :class="['fas', 'mr-2', loadingWebhooks ? 'fa-spinner animate-spin' : 'fa-sync']"></i>
            Обновить
          </button>
        </div>

        <div v-if="webhooks.length > 0" class="mt-6">
          <h3 class="text-lg font-bold mb-3">Активные вебхуки</h3>
          <div class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>События</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(webhook, index) in webhooks" :key="index">
                  <td>
                    <code class="text-sm">{{ webhook.destination }}</code>
                  </td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="event in webhook.settings" 
                        :key="event"
                        class="badge"
                        style="background: var(--color-primary-light); color: var(--color-primary);"
                      >
                        {{ event }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Блок соответствия полей -->
      <div v-if="hasValidToken" class="card mb-8">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <i class="fas fa-list-alt" style="color: var(--color-primary)"></i>
          Соответствие полей
        </h2>

        <div v-if="loadingFields" class="text-center py-12">
          <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
          <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка полей...</p>
        </div>

        <div v-else class="space-y-6">
          <!-- Чекбокс "Сформировать?" -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Поле "Сформировать?" (checkbox) <span class="text-red-500">*</span>
            </label>
            <select v-model="fieldSettings.field_check" class="input">
              <option value="">Выберите поле...</option>
              <option 
                v-for="field in checkboxFields" 
                :key="field.id" 
                :value="String(field.id)"
              >
                ID: {{ field.id }} — {{ field.name }}
              </option>
            </select>
          </div>

          <!-- Select "Продукт" -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Поле "Продукт" (select) <span class="text-red-500">*</span>
            </label>
            <select v-model="fieldSettings.field_product" class="input">
              <option value="">Выберите поле...</option>
              <option 
                v-for="field in selectFields" 
                :key="field.id" 
                :value="String(field.id)"
              >
                ID: {{ field.id }} — {{ field.name }}
              </option>
            </select>
          </div>

          <!-- Select "Тариф" -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Поле "Тариф" (select) <span class="text-red-500">*</span>
            </label>
            <select v-model="fieldSettings.field_tariff" class="input">
              <option value="">Выберите поле...</option>
              <option 
                v-for="field in selectFields" 
                :key="field.id" 
                :value="String(field.id)"
              >
                ID: {{ field.id }} — {{ field.name }}
              </option>
            </select>
          </div>

          <!-- Numeric "Своя цена" -->
          <div>
            <label class="block text-sm font-semibold mb-2">
              Поле "Своя цена" (numeric) <span class="text-red-500">*</span>
            </label>
            <select v-model="fieldSettings.field_price" class="input">
              <option value="">Выберите поле...</option>
              <option 
                v-for="field in numericFields" 
                :key="field.id" 
                :value="String(field.id)"
              >
                ID: {{ field.id }} — {{ field.name }}
              </option>
            </select>
          </div>

          <button 
            @click="saveFieldSettings" 
            :disabled="savingSettings || !canSaveSettings"
            class="btn btn-primary"
          >
            <i :class="['fas', 'mr-2', savingSettings ? 'fa-spinner animate-spin' : 'fa-save']"></i>
            {{ savingSettings ? 'Сохранение...' : 'Сохранить настройки' }}
          </button>
        </div>
      </div>

      <!-- Блок тестирования -->
      <div v-if="hasValidToken && settingsSaved" class="card">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <i class="fas fa-vial" style="color: var(--color-primary)"></i>
          Тестирование
        </h2>

        <p class="text-[var(--color-text-secondary)] mb-6">
          Введите ID сделки для проверки обработки. Результаты будут отображены в логах.
        </p>

        <div class="flex gap-4 mb-6">
          <input 
            v-model="testLeadId" 
            type="number" 
            class="input flex-1" 
            placeholder="ID сделки (например: 12345)"
          />
          <button 
            @click="testProcessing" 
            :disabled="testing || !testLeadId"
            class="btn btn-primary"
          >
            <i :class="['fas', 'mr-2', testing ? 'fa-spinner animate-spin' : 'fa-play']"></i>
            {{ testing ? 'Тестирование...' : 'Протестировать' }}
          </button>
        </div>

        <div v-if="testResult" class="p-4 rounded-lg" :style="testResultStyle">
          <div class="flex items-start gap-3">
            <i :class="['fas', 'text-xl', testResult.success ? 'fa-check-circle' : 'fa-exclamation-circle']"></i>
            <div class="flex-1">
              <p class="font-bold mb-3">{{ testResult.success ? 'Результаты тестирования' : 'Ошибка' }}</p>
              <div v-if="testResult.success && testResult.data">
                <div class="space-y-2 text-sm">
                  <div class="grid grid-cols-2 gap-2">
                    <div class="font-semibold">ID сделки:</div>
                    <div>{{ testResult.data.lead_id }}</div>
                    
                    <div class="font-semibold">Email:</div>
                    <div>{{ testResult.data.email || 'не найден' }}</div>
                    
                    <div class="font-semibold">Сформировать?:</div>
                    <div>
                      <span v-if="testResult.data.should_process === true" class="text-green-600 dark:text-green-400">
                        <i class="fas fa-check mr-1"></i>Да
                      </span>
                      <span v-else-if="testResult.data.should_process === false" class="text-red-600 dark:text-red-400">
                        <i class="fas fa-times mr-1"></i>Нет
                      </span>
                      <span v-else class="text-gray-500">не указано</span>
                    </div>
                    
                    <div class="font-semibold">Продукт:</div>
                    <div>
                      {{ testResult.data.product?.value || 'не указан' }}
                      <span v-if="testResult.data.product?.enum_id" class="text-xs opacity-70">
                        (ID: {{ testResult.data.product.enum_id }})
                      </span>
                    </div>
                    
                    <div class="font-semibold">Тариф:</div>
                    <div>
                      {{ testResult.data.tariff?.value || 'не указан' }}
                      <span v-if="testResult.data.tariff?.enum_id" class="text-xs opacity-70">
                        (ID: {{ testResult.data.tariff.enum_id }})
                      </span>
                    </div>
                    
                    <div class="font-semibold">Своя цена:</div>
                    <div>{{ testResult.data.custom_price || 'не указана' }}</div>
                    
                    <div class="font-semibold">Обработано:</div>
                    <div>{{ formatDate(testResult.data.processed_at) }}</div>
                  </div>
                </div>
              </div>
              <p v-else-if="!testResult.success">{{ testResult.error || testResult.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Служебный блок -->
      <div class="card mt-8" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%); border-color: rgba(239, 68, 68, 0.3);">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold mb-1 flex items-center gap-2" style="color: var(--color-danger);">
              <i class="fas fa-tools"></i>
              Служебные функции
            </h2>
            <p class="text-sm text-[var(--color-text-secondary)]">
              Опасные действия для администрирования системы
            </p>
          </div>
          <button 
            @click="clearAllWebhookEvents" 
            :disabled="clearingWebhookEvents || webhookEvents.length === 0"
            class="px-6 py-3 rounded-lg font-semibold transition-all text-white"
            :style="{ 
              background: clearingWebhookEvents || webhookEvents.length === 0 ? '#9ca3af' : 'var(--color-danger)',
              cursor: clearingWebhookEvents || webhookEvents.length === 0 ? 'not-allowed' : 'pointer',
              opacity: clearingWebhookEvents || webhookEvents.length === 0 ? 0.6 : 1
            }"
          >
            <i v-if="clearingWebhookEvents" class="fas fa-spinner animate-spin mr-2"></i>
            <i v-else class="fas fa-trash-alt mr-2"></i>
            {{ clearingWebhookEvents ? 'Удаление...' : 'Удалить все события' }}
          </button>
        </div>
      </div>

      <!-- Сообщение об ошибке -->
      <div v-if="error" class="card mt-6" style="background: var(--color-danger-light); border-color: var(--color-danger);">
        <div class="flex items-start gap-3">
          <i class="fas fa-exclamation-circle text-xl" style="color: var(--color-danger)"></i>
          <div class="flex-1">
            <p class="font-bold mb-1" style="color: var(--color-danger)">Ошибка</p>
            <p style="color: var(--color-danger)">{{ error }}</p>
          </div>
          <button @click="error = null" class="text-xl" style="color: var(--color-danger)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import WebhooksTable from '../components/WebhooksTable.vue'
import { 
  apiGetOAuthStatusRoute, 
  apiGetCustomFieldsRoute,
  apiSubscribeWebhookRoute,
  apiUnsubscribeWebhookRoute,
  apiGetWebhooksRoute,
  apiSaveWebhookSettingsRoute,
  apiGetWebhookSettingsRoute,
  apiTestWebhookProcessingRoute,
  apiGetWebhookEventsRoute,
  apiClearAllWebhookEventsRoute
} from '../api/amocrm'
import { webhookSettingsPageRoute } from '../webhookSettings'
import { indexPageRoute } from '../index'
import { oauthSettingsPageRoute } from '../oauthSettings'

const homeUrl = computed(() => indexPageRoute.url())
const oauthSettingsUrl = computed(() => oauthSettingsPageRoute.url())
const webhookUrl = ref('')

const oauthStatus = ref({ status: 'offline' })
const fields = ref([])
const loadingFields = ref(false)
const webhooks = ref([])
const loadingWebhooks = ref(false)

const fieldSettings = ref({
  field_check: '',
  field_product: '',
  field_tariff: '',
  field_price: ''
})

const isSubscribed = ref(false)
const subscribing = ref(false)
const unsubscribing = ref(false)
const savingSettings = ref(false)
const settingsSaved = ref(false)

const testLeadId = ref('')
const testing = ref(false)
const testResult = ref(null)
const error = ref(null)

const webhookEvents = ref([])
const loadingWebhookEvents = ref(false)
const clearingWebhookEvents = ref(false) // Для отслеживания процесса удаления всех событий

const hasValidToken = computed(() => {
  return oauthStatus.value.status === 'active'
})

const checkboxFields = computed(() => {
  return fields.value.filter(f => f.type === 'checkbox')
})

const selectFields = computed(() => {
  return fields.value.filter(f => f.type === 'select' || f.type === 'multiselect')
})

const numericFields = computed(() => {
  return fields.value.filter(f => f.type === 'numeric')
})

const canSaveSettings = computed(() => {
  return fieldSettings.value.field_check &&
         fieldSettings.value.field_product &&
         fieldSettings.value.field_tariff &&
         fieldSettings.value.field_price
})

const subscriptionStatusColor = computed(() => {
  return isSubscribed.value ? 'var(--color-success)' : 'var(--color-text-secondary)'
})

const subscriptionStatusText = computed(() => {
  return isSubscribed.value ? 'Активна' : 'Не активна'
})

const activeWebhooksCount = computed(() => {
  return webhooks.value.length
})

const testResultStyle = computed(() => {
  if (!testResult.value) return {}
  
  return {
    background: testResult.value.success ? 'var(--color-success-light)' : 'var(--color-danger-light)',
    borderColor: testResult.value.success ? 'var(--color-success)' : 'var(--color-danger)',
    color: testResult.value.success ? 'var(--color-success)' : 'var(--color-danger)',
    border: '1px solid'
  }
})

onMounted(async () => {
  // Получаем URL вебхука через роут-объект + относительный путь
  webhookUrl.value = indexPageRoute.url() + '/api/webhook'
  
  await checkOAuthStatus()
  if (hasValidToken.value) {
    await Promise.all([
      loadFields(),
      loadWebhooks(),
      loadSettings(),
      loadWebhookEvents()
    ])
  }
  
  // Скрываем глобальный прелоадер после монтирования
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
})

async function checkOAuthStatus() {
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
  loadingFields.value = true
  
  try {
    const response = await apiGetCustomFieldsRoute.run(ctx)
    
    if (response.success) {
      fields.value = response.fields || []
    } else {
      error.value = response.error || 'Ошибка загрузки полей'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    loadingFields.value = false
  }
}

async function loadWebhooks() {
  loadingWebhooks.value = true
  error.value = null
  
  try {
    const response = await apiGetWebhooksRoute.run(ctx)
    
    if (response.success) {
      webhooks.value = response.webhooks || []
      
      // Проверяем, подписаны ли мы уже
      isSubscribed.value = webhooks.value.some(w => 
        w.destination === webhookUrl.value
      )
    } else {
      error.value = response.error || 'Ошибка загрузки вебхуков'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    loadingWebhooks.value = false
  }
}

async function loadSettings() {
  try {
    const response = await apiGetWebhookSettingsRoute.run(ctx)
    
    if (response.success) {
      const settings = response.settings
      fieldSettings.value = {
        field_check: settings.field_check || '',
        field_product: settings.field_product || '',
        field_tariff: settings.field_tariff || '',
        field_price: settings.field_price || ''
      }
      
      isSubscribed.value = settings.webhook_status === 'subscribed'
      
      settingsSaved.value = !!(settings.field_check && settings.field_product && 
                               settings.field_tariff && settings.field_price)
    }
  } catch (e) {
    console.error('Ошибка загрузки настроек:', e)
  }
}

async function subscribeWebhook() {
  subscribing.value = true
  error.value = null
  
  try {
    const response = await apiSubscribeWebhookRoute.run(ctx, {
      webhookUrl: webhookUrl.value
    })
    
    if (response.success) {
      isSubscribed.value = true
      await loadWebhooks()
    } else {
      error.value = response.error || 'Ошибка подписки на вебхук'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    subscribing.value = false
  }
}

async function unsubscribeWebhook() {
  if (!confirm('Вы уверены, что хотите отписаться от вебхуков?')) {
    return
  }
  
  unsubscribing.value = true
  error.value = null
  
  try {
    const response = await apiUnsubscribeWebhookRoute.run(ctx, {
      webhookUrl: webhookUrl.value
    })
    
    if (response.success) {
      isSubscribed.value = false
      await loadWebhooks()
    } else {
      error.value = response.error || 'Ошибка отписки от вебхука'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    unsubscribing.value = false
  }
}

async function saveFieldSettings() {
  savingSettings.value = true
  error.value = null
  
  try {
    const response = await apiSaveWebhookSettingsRoute.run(ctx, fieldSettings.value)
    
    if (response.success) {
      settingsSaved.value = true
      // Показываем успешное сообщение
      testResult.value = {
        success: true,
        message: 'Настройки полей успешно сохранены'
      }
      setTimeout(() => {
        testResult.value = null
      }, 3000)
    } else {
      error.value = response.error || 'Ошибка сохранения настроек'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    savingSettings.value = false
  }
}

async function testProcessing() {
  testing.value = true
  error.value = null
  testResult.value = null
  
  try {
    const response = await apiTestWebhookProcessingRoute.run(ctx, {
      leadId: testLeadId.value
    })
    
    testResult.value = response
  } catch (e) {
    testResult.value = {
      success: false,
      error: e.message || 'Ошибка сети'
    }
  } finally {
    testing.value = false
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

function copyWebhookUrl() {
  navigator.clipboard.writeText(webhookUrl.value).then(() => {
    testResult.value = {
      success: true,
      message: 'URL скопирован в буфер обмена'
    }
    setTimeout(() => {
      testResult.value = null
    }, 2000)
  })
}

async function loadWebhookEvents() {
  loadingWebhookEvents.value = true
  error.value = null
  
  try {
    const response = await apiGetWebhookEventsRoute.run(ctx)
    
    if (response.success) {
      webhookEvents.value = response.events || []
    } else {
      error.value = response.error || 'Ошибка загрузки входящих вебхуков'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    loadingWebhookEvents.value = false
  }
}

async function clearAllWebhookEvents() {
  const confirmMessage = `Вы уверены, что хотите удалить ВСЕ события вебхуков (${webhookEvents.value.length} записей)?\n\nЭто действие невозможно отменить!`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  // Дополнительное подтверждение
  if (!confirm('Подтвердите удаление ещё раз. Все данные будут потеряны безвозвратно.')) {
    return
  }
  
  clearingWebhookEvents.value = true
  error.value = null
  
  try {
    const response = await apiClearAllWebhookEventsRoute.run(ctx)
    
    if (response.success) {
      // Обновляем список событий
      await loadWebhookEvents()
      
      // Показываем уведомление об успехе
      testResult.value = {
        success: true,
        message: `Успешно удалено ${response.deletedCount} событий`
      }
      setTimeout(() => {
        testResult.value = null
      }, 3000)
    } else {
      error.value = response.error || 'Ошибка удаления событий вебхуков'
    }
  } catch (e) {
    error.value = e.message || 'Ошибка сети'
  } finally {
    clearingWebhookEvents.value = false
  }
}
</script>

<style scoped>
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

