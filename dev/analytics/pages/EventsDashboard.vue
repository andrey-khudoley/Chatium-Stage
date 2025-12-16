<template>
  <div class="dashboard-container">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1>
            <i class="fas fa-chart-line"></i>
            Обзор событий
          </h1>
          <p class="subtitle">Мониторинг всех событий системы из ClickHouse</p>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="user-name">{{ ctx.user?.displayName }}</span>
            <span class="user-role">Admin</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="main-content">
      <!-- Stats cards -->
      <div v-if="stats" class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <i class="fas fa-bolt"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalEvents || 0 }}</div>
            <div class="stat-label">Всего событий</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.uniqueUsers || 0 }}</div>
            <div class="stat-label">Уникальных пользователей</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.uniqueEventTypes || 0 }}</div>
            <div class="stat-label">Типов событий</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
            <i class="fas fa-calendar"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatDateShort(stats.lastEventDate) }}</div>
            <div class="stat-label">Последнее событие</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-header">
          <h3>
            <i class="fas fa-filter"></i>
            Фильтры
          </h3>
          <button @click="applyFilters" class="btn-primary" :disabled="loading">
            <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
            Применить
          </button>
        </div>
        <div class="filters-content">
          <div class="filter-group">
            <label for="dateFrom">
              <i class="fas fa-calendar-alt"></i>
              Дата от
            </label>
            <input 
              type="date" 
              id="dateFrom" 
              v-model="filters.dateFrom"
              :max="filters.dateTo"
            />
          </div>
          <div class="filter-group">
            <label for="dateTo">
              <i class="fas fa-calendar-alt"></i>
              Дата до
            </label>
            <input 
              type="date" 
              id="dateTo" 
              v-model="filters.dateTo"
              :min="filters.dateFrom"
            />
          </div>
          <div class="filter-group">
            <label for="limit">
              <i class="fas fa-list-ol"></i>
              Количество записей
            </label>
            <select id="limit" v-model.number="filters.limit">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Загрузка событий...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button @click="loadData" class="btn-secondary">
          <i class="fas fa-redo"></i>
          Попробовать снова
        </button>
      </div>

      <!-- Events table -->
      <EventsTable v-else :events="events" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiGetEventsRoute, apiGetEventStatsRoute } from '../api/events'
import EventsTable from '../components/tables/EventsTable.vue'

// State
const loading = ref(true)
const error = ref(null)
const events = ref([])
const stats = ref(null)

// Filters
const filters = ref({
  dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  dateTo: new Date().toISOString().split('T')[0],
  limit: 50,
  offset: 0
})

// Methods
async function loadData() {
  loading.value = true
  error.value = null

  try {
    // Загружаем события и статистику параллельно
    const [eventsResult, statsResult] = await Promise.all([
      apiGetEventsRoute.run(ctx, {
        dateFrom: filters.value.dateFrom,
        dateTo: filters.value.dateTo,
        limit: filters.value.limit,
        offset: filters.value.offset
      }),
      apiGetEventStatsRoute.run(ctx, {
        dateFrom: filters.value.dateFrom,
        dateTo: filters.value.dateTo
      })
    ])

    if (eventsResult.success) {
      events.value = eventsResult.events || []
    } else {
      error.value = eventsResult.error || 'Не удалось загрузить события'
    }

    if (statsResult.success) {
      stats.value = statsResult.stats
    }
  } catch (e) {
    error.value = e.message || 'Произошла ошибка при загрузке данных'
    console.error('Failed to load dashboard data:', e)
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  loadData()
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}`
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f7fafc;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.header-left h1 i {
  margin-right: 0.75rem;
}

.subtitle {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-size: 1rem;
  font-weight: 500;
}

.user-role {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
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
  font-size: 1.75rem;
  font-weight: 600;
  color: #2d3748;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
}

.filters-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filters-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
}

.filters-header h3 i {
  margin-right: 0.5rem;
  color: #667eea;
}

.filters-content {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.filter-group label i {
  margin-right: 0.5rem;
  color: #667eea;
}

.filter-group input,
.filter-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #2d3748;
  transition: border-color 0.2s;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-secondary:hover {
  background: #f7fafc;
}

.loading-state,
.error-state {
  background: white;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-state i,
.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state i {
  color: #667eea;
}

.error-state i {
  color: #f56565;
}

.loading-state p,
.error-state p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #718096;
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 1.5rem 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-left h1 {
    font-size: 1.5rem;
  }

  .main-content {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters-content {
    grid-template-columns: 1fr;
  }
}
</style>

