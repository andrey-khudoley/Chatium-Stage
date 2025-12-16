<template>
  <div class="analytics-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <button @click="goBack" class="back-button">
            <i class="fas fa-arrow-left"></i>
          </button>
          <h1>
            <i class="fas fa-users"></i>
            Все пользователи
          </h1>
        </div>
        <div class="header-right">
          <span class="user-name">{{ ctx.user?.displayName }}</span>
          <span class="user-role">Admin</span>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="main-content">
      <!-- Stats cards -->
      <div class="stats-grid" v-if="!loading">
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">Всего пользователей</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <i class="fas fa-user-plus"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.todayUsers }}</div>
            <div class="stat-label">Новые сегодня</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.weekUsers }}</div>
            <div class="stat-label">За неделю</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <i class="fas fa-calendar-check"></i>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{ stats.monthUsers }}</div>
            <div class="stat-label">За месяц</div>
          </div>
        </div>
      </div>

      <!-- Search and filters -->
      <div class="filters-section">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Поиск по имени или email..."
            @input="onSearchInput"
          />
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Загрузка данных...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Ошибка загрузки: {{ error }}</p>
      </div>

      <!-- Users table -->
      <div v-else class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Телефон</th>
              <th>UID</th>
              <th>Дата регистрации</th>
              <th>Событий</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="user in users" :key="user.id">
              <tr 
                class="user-row"
                :class="{ 'selected': selectedUser?.id === user.id }"
                @click="selectUser(user)"
              >
                <td class="email-cell">{{ user.email || '—' }}</td>
                <td>{{ user.firstName || '—' }}</td>
                <td>{{ user.lastName || '—' }}</td>
                <td>{{ user.phone || '—' }}</td>
                <td class="uid-cell">{{ user.uid ? user.uid.substring(0, 8) + '...' : '—' }}</td>
                <td>{{ formatDate(user.registrationDate) }}</td>
                <td class="count-cell">—</td>
              </tr>
              
              <!-- События пользователя (спойлер) -->
              <tr v-if="selectedUser?.id === user.id" class="events-row">
                <td colspan="7" class="events-cell">
                  <div class="events-spoiler">
                    <!-- Loading -->
                    <div v-if="eventsLoading" class="events-loading">
                      <i class="fas fa-spinner fa-spin"></i>
                      <span>Загрузка событий...</span>
                    </div>
                    
                    <!-- Error -->
                    <div v-else-if="eventsError" class="events-error">
                      <i class="fas fa-exclamation-triangle"></i>
                      <span>Ошибка: {{ eventsError }}</span>
                    </div>
                    
                    <!-- Events -->
                    <div v-else class="events-content">
                      <div class="events-header-inline">
                        <h4>
                          <i class="fas fa-clock"></i>
                          События пользователя (всего: {{ userEventsTotalCount }})
                        </h4>
                      </div>
                      
                      <div v-if="userEvents.length === 0" class="events-empty-inline">
                        <i class="fas fa-inbox"></i>
                        <span>События не найдены</span>
                      </div>
                      
                      <div v-else class="events-list-inline">
                        <div v-for="(event, index) in userEvents" :key="index" class="event-item-inline">
                          <div class="event-header-inline">
                            <div class="event-type-inline">
                              <i :class="getEventIcon(event.urlPath)"></i>
                              <span>{{ getEventName(event.urlPath) }}</span>
                            </div>
                            <div class="event-time-inline">
                              {{ formatEventDate(event.ts) }}
                            </div>
                          </div>
                          
                          <div v-if="hasEventDetails(event)" class="event-details-inline">
                            <div v-if="event.title" class="event-detail-inline">
                              <span class="detail-label-inline">Название:</span>
                              <span class="detail-value-inline">{{ event.title }}</span>
                            </div>
                            <div v-if="event.action_param1" class="event-detail-inline">
                              <span class="detail-label-inline">Параметр 1:</span>
                              <span class="detail-value-inline">{{ event.action_param1 }}</span>
                            </div>
                            <div v-if="event.action_param2" class="event-detail-inline">
                              <span class="detail-label-inline">Параметр 2:</span>
                              <span class="detail-value-inline">{{ event.action_param2 }}</span>
                            </div>
                            <div v-if="event.action_param1_float" class="event-detail-inline">
                              <span class="detail-label-inline">Сумма:</span>
                              <span class="detail-value-inline">{{ event.action_param1_float }}</span>
                            </div>
                            <div v-if="event.gc_deal_id" class="event-detail-inline">
                              <span class="detail-label-inline">GC Deal ID:</span>
                              <span class="detail-value-inline">{{ event.gc_deal_id }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Pagination -->
                      <div v-if="userEvents.length > 0 && userEventsTotalCount > eventsLimit" class="events-pagination-inline">
                        <button 
                          @click.stop="previousEventsPage" 
                          :disabled="eventsOffset === 0"
                          class="pagination-button-inline"
                        >
                          <i class="fas fa-chevron-left"></i>
                          Предыдущие
                        </button>
                        
                        <span class="pagination-info-inline">
                          {{ eventsOffset + 1 }}-{{ Math.min(eventsOffset + eventsLimit, userEventsTotalCount) }} из {{ userEventsTotalCount }}
                        </span>
                        
                        <button 
                          @click.stop="nextEventsPage" 
                          :disabled="eventsOffset + eventsLimit >= userEventsTotalCount"
                          class="pagination-button-inline"
                        >
                          Следующие
                          <i class="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        
        <div v-if="users.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Пользователи не найдены</p>
          <p class="empty-hint">Используйте кнопку "Обновить исторические данные" в настройках</p>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && users.length > 0" class="pagination">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 0"
          class="pagination-button"
        >
          <i class="fas fa-chevron-left"></i>
          Предыдущая
        </button>
        
        <span class="pagination-info">
          Показано {{ offset + 1 }}-{{ Math.min(offset + limit, totalCount) }} из {{ totalCount }}
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="offset + limit >= totalCount"
          class="pagination-button"
        >
          Следующая
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { apiGetUsersRoute, apiGetUsersStatsRoute, apiGetUserEventsCountRoute } from '../api/users'
import { apiGetUserEventsRoute } from '../api/events'
import { indexPageRoute } from '../index'

const users = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const currentPage = ref(0)
const limit = ref(25)
const offset = computed(() => currentPage.value * limit.value)
const totalCount = ref(0)

// Selected user and their events
const selectedUser = ref(null)
const userEvents = ref([])
const eventsLoading = ref(false)
const eventsError = ref(null)
const eventsOffset = ref(0)
const eventsLimit = ref(50)
const userEventsTotalCount = ref(0)

const stats = reactive({
  totalUsers: 0,
  todayUsers: 0,
  weekUsers: 0,
  monthUsers: 0
})

let searchTimeout = null

const loadUsers = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Формируем URL с query параметрами
    const params = new URLSearchParams()
    if (searchQuery.value) {
      params.append('search', searchQuery.value)
    }
    params.append('limit', String(limit.value))
    params.append('offset', String(offset.value))
    
    const usersUrl = apiGetUsersRoute.url() + '?' + params.toString()
    
    // Загружаем пользователей и статистику параллельно
    const [usersResponse, statsResult] = await Promise.all([
      fetch(usersUrl).then(r => r.json()),
      apiGetUsersStatsRoute.run(ctx)
    ])
    
    const usersResult = usersResponse
    
    if (usersResult.success) {
      users.value = usersResult.users || []
      totalCount.value = usersResult.totalCount || 0
    } else {
      error.value = usersResult.error || 'Неизвестная ошибка'
    }
    
    if (statsResult.success && statsResult.stats) {
      stats.totalUsers = statsResult.stats.totalUsers
      stats.todayUsers = statsResult.stats.todayUsers
      stats.weekUsers = statsResult.stats.weekUsers
      stats.monthUsers = statsResult.stats.monthUsers
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    currentPage.value = 0
    loadUsers()
  }, 500)
}

const previousPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--
    loadUsers()
  }
}

const nextPage = () => {
  if (offset.value + limit.value < totalCount.value) {
    currentPage.value++
    loadUsers()
  }
}

const goBack = () => {
  window.location.href = indexPageRoute.url()
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

const formatEventDate = (dateString) => {
  if (!dateString) return '—'
  
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
}

const selectUser = async (user) => {
  // Если кликнули на того же пользователя - закрываем спойлер
  if (selectedUser.value?.id === user.id) {
    selectedUser.value = null
    userEvents.value = []
    userEventsTotalCount.value = 0
    return
  }
  
  selectedUser.value = user
  eventsOffset.value = 0
  
  // Загружаем количество событий И сами события
  await Promise.all([
    loadUserEventsCount(user.email),
    loadUserEvents(user.email)
  ])
}

const loadUserEventsCount = async (userEmail) => {
  if (!userEmail) return
  
  try {
    const url = apiGetUserEventsCountRoute.url() + `?email=${encodeURIComponent(userEmail)}`
    const response = await fetch(url)
    const result = await response.json()
    
    if (result.success) {
      userEventsTotalCount.value = result.count || 0
      console.log('User events count:', result.count)
    }
  } catch (e) {
    console.error('Failed to load events count:', e)
  }
}

const closeEventsPanel = () => {
  selectedUser.value = null
  userEvents.value = []
  eventsError.value = null
  eventsOffset.value = 0
}

const loadUserEvents = async (userEmail) => {
  if (!userEmail) return
  
  eventsLoading.value = true
  eventsError.value = null
  
  try {
    const url = apiGetUserEventsRoute.url() + 
      `?email=${encodeURIComponent(userEmail)}` +
      `&limit=${eventsLimit.value}` +
      `&offset=${eventsOffset.value}`
    
    console.log('Loading user events:', { url, userEmail, limit: eventsLimit.value, offset: eventsOffset.value })
    
    const response = await fetch(url)
    const result = await response.json()
    
    console.log('User events API response:', { 
      success: result.success, 
      eventsCount: result.events?.length || 0, 
      totalCount: result.totalCount,
      events: result.events 
    })
    
    if (result.success) {
      const events = Array.isArray(result.events) ? result.events : []
      userEvents.value = events
      userEventsTotalCount.value = result.totalCount || 0
      
      console.log('Loaded events:', { 
        eventsCount: events.length, 
        totalCount: userEventsTotalCount.value,
        firstEvent: events[0] 
      })
    } else {
      eventsError.value = result.error || 'Неизвестная ошибка'
      console.error('Error loading events:', result.error)
    }
  } catch (e) {
    eventsError.value = e.message
    console.error('Exception loading events:', e)
  } finally {
    eventsLoading.value = false
  }
}

const previousEventsPage = () => {
  if (eventsOffset.value >= eventsLimit.value && selectedUser.value?.email) {
    eventsOffset.value -= eventsLimit.value
    loadUserEvents(selectedUser.value.email)
  }
}

const nextEventsPage = () => {
  if (eventsOffset.value + eventsLimit.value < userEventsTotalCount.value && selectedUser.value?.email) {
    eventsOffset.value += eventsLimit.value
    loadUserEvents(selectedUser.value.email)
  }
}

const getEventIcon = (urlPath) => {
  if (!urlPath) return 'fas fa-question-circle'
  
  if (urlPath.includes('dealCreated') || urlPath.includes('deal')) {
    return 'fas fa-handshake'
  } else if (urlPath.includes('payment') || urlPath.includes('order')) {
    return 'fas fa-credit-card'
  } else if (urlPath.includes('registration') || urlPath.includes('user')) {
    return 'fas fa-user-plus'
  } else if (urlPath.includes('form') || urlPath.includes('answers')) {
    return 'fas fa-file-alt'
  } else if (urlPath.includes('page') || urlPath.includes('view')) {
    return 'fas fa-eye'
  } else if (urlPath.includes('click') || urlPath.includes('button')) {
    return 'fas fa-mouse-pointer'
  }
  
  return 'fas fa-circle'
}

const getEventName = (urlPath) => {
  if (!urlPath) return 'Неизвестное событие'
  
  // Удаляем префикс event://
  let name = urlPath.replace('event://', '')
  
  // Заменяем getcourse/ на более читаемое
  name = name.replace('getcourse/', 'GC: ')
  
  // Заменяем слеши на пробелы
  name = name.replace(/\//g, ' → ')
  
  return name
}

const hasEventDetails = (event) => {
  return event.title 
    || event.action_param1 
    || event.action_param2 
    || event.action_param1_float
    || event.gc_deal_id
}

onMounted(() => {
  loadUsers()
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
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
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
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 500;
}

.user-role {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-details {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
}

.stat-label {
  color: #718096;
  font-size: 0.875rem;
}

.filters-section {
  margin-bottom: 2rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box i {
  color: #a0aec0;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.loading-state i,
.error-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #a0aec0;
}

.loading-state i {
  color: #667eea;
}

.error-state i {
  color: #f56565;
}

.empty-hint {
  color: #a0aec0;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.table-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: #f7fafc;
}

.users-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
}

.users-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.users-table tbody tr:hover {
  background: #f7fafc;
  cursor: pointer;
}

.users-table tbody tr.selected {
  background: #edf2f7;
  border-left: 4px solid #667eea;
}

.users-table td {
  padding: 1rem;
  color: #4a5568;
}

.email-cell {
  font-weight: 500;
  color: #667eea;
}

.uid-cell {
  font-family: monospace;
  font-size: 0.875rem;
}

.count-cell {
  font-weight: 600;
  color: #48bb78;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #667eea;
  color: #667eea;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #718096;
}

/* Events spoiler styles */
.events-row {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}

.events-cell {
  padding: 0 !important;
  background: #f7fafc;
  border-top: 2px solid #667eea !important;
}

.events-spoiler {
  padding: 1.5rem;
}

.events-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #667eea;
}

.events-loading i {
  font-size: 1.5rem;
}

.events-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #f56565;
}

.events-error i {
  font-size: 1.5rem;
}

.events-header-inline {
  margin-bottom: 1rem;
}

.events-header-inline h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.events-header-inline i {
  color: #667eea;
}

.events-empty-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #a0aec0;
}

.events-empty-inline i {
  font-size: 1.5rem;
}

.events-list-inline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.event-item-inline {
  background: white;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.event-item-inline:hover {
  border-color: #667eea;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.1);
}

.event-header-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.event-type-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9375rem;
}

.event-type-inline i {
  color: #667eea;
  width: 1.125rem;
}

.event-time-inline {
  color: #718096;
  font-size: 0.8125rem;
  font-family: monospace;
}

.event-details-inline {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
}

.event-detail-inline {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.detail-label-inline {
  color: #718096;
  min-width: 90px;
  font-weight: 500;
}

.detail-value-inline {
  color: #2d3748;
  flex: 1;
  word-break: break-word;
}

.events-pagination-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.pagination-button-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.pagination-button-inline:hover:not(:disabled) {
  background: #f7fafc;
  border-color: #667eea;
  color: #667eea;
}

.pagination-button-inline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info-inline {
  color: #718096;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .users-table {
    font-size: 0.875rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .event-header-inline {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .events-pagination-inline {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>


