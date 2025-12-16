<template>
  <div class="traffic-reports">
    <div class="header">
      <div class="header-top">
        <h1 class="title">Отчеты по трафику сайта</h1>
        <div class="header-buttons">
          <button @click="openCloudSettings" class="cloud-btn" title="Облако">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Облако</span>
          </button>
          <button @click="openSettings" class="settings-btn" title="Настройки">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.4 15C19.2669 15 15 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2549 9.77251 19.9887C9.5799 19.7225 9.31074 19.5265 9 19.43C8.69838 19.2969 8.36381 19.2572 8.03941 19.316C7.71502 19.3748 7.41568 19.5295 7.18 19.76L7.12 19.82C6.93425 20.006 6.71368 20.1535 6.47088 20.2541C6.22808 20.3548 5.96783 20.4066 5.705 20.4066C5.44217 20.4066 5.18192 20.3548 4.93912 20.2541C4.69632 20.1535 4.47575 20.006 4.29 19.82C4.10405 19.6343 3.95653 19.4137 3.85588 19.1709C3.75523 18.9281 3.70343 18.6678 3.70343 18.405C3.70343 18.1422 3.75523 17.8819 3.85588 17.6391C3.95653 17.3963 4.10405 17.1757 4.29 16.99L4.35 16.93C4.58054 16.6943 4.73519 16.395 4.794 16.0706C4.85282 15.7462 4.81312 15.4116 4.68 15.11C4.55324 14.8142 4.34276 14.562 4.07447 14.3843C3.80618 14.2066 3.49179 14.1113 3.17 14.11H3C2.46957 14.11 1.96086 13.8993 1.58579 13.5242C1.21071 13.1491 1 12.6404 1 12.11C1 11.5796 1.21071 11.0709 1.58579 10.6958C1.96086 10.3207 2.46957 10.11 3 10.11H3.09C3.42099 10.1023 3.74514 9.99512 4.01133 9.80251C4.27753 9.6099 4.47354 9.34074 4.57 9.03C4.70312 8.72838 4.74282 8.39381 4.684 8.06941C4.62519 7.74502 4.47054 7.44568 4.24 7.21L4.18 7.15C3.99405 6.96425 3.84653 6.74368 3.74588 6.50088C3.64523 6.25808 3.59343 5.99783 3.59343 5.735C3.59343 5.47217 3.64523 5.21192 3.74588 4.96912C3.84653 4.72632 3.99405 4.50575 4.18 4.32C4.36575 4.13405 4.58632 3.98653 4.82912 3.88588C5.07192 3.78523 5.33217 3.73343 5.595 3.73343C5.85783 3.73343 6.11808 3.78523 6.36088 3.88588C6.60368 3.98653 6.82425 4.13405 7.01 4.32L7.07 4.38C7.30568 4.61054 7.60502 4.76519 7.92941 4.824C8.25381 4.88282 8.58838 4.84312 8.89 4.71H8.91C9.20583 4.58324 9.45798 4.37276 9.63568 4.10447C9.81338 3.83618 9.90865 3.52179 9.91 3.2V3C9.91 2.46957 10.1207 1.96086 10.4958 1.58579C10.8709 1.21071 11.3796 1 11.91 1C12.4404 1 12.9491 1.21071 13.3242 1.58579C13.6993 1.96086 13.91 2.46957 13.91 3V3.09C13.9113 3.41179 14.0066 3.72618 14.1843 3.99447C14.362 4.26276 14.6142 4.47324 14.91 4.6C15.2116 4.73312 15.5462 4.77282 15.8706 4.714C16.195 4.65519 16.4943 4.50054 16.73 4.27L16.79 4.21C16.9757 4.02405 17.1963 3.87653 17.4391 3.77588C17.6819 3.67523 17.9422 3.62343 18.205 3.62343C18.4678 3.62343 18.7281 3.67523 18.9709 3.77588C19.2137 3.87653 19.4343 4.02405 19.62 4.21C19.806 4.39575 19.9535 4.61632 20.0541 4.85912C20.1548 5.10192 20.2066 5.36217 20.2066 5.625C20.2066 5.88783 20.1548 6.14808 20.0541 6.39088C19.9535 6.63368 19.806 6.85425 19.62 7.04L19.56 7.1C19.3295 7.33568 19.1748 7.63502 19.116 7.95941C19.0572 8.28381 19.0969 8.61838 19.23 8.92V8.94C19.3568 9.23583 19.5672 9.48798 19.8355 9.66568C20.1038 9.84338 20.4182 9.93865 20.74 9.94H20.93C21.4604 9.94 21.9691 10.1507 22.3442 10.5258C22.7193 10.9009 22.93 11.4096 22.93 11.94C22.93 12.4704 22.7193 12.9791 22.3442 13.3542C21.9691 13.7293 21.4604 13.94 20.93 13.94H20.84C20.5182 13.9413 20.2038 14.0366 19.9355 14.2143C19.6672 14.392 19.4568 14.6442 19.33 14.94V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
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

        <div v-if="activeTab === 'orders'" class="filter-group">
          <label>Статус заказа:</label>
          <div class="status-multiselect">
            <button 
              type="button" 
              class="status-select" 
              @click.stop="statusDropdownOpen = !statusDropdownOpen"
              :class="{ 'dropdown-open': statusDropdownOpen }"
            >
              <span v-if="selectedStatusesText">{{ selectedStatusesText }}</span>
              <span v-else>Выберите статусы</span>
              <svg class="dropdown-arrow" :class="{ 'rotated': statusDropdownOpen }" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            
            <div v-if="statusDropdownOpen" class="status-dropdown" @click.stop>
              <div class="status-dropdown-header">
                <button type="button" @click="selectAllStatuses" class="select-all-btn">Выбрать все</button>
                <button type="button" @click="clearAllStatuses" class="clear-all-btn">Очистить</button>
              </div>
              <div class="status-options">
                <label v-for="status in statusOptions" :key="status.value" class="status-option">
                  <input 
                    type="checkbox" 
                    :value="status.value" 
                    v-model="filters.orderStatuses"
                    @change="onFiltersChange"
                  />
                  <span class="status-checkmark"></span>
                  <span class="status-label">{{ status.label }}</span>
                </label>
              </div>
            </div>
          </div>
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
        
        <!-- Пользователи -->
        <div v-if="activeTab === 'users' && !loading" class="report-section">
          <h3>Регистрация пользователей</h3>
          
          <!-- Users Metrics Cards -->
          <div class="users-metrics-row">
            <div class="metric-card metric-users-total">
              <div class="metric-label">Всего пользователей</div>
              <div class="metric-value">{{ totalUsers }}</div>
            </div>
            
            <div class="metric-card metric-telegram-users">
              <div class="metric-label">Подключен Telegram</div>
              <div class="metric-value">{{ telegramConnectedUsers }}</div>
              <div class="metric-percent">{{ telegramConnectedPercent }}%</div>
            </div>
            
            <div class="metric-card metric-telegram-disconnected">
              <div class="metric-label">Отключен Telegram</div>
              <div class="metric-value">{{ telegramDisconnectedUsers }}</div>
              <div class="metric-percent">{{ telegramDisconnectedPercent }}%</div>
            </div>
            
            <div class="metric-card metric-telegram-active">
              <div class="metric-label">Активен Telegram</div>
              <div class="metric-value">{{ activeTelegramUsers }}</div>
              <div class="metric-percent">{{ activeTelegramPercent }}%</div>
            </div>
            
            <div class="metric-card metric-group-added">
              <div class="metric-label">В группе<br>CHTM</div>
              <div class="metric-value">{{ groupAddedUsers }}</div>
              <div class="metric-percent">{{ groupAddedPercent }}%</div>
            </div>
          </div>
          
          <!-- Users Registration Chart -->
          <div v-if="usersData.length > 0" class="chart-container users-chart">
            <div class="chart-title">Регистрация пользователей по дням</div>
            <div class="chart-wrapper">
              <canvas ref="usersChartCanvas" class="chart"></canvas>
            </div>
          </div>
          
          <div v-else-if="!loading" class="empty-chart-state">
            <div class="empty-chart-content">
              <svg class="empty-chart-icon" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <p>Нет данных по регистрациям пользователей для отображения графика</p>
            </div>
          </div>
          
          <!-- Channel Subscribers Info -->
          <div class="channel-subscribers-info">
            <h4>Подписчики канала</h4>
            <div class="subscribers-count">
              <span class="count-value">{{ channelSubscribers }}</span>
              <span class="count-label">подписаны на канал ({{ channelSubscribersPercent }}% от общего количества)</span>
            </div>
          </div>
        </div>
        
        <!-- Заказы -->
        <div v-if="activeTab === 'orders' && !loading" class="report-section">
          <!-- remaining template unchanged -->
          <h3>Заказы</h3>
          
          <!-- Metrics Cards -->
          <div class="metrics-wrapper">
            <div class="metrics-row-linear">
              <div class="metric-card metric-orders">
                <div class="metric-label">Количество заказов</div>
                <div class="metric-value">{{ ordersSummary.total_orders || 0 }}</div>
              </div>
              <div class="metric-card metric-order-amount">
                <div class="metric-label">Сумма заказов</div>
                <div class="metric-value">{{ formatAmount(ordersSummary.total_order_amount || 0) }}</div>
              </div>
              <div class="metric-card metric-conversion metric-conversion-small">
                <div class="conversion-arrow">→</div>
                <div class="metric-value conversion-value">{{ formatConversion(ordersSummary.total_orders, ordersSummary.total_payments) }}</div>
              </div>
              <div class="metric-card metric-payments">
                <div class="metric-label">Количество оплат</div>
                <div class="metric-value">{{ ordersSummary.total_payments || 0 }}</div>
              </div>
              <div class="metric-card metric-payment-amount">
                <div class="metric-label">Сумма оплат</div>
                <div class="metric-value">{{ formatAmount(ordersSummary.total_payment_amount || 0) }}</div>
              </div>
              <div class="metric-card metric-avg-check">
                <div class="metric-label">Средний чек</div>
                <div class="metric-value">{{ formatAmount(ordersSummary.avg_payment_amount || 0) }}</div>
              </div>
            </div>
          </div>
          
          <div v-if="ordersHierarchy.length === 0" class="empty-state">
            <p>Нет данных о заказах за выбранный период</p>
          </div>
          <div v-else class="table-wrapper">
            <table class="reports-table hierarchical-table">
              <thead>
                <tr>
                  <th>Период</th>
                  <th>Количество заказов</th>
                  <th>Сумма заказов</th>
                  <th>Сумма оплат</th>
                  <th>Средняя сумма оплаты</th>
                </tr>
              </thead>
              <tbody>
                <!-- Years -->
                <template v-for="yearGroup in ordersHierarchy" :key="'year-' + yearGroup.year">
                  <tr class="year-row" @click="toggleYear(yearGroup.year)">
                    <td class="hierarchy-cell year-cell">
                      <span class="hierarchy-toggle">
                        <svg 
                          :class="['toggle-icon', { expanded: expandedYears.includes(yearGroup.year) }]"
                          viewBox="0 0 24 24" 
                          fill="none"
                        >
                          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2"/>
                        </svg>
                      </span>
                      <span class="hierarchy-label">{{ yearGroup.year }} год</span>
                    </td>
                    <td class="number-cell">{{ yearGroup.totalOrders }}</td>
                    <td class="number-cell">{{ formatAmount(yearGroup.totalAmount) }}</td>
                    <td class="number-cell">{{ formatAmount(yearGroup.totalPaymentAmount) }}</td>
                    <td class="number-cell">{{ formatAmount(yearGroup.avgPaymentAmount) }}</td>
                  </tr>
                  
                  <!-- Months -->
                  <template v-if="expandedYears.includes(yearGroup.year)">
                    <template v-for="monthGroup in yearGroup.months" :key="'month-' + yearGroup.year + '-' + monthGroup.month">
                      <tr class="month-row" @click="toggleMonth(yearGroup.year, monthGroup.month)">
                        <td class="hierarchy-cell month-cell">
                          <span class="hierarchy-toggle">
                            <svg 
                              :class="['toggle-icon', { expanded: expandedMonths.includes(`${yearGroup.year}-${monthGroup.month}`) }]"
                              viewBox="0 0 24 24" 
                              fill="none"
                            >
                              <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2"/>
                            </svg>
                          </span>
                          <span class="hierarchy-label">{{ getMonthName(monthGroup.month) }} {{ yearGroup.year }}</span>
                        </td>
                        <td class="number-cell">{{ monthGroup.totalOrders }}</td>
                        <td class="number-cell">{{ formatAmount(monthGroup.totalAmount) }}</td>
                        <td class="number-cell">{{ formatAmount(monthGroup.totalPaymentAmount) }}</td>
                        <td class="number-cell">{{ formatAmount(monthGroup.avgPaymentAmount) }}</td>
                      </tr>
                      
                      <!-- Days -->
                      <template v-if="expandedMonths.includes(`${yearGroup.year}-${monthGroup.month}`)">
                        <tr v-for="dayGroup in monthGroup.days" :key="'day-' + yearGroup.year + '-' + monthGroup.month + '-' + dayGroup.day" class="day-row">
                          <td class="hierarchy-cell day-cell">
                            <span class="hierarchy-label">{{ dayGroup.day }} {{ getMonthName(monthGroup.month) }} {{ yearGroup.year }}</span>
                          </td>
                          <td class="number-cell">{{ dayGroup.orders_count }}</td>
                          <td class="number-cell">{{ formatAmount(dayGroup.total_amount || 0) }}</td>
                          <td class="number-cell">{{ formatAmount(dayGroup.total_payment_amount || 0) }}</td>
                          <td class="number-cell">{{ formatAmount(dayGroup.avg_payment_amount || 0) }}</td>
                        </tr>
                      </template>
                    </template>
                  </template>
                </template>
              </tbody>
            </table>
          </div>
          
          <!-- Payments Chart -->
          <div v-if="paymentsData.length > 0" class="chart-container payments-chart">
            <div class="chart-title">Сумма оплат по дням</div>
            <div class="chart-wrapper">
              <canvas ref="paymentsChartCanvas" class="chart"></canvas>
            </div>
          </div>
          
          <div v-else-if="!loading" class="empty-chart-state">
            <div class="empty-chart-content">
              <svg class="empty-chart-icon" viewBox="0 0 24 24" fill="none">
                <path d="M3 3v18h18" stroke="currentColor" stroke-width="2"/>
                <path d="M7 12l4-4 4 4 4-4" stroke="currentColor" stroke-width="2"/>
              </svg>
              <p>Нет данных по оплатам для отображения графика</p>
            </div>
          </div>
          
          <!-- Orders Details Table (collapsed by default) -->
          <div class="order-details-section">
            <button @click="toggleOrderDetails" class="order-details-toggle-btn">
              <span class="toggle-text">{{ showOrderDetails ? 'Скрыть' : 'Показать' }} детали заказов</span>
              <svg 
                :class="['toggle-arrow', { 'rotated': showOrderDetails }]"
                viewBox="0 0 24 24" 
                fill="none"
              >
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            
            <div v-if="showOrderDetails" class="order-details-content">
              <div v-if="loadingOrderDetails" class="loading-details">Загрузка деталей...</div>
              
              <div v-else-if="orderDetails.length > 0" class="table-wrapper">
                <table class="reports-table order-details-table">
                  <thead>
                    <tr>
                      <th>ID заказа</th>
                      <th>Сумма заказа</th>
                      <th>Сумма оплаты</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in orderDetails" :key="order.order_id">
                      <td class="order-id-cell">{{ order.order_id }}</td>
                      <td class="amount-cell">{{ formatAmount(order.order_amount || 0) }}</td>
                      <td class="amount-cell">{{ formatAmount(order.total_paid || 0) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div v-else class="empty-state">
                <p>Нет данных о деталях заказов</p>
              </div>
            </div>
          </div>
          
        </div>
        
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
  apiUsersRegistrationRoute,
  apiPopularPagesRoute,
  apiEntryPagesRoute,
  apiOrdersRoute,
  apiOrdersSummaryRoute,
  apiPaymentsByDateRoute,
  apiTotalUsersRoute,
  apiTelegramConnectedUsersRoute,
  apiTelegramDisconnectedUsersRoute,
  apiGroupAddedUsersRoute,
  apiChannelSubscribersRoute,
  apiOrderDetailsRoute
} from '../api/traffic'
import { indexPageRoute } from '../index'
import { cloudSettingsPageRoute } from '../cloudSettings'

// Реактивные данные
const activeTab = ref('users')
const loading = ref(false)
const chartCanvas = ref(null)
const usersChartCanvas = ref(null)
const paymentsChartCanvas = ref(null)
let chartInstance = null
let usersChartInstance = null
let paymentsChartInstance = null
const errorMessage = ref('')

// Фильтры
const filters = reactive({
  dateFrom: getTodayDate(),
  dateTo: getTodayDate(),
  url: '',
  orderStatuses: ['new', 'in_work', 'cancelled', 'payed', 'not_confirmed', 'payment_waiting', 'part_payed', 'waiting_for_return', 'pending', 'false']
})

// Данные отчетов
const recentVisits = ref([])
const dailyStats = ref([])
const popularPages = ref([])
const landingPages = ref([])
const ordersData = ref([])
const ordersHierarchy = ref([])
const orderDetails = ref([])
const ordersSummary = ref({})
const paymentsData = ref([])
const statusDropdownOpen = ref(false)
const usersData = ref([])
const expandedYears = ref([])
const totalUsers = ref(0)
const telegramConnectedUsers = ref(0)
const telegramDisconnectedUsers = ref(0)
const groupAddedUsers = ref(0)
const channelSubscribers = ref(0)
const expandedMonths = ref([])
const showOrderDetails = ref(false)
const loadingOrderDetails = ref(false)

// Computed property for active telegram users
const activeTelegramUsers = computed(() => {
  return telegramConnectedUsers.value - telegramDisconnectedUsers.value
})

// Computed properties for percentages
const telegramConnectedPercent = computed(() => {
  if (totalUsers.value === 0) return 0
  return Math.round((telegramConnectedUsers.value / totalUsers.value) * 100)
})

const telegramDisconnectedPercent = computed(() => {
  if (totalUsers.value === 0) return 0
  return Math.round((telegramDisconnectedUsers.value / totalUsers.value) * 100)
})

const activeTelegramPercent = computed(() => {
  if (totalUsers.value === 0) return 0
  return Math.round((activeTelegramUsers.value / totalUsers.value) * 100)
})

const groupAddedPercent = computed(() => {
  if (totalUsers.value === 0) return 0
  return Math.round((groupAddedUsers.value / totalUsers.value) * 100)
})

const channelSubscribersPercent = computed(() => {
  if (totalUsers.value === 0) return 0
  return Math.round((channelSubscribers.value / totalUsers.value) * 100)
})

// Chart settings for toggling lines
const chartSettings = reactive({
  showVisits: true,
  showUsers: true,
  showSessions: true
})

// Конфигурация табов
const tabs = [
  { key: 'users', title: 'Пользователи' },
  { key: 'orders', title: 'Заказы' },
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

function openCloudSettings() {
  try {
    window.location.href = cloudSettingsPageRoute.url()
  }
  catch(e) {
    console.error('Error navigating to cloud settings:', e)
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

// Payments Chart configuration
const getPaymentsChartConfig = computed(() => {
  if (!paymentsData.value.length) return null
  
  const sortedData = [...paymentsData.value].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date))
  
  return {
    type: 'line',
    data: {
      labels: sortedData.map(item => formatChartDate(item.payment_date)),
      datasets: [{
        label: 'Сумма оплат',
        data: sortedData.map(item => item.total_payment_amount || 0),
        borderColor: '#10b981', // Green color matching payment cards
        backgroundColor: '#10b981',
        tension: 0.4,
        fill: false,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 40
        }
      },
      plugins: {
        datalabels: {
          display: true,
          align: 'top',
          color: '#047857',
          font: { weight: 'bold', size: 12 },
          formatter: (value) => formatAmount(value)
        },
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#10b981',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Сумма оплат: ${formatAmount(context.parsed.y)}`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: true, color: '#e5f2ef' },
          ticks: { color: '#10b981' },
          title: { display: true, text: 'Дата', color: '#10b981', font: { weight: 'bold' } }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: { display: true, color: '#e5f2ef' },
          ticks: { color: '#10b981', callback: function(value) { return formatAmount(value) } },
          title: { display: true, text: 'Сумма оплат', color: '#10b981', font: { weight: 'bold' } }
        }
      }
    }
  }
})

// Users Registration Chart configuration
const getUsersChartConfig = computed(() => {
  if (!usersData.value.length) return null
  
  const sortedData = [...usersData.value].sort((a, b) => new Date(a.registration_date) - new Date(b.registration_date))
  
  return {
    type: 'line',
    data: {
      labels: sortedData.map(item => formatChartDate(item.registration_date)),
      datasets: [{
        label: 'Количество регистраций',
        data: sortedData.map(item => item.registrations_count || 0),
        borderColor: '#7c3aed', // Pastel purple-blue
        backgroundColor: '#7c3aed',
        tension: 0.4,
        fill: false,
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 40
        }
      },
      plugins: {
        datalabels: {
          display: true,
          align: 'top',
          color: '#5b21b6',
          font: { weight: 'bold', size: 12 },
          formatter: (value) => value
        },
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(124, 58, 237, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#7c3aed',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `Регистраций: ${context.parsed.y}`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: { display: true, color: '#f3f0ff' },
          ticks: { color: '#7c3aed' },
          title: { display: true, text: 'Дата', color: '#7c3aed', font: { weight: 'bold' } }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: { display: true, color: '#f3f0ff' },
          ticks: { color: '#7c3aed' },
          title: { display: true, text: 'Количество пользователей', color: '#7c3aed', font: { weight: 'bold' } }
        }
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

// Create payments chart
async function createPaymentsChart() {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded')
    return
  }
  
  if (!paymentsChartCanvas.value || !paymentsData.value.length) return
  
  const config = getPaymentsChartConfig.value
  if (!config) return
  
  // Destroy existing chart
  if (paymentsChartInstance) {
    paymentsChartInstance.destroy()
    paymentsChartInstance = null
  }
  
  // Create new chart
  try {
    paymentsChartInstance = new Chart(paymentsChartCanvas.value, config)
    console.log('Payments chart created successfully')
  } catch (error) {
    console.error('Error creating payments chart:', error)
  }
}

function updatePaymentsChart() {
  createPaymentsChart()
}

// Create users chart
async function createUsersChart() {
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded')
    return
  }
  
  if (!usersChartCanvas.value || !usersData.value.length) return
  
  const config = getUsersChartConfig.value
  if (!config) return
  
  // Destroy existing chart
  if (usersChartInstance) {
    usersChartInstance.destroy()
    usersChartInstance = null
  }
  
  // Create new chart
  try {
    usersChartInstance = new Chart(usersChartCanvas.value, config)
    console.log('Users chart created successfully')
  } catch (error) {
    console.error('Error creating users chart:', error)
  }
}

function updateUsersChart() {
  createUsersChart()
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

async function loadOrdersSummary() {
  try {
    const response = await apiOrdersSummaryRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      statuses: filters.orderStatuses.join(',')
    }).run(ctx)
    
    if (response.success && response.rows && response.rows.length > 0) {
      ordersSummary.value = response.rows[0]
    }
  } catch (error) {
    console.error('Ошибка загрузки суммарных данных заказов:', error)
  }
}

async function loadOrderDetails() {
  try {
    loadingOrderDetails.value = true
    const response = await apiOrderDetailsRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      statuses: filters.orderStatuses.join(',')
    }).run(ctx)
    
    if (response.success && response.rows) {
      orderDetails.value = response.rows
    } else {
      orderDetails.value = []
    }
  } catch (error) {
    console.error('Ошибка загрузки деталей заказов:', error)
    showError(error.message || 'Не удалось загрузить детали заказов')
    orderDetails.value = []
  } finally {
    loadingOrderDetails.value = false
  }
}

async function toggleOrderDetails() {
  showOrderDetails.value = !showOrderDetails.value
  
  // Загружаем данные только при первом открытии или если данных нет
  if (showOrderDetails.value && orderDetails.value.length === 0) {
    await loadOrderDetails()
  }
}

async function loadOrders() {
  try {
    loading.value = true
    clearError()
    const response = await apiOrdersRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      statuses: filters.orderStatuses.join(',')
    }).run(ctx)
    
    if (!response.success) {
      throw new Error(response.error || 'Неизвестная ошибка')
    }
    
    ordersData.value = response?.rows || []
    buildOrdersHierarchy()
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error)
    showError(error.message || 'Не удалось загрузить заказы')
    ordersData.value = []
    ordersHierarchy.value = []
  } finally {
    loading.value = false
  }
  await loadOrdersSummary()
  // Не загружаем детали автоматически - только по требованию
}

