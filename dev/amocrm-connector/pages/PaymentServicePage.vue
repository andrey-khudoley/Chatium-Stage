<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
    <ThemeToggle />
    
    <div class="container py-6 max-w-6xl">
      <!-- Хлебные крошки -->
      <div class="mb-6">
        <a :href="indexPageUrl" class="text-[var(--color-primary)] hover:opacity-70 flex items-center gap-2">
          <i class="fas fa-arrow-left"></i>
          Назад к главной
        </a>
      </div>

      <!-- Заголовок -->
      <header class="text-center mb-8 mt-4">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
          <i class="fas fa-credit-card text-2xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
          Генерация ссылок на оплату
        </h1>
        <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Автоматическое создание заказов GetCourse при обработке вебхуков AmoCRM
        </p>
      </header>

      <!-- Переключатель сервиса -->
      <div class="card mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold mb-1 text-[var(--color-text)]">
              Статус сервиса
            </h2>
            <p class="text-sm text-[var(--color-text-secondary)]">
              {{ serviceEnabled ? 'Сервис активен. Ссылки будут создаваться автоматически.' : 'Сервис отключен. Вебхуки не будут обрабатываться.' }}
            </p>
          </div>
          <button 
            @click="toggleService" 
            :disabled="togglingService"
            class="px-6 py-3 rounded-lg font-semibold transition-all text-white hover:opacity-80"
            :style="{ background: serviceEnabled ? 'var(--color-success)' : '#6b7280' }"
          >
            <i class="fas mr-2" :class="serviceEnabled ? 'fa-check-circle' : 'fa-times-circle'"></i>
            {{ serviceEnabled ? 'Активен' : 'Отключен' }}
          </button>
        </div>
      </div>

      <!-- Таблица кодов предложений -->
      <div class="card mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-list-alt" style="color: var(--color-primary)"></i>
            Коды предложений
          </h2>
          <button 
            @click="openAddOfferModal" 
            class="btn btn-primary"
          >
            <i class="fas fa-plus mr-2"></i>
            Добавить
          </button>
        </div>

        <div v-if="loadingOffers" class="text-center py-12">
          <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
          <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка...</p>
        </div>

        <div v-else-if="offersError" class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger)"></i>
          <p style="color: var(--color-danger)">{{ offersError }}</p>
        </div>

        <div v-else-if="offers.length === 0" class="text-center py-12">
          <i class="fas fa-inbox text-4xl mb-4 text-[var(--color-text-tertiary)]"></i>
          <p class="text-[var(--color-text-secondary)]">Нет кодов предложений</p>
          <p class="text-sm text-[var(--color-text-tertiary)] mt-2">Добавьте маппинг продукт+тариф → код предложения GetCourse</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Продукт</th>
                <th>Тариф</th>
                <th>ID предложения</th>
                <th>Название</th>
                <th class="text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="offer in offers" :key="offer.id">
                <td class="font-semibold">{{ offer.productValue }}</td>
                <td class="font-semibold">{{ offer.tariffValue }}</td>
                <td><code class="px-2 py-1 rounded bg-[var(--color-bg)] text-[var(--color-primary)]">{{ offer.offerId }}</code></td>
                <td>{{ offer.offerName }}</td>
                <td class="text-right">
                  <button 
                    @click="openEditOfferModal(offer)" 
                    class="mr-3 transition-opacity hover:opacity-70"
                    style="color: var(--color-primary)"
                    title="Редактировать"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    @click="deleteOffer(offer)" 
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

      <!-- Таблица логов -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-history" style="color: var(--color-primary)"></i>
            Последние операции
          </h2>
          <button 
            @click="refreshLogs" 
            class="btn"
            style="background: var(--color-border);"
          >
            <i class="fas fa-sync-alt mr-2"></i>
            Обновить
          </button>
        </div>

        <div v-if="loadingLogs" class="text-center py-12">
          <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
          <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка...</p>
        </div>

        <div v-else-if="logsError" class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger)"></i>
          <p style="color: var(--color-danger)">{{ logsError }}</p>
        </div>

        <div v-else-if="logs.length === 0" class="text-center py-12">
          <i class="fas fa-inbox text-4xl mb-4 text-[var(--color-text-tertiary)]"></i>
          <p class="text-[var(--color-text-secondary)]">Нет операций</p>
          <p class="text-sm text-[var(--color-text-tertiary)] mt-2">Здесь будут отображаться все запросы к Deal Manager</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Дата/Время</th>
                <th>ID сделки</th>
                <th>Email</th>
                <th>Продукт</th>
                <th>Тариф</th>
                <th>Ссылка на оплату</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="text-sm">{{ formatDate(log.createdAt) }}</td>
                <td><code class="text-sm">{{ log.leadId }}</code></td>
                <td class="text-sm">{{ log.email || '—' }}</td>
                <td class="text-sm">{{ log.productValue || '—' }}</td>
                <td class="text-sm">{{ log.tariffValue || '—' }}</td>
                <td>
                  <a 
                    v-if="log.paymentUrl" 
                    :href="log.paymentUrl" 
                    target="_blank"
                    class="text-[var(--color-primary)] hover:underline text-sm"
                  >
                    <i class="fas fa-external-link-alt mr-1"></i>
                    Открыть
                  </a>
                  <span v-else class="text-[var(--color-text-tertiary)] text-sm">—</span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span 
                      class="badge text-sm"
                      :class="log.status === 'success' ? 'badge-success' : 'badge-error'"
                    >
                      {{ log.status === 'success' ? 'Успешно' : 'Ошибка' }}
                    </span>
                    <button
                      v-if="log.status === 'error' && log.requestData"
                      @click="retryPayment(log)"
                      :disabled="retryingLogs.has(log.id)"
                      class="btn-small"
                      style="background: var(--color-primary); color: white;"
                      title="Отправить повторно"
                    >
                      <i v-if="retryingLogs.has(log.id)" class="fas fa-spinner animate-spin"></i>
                      <i v-else class="fas fa-redo"></i>
                    </button>
                  </div>
                  <span v-if="log.errorMessage" class="block text-xs text-[var(--color-danger)] mt-1">
                    {{ log.errorMessage }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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
            @click="clearAllLogs" 
            :disabled="clearingLogs || logs.length === 0"
            class="px-6 py-3 rounded-lg font-semibold transition-all text-white"
            :style="{ 
              background: clearingLogs || logs.length === 0 ? '#9ca3af' : 'var(--color-danger)',
              cursor: clearingLogs || logs.length === 0 ? 'not-allowed' : 'pointer',
              opacity: clearingLogs || logs.length === 0 ? 0.6 : 1
            }"
          >
            <i v-if="clearingLogs" class="fas fa-spinner animate-spin mr-2"></i>
            <i v-else class="fas fa-trash-alt mr-2"></i>
            {{ clearingLogs ? 'Удаление...' : 'Удалить все логи' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования кода предложения -->
    <div v-if="showOfferModal" class="modal-overlay" @click.self="closeOfferModal">
      <div class="modal-content">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-[var(--color-text)]">
            {{ editingOffer ? 'Редактировать код предложения' : 'Добавить код предложения' }}
          </h3>
          <button @click="closeOfferModal" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <form @submit.prevent="saveOffer">
          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">
              Продукт <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="offerForm.productValue" 
              type="text" 
              class="input"
              placeholder="Например: Флагман"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">
              Тариф <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="offerForm.tariffValue" 
              type="text" 
              class="input"
              placeholder="Например: Тариф 1"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">
              ID предложения GetCourse <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="offerForm.offerId" 
              type="text" 
              class="input"
              placeholder="Например: 12345"
              required
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-semibold mb-2">
              Название предложения <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="offerForm.offerName" 
              type="text" 
              class="input"
              placeholder="Например: Флагман Тариф 1"
              required
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-semibold mb-2">
              Описание
            </label>
            <textarea 
              v-model="offerForm.description" 
              class="input min-h-[100px]"
              placeholder="Дополнительная информация (опционально)"
            ></textarea>
          </div>

          <div class="flex gap-3">
            <button 
              type="submit" 
              class="btn btn-primary flex-1"
              :disabled="savingOffer"
            >
              <i v-if="savingOffer" class="fas fa-spinner animate-spin mr-2"></i>
              <i v-else class="fas fa-save mr-2"></i>
              {{ savingOffer ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <button 
              type="button" 
              @click="closeOfferModal" 
              class="btn"
              style="background: var(--color-border);"
            >
              Отмена
            </button>
          </div>

          <div v-if="offerError" class="mt-4 p-4 rounded-lg bg-[var(--color-danger-light)] text-[var(--color-danger)]">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            {{ offerError }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { indexPageRoute } from '../index'
import {
  apiGetPaymentOffersRoute,
  apiCreatePaymentOfferRoute,
  apiUpdatePaymentOfferRoute,
  apiDeletePaymentOfferRoute,
  apiGetPaymentLogsRoute,
  apiGetPaymentServiceStatusRoute,
  apiTogglePaymentServiceRoute,
  apiRetryPaymentRoute,
  apiClearAllPaymentLogsRoute
} from '../api/paymentService'

// Статус сервиса
const serviceEnabled = ref(false)
const togglingService = ref(false)

// Коды предложений
const offers = ref([])
const loadingOffers = ref(true)
const offersError = ref(null)

// Логи
const logs = ref([])
const loadingLogs = ref(true)
const logsError = ref(null)
const retryingLogs = ref(new Set()) // Для отслеживания процесса повторной отправки
const clearingLogs = ref(false) // Для отслеживания процесса удаления всех логов

// Модальное окно
const showOfferModal = ref(false)
const editingOffer = ref(null)
const savingOffer = ref(false)
const offerError = ref(null)
const offerForm = ref({
  productValue: '',
  tariffValue: '',
  offerId: '',
  offerName: '',
  description: ''
})

const indexPageUrl = computed(() => indexPageRoute.url())

onMounted(async () => {
  await Promise.all([
    loadServiceStatus(),
    loadOffers(),
    loadLogs()
  ])
  
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
})

async function loadServiceStatus() {
  try {
    const response = await apiGetPaymentServiceStatusRoute.run(ctx)
    if (response.success) {
      serviceEnabled.value = response.enabled
    }
  } catch (e) {
    console.error('Ошибка загрузки статуса сервиса:', e)
  }
}

async function toggleService() {
  togglingService.value = true
  try {
    const response = await apiTogglePaymentServiceRoute.run(ctx, {
      enabled: !serviceEnabled.value
    })
    
    if (response.success) {
      serviceEnabled.value = response.enabled
    }
  } catch (e) {
    console.error('Ошибка переключения сервиса:', e)
  } finally {
    togglingService.value = false
  }
}

async function loadOffers() {
  loadingOffers.value = true
  offersError.value = null
  
  try {
    const response = await apiGetPaymentOffersRoute.run(ctx)
    if (response.success) {
      offers.value = response.offers
    } else {
      offersError.value = response.error || 'Ошибка загрузки'
    }
  } catch (e) {
    offersError.value = e.message || 'Ошибка сети'
  } finally {
    loadingOffers.value = false
  }
}

async function loadLogs() {
  loadingLogs.value = true
  logsError.value = null
  
  try {
    const response = await apiGetPaymentLogsRoute.run(ctx, { limit: 50 })
    if (response.success) {
      logs.value = response.logs
    } else {
      logsError.value = response.error || 'Ошибка загрузки'
    }
  } catch (e) {
    logsError.value = e.message || 'Ошибка сети'
  } finally {
    loadingLogs.value = false
  }
}

function refreshLogs() {
  loadLogs()
}

function openAddOfferModal() {
  editingOffer.value = null
  offerForm.value = {
    productValue: '',
    tariffValue: '',
    offerId: '',
    offerName: '',
    description: ''
  }
  offerError.value = null
  showOfferModal.value = true
}

function openEditOfferModal(offer) {
  editingOffer.value = offer
  offerForm.value = {
    productValue: offer.productValue,
    tariffValue: offer.tariffValue,
    offerId: offer.offerId,
    offerName: offer.offerName,
    description: offer.description || ''
  }
  offerError.value = null
  showOfferModal.value = true
}

function closeOfferModal() {
  showOfferModal.value = false
  editingOffer.value = null
  offerError.value = null
}

async function saveOffer() {
  savingOffer.value = true
  offerError.value = null
  
  try {
    const route = editingOffer.value ? apiUpdatePaymentOfferRoute : apiCreatePaymentOfferRoute
    const payload = editingOffer.value 
      ? { ...offerForm.value, id: editingOffer.value.id }
      : offerForm.value
    
    const response = await route.run(ctx, payload)
    
    if (response.success) {
      closeOfferModal()
      await loadOffers()
    } else {
      offerError.value = response.error || 'Ошибка сохранения'
    }
  } catch (e) {
    offerError.value = e.message || 'Ошибка сети'
  } finally {
    savingOffer.value = false
  }
}

async function deleteOffer(offer) {
  if (!confirm(`Удалить код предложения для "${offer.productValue} + ${offer.tariffValue}"?`)) {
    return
  }
  
  try {
    const response = await apiDeletePaymentOfferRoute.run(ctx, { id: offer.id })
    
    if (response.success) {
      await loadOffers()
    } else {
      alert('Ошибка удаления: ' + (response.error || 'Неизвестная ошибка'))
    }
  } catch (e) {
    alert('Ошибка сети: ' + e.message)
  }
}

async function retryPayment(log) {
  if (retryingLogs.value.has(log.id)) {
    return
  }
  
  retryingLogs.value.add(log.id)
  
  try {
    const response = await apiRetryPaymentRoute.run(ctx, { logId: log.id })
    
    if (response.success) {
      // Обновляем список логов
      await loadLogs()
      
      // Показываем уведомление об успехе
      alert('Запрос успешно отправлен повторно!')
    } else {
      alert('Ошибка повторной отправки: ' + (response.error || 'Неизвестная ошибка'))
    }
  } catch (e) {
    alert('Ошибка сети: ' + e.message)
  } finally {
    retryingLogs.value.delete(log.id)
  }
}

async function clearAllLogs() {
  const confirmMessage = `Вы уверены, что хотите удалить ВСЕ логи (${logs.value.length} записей)?\n\nЭто действие невозможно отменить!`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  // Дополнительное подтверждение
  if (!confirm('Подтвердите удаление ещё раз. Все данные будут потеряны безвозвратно.')) {
    return
  }
  
  clearingLogs.value = true
  
  try {
    const response = await apiClearAllPaymentLogsRoute.run(ctx)
    
    if (response.success) {
      // Обновляем список логов
      await loadLogs()
      
      // Показываем уведомление об успехе
      alert(`Успешно удалено ${response.deletedCount} записей`)
    } else {
      alert('Ошибка удаления: ' + (response.error || 'Неизвестная ошибка'))
    }
  } catch (e) {
    alert('Ошибка сети: ' + e.message)
  } finally {
    clearingLogs.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
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

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success);
}

.badge-error {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.btn-small {
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-small:hover:not(:disabled) {
  opacity: 0.8;
}

.btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

