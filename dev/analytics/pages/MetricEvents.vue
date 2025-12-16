<template>
  <div class="analytics-container">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <button class="back-button" @click="goBack">
          <i class="fas fa-arrow-left"></i>
        </button>
        <h1>
          <i class="fas fa-satellite-dish"></i>
          Metric Events Monitor
        </h1>
        <p class="subtitle">Мониторинг всех событий из metric-event hook</p>
      </div>
      <div class="header-user">
        <span class="user-name">{{ ctx.user?.displayName }}</span>
        <span class="user-role">Admin</span>
      </div>
    </header>

    <!-- Stats Cards -->
    <div class="stats-grid" v-if="!loading && stats">
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="fas fa-inbox"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Всего событий</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.lastHour }}</div>
          <div class="stat-label">За последний час</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="fas fa-calendar-day"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.lastDay }}</div>
          <div class="stat-label">За последние 24 часа</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.lastEvent ? formatTime(stats.lastEvent.receivedAt) : '—' }}</div>
          <div class="stat-label">Последнее событие</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions-section">
      <button class="action-button primary" @click="subscribeToAll" :disabled="subscribing">
        <i class="fas fa-bell"></i>
        {{ subscribing ? 'Подписываемся...' : 'Подписаться на все события' }}
      </button>
      
      <button class="action-button secondary" @click="refreshData" :disabled="loading">
        <i class="fas fa-sync"></i>
        Обновить
      </button>
      
      <button class="action-button danger" @click="cleanupOldEvents" :disabled="cleaning">
        <i class="fas fa-trash"></i>
        {{ cleaning ? 'Очистка...' : 'Очистить старые (>7 дней)' }}
      </button>
    </div>

    <!-- Events Table -->
    <main class="main-content">
      <div class="card">
        <h3>
          <i class="fas fa-list"></i>
          Полученные события
        </h3>
        
        <div v-if="loading" class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          Загрузка событий...
        </div>
        
        <div v-else-if="error" class="error">
          <i class="fas fa-exclamation-circle"></i>
          Ошибка: {{ error }}
        </div>
        
        <div v-else-if="events.length === 0" class="empty">
          <i class="fas fa-inbox"></i>
          <p>Событий пока нет</p>
          <p style="color: #999; font-size: 0.9rem;">Подпишитесь на события и дождитесь их появления</p>
        </div>
        
        <table v-else class="events-table">
          <thead>
            <tr>
              <th>Время получения</th>
              <th>URL Path</th>
              <th>Email</th>
              <th>User ID</th>
              <th>Детали</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(event, index) in events" :key="event.id">
              <tr class="event-row" @click="toggleDetails(index)">
                <td>{{ formatDateTime(event.receivedAt) }}</td>
                <td>
                  <i :class="getEventIcon(event.urlPath)"></i>
                  {{ getEventName(event.urlPath) }}
                </td>
                <td>{{ event.userEmail || '—' }}</td>
                <td><code>{{ event.userId || '—' }}</code></td>
                <td>
                  <button class="details-button">
                    <i :class="expandedRows.includes(index) ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                    {{ expandedRows.includes(index) ? 'Скрыть' : 'Показать' }}
                  </button>
                </td>
              </tr>
              
              <!-- Details Row -->
              <tr v-show="expandedRows.includes(index)" class="details-row">
                <td colspan="5">
                  <div class="event-details">
                    <h4><i class="fas fa-code"></i> Полные данные события</h4>
                    <pre class="json-viewer">{{ formatJSON(event.eventData) }}</pre>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <div class="pagination" v-if="events.length > 0">
          <button @click="prevPage" :disabled="currentPage === 1" class="pagination-button">
            <i class="fas fa-chevron-left"></i>
            Предыдущая
          </button>
          <span class="pagination-info">
            Показано {{ (currentPage - 1) * limit + 1 }}-{{ Math.min(currentPage * limit, total) }} из {{ total }}
          </span>
          <button @click="nextPage" :disabled="currentPage * limit >= total" class="pagination-button">
            Следующая
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiGetMetricEventsRoute, apiGetMetricEventsStatsRoute, apiSubscribeToAllEventsRoute, apiCleanupMetricEventsRoute } from '../api/metric-events'
import { indexPageRoute } from '../index'

const events = ref([])
const stats = ref(null)
const loading = ref(true)
const error = ref(null)
const subscribing = ref(false)
const cleaning = ref(false)
const expandedRows = ref([])
const currentPage = ref(1)
const limit = 50
const total = ref(0)

const offset = computed(() => (currentPage.value - 1) * limit)

