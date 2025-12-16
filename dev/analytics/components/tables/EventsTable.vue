<template>
  <div class="events-table-container">
    <!-- Заголовок таблицы -->
    <div class="table-header">
      <h3>
        <i class="fas fa-table"></i>
        События ({{ events.length }})
      </h3>
    </div>

    <!-- Таблица событий -->
    <div class="table-wrapper">
      <table class="events-table">
        <thead>
          <tr>
            <th>Дата и время</th>
            <th>Тип события</th>
            <th>Пользователь</th>
            <th>Параметры</th>
            <th>Детали</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="events.length === 0">
            <td colspan="5" class="empty-state">
              <i class="fas fa-inbox"></i>
              <p>Нет событий за выбранный период</p>
            </td>
          </tr>
          <template v-for="(event, index) in events" :key="index">
            <tr class="event-row">
              <td class="date-cell">
                <div class="date-time">
                  <span class="date">{{ formatDate(event.dt) }}</span>
                  <span class="time">{{ formatTime(event.ts) }}</span>
                </div>
              </td>
              <td class="event-type-cell">
                <div class="event-type">
                  <i :class="getEventIcon(event.urlPath)"></i>
                  <span>{{ getEventName(event.urlPath) }}</span>
                </div>
              </td>
              <td class="user-cell">
                <div v-if="event.user_email || event.user_first_name" class="user-info">
                  <div class="user-name">
                    {{ event.user_first_name || 'Без имени' }}
                    {{ event.user_last_name || '' }}
                  </div>
                  <div v-if="event.user_email" class="user-email">
                    {{ event.user_email }}
                  </div>
                </div>
                <div v-else class="user-info">
                  <span class="no-user">—</span>
                </div>
              </td>
              <td class="params-cell">
                <div class="params">
                  <span v-if="event.action_param1" class="param">
                    <span class="param-label">P1:</span> {{ truncate(event.action_param1, 20) }}
                  </span>
                  <span v-if="event.action_param2" class="param">
                    <span class="param-label">P2:</span> {{ truncate(event.action_param2, 20) }}
                  </span>
                  <span v-if="event.action_param1_int" class="param">
                    <span class="param-label">Int:</span> {{ event.action_param1_int }}
                  </span>
                  <span v-if="event.action_param1_float" class="param">
                    <span class="param-label">Float:</span> {{ event.action_param1_float }}
                  </span>
                </div>
              </td>
              <td class="details-cell">
                <button 
                  @click="toggleDetails(index)" 
                  class="details-btn"
                  :class="{ active: expandedRows.includes(index) }"
                >
                  <i class="fas" :class="expandedRows.includes(index) ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>
              </td>
            </tr>
            <!-- Развернутая строка с деталями сразу после основной -->
            <tr v-show="expandedRows.includes(index)" class="details-row">
              <td colspan="5">
                <div class="details-content">
                  <!-- URL события -->
                  <div class="detail-section">
                    <h4><i class="fas fa-link"></i> Тип события</h4>
                    <code>{{ event.urlPath }}</code>
                  </div>

                  <!-- Название события -->
                  <div v-if="hasValue(event.title)" class="detail-section">
                    <h4><i class="fas fa-tag"></i> Название</h4>
                    <p>{{ event.title }}</p>
                  </div>

                  <!-- Данные пользователя -->
                  <div v-if="hasUserData(event)" class="detail-section">
                    <h4><i class="fas fa-user"></i> Данные пользователя</h4>
                    <div class="fields-grid">
                      <div v-if="hasValue(event.user_id)" class="field-item">
                        <span class="field-key">ID пользователя:</span>
                        <span class="field-value">{{ event.user_id }}</span>
                      </div>
                      <div v-if="hasValue(event.user_email)" class="field-item">
                        <span class="field-key">Email:</span>
                        <span class="field-value">{{ event.user_email }}</span>
                      </div>
                      <div v-if="hasValue(event.user_first_name)" class="field-item">
                        <span class="field-key">Имя:</span>
                        <span class="field-value">{{ event.user_first_name }}</span>
                      </div>
                      <div v-if="hasValue(event.user_last_name)" class="field-item">
                        <span class="field-key">Фамилия:</span>
                        <span class="field-value">{{ event.user_last_name }}</span>
                      </div>
                      <div v-if="hasValue(event.user_phone)" class="field-item">
                        <span class="field-key">Телефон:</span>
                        <span class="field-value">{{ event.user_phone }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Параметры события -->
                  <div v-if="hasEventParams(event)" class="detail-section">
                    <h4><i class="fas fa-sliders-h"></i> Параметры события</h4>
                    <div class="fields-grid">
                      <div v-if="hasValue(event.action_param1)" class="field-item">
                        <span class="field-key">Параметр 1:</span>
                        <span class="field-value">{{ event.action_param1 }}</span>
                      </div>
                      <div v-if="hasValue(event.action_param2)" class="field-item">
                        <span class="field-key">Параметр 2:</span>
                        <span class="field-value">{{ event.action_param2 }}</span>
                      </div>
                      <div v-if="hasValue(event.action_param3)" class="field-item">
                        <span class="field-key">Параметр 3:</span>
                        <span class="field-value">{{ event.action_param3 }}</span>
                      </div>
                      <div v-if="hasValue(event.action_param1_int)" class="field-item">
                        <span class="field-key">Число (int):</span>
                        <span class="field-value">{{ event.action_param1_int }}</span>
                      </div>
                      <div v-if="hasValue(event.action_param2_int)" class="field-item">
                        <span class="field-key">Число 2 (int):</span>
                        <span class="field-value">{{ event.action_param2_int }}</span>
                      </div>
                      <div v-if="hasValue(event.action_param1_float)" class="field-item">
                        <span class="field-key">Число (float):</span>
                        <span class="field-value">{{ event.action_param1_float }}</span>
                      </div>
                      <div v-if="hasValue(event.action_param2_float)" class="field-item">
                        <span class="field-key">Число 2 (float):</span>
                        <span class="field-value">{{ event.action_param2_float }}</span>
                      </div>
                      <div v-if="hasValue(event.action_param1_arrstr)" class="field-item">
                        <span class="field-key">Массив строк:</span>
                        <span class="field-value">{{ formatArray(event.action_param1_arrstr) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- JSON параметры -->
                  <div v-if="hasValue(event.action_params)" class="detail-section">
                    <h4><i class="fas fa-code"></i> Дополнительные параметры (JSON)</h4>
                    <pre>{{ formatJSON(event.action_params) }}</pre>
                  </div>

                  <!-- Технические данные -->
                  <div class="detail-section">
                    <h4><i class="fas fa-clock"></i> Технические данные</h4>
                    <div class="fields-grid">
                      <div class="field-item">
                        <span class="field-key">Дата:</span>
                        <span class="field-value">{{ event.dt }}</span>
                      </div>
                      <div class="field-item">
                        <span class="field-key">Время (UTC):</span>
                        <span class="field-value">{{ event.ts }}</span>
                      </div>
                      <div v-if="hasValue(event.gc_visit_id)" class="field-item">
                        <span class="field-key">GC Visit ID:</span>
                        <span class="field-value">{{ event.gc_visit_id }}</span>
                      </div>
                      <div v-if="hasValue(event.gc_visitor_id)" class="field-item">
                        <span class="field-key">GC Visitor ID:</span>
                        <span class="field-value">{{ event.gc_visitor_id }}</span>
                      </div>
                      <div v-if="hasValue(event.gc_session_id)" class="field-item">
                        <span class="field-key">GC Session ID:</span>
                        <span class="field-value">{{ event.gc_session_id }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

// State
const expandedRows = ref([])

// Methods
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

function formatTime(tsStr) {
  if (!tsStr) return '—'
  const date = new Date(tsStr)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function getEventName(urlPath) {
  if (!urlPath) return 'Unknown'
  
  // Извлекаем название события из URL
  const parts = urlPath.split('/')
  return parts[parts.length - 1] || urlPath
}

function getEventIcon(urlPath) {
  if (!urlPath) return 'fas fa-circle'
  
  const path = urlPath.toLowerCase()
  
  if (path.includes('deal') || path.includes('order')) return 'fas fa-shopping-cart'
  if (path.includes('user') || path.includes('registration')) return 'fas fa-user'
  if (path.includes('payment')) return 'fas fa-credit-card'
  if (path.includes('group')) return 'fas fa-users'
  if (path.includes('message') || path.includes('email')) return 'fas fa-envelope'
  if (path.includes('telegram')) return 'fab fa-telegram'
  if (path.includes('vk')) return 'fab fa-vk'
  
  return 'fas fa-circle'
}

function truncate(str, maxLength) {
  if (!str) return '—'
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

function toggleDetails(index) {
  const pos = expandedRows.value.indexOf(index)
  if (pos >= 0) {
    expandedRows.value.splice(pos, 1)
  } else {
    expandedRows.value.push(index)
  }
}

function formatJSON(jsonStr) {
  try {
    const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return jsonStr
  }
}

function formatArray(arr) {
  if (!arr) return '—'
  if (Array.isArray(arr)) return arr.join(', ')
  return String(arr)
}

function hasValue(value) {
  // Проверяем что значение существует и не пустое
  if (value === null || value === undefined) return false
  if (value === '') return false
  if (value === '—') return false
  if (typeof value === 'number' && value === 0) return true // 0 это валидное значение
  return true
}

function hasUserData(event) {
  // Проверяем есть ли хотя бы одно поле пользователя
  return hasValue(event.user_id) || 
         hasValue(event.user_email) || 
         hasValue(event.user_first_name) || 
         hasValue(event.user_last_name) || 
         hasValue(event.user_phone)
}

function hasEventParams(event) {
  // Проверяем есть ли хотя бы один параметр события
  return hasValue(event.action_param1) || 
         hasValue(event.action_param2) || 
         hasValue(event.action_param3) || 
         hasValue(event.action_param1_int) || 
         hasValue(event.action_param2_int) || 
         hasValue(event.action_param1_float) || 
         hasValue(event.action_param2_float) || 
         hasValue(event.action_param1_arrstr)
}
</script>

<style scoped>
.events-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.table-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
}

.table-header h3 i {
  margin-right: 0.5rem;
  color: #667eea;
}

.table-wrapper {
  overflow-x: auto;
}

.events-table {
  width: 100%;
  border-collapse: collapse;
}

.events-table thead {
  background: #f7fafc;
}

.events-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.events-table tbody tr.event-row {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.events-table tbody tr.event-row:hover {
  background: #f7fafc;
}

.events-table td {
  padding: 1rem;
  font-size: 0.875rem;
  color: #2d3748;
  vertical-align: top;
}

.date-cell .date-time {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-cell .date {
  font-weight: 500;
}

.date-cell .time {
  font-size: 0.8rem;
  color: #718096;
}

.event-type-cell .event-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-type-cell .event-type i {
  color: #667eea;
  width: 16px;
}

.user-cell .user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-cell .user-name {
  font-weight: 500;
}

.user-cell .user-email {
  font-size: 0.8rem;
  color: #718096;
}

.user-cell .no-user {
  color: #cbd5e0;
}

.params-cell .params {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.params-cell .param {
  font-size: 0.8rem;
}

.params-cell .param-label {
  color: #718096;
  font-weight: 500;
}

.details-cell {
  text-align: center;
  width: 50px;
}

.details-btn {
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  color: #718096;
  transition: all 0.2s;
}

.details-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
  color: #4a5568;
}

.details-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.details-row td {
  background: #f7fafc;
  padding: 0;
}

.details-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4a5568;
}

.detail-section h4 i {
  margin-right: 0.5rem;
  color: #667eea;
}

.detail-section code,
.detail-section pre {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.5rem;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  color: #2d3748;
  overflow-x: auto;
}

.detail-section p {
  margin: 0;
  color: #2d3748;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.field-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.field-key {
  font-weight: 500;
  color: #718096;
}

.field-value {
  color: #2d3748;
  word-break: break-all;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem !important;
  color: #cbd5e0;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
  color: #718096;
}

@media (max-width: 768px) {
  .events-table th,
  .events-table td {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }
}
</style>