async function loadUsersRegistration() {
  try {
    loading.value = true
    clearError()
    const response = await apiUsersRegistrationRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    }).run(ctx)
    
    if (!response.success) {
      throw new Error(response.error || 'Неизвестная ошибка')
    }
    
    const data = response
    usersData.value = data?.rows || []
  } catch (error) {
    console.error('Ошибка загрузки данных регистрации пользователей:', error)
    showError(error.message || 'Не удалось загрузить данные регистрации пользователей')
    usersData.value = []
  } finally {
    loading.value = false
  }
}

async function loadPaymentsByDate() {
  try {
    const response = await apiPaymentsByDateRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    }).run(ctx)
    
    if (response.success && response.rows) {
      paymentsData.value = response.rows
    }
  } catch (error) {
    console.error('Ошибка загрузки данных по оплатам по дням:', error)
  }
}

async function loadTotalUsers() {
  try {
    const response = await apiTotalUsersRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    }).run(ctx)
    
    if (response.success && response.rows && response.rows.length > 0) {
      totalUsers.value = response.rows[0].total_users || 0
    }
  } catch (error) {
    console.error('Ошибка загрузки общего количества пользователей:', error)
    totalUsers.value = 0
  }
}

async function loadTelegramConnectedUsers() {
  try {
    const response = await apiTelegramConnectedUsersRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    }).run(ctx)
    
    if (response.success && response.rows && response.rows.length > 0) {
      telegramConnectedUsers.value = response.rows[0].telegram_connected_users || 0
    }
  } catch (error) {
    console.error('Ошибка загрузки количества пользователей с подключенным Telegram:', error)
    telegramConnectedUsers.value = 0
  }
}

