<template>
  <div class="traffic-reports">
    <div class="header">
      <div class="header-top">
        <h1 class="title">Отчеты по трафику сайта</h1>
        <button @click="openSettings" class="settings-btn" title="Настройки">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2549 9.77251 19.9887C9.5799 19.7225 9.31074 19.5265 9 19.43C8.69838 19.2969 8.36381 19.2572 8.03941 19.316C7.71502 19.3748 7.41568 19.5295 7.18 19.76L7.12 19.82C6.93425 20.006 6.71368 20.1535 6.47088 20.2541C6.22808 20.3548 5.96783 20.4066 5.705 20.4066C5.44217 20.4066 5.18192 20.3548 4.93912 20.2541C4.69632 20.1535 4.47575 20.006 4.29 19.82C4.10405 19.6343 3.95653 19.4137 3.85588 19.1709C3.75523 18.9281 3.70343 18.6678 3.70343 18.405C3.70343 18.1422 3.75523 17.8819 3.85588 17.6391C3.95653 17.3963 4.10405 17.1757 4.29 16.99L4.35 16.93C4.58054 16.6943 4.73519 16.395 4.794 16.0706C4.85282 15.7462 4.81312 15.4116 4.68 15.11C4.55324 14.8142 4.34276 14.562 4.07447 14.3843C3.80618 14.2066 3.49179 14.1113 3.17 14.11H3C2.46957 14.11 1.96086 13.8993 1.58579 13.5242C1.21071 13.1491 1 12.6404 1 12.11C1 11.5796 1.21071 11.0709 1.58579 10.6958C1.96086 10.3207 2.46957 10.11 3 10.11H3.09C3.42099 10.1023 3.74514 9.99512 4.01133 9.80251C4.27753 9.6099 4.47354 9.34074 4.57 9.03C4.70312 8.72838 4.74282 8.39381 4.684 8.06941C4.62519 7.74502 4.47054 7.44568 4.24 7.21L4.18 7.15C3.99405 6.96425 3.84653 6.74368 3.74588 6.50088C3.64523 6.25808 3.59343 5.99783 3.59343 5.735C3.59343 5.47217 3.64523 5.21192 3.74588 4.96912C3.84653 4.72632 3.99405 4.50575 4.18 4.32C4.36575 4.13405 4.58632 3.98653 4.82912 3.88588C5.07192 3.78523 5.33217 3.73343 5.595 3.73343C5.85783 3.73343 6.11808 3.78523 6.36088 3.88588C6.60368 3.98653 6.82425 4.13405 7.01 4.32L7.07 4.38C7.30568 4.61054 7.60502 4.76519 7.92941 4.824C8.25381 4.88282 8.58838 4.84312 8.89 4.71H8.91C9.20583 4.58324 9.45798 4.37276 9.63568 4.10447C9.81338 3.83618 9.90865 3.52179 9.91 3.2V3C9.91 2.46957 10.1207 1.96086 10.4958 1.58579C10.8709 1.21071 11.3796 1 11.91 1C12.4404 1 12.9491 1.21071 13.3242 1.58579C13.6993 1.96086 13.91 2.46957 13.91 3V3.09C13.9113 3.41179 14.0066 3.72618 14.1843 3.99447C14.362 4.26276 14.6142 4.47324 14.91 4.6C15.2116 4.73312 15.5462 4.77282 15.8706 4.714C16.195 4.65519 16.4943 4.50054 16.73 4.27L16.79 4.21C16.9757 4.02405 17.1963 3.87653 17.4391 3.77588C17.6819 3.67523 17.9422 3.62343 18.205 3.62343C18.4678 3.62343 18.7281 3.67523 18.9709 3.77588C19.2137 3.87653 19.4343 4.02405 19.62 4.21C19.806 4.39575 19.9535 4.61632 20.0541 4.85912C20.1548 5.10192 20.2066 5.36217 20.2066 5.625C20.2066 5.88783 20.1548 6.14808 20.0541 6.39088C19.9535 6.63368 19.806 6.85425 19.62 7.04L19.56 7.1C19.3295 7.33568 19.1748 7.63502 19.116 7.95941C19.0572 8.28381 19.0969 8.61838 19.23 8.92V8.94C19.3568 9.23583 19.5672 9.48798 19.8355 9.66568C20.1038 9.84338 20.4182 9.93865 20.74 9.94H20.93C21.4604 9.94 21.9691 10.1507 22.3442 10.5258C22.7193 10.9009 22.93 11.4096 22.93 11.94C22.93 12.4704 22.7193 12.9791 22.3442 13.3542C21.9691 13.7293 21.4604 13.94 20.93 13.94H20.84C20.5182 13.9413 20.2038 14.0366 19.9355 14.2143C19.6672 14.392 19.4568 14.6442 19.33 14.94V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <!-- Фильтры -->
      <div class="filters-panel">
        <div class="filter-group">
          <label>Дата события:</label>
          <div class="date-inputs">
            <input 
              type="date" 
              v-model="filters.dateFrom" 
              class="date-input"
              @change="onFiltersChange"
            />
            <span>до</span>
            <input 
              type="date" 
              v-model="filters.dateTo" 
              class="date-input"
              @change="onFiltersChange"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label>URL события:</label>
          <input 
            type="text" 
            v-model="filters.url" 
            placeholder="https://example.com/page"
            class="url-input"
            @input="onFiltersChange()"
          />
        </div>
        
        <button @click="applyFilters" class="apply-btn">Применить фильтры</button>
      </div>
    </div>

    <div v-if="errorMessage" class="error-banner">
      <div class="error-content">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>
        </svg>
        <div class="error-text">
          <div class="error-title">Ошибка загрузки данных</div>
          <div class="error-description">{{ errorMessage }}</div>
        </div>
        <button @click="clearError" class="error-close">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Табы -->
    <div class="tabs-container">
      <div class="tabs-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="['tab-btn', { active: activeTab === tab.key }]"
        >
          {{ tab.title }}
        </button>
      </div>

      <!-- Контент табов -->
      <div class="tab-content">
        <div v-if="loading" class="loading">Загрузка...</div>
        
        <!-- Последние посещения -->
        <div v-if="activeTab === 'recent' && !loading" class="report-section">
          <h3>Последние посещения</h3>
          <div class="table-wrapper">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>URL</th>
                  <th>Пользователь</th>
                  <th>Устройство</th>
                  <th>Локация</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="visit in recentVisits" :key="visit.id">
                  <td>{{ formatDateTime(visit.ts) }}</td>
                  <td class="url-cell">{{ visit.url }}</td>
                  <td>{{ visit.user_name || 'Анонимный' }}</td>
                  <td>{{ visit.device_info }}</td>
                  <td>{{ visit.location }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Посетители по дням -->
        <div v-if="activeTab === 'daily' && !loading" class="report-section">
          <h3>Посетители по дням</h3>
          
          <!-- График -->
          <div v-if="dailyStats.length > 0" class="chart-container">
            <div class="chart-title">Динамика трафика</div>
            <div class="chart-wrapper">
              <canvas ref="chartCanvas" class="chart"></canvas>
            </div>
            
            <!-- Custom Legend -->
            <div class="chart-legend">
              <div 
                :class="['legend-item', { inactive: !chartSettings.showVisits }]"
                @click="toggleChartLine('visits')"
              >
                <div :class="['legend-color', 'visits-color', { inactive: !chartSettings.showVisits }]"></div>
                <span>Посещения</span>
              </div>
              <div 
                :class="['legend-item', { inactive: !chartSettings.showUsers }]"
                @click="toggleChartLine('users')"
              >
                <div :class="['legend-color', 'users-color', { inactive: !chartSettings.showUsers }]"></div>
                <span>Уникальные посетители</span>
              </div>
              <div 
                :class="['legend-item', { inactive: !chartSettings.showSessions }]"
                @click="toggleChartLine('sessions')"
              >
                <div :class="['legend-color', 'sessions-color', { inactive: !chartSettings.showSessions }]"></div>
                <span>Сессии</span>
              </div>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Посещения</th>
                  <th>Уникальные посетители</th>
                  <th>Сессии</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="day in dailyStats" :key="day.date">
                  <td>{{ formatDate(day.date) }}</td>
                  <td>{{ day.visits_count }}</td>
                  <td>{{ day.users_count }}</td>
                  <td>{{ day.sessions_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Самые посещаемые страницы -->
        <div v-if="activeTab === 'popular' && !loading" class="report-section">
          <h3>Самые посещаемые страницы</h3>
          <div class="table-wrapper">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Посещения</th>
                  <th>Уникальные посетители</th>
                  <th>% от общего трафика</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="page in popularPages" :key="page.url">
                  <td class="url-cell">{{ page.url }}</td>
                  <td>{{ page.visits_count }}</td>
                  <td>{{ page.users_count }}</td>
                  <td>{{ page.percentage }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Страницы входа -->
        <div v-if="activeTab === 'landing' && !loading" class="report-section">
          <h3>Страницы входа</h3>
          <div class="table-wrapper">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>URL входа</th>
                  <th>Количество входов</th>
                  <th>Уникальные посетители</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="page in landingPages" :key="page.url">
                  <td class="url-cell">{{ page.url }}</td>
                  <td>{{ page.entry_count }}</td>
                  <td>{{ page.unique_visitors }}</td>
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
import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue'
import { 
  apiRecentVisitsRoute,
  apiDailyStatsRoute,
  apiPopularPagesRoute,
  apiEntryPagesRoute
} from '../api/traffic'
import { indexPageRoute } from '../index'

// Реактивные данные
const activeTab = ref('recent')
const loading = ref(false)
const chartCanvas = ref(null)
let chartInstance = null
const errorMessage = ref('')

// Фильтры
const filters = reactive({
  dateFrom: getDateWeekAgo(),
  dateTo: getTodayDate(),
  url: ''
})

// Данные отчетов
const recentVisits = ref([])
const dailyStats = ref([])
const popularPages = ref([])
const landingPages = ref([])

// Chart settings for toggling lines
const chartSettings = reactive({
  showVisits: true,
  showUsers: true,
  showSessions: true
})

// Конфигурация табов
const tabs = [
  { key: 'recent', title: 'Последние посещения' },
  { key: 'daily', title: 'Посетители по дням' },
  { key: 'popular', title: 'Самые посещаемые страницы' },
  { key: 'landing', title: 'Страницы входа' }
]

// Методы для получения дат по умолчанию
function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

function getDateWeekAgo() {
  const date = new Date()
  date.setDate(date.getDate() - 7)
  return date.toISOString().split('T')[0]
}

function openSettings() {
  try {
    window.open(ctx.account.url('/app/gc-mcp-server') + `?backUrl=${encodeURIComponent(indexPageRoute.url())}&backText=${encodeURIComponent('Вернуться к отчету')}`, '_blank')
  }
  catch(e) {
    window.location.href = ctx.account.url('/app/gc-mcp-server') + `?backUrl=${encodeURIComponent(indexPageRoute.url())}&backText=${encodeURIComponent('Вернуться к отчету')}`
  }
}

// Chart.js configuration
const getChartConfig = computed(() => {
  if (!dailyStats.value.length) return null
  
  const sortedData = [...dailyStats.value].sort((a, b) => new Date(a.date) - new Date(b.date))
  
  const datasets = []
  
  if (chartSettings.showVisits) {
    datasets.push({
      label: 'Посещения',
      data: sortedData.map(item => item.visits_count),
      borderColor: '#4299e1',
      backgroundColor: '#4299e1',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3
    })
  }
  
  if (chartSettings.showUsers) {
    datasets.push({
      label: 'Уникальные посетители',
      data: sortedData.map(item => item.users_count),
      borderColor: '#48bb78',
      backgroundColor: '#48bb78',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3
    })
  }
  
  if (chartSettings.showSessions) {
    datasets.push({
      label: 'Сессии',
      data: sortedData.map(item => item.sessions_count),
      borderColor: '#ed8936',
      backgroundColor: '#ed8936',
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 3
    })
  }
  
  return {
    type: 'line',
    data: {
      labels: sortedData.map(item => formatChartDate(item.date)),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We use custom legend
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#4299e1',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
            color: '#f0f0f0'
          },
          ticks: {
            color: '#666'
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            display: true,
            color: '#f0f0f0'
          },
          ticks: {
            color: '#666'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      hover: {
        mode: 'nearest',
        intersect: false
      }
    }
  }
})

// Create or update chart
async function createChart() {
  // Wait a bit to ensure Chart.js is loaded and DOM is ready
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded')
    return
  }
  
  if (!chartCanvas.value || !dailyStats.value.length) return
  
  const config = getChartConfig.value
  if (!config) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  
  // Create new chart
  try {
    chartInstance = new Chart(chartCanvas.value, config)
    console.log('Chart created successfully')
  } catch (error) {
    console.error('Error creating chart:', error)
  }
}

// Update existing chart data
function updateChart() {
  // Always recreate chart for simplicity
  createChart()
}

// Toggle chart line visibility
function toggleChartLine(type) {
  switch(type) {
    case 'visits':
      chartSettings.showVisits = !chartSettings.showVisits
      break
    case 'users':
      chartSettings.showUsers = !chartSettings.showUsers
      break
    case 'sessions':
      chartSettings.showSessions = !chartSettings.showSessions
      break
  }
  
  updateChart()
}

// Функция очистки ошибки
function clearError() {
  errorMessage.value = ''
}

// Функция отображения ошибки
function showError(message) {
  errorMessage.value = message
}

// Загрузка данных
async function loadRecentVisits() {
  try {
    loading.value = true
    clearError()
    const response = await apiRecentVisitsRoute.query(filters).run(ctx)
    
    if (!response.success) {
      throw new Error(response.error || 'Неизвестная ошибка')
    }
    
    const data = response
    recentVisits.value = data?.rows || []
  } catch (error) {
    console.error('Ошибка загрузки последних посещений:', error)
    showError(error.message || 'Не удалось загрузить последние посещения')
    recentVisits.value = []
  } finally {
    loading.value = false
  }
}

async function loadDailyStats() {
  try {
    loading.value = true
    clearError()
    const response = await apiDailyStatsRoute.query(filters).run(ctx)
    
    if (!response.success) {
      throw new Error(response.error || 'Неизвестная ошибка')
    }
    
    const data = response
    
    dailyStats.value = data?.rows || []
    
    // Update chart after data loads
    if (activeTab.value === 'daily') {
      await nextTick()
      updateChart()
    }
  } catch (error) {
    console.error('Ошибка загрузки статистики по дням:', error)
    showError(error.message || 'Не удалось загрузить статистику по дням')
    dailyStats.value = []
  } finally {
    loading.value = false
  }
}

async function loadPopularPages() {
  try {
    loading.value = true
    clearError()
    const response = await apiPopularPagesRoute.query(filters).run(ctx)
    
    if (!response.success) {
      throw new Error(response.error || 'Неизвестная ошибка')
    }
    
    const data = response
    popularPages.value = data?.rows || []
  } catch (error) {
    console.error('Ошибка загрузки популярных страниц:', error)
    showError(error.message || 'Не удалось загрузить популярные страницы')
    popularPages.value = []
  } finally {
    loading.value = false
  }
}

async function loadLandingPages() {
  try {
    loading.value = true
    clearError()
    const response = await apiEntryPagesRoute.run(ctx, {
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      urlFilter: filters.url
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Неизвестная ошибка')
    }
    
    const data = response
    landingPages.value = data?.rows || []
  } catch (error) {
    console.error('Ошибка загрузки страниц входа:', error)
    showError(error.message || 'Не удалось загрузить страницы входа')
    landingPages.value = []
  } finally {
    loading.value = false
  }
}

// Загрузка данных в зависимости от активного таба
async function loadDataForActiveTab() {
  switch (activeTab.value) {
    case 'recent':
      await loadRecentVisits()
      break
    case 'daily':
      await loadDailyStats()
      break
    case 'popular':
      await loadPopularPages()
      break
    case 'landing':
      await loadLandingPages()
      break
  }
}

// Обработчики событий
function onFiltersChange() {
  // Debounce для избежания частых запросов при вводе
  clearTimeout(onFiltersChange.timeout)
  onFiltersChange.timeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

function applyFilters() {
  loadDataForActiveTab()
}

// Форматирование данных
function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('ru-RU')
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function formatDuration(seconds) {
  if (!seconds) return '0 сек'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (minutes > 0) {
    return `${minutes} мин ${remainingSeconds} сек`
  }
  return `${remainingSeconds} сек`
}

function formatChartDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', { 
    day: '2-digit', 
    month: '2-digit' 
  })
}

// Следим за изменением активного таба
watch(activeTab, async () => {
  await loadDataForActiveTab()
  if (activeTab.value === 'daily' && dailyStats.value.length > 0) {
    await nextTick()
    updateChart()
  }
})

// Watch for data changes to update chart
watch(dailyStats, async () => {
  if (activeTab.value === 'daily' && dailyStats.value.length > 0) {
    await nextTick()
    updateChart()
  }
}, { deep: true })

// Watch for chart settings changes
watch(chartSettings, () => {
  if (activeTab.value === 'daily') {
    updateChart()
  }
}, { deep: true })

// Загрузка данных при монтировании компонента
onMounted(() => {
  loadDataForActiveTab()
})
</script>

<style scoped>
.traffic-reports {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.header {
  margin-bottom: 30px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.settings-btn {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: #edf2f7;
  color: #2d3748;
  border-color: #cbd5e0;
}

.filters-panel {
  background: #f7fafc;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #4a5568;
  font-size: 14px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input, .url-input {
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  min-width: 140px;
}

.url-input {
  min-width: 250px;
}

.apply-btn {
  background: #4299e1;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.apply-btn:hover {
  background: #3182ce;
}

.tabs-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.tab-btn {
  flex: 1;
  padding: 16px 20px;
  border: none;
  background: transparent;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #edf2f7;
  color: #2d3748;
}

.tab-btn.active {
  background: white;
  color: #4299e1;
  border-bottom-color: #4299e1;
}

.tab-content {
  padding: 0;
}

.report-section {
  padding: 30px;
}

.report-section h3 {
  font-size: 24px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.reports-table th {
  background: #f7fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.reports-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f7fafc;
  font-size: 14px;
  color: #2d3748;
}

.reports-table tr:hover {
  background: #f7fafc;
}

.url-cell {
  max-width: 300px;
  word-break: break-all;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  font-size: 16px;
  color: #4a5568;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  width: 100%;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 20px;
  text-align: center;
}

.chart-wrapper {
  width: 100%;
  height: 400px;
  position: relative;
  overflow: hidden;
}

.chart {
  width: 100% !important;
  height: 400px !important;
  display: block;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  user-select: none;
}

.legend-item:hover {
  background: #f7fafc;
}

.legend-item.inactive {
  opacity: 0.4;
}

.legend-item.inactive:hover {
  opacity: 0.7;
}

.legend-color {
  width: 16px;
  height: 3px;
  border-radius: 2px;
  transition: all 0.2s;
}

.visits-color {
  background-color: #4299e1;
}

.users-color {
  background-color: #48bb78;
}

.sessions-color {
  background-color: #ed8936;
}

.legend-color.inactive {
  background-color: #cbd5e0 !important;
}

.error-banner {
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  margin-bottom: 20px;
  animation: slideDown 0.3s ease-out;
}

.error-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.error-icon {
  width: 20px;
  height: 20px;
  color: #e53e3e;
  flex-shrink: 0;
  margin-top: 2px;
}

.error-text {
  flex: 1;
  min-width: 0;
}

.error-title {
  font-weight: 600;
  color: #742a2a;
  margin-bottom: 4px;
}

.error-description {
  color: #9b2c2c;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}

.error-close {
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.error-close:hover {
  background: #feb2b2;
}

.error-close svg {
  width: 16px;
  height: 16px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .traffic-reports {
    padding: 15px;
  }
  
  .filters-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-inputs {
    flex-wrap: wrap;
  }
  
  .tabs-nav {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    flex: none;
    min-width: calc(50% - 1px);
  }
  
  .report-section {
    padding: 20px;
  }
  
  .reports-table {
    font-size: 13px;
  }
  
  .reports-table th,
  .reports-table td {
    padding: 8px 12px;
  }
}
</style>