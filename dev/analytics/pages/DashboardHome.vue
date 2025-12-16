<template>
  <div class="analytics-container">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <h1 class="header-title">
          <i class="fas fa-chart-line"></i>
          Система аналитики
        </h1>
        <div class="header-user">
          <span class="user-name">{{ ctx.user?.displayName }}</span>
          <span class="user-role">Admin</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="welcome-card">
        <div class="welcome-icon">
          <i class="fas fa-rocket"></i>
        </div>
        <h2 class="welcome-title">Добро пожаловать в систему аналитики!</h2>
        <p class="welcome-text">
          Система аналитики для просмотра и анализа событий из ClickHouse.
          Доступен первый дашборд "Обзор событий" с таблицей последних событий и фильтрами.
        </p>
        <div class="status-badge">
          <i class="fas fa-rocket"></i>
          <span>ДЕМО (Волна 1) - Управление пользователями РЕАЛИЗОВАНО</span>
        </div>
      </div>

      <!-- Feature Preview Cards -->
      <div class="feature-grid">
        <a :href="eventsDashboardRoute.url()" class="feature-card feature-card-active">
          <div class="feature-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <h3 class="feature-title">Обзор событий</h3>
          <p class="feature-description">
            Таблица последних 50 событий из ClickHouse с фильтрами по дате
          </p>
          <span class="feature-status active">
            <i class="fas fa-check-circle"></i>
            Доступно
          </span>
        </a>

        <a :href="allUsersRoute.url()" class="feature-card feature-card-active">
          <div class="feature-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <i class="fas fa-users"></i>
          </div>
          <h3 class="feature-title">Все пользователи</h3>
          <p class="feature-description">
            Список всех зарегистрированных пользователей из событий с поиском
          </p>
          <span class="feature-status active">
            <i class="fas fa-check-circle"></i>
            Доступно
          </span>
        </a>

        <a :href="settingsRoute.url()" class="feature-card feature-card-active">
          <div class="feature-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <i class="fas fa-cog"></i>
          </div>
          <h3 class="feature-title">Настройки</h3>
          <p class="feature-description">
            Настройки проекта и обновление исторических данных
          </p>
          <span class="feature-status active">
            <i class="fas fa-check-circle"></i>
            Доступно
          </span>
        </a>
        
        <a :href="metricEventsRoute.url()" class="feature-card feature-card-active">
          <div class="feature-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <i class="fas fa-satellite-dish"></i>
          </div>
          <h3 class="feature-title">Metric Events</h3>
          <p class="feature-description">
            Мониторинг событий из metric-event hook
          </p>
          <span class="feature-status debug" style="background: #f6ad55; color: white;">
            <i class="fas fa-bug"></i>
            Отладка
          </span>
        </a>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-filter"></i>
          </div>
          <h3 class="feature-title">Фильтры</h3>
          <p class="feature-description">
            Гибкая фильтрация данных по параметрам
          </p>
          <span class="feature-status upcoming">Скоро</span>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-database"></i>
          </div>
          <h3 class="feature-title">ClickHouse</h3>
          <p class="feature-description">
            Интеграция с базой событий
          </p>
          <span class="feature-status upcoming">Скоро</span>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="fas fa-robot"></i>
          </div>
          <h3 class="feature-title">AI-Ассистент</h3>
          <p class="feature-description">
            Умный помощник для работы с событиями
          </p>
          <span class="feature-status planned">Запланировано</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { eventsDashboardRoute, allUsersRoute, settingsRoute, metricEventsRoute } from '../index'

// ctx доступен глобально в Chatium
// Информация о пользователе доступна через ctx.user

onMounted(() => {
  // Инициализация при монтировании
  console.log('Analytics Dashboard mounted')
})
</script>

<style scoped>
.analytics-container {
  min-height: 100vh;
  background: #f7fafc;
}

.header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title i {
  color: #667eea;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-name {
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

.user-role {
  background: #667eea;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.welcome-card {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-icon {
  font-size: 4rem;
  color: #667eea;
  margin-bottom: 1.5rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.welcome-text {
  font-size: 1.125rem;
  color: #718096;
  line-height: 1.7;
  margin: 0 0 2rem 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fef3c7;
  color: #92400e;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  text-decoration: none;
  display: block;
  color: inherit;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.feature-card-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border: 2px solid #667eea;
  cursor: pointer;
}

.feature-card-active:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 20px rgba(102, 126, 234, 0.3);
}

.feature-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.feature-icon i {
  font-size: 1.5rem;
  color: white;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

.feature-description {
  font-size: 0.875rem;
  color: #718096;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.feature-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.feature-status.active {
  background: #d1fae5;
  color: #065f46;
}

.feature-status.upcoming {
  background: #dbeafe;
  color: #1e40af;
}

.feature-status.planned {
  background: #e0e7ff;
  color: #5b21b6;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .welcome-card {
    padding: 2rem 1.5rem;
  }

  .welcome-title {
    font-size: 1.5rem;
  }

  .welcome-text {
    font-size: 1rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>