async function loadTelegramDisconnectedUsers() {
  try {
    const response = await apiTelegramDisconnectedUsersRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    }).run(ctx)
    
    if (response.success && response.rows && response.rows.length > 0) {
      telegramDisconnectedUsers.value = response.rows[0].telegram_disconnected_users || 0
    }
  } catch (error) {
    console.error('Ошибка загрузки количества пользователей с отключенным Telegram:', error)
    telegramDisconnectedUsers.value = 0
  }
}

async function loadGroupAddedUsers() {
  try {
    const response = await apiGroupAddedUsersRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    }).run(ctx)
    
    if (response.success && response.rows && response.rows.length > 0) {
      groupAddedUsers.value = response.rows[0].group_added_users || 0
    }
  } catch (error) {
    console.error('Ошибка загрузки количества пользователей в группе:', error)
    groupAddedUsers.value = 0
  }
}

async function loadChannelSubscribers() {
  try {
    const response = await apiChannelSubscribersRoute.query({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo
    }).run(ctx)
    
    if (response.success && response.rows && response.rows.length > 0) {
      channelSubscribers.value = response.rows[0].channel_subscribers || 0
    }
  } catch (error) {
    console.error('Ошибка загрузки количества подписчиков канала:', error)
    channelSubscribers.value = 0
  }
}