function goBack() {
  window.location.href = indexPageRoute.url()
}

function toggleDetails(index) {
  const idx = expandedRows.value.indexOf(index)
  if (idx > -1) {
    expandedRows.value.splice(idx, 1)
  } else {
    expandedRows.value.push(index)
  }
}

function getEventIcon(urlPath) {
  if (!urlPath) return 'fas fa-question-circle'
  
  if (urlPath.includes('user/created')) return 'fas fa-user-plus'
  if (urlPath.includes('user/updated')) return 'fas fa-user-edit'
  if (urlPath.includes('deal')) return 'fas fa-handshake'
  if (urlPath.includes('order')) return 'fas fa-shopping-cart'
  if (urlPath.includes('message')) return 'fas fa-envelope'
  if (urlPath.includes('form')) return 'fas fa-file-alt'
  
  return 'fas fa-circle'
}

function getEventName(urlPath) {
  if (!urlPath) return 'Unknown'
  
  const parts = urlPath.split('/')
  return parts[parts.length - 1] || urlPath
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatTime(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatJSON(jsonStr) {
  if (!jsonStr) return '{}'
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return jsonStr
  }
}

async function loadData() {
  loading.value = true
  error.value = null
  
  try {
    const [eventsResult, statsResult] = await Promise.all([
      apiGetMetricEventsRoute.run(ctx, { limit, offset: offset.value }),
      apiGetMetricEventsStatsRoute.run(ctx)
    ])
    
    if (eventsResult.success) {
      events.value = eventsResult.events
      total.value = eventsResult.total
    } else {
      error.value = eventsResult.error
    }
    
    if (statsResult.success) {
      stats.value = statsResult.stats
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  await loadData()
}

async function subscribeToAll() {
  subscribing.value = true
  
  try {
    const result = await apiSubscribeToAllEventsRoute.run(ctx)
    
    if (result.success) {
      alert(`✅ Успешно подписались на ${result.events.length} событий!\n\n${result.events.join('\n')}`)
    } else {
      alert(`❌ Ошибка подписки: ${result.error}`)
    }
  } catch (e) {
    alert(`❌ Ошибка: ${e.message}`)
  } finally {
    subscribing.value = false
  }
}

async function cleanupOldEvents() {
  if (!confirm('Удалить все события старше 7 дней?')) return
  
  cleaning.value = true
  
  try {
    const result = await apiCleanupMetricEventsRoute.run(ctx)
    
    if (result.success) {
      alert(`✅ Удалено событий: ${result.deleted}`)
      await loadData()
    } else {
      alert(`❌ Ошибка: ${result.error}`)
    }
  } catch (e) {
    alert(`❌ Ошибка: ${e.message}`)
  } finally {
    cleaning.value = false
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadData()
  }
}

function nextPage() {
  if (currentPage.value * limit < total.value) {
    currentPage.value++
    loadData()
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.analytics-container {
  min-height: 100vh;
  background: #f7fafc;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 0.9rem;
}

.header-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.user-name {
  font-weight: 500;
}

.user-role {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2d3748;
}

.stat-label {
  color: #718096;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.actions-section {
  padding: 0 2rem 1rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

.action-button.secondary {
  background: #e2e8f0;
  color: #2d3748;
}

.action-button.secondary:hover:not(:disabled) {
  background: #cbd5e0;
}

.action-button.danger {
  background: #fc8181;
  color: white;
}

.action-button.danger:hover:not(:disabled) {
  background: #f56565;
}

.main-content {
  padding: 0 2rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 1.5rem 0;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading, .error, .empty {
  text-align: center;
  padding: 3rem;
  color: #718096;
}

.error {
  color: #f56565;
}

.empty i {
  font-size: 3rem;
  color: #cbd5e0;
  margin-bottom: 1rem;
}

.events-table {
  width: 100%;
  border-collapse: collapse;
}

.events-table th {
  background: #f7fafc;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

.event-row {
  cursor: pointer;
  transition: background 0.2s;
}

.event-row:hover {
  background: #f7fafc;
}

.event-row td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.event-row code {
  background: #f7fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
}

.details-button {
  background: #e2e8f0;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.details-button:hover {
  background: #cbd5e0;
}

.details-row {
  background: #f7fafc;
}

.details-row td {
  padding: 0 !important;
}

.event-details {
  padding: 1.5rem;
}

.event-details h4 {
  margin: 0 0 1rem 0;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.json-viewer {
  background: #2d3748;
  color: #68d391;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.pagination-button {
  padding: 0.5rem 1rem;
  background: #e2e8f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: #cbd5e0;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #718096;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>

