<template>
  <div class="cloud-settings">
    <div class="header">
      <div class="header-top">
        <h1 class="title">Настройка данных в облаке</h1>
        <button @click="goBack" class="back-btn" title="Вернуться к отчетам">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Назад</span>
        </button>
      </div>
    </div>

    <div class="content-container">
      <div class="development-notice">
        <svg class="notice-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div class="notice-content">
          <h2>В разработке</h2>
          <p>Эта страница находится в процессе разработки. Скоро здесь появятся инструменты для настройки синхронизации данных в облако.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { indexPageRoute } from '../index'

function goBack() {
  try {
    window.location.href = indexPageRoute.url()
  } catch (e) {
    console.error('Error navigating back:', e)
    window.history.back()
  }
}
</script>

<style scoped>
.cloud-settings {
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

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  color: #4a5568;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.back-btn:hover {
  background: #edf2f7;
  color: #2d3748;
  border-color: #cbd5e0;
}

.content-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 60px 40px;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.development-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 600px;
}

.notice-icon {
  width: 80px;
  height: 80px;
  color: #4299e1;
  margin-bottom: 24px;
}

.notice-content h2 {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 16px 0;
}

.notice-content p {
  font-size: 16px;
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .cloud-settings {
    padding: 15px;
  }

  .title {
    font-size: 24px;
  }

  .content-container {
    padding: 40px 20px;
  }

  .notice-icon {
    width: 60px;
    height: 60px;
  }

  .notice-content h2 {
    font-size: 22px;
  }

  .notice-content p {
    font-size: 14px;
  }

  .back-btn span {
    display: none;
  }
}
</style>