function buildOrdersHierarchy() {
  const hierarchy = {}
  
  ordersData.value.forEach(item => {
    const { year, month, day, orders_count, total_amount, total_payment_amount, avg_payment_amount } = item
    
    if (!hierarchy[year]) {
      hierarchy[year] = {
        year,
        months: {},
        totalOrders: 0,
        totalAmount: 0,
        totalPaymentAmount: 0,
        avgPaymentAmount: 0
      }
    }
    
    if (!hierarchy[year].months[month]) {
      hierarchy[year].months[month] = {
        month,
        days: [],
        totalOrders: 0,
        totalAmount: 0,
        totalPaymentAmount: 0,
        avgPaymentAmount: 0
      }
    }
    
    // Add day data
    hierarchy[year].months[month].days.push({
      day,
      orders_count,
      total_amount,
      total_payment_amount,
      avg_payment_amount
    })
    
    // Update month totals
    hierarchy[year].months[month].totalOrders += orders_count
    hierarchy[year].months[month].totalAmount += (total_amount || 0)
    hierarchy[year].months[month].totalPaymentAmount += (total_payment_amount || 0)
    
    // Update year totals
    hierarchy[year].totalOrders += orders_count
    hierarchy[year].totalAmount += (total_amount || 0)
    hierarchy[year].totalPaymentAmount += (total_payment_amount || 0)
  })
  
  // Convert to array and calculate averages
  ordersHierarchy.value = Object.values(hierarchy).map(yearGroup => ({
    ...yearGroup,
    months: Object.values(yearGroup.months).map(monthGroup => ({
      ...monthGroup,
      days: monthGroup.days.sort((a, b) => a.day - b.day), // Сортировка дней по возрастанию
      avgPaymentAmount: monthGroup.totalOrders > 0 ? monthGroup.totalPaymentAmount / monthGroup.totalOrders : 0
    })),
    avgPaymentAmount: yearGroup.totalOrders > 0 ? yearGroup.totalPaymentAmount / yearGroup.totalOrders : 0
  })).sort((a, b) => b.year - a.year)
  
  // Auto-expand all years by default
  expandedYears.value = ordersHierarchy.value.map(year => year.year)
  // Keep months collapsed by default
  expandedMonths.value = []
}

