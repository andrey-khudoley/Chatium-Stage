<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold flex items-center gap-3">
        <i class="fas fa-list" style="color: var(--color-primary)"></i>
        Последние входящие вебхуки
      </h2>
      <button @click="$emit('refresh')" class="text-[var(--color-primary)] hover:opacity-70" title="Обновить">
        <i class="fas fa-sync-alt"></i>
      </button>
    </div>
    
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>ID сделки</th>
            <th>Время обработки</th>
            <th>Статус</th>
            <th>Ошибка</th>
            <th>Детали</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center py-12">
              <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
              <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка вебхуков...</p>
            </td>
          </tr>
          <tr v-else-if="!events || events.length === 0">
            <td colspan="5" class="text-center py-12">
              <i class="fas fa-inbox text-4xl mb-4 text-[var(--color-text-tertiary)]"></i>
              <p class="text-[var(--color-text-secondary)]">Входящих вебхуков пока нет</p>
            </td>
          </tr>
          <tr v-else v-for="event in events" :key="event.id">
            <td>
              <code class="px-2 py-1 rounded bg-[var(--color-bg)] text-[var(--color-primary)]">{{ event.leadId }}</code>
            </td>
            <td class="text-sm">
              {{ formatDate(event.processedAt) }}
            </td>
            <td>
              <span class="badge" :style="getStatusStyle(event.status)">
                <i :class="getStatusIcon(event.status)"></i>
                {{ getStatusLabel(event.status) }}
              </span>
            </td>
            <td>
              <span v-if="event.errorMessage" class="text-sm text-[var(--color-danger)]" :title="event.errorMessage">
                {{ truncateText(event.errorMessage, 50) }}
              </span>
              <span v-else class="text-[var(--color-text-tertiary)]">—</span>
            </td>
            <td>
              <button @click="showDetails(event)" class="transition-opacity hover:opacity-70" style="color: var(--color-primary)" title="Подробнее">
                <i class="fas fa-info-circle"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Модальное окно с деталями -->
    <div v-if="selectedEvent" class="modal-overlay" @click="selectedEvent = null">
      <div class="modal-content" @click.stop>
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-[var(--color-text)]">Детали события вебхука</h3>
          <button @click="selectedEvent = null" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div>
          <div class="detail-row">
            <span class="detail-label">ID события:</span>
            <span class="detail-value">{{ selectedEvent.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">ID сделки:</span>
            <span class="detail-value">{{ selectedEvent.leadId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Время обновления сделки:</span>
            <span class="detail-value">{{ formatTimestamp(selectedEvent.leadUpdatedAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Время обработки:</span>
            <span class="detail-value">{{ formatDate(selectedEvent.processedAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Статус:</span>
            <span class="detail-value">
              <span class="status-badge" :class="`status-${selectedEvent.status}`">
                <i :class="getStatusIcon(selectedEvent.status)"></i>
                {{ getStatusLabel(selectedEvent.status) }}
              </span>
            </span>
          </div>
          <div v-if="selectedEvent.errorMessage" class="detail-row">
            <span class="detail-label">Сообщение об ошибке:</span>
            <span class="detail-value error-text">{{ selectedEvent.errorMessage }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Создано:</span>
            <span class="detail-value">{{ formatDate(selectedEvent.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  events: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh'])

const selectedEvent = ref(null)

const formatDate = (date) => {
  if (!date) return '—'
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '—'
  const d = new Date(timestamp)
  return formatDate(d)
}

const getStatusLabel = (status) => {
  const labels = {
    processing: 'Обработка',
    processed: 'Обработано',
    skipped: 'Пропущено',
    error: 'Ошибка'
  }
  return labels[status] || status
}

const getStatusIcon = (status) => {
  const icons = {
    processing: 'fas fa-spinner fa-spin',
    processed: 'fas fa-check-circle',
    skipped: 'fas fa-minus-circle',
    error: 'fas fa-times-circle'
  }
  return icons[status] || 'fas fa-question-circle'
}

const getStatusStyle = (status) => {
  const styles = {
    processing: 'background: var(--color-warning-light); color: var(--color-warning);',
    processed: 'background: var(--color-success-light); color: var(--color-success);',
    skipped: 'background: var(--color-text-tertiary); color: var(--color-text-secondary);',
    error: 'background: var(--color-danger-light); color: var(--color-danger);'
  }
  return styles[status] || 'background: var(--color-bg); color: var(--color-text-secondary);'
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const showDetails = (event) => {
  selectedEvent.value = event
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

.detail-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  color: var(--color-text);
  font-size: 1rem;
}

</style>

