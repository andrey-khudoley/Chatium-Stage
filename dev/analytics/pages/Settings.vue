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
            <i class="fas fa-cog"></i>
            Настройки проекта
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
      <!-- General settings section -->
      <div class="settings-section">
        <h2>
          <i class="fas fa-sliders-h"></i>
          Общие настройки
        </h2>
        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Проект</div>
              <div class="setting-value">Система аналитики</div>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">Версия</div>
              <div class="setting-value">1.0.0 (ДЕМО)</div>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-title">База данных</div>
              <div class="setting-value">Heap + ClickHouse</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="settings-section danger-zone">
        <h2>
          <i class="fas fa-exclamation-triangle"></i>
          Опасная зона
        </h2>
        <div class="settings-card danger-card">
          <div class="danger-warning">
            <i class="fas fa-info-circle"></i>
            <p>Эти операции могут значительно изменить данные в системе. Используйте с осторожностью.</p>
          </div>
          
          <!-- Historical data update -->
          <div class="danger-action">
            <div class="action-info">
              <div class="action-title">
                <i class="fas fa-sync"></i>
                Обновить исторические данные
              </div>
              <div class="action-description">
                Загрузить всех пользователей из исторических событий ClickHouse (регистрации, заполнения форм).
                Операция идемпотентна - повторный запуск обновит только изменившиеся данные.
              </div>
              <div v-if="updateResult" class="action-result">
                <div v-if="updateResult.success" class="result-success">
                  <i class="fas fa-check-circle"></i>
                  <div>
                    <strong>Успешно обновлено!</strong>
                    <p>
                      Обработано: {{ updateResult.processed }}, 
                      Создано: {{ updateResult.created }}, 
                      Обновлено: {{ updateResult.updated }}
                    </p>
                  </div>
                </div>
                <div v-else class="result-error">
                  <i class="fas fa-times-circle"></i>
                  <div>
                    <strong>Ошибка обновления</strong>
                    <p>{{ updateResult.error }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="action-buttons">
              <button 
                v-if="!showConfirm"
                @click="showConfirmDialog" 
                class="danger-button"
                :disabled="isUpdating"
              >
                <i :class="isUpdating ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"></i>
                {{ isUpdating ? 'Обновление...' : 'Обновить данные' }}
              </button>
              
              <div v-else class="confirm-dialog">
                <p class="confirm-text">
                  <i class="fas fa-question-circle"></i>
                  Вы уверены, что хотите обновить исторические данные?
                </p>
                <div class="confirm-buttons">
                  <button @click="updateHistoricalData" class="confirm-yes">
                    <i class="fas fa-check"></i>
                    Да, обновить
                  </button>
                  <button @click="cancelConfirm" class="confirm-no">
                    <i class="fas fa-times"></i>
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info section -->
      <div class="settings-section">
        <h2>
          <i class="fas fa-info-circle"></i>
          Информация
        </h2>
        <div class="settings-card">
          <div class="info-item">
            <i class="fas fa-lightbulb"></i>
            <div>
              <strong>Автоматическое обновление</strong>
              <p>Новые пользователи автоматически добавляются при регистрации через события workspace.</p>
            </div>
          </div>
          <div class="info-item">
            <i class="fas fa-database"></i>
            <div>
              <strong>Источник данных</strong>
              <p>Данные берутся из таблицы workspace_events в ClickHouse и сохраняются в Heap.</p>
            </div>
          </div>
          <div class="info-item">
            <i class="fas fa-shield-alt"></i>
            <div>
              <strong>Безопасность</strong>
              <p>Все операции доступны только пользователям с ролью Admin.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiUpdateHistoricalDataRoute } from '../api/users'
import { indexPageRoute } from '../index'

const showConfirm = ref(false)
const isUpdating = ref(false)
const updateResult = ref(null)

const showConfirmDialog = () => {
  showConfirm.value = true
  updateResult.value = null
}

const cancelConfirm = () => {
  showConfirm.value = false
}

const updateHistoricalData = async () => {
  showConfirm.value = false
  isUpdating.value = true
  updateResult.value = null
  
  try {
    const result = await apiUpdateHistoricalDataRoute.run(ctx)
    updateResult.value = result
  } catch (error) {
    updateResult.value = {
      success: false,
      error: error.message
    }
  } finally {
    isUpdating.value = false
  }
}

const goBack = () => {
  window.location.href = indexPageRoute.url()
}
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
  max-width: 1200px;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.danger-zone h2 {
  color: #ed8936;
}

.settings-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.danger-card {
  border: 2px solid #ed8936;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-title {
  color: #718096;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.setting-value {
  color: #2d3748;
  font-weight: 500;
}

.danger-warning {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: #fef5e7;
  border: 1px solid #f8d7a1;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.danger-warning i {
  color: #ed8936;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.danger-warning p {
  color: #975a16;
  margin: 0;
  line-height: 1.5;
}

.danger-action {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.action-info {
  flex: 1;
}

.action-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-title i {
  color: #ed8936;
}

.action-description {
  color: #718096;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.action-result {
  margin-top: 1rem;
}

.result-success,
.result-error {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
}

.result-success {
  background: #e6fffa;
  border: 1px solid #81e6d9;
}

.result-success i {
  color: #38b2ac;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.result-success strong {
  color: #234e52;
}

.result-success p {
  color: #2c7a7b;
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
}

.result-error {
  background: #fff5f5;
  border: 1px solid #feb2b2;
}

.result-error i {
  color: #f56565;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.result-error strong {
  color: #742a2a;
}

.result-error p {
  color: #c53030;
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
}

.action-buttons {
  min-width: 200px;
}

.danger-button {
  width: 100%;
  background: #ed8936;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.danger-button:hover:not(:disabled) {
  background: #dd6b20;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(237, 137, 54, 0.3);
}

.danger-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.confirm-dialog {
  background: #fff5f5;
  border: 2px solid #fc8181;
  border-radius: 0.5rem;
  padding: 1rem;
}

.confirm-text {
  color: #742a2a;
  margin: 0 0 1rem 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confirm-buttons {
  display: flex;
  gap: 0.5rem;
}

.confirm-yes,
.confirm-no {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.confirm-yes {
  background: #e53e3e;
  color: white;
}

.confirm-yes:hover {
  background: #c53030;
}

.confirm-no {
  background: white;
  color: #718096;
  border: 1px solid #e2e8f0;
}

.confirm-no:hover {
  background: #f7fafc;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item i {
  color: #667eea;
  font-size: 1.5rem;
  margin-top: 0.125rem;
}

.info-item strong {
  color: #2d3748;
  display: block;
  margin-bottom: 0.25rem;
}

.info-item p {
  color: #718096;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .danger-action {
    flex-direction: column;
  }
  
  .action-buttons {
    width: 100%;
  }
}
</style>