// Status options for orders
const statusOptions = [
  { value: 'new', label: 'Новый' },
  { value: 'in_work', label: 'В работе' },
  { value: 'cancelled', label: 'Отменён' },
  { value: 'payed', label: 'Завершен' },
  { value: 'not_confirmed', label: 'Не подтвержден' },
  { value: 'payment_waiting', label: 'Ожидаем оплаты' },
  { value: 'part_payed', label: 'Частично оплачен' },
  { value: 'waiting_for_return', label: 'Ожидаем возврата' },
  { value: 'pending', label: 'Отложен' },
  { value: 'false', label: 'Ложный' }
]

// Computed for selected statuses text
const selectedStatusesText = computed(() => {
  const count = filters.orderStatuses.length
  if (count === 0) return ''
  if (count === statusOptions.length) return 'Все статусы'
  if (count === 1) {
    const status = statusOptions.find(s => s.value === filters.orderStatuses[0])
    return status ? status.label : ''
  }
  return `Выбрано: ${count}`
})

// Status dropdown functions
function selectAllStatuses() {
  filters.orderStatuses = statusOptions.map(s => s.value)
  onFiltersChange()
}

function clearAllStatuses() {
  filters.orderStatuses = []
  onFiltersChange()
}

// Close dropdown when clicking outside
document.addEventListener('click', () => {
  statusDropdownOpen.value = false
})

function toggleYear(year) {
  const index = expandedYears.value.indexOf(year)
  if (index > -1) {
    expandedYears.value.splice(index, 1)
    // Collapse all months in this year
    expandedMonths.value = expandedMonths.value.filter(key => !key.startsWith(`${year}-`))
  } else {
    expandedYears.value.push(year)
  }
}

function toggleMonth(year, month) {
  const key = `${year}-${month}`
  const index = expandedMonths.value.indexOf(key)
  if (index > -1) {
    expandedMonths.value.splice(index, 1)
  } else {
    expandedMonths.value.push(key)
  }
}

function getMonthName(monthNumber) {
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]
  return months[monthNumber - 1] || monthNumber
}

function formatAmount(amount) {
  if (!amount || amount === 0) return '0 ₽'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function formatConversion(totalOrders, totalPayments) {
  if (!totalOrders || totalOrders === 0) return '0%'
  return Math.round((totalPayments / totalOrders) * 100) + '%'
}

function getStatusLabel(status) {
  const statusLabels = {
    '': 'Новый', // Empty status should be displayed as "Новый"
    'null': 'Новый',
    'undefined': 'Новый',
    'new': 'Новый',
    'in_work': 'В работе',
    'cancelled': 'Отменён',
    'payed': 'Завершен',
    'not_confirmed': 'Не подтвержден',
    'payment_waiting': 'Ожидаем оплаты',
    'part_payed': 'Частично оплачен',
    'waiting_for_return': 'Ожидаем возврата',
    'pending': 'Отложен',
    'false': 'Ложный',
  }
  
  // If status is empty, null, undefined, return "Новый"
  if (!status || status === '' || status === null || status === undefined) {
    return 'Новый'
  }
  return statusLabels[status] || status
}

// Загрузка данных в зависимости от активного таба
async function loadDataForActiveTab() {
  switch (activeTab.value) {
    case 'users':
      await loadUsersRegistration()
      await loadTotalUsers()
      await loadTelegramConnectedUsers()
      await loadTelegramDisconnectedUsers()
      await loadGroupAddedUsers()
      await loadChannelSubscribers()
      break
    case 'orders':
      await loadOrders()
      await loadPaymentsByDate()
      break
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
  // Если таблица деталей открыта - обновляем её данные
  if (showOrderDetails.value && activeTab.value === 'orders') {
    loadOrderDetails()
  }
}

// Форматирование данных
function formatDateTime(timestamp) {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) {
    return timestamp.toString() // Return original value if can't parse
  }
  return date.toLocaleString('ru-RU')
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
  // Сворачиваем таблицу деталей при смене таба
  showOrderDetails.value = false
  
  await loadDataForActiveTab()
  if (activeTab.value === 'users' && usersData.value.length > 0) {
    await nextTick()
    updateUsersChart()
  }
  if (activeTab.value === 'daily' && dailyStats.value.length > 0) {
    await nextTick()
    updateChart()
  }
  if (activeTab.value === 'orders') {
    await loadPaymentsByDate()
    if (paymentsData.value.length > 0) {
      await nextTick()
      updatePaymentsChart()
    }
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

// Watch for users data changes
watch(usersData, async () => {
  if (activeTab.value === 'users' && usersData.value.length > 0) {
    await nextTick()
    updateUsersChart()
  }
}, { deep: true })

// Watch for payments data changes
watch(paymentsData, async () => {
  if (activeTab.value === 'orders' && paymentsData.value.length > 0) {
    await nextTick()
    updatePaymentsChart()
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

.header-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cloud-btn,
.settings-btn {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.settings-btn {
  padding: 10px;
}

.cloud-btn:hover,
.settings-btn:hover {
  background: #edf2f7;
  color: #2d3748;
  border-color: #cbd5e0;
}

.cloud-btn {
  background: linear-gradient(135deg, #e6f3ff 0%, #cce7ff 100%);
  border-color: #b3d9ff;
  color: #2563eb;
}

.cloud-btn:hover {
  background: linear-gradient(135deg, #cce7ff 0%, #b3d9ff 100%);
  border-color: #66c2ff;
  color: #1d4ed8;
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

.status-select {
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  min-width: 180px;
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
  margin-top: 30px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #4a5568;
}

.empty-state p {
  margin: 10px 0;
}

.empty-hint {
  font-style: italic;
  opacity: 0.7;
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

/* Payments Chart Styles */
.payments-chart {
  border: 2px solid #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #e6fffa 100%);
}

.payments-chart .chart-title {
  color: #047857;
  font-weight: 700;
}

.empty-chart-state {
  background: white;
  border-radius: 8px;
  padding: 40px 20px;
  margin-bottom: 30px;
  text-align: center;
  border: 2px dashed #d1d5db;
}

.empty-chart-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-chart-icon {
  width: 48px;
  height: 48px;
  color: #9ca3af;
}

.empty-chart-content p {
  color: #6b7280;
  margin: 0;
  font-style: italic;
}

@media (max-width: 768px) {
  .traffic-reports {
    padding: 15px;
  }
  
  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .title {
    font-size: 24px;
    text-align: center;
  }
  
  .header-buttons {
    justify-content: center;
  }
  
  .cloud-btn span {
    display: none;
  }
  
  .cloud-btn,
  .settings-btn {
    flex: 1;
    justify-content: center;
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

/* Hierarchical Table Styles */

.hierarchical-table .hierarchy-cell {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hierarchy-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 2px;
}

.toggle-icon {
  width: 12px;
  height: 12px;
  transition: transform 0.2s;
  color: #4a5568;
}

.toggle-icon.expanded {
  transform: rotate(90deg);
}

.hierarchy-label {
  user-select: none;
}

.year-row {
  background: #f7fafc;
  font-weight: 600;
  cursor: pointer;
}

.year-row:hover {
  background: #edf2f7;
}

.year-cell {
  padding-left: 16px;
}

.month-row {
  background: #fafbfc;
  cursor: pointer;
}

.month-row:hover {
  background: #f1f3f4;
}

.month-cell {
  padding-left: 32px;
  font-weight: 500;
}

.day-row {
  background: #ffffff;
}

.day-row:hover {
  background: #f9fafb;
}

.day-cell {
  padding-left: 48px;
  font-weight: normal;
  color: #4a5568;
}

.day-cell .hierarchy-label {
  font-size: 14px;
}

.number-cell {
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.year-row .number-cell {
  font-weight: 600;
  color: #1a202c;
}

.month-row .number-cell {
  font-weight: 500;
  color: #2d3748;
}

.day-row .number-cell {
  font-weight: normal;
  color: #4a5568;
}

/* Prevent text selection on clickable rows */
.year-row, .month-row {
  user-select: none;
}

/* Status MultiSelect Styles */

.status-multiselect {
  position: relative;
  min-width: 200px;
}

.status-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.status-select:hover {
  border-color: #a0aec0;
}

.status-select.dropdown-open {
  border-color: #4299e1;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  color: #4a5568;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.status-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #4299e1;
  border-top: none;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.status-dropdown-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.select-all-btn, .clear-all-btn {
  background: none;
  border: none;
  color: #4299e1;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background 0.2s;
}

.select-all-btn:hover, .clear-all-btn:hover {
  background: #e2e8f0;
}

.status-options {
  padding: 4px 0;
}

.status-option {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 8px;
}

.status-option:hover {
  background: #f7fafc;
}

.status-option input[type="checkbox"] {
  display: none;
}

.status-checkmark {
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e0;
  border-radius: 3px;
  position: relative;
  transition: all 0.2s;
}

.status-option input[type="checkbox"]:checked + .status-checkmark {
  background: #4299e1;
  border-color: #4299e1;
}

.status-option input[type="checkbox"]:checked + .status-checkmark::after {
  content: '✓';
  position: absolute;
  top: -2px;
  left: 2px;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.status-label {
  font-size: 14px;
  color: #2d3748;
  user-select: none;
}

/* Metrics Wrapper Styles */

.metrics-wrapper {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 30px;
}

.metrics-row-linear {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.metric-conversion-small {
  width: 80px;
  height: 70px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.conversion-arrow {
  font-size: 20px;
  color: #f59e0b;
  font-weight: bold;
  margin-bottom: 8px;
}

.conversion-value {
  font-size: 18px !important;
  font-weight: 700;
  color: #f59e0b;
}

/* Metrics Cards Styles */

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  min-width: 180px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.metric-card:hover {
  border-color: #4299e1;
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.15);
}

.metric-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #1a202c;
  line-height: 1.2;
}

.metric-percent {
  font-size: 14px;
  font-weight: 500;
  color: #667eea;
  margin-top: 4px;
  font-style: italic;
  opacity: 0.8;
}

/* Metric Card Color Themes */

.metric-orders {
  background: linear-gradient(135deg, #e6f3ff 0%, #cce7ff 100%);
  border-color: #b3d9ff;
}

.metric-orders:hover {
  border-color: #66c2ff;
}

.metric-order-amount {
  background: linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%);
  border-color: #ffcc80;
}

.metric-order-amount:hover {
  border-color: #ffb74d;
}

.metric-payments {
  background: linear-gradient(135deg, #e6f7f0 0%, #ccf2e0 100%);
  border-color: #99e6cc;
}

.metric-payments:hover {
  border-color: #66d9b3;
}

.metric-payment-amount {
  background: linear-gradient(135deg, #d9f2e6 0%, #b3e6cc 100%);
  border-color: #80d9b3;
}

.metric-payment-amount:hover {
  border-color: #4dcc99;
}

.metric-avg-check {
  background: linear-gradient(135deg, #fff9e6 0%, #fff2cc 100%);
  border-color: #ffe699;
}

.metric-avg-check:hover {
  border-color: #ffd966;
}

.metric-conversion {
  background: linear-gradient(135deg, #fffce6 0%, #fff7cc 100%);
  border-color: #ffeb99;
}

.metric-conversion:hover {
  border-color: #ffe066;
}

@media (max-width: 768px) {
  .metrics-wrapper {
    overflow-x: auto;
  }
  
  .metrics-row-linear {
    min-width: 700px;
  }

  .metric-card {
    padding: 16px;
    min-width: 140px;
  }
}

/* Users Chart Styles */
.users-chart {
  border: 2px solid #7c3aed;
  background: linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%);
}

.users-chart .chart-title {
  color: #5b21b6;
  font-weight: 700;
}

/* Users Metrics Row */
.users-metrics-row {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

/* Telegram Users Card Style */
.metric-telegram-users {
  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
  border: 2px solid #29b6f6;
  max-width: 190px;
  min-height: 120px;
}

.metric-telegram-users:hover {
  border-color: #1976d2;
}

/* Telegram Disconnected Users Card Style */
.metric-telegram-disconnected {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  border: 2px solid #f87171;
  max-width: 190px;
  min-height: 120px;
}

.metric-telegram-disconnected:hover {
  border-color: #dc2626;
}

/* Total Users Card Style */
.metric-users-total {
  background: linear-gradient(135deg, #f3f0ff 0%, #ede9fe 100%);
  border: 2px solid #a855f7;
  max-width: 190px;
  min-height: 120px;
}

.metric-users-total:hover {
  border-color: #7c3aed;
}

/* Active Telegram Users Card Style */
.metric-telegram-active {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 2px solid #10b981;
  max-width: 190px;
  min-height: 120px;
}

.metric-telegram-active:hover {
  border-color: #059669;
}

/* Group Added Users Card Style */
.metric-group-added {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  max-width: 190px;
  min-height: 120px;
}

.metric-group-added .metric-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-group-added:hover {
  border-color: #d97706;
}

@media (max-width: 768px) {
  .metric-card {
    max-width: 180px;
  }
  
  .users-metrics-row {
    justify-content: center;
  }
  
  .users-metrics-row {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}

/* Channel Subscribers Info Styles */
.channel-subscribers-info {
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
  border: 2px solid #26c6da;
  border-radius: 12px;
  padding: 24px;
  margin-top: 30px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(38, 198, 218, 0.15);
}

.channel-subscribers-info h4 {
  font-size: 18px;
  font-weight: 600;
  color: #00695c;
  margin-bottom: 16px;
  margin-top: 0;
}

.subscribers-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.count-value {
  font-size: 36px;
  font-weight: 700;
  color: #004d40;
  line-height: 1;
}

.count-label {
  font-size: 16px;
  color: #00695c;
  font-style: italic;
}

/* Order Details Section Styles */
.order-details-section {
  margin-top: 40px;
}

.order-details-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 2px solid #cbd5e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.order-details-toggle-btn:hover {
  background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
  border-color: #4299e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.2);
}

.toggle-text {
  flex: 1;
  text-align: center;
}

.toggle-arrow {
  width: 20px;
  height: 20px;
  color: #4a5568;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.toggle-arrow.rotated {
  transform: rotate(180deg);
}

.order-details-content {
  margin-top: 20px;
  animation: slideDown 0.3s ease-out;
}

.loading-details {
  text-align: center;
  padding: 40px 20px;
  color: #4a5568;
  font-style: italic;
}

.order-details-section h4 {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 20px;
  margin-top: 0;
}

.order-details-table {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.order-details-table th {
  background: #f8fafc;
  color: #4a5568;
  font-weight: 600;
  text-align: center;
}

.order-details-table td {
  text-align: center;
  vertical-align: middle;
}

.order-id-cell {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.amount-cell {
  font-weight: 600;
  color: #2d3748;
  text-align: right;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-new { background: #e2e8f0; color: #4a5568; }
.status-in_work { background: #bee3f8; color: #2a69ac; }
.status-cancelled { background: #fed7d7; color: #c53030; }
.status-payed { background: #c6f6d5; color: #22543d; }
.status-not_confirmed { background: #ffeaa7; color: #d68910; }
.status-payment_waiting { background: #fbb6ce; color: #97266d; }
.status-part_payed { background: #d4edda; color: #155724; }
.status-waiting_for_return { background: #f8d7da; color: #721c24; }
.status-pending { background: #e2e3e5; color: #495057; }
.status-false { background: #f8f9fa; color: #6c757d; }
.status-new { background: #ffeaa7; color: #d68910; }

@media (max-width: 768px) {
  .order-details-table {
    font-size: 12px;
  }
  
  .order-details-table th,
  .order-details-table td {
    padding: 8px 6px;
  }
  
  .order-id-cell {
    font-size: 12px;
  }
  
  .status-badge {
    font-size: 10px;
    padding: 3px 8px;
  }
}
</style>