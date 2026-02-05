<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('DesignDemoLightPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectTitle: string
  logoUrl?: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
}>()

const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const activeSection = ref('dashboard')
const activeTab = ref('overview')

const stats = [
  { value: '2.4K', label: 'Пользователей', icon: 'fa-users' },
  { value: '147', label: 'Курсов', icon: 'fa-graduation-cap' },
  { value: '98%', label: 'Довольных', icon: 'fa-heart' },
  { value: '4.9', label: 'Рейтинг', icon: 'fa-star' }
]

const menuItems = [
  { id: 'dashboard', icon: 'fa-house', label: 'Главная' },
  { id: 'courses', icon: 'fa-book-open', label: 'Курсы' },
  { id: 'users', icon: 'fa-users', label: 'Пользователи' },
  { id: 'analytics', icon: 'fa-chart-pie', label: 'Аналитика' },
  { id: 'settings', icon: 'fa-gear', label: 'Настройки' }
]

function startAnimations() {
  log.info('Boot complete')
  bootLoaderDone.value = true
}

onMounted(() => {
  if (window.hideAppLoader) window.hideAppLoader()
  if (window.bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }
})
</script>

<template>
  <div class="app" :class="{ 'app-ready': bootLoaderDone }">
    <!-- Animated Mesh Background — солнечные зайчики -->
    <div class="mesh-bg">
      <div class="mesh-gradient mesh-1"></div>
      <div class="mesh-gradient mesh-2"></div>
      <div class="mesh-gradient mesh-3"></div>
      <div class="noise-overlay"></div>
    </div>

    <!-- Floating Orbs — солнечные блики -->
    <div class="orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <i class="fas fa-leaf"></i>
          </div>
          <span v-if="!sidebarCollapsed" class="logo-text">NeSo</span>
        </div>
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <i :class="sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
        </button>
      </div>

      <nav class="nav">
        <button
          v-for="item in menuItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: activeSection === item.id }"
          @click="activeSection = item.id"
          :title="sidebarCollapsed ? item.label : ''"
        >
          <i :class="['fas', item.icon]"></i>
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </button>
      </nav>

      <div v-if="!sidebarCollapsed" class="sidebar-footer">
        <div class="user-pill">
          <div class="avatar">
            <i class="fas fa-user"></i>
          </div>
          <div class="user-info">
            <span class="name">Алексей</span>
            <span class="role">Admin</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Добро пожаловать в NeSo Academy</p>
        </div>
        <div class="header-actions">
          <button class="action-btn glass">
            <i class="fas fa-search"></i>
          </button>
          <button class="action-btn glass">
            <i class="fas fa-bell"></i>
            <span class="badge">3</span>
          </button>
          <button class="action-btn primary">
            <i class="fas fa-plus"></i>
            <span>Создать</span>
          </button>
        </div>
      </header>

      <!-- Content -->
      <div class="content">
        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Hero Card -->
          <div class="bento-item hero-card">
            <div class="hero-content">
              <span class="hero-tag">
                <i class="fas fa-sparkles"></i>
                Новое
              </span>
              <h2 class="hero-title">Образовательная платформа нового поколения</h2>
              <p class="hero-desc">Управляйте курсами, отслеживайте прогресс студентов и создавайте уникальный контент</p>
              <div class="hero-actions">
                <button class="btn-glow">
                  <span>Начать</span>
                  <i class="fas fa-arrow-right"></i>
                </button>
                <button class="btn-ghost">Узнать больше</button>
              </div>
            </div>
            <div class="hero-visual">
              <div class="floating-card card-1">
                <i class="fas fa-play"></i>
              </div>
              <div class="floating-card card-2">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="floating-card card-3">
                <i class="fas fa-trophy"></i>
              </div>
            </div>
          </div>

          <!-- Stats Cards -->
          <div 
            v-for="(stat, i) in stats" 
            :key="i" 
            class="bento-item stat-card"
            :style="{ '--delay': `${Number(i) * 0.1}s` }"
          >
            <div class="stat-icon">
              <i :class="['fas', stat.icon]"></i>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
            <div class="stat-glow"></div>
          </div>

          <!-- Quick Actions -->
          <div class="bento-item actions-card">
            <h3 class="card-title">Быстрые действия</h3>
            <div class="quick-actions">
              <button class="quick-btn">
                <div class="quick-icon"><i class="fas fa-plus"></i></div>
                <span>Новый курс</span>
              </button>
              <button class="quick-btn">
                <div class="quick-icon"><i class="fas fa-user-plus"></i></div>
                <span>Пригласить</span>
              </button>
              <button class="quick-btn">
                <div class="quick-icon"><i class="fas fa-file-export"></i></div>
                <span>Экспорт</span>
              </button>
              <button class="quick-btn">
                <div class="quick-icon"><i class="fas fa-cog"></i></div>
                <span>Настройки</span>
              </button>
            </div>
          </div>

          <!-- Activity Card -->
          <div class="bento-item activity-card">
            <div class="card-header">
              <h3 class="card-title">Активность</h3>
              <span class="live-badge">
                <span class="live-dot"></span>
                Live
              </span>
            </div>
            <div class="activity-list">
              <div class="activity-item">
                <div class="activity-avatar">М</div>
                <div class="activity-info">
                  <span class="activity-name">Мария завершила курс</span>
                  <span class="activity-time">2 мин назад</span>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-avatar">И</div>
                <div class="activity-info">
                  <span class="activity-name">Иван присоединился</span>
                  <span class="activity-time">15 мин назад</span>
                </div>
              </div>
              <div class="activity-item">
                <div class="activity-avatar">А</div>
                <div class="activity-info">
                  <span class="activity-name">Анна оставила отзыв</span>
                  <span class="activity-time">1 час назад</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart Card -->
          <div class="bento-item chart-card">
            <div class="card-header">
              <h3 class="card-title">Прогресс</h3>
              <div class="chart-tabs">
                <button class="tab active">Неделя</button>
                <button class="tab">Месяц</button>
              </div>
            </div>
            <div class="chart-visual">
              <div class="chart-bars">
                <div class="bar" style="--h: 60%"><span>Пн</span></div>
                <div class="bar" style="--h: 80%"><span>Вт</span></div>
                <div class="bar" style="--h: 45%"><span>Ср</span></div>
                <div class="bar" style="--h: 90%"><span>Чт</span></div>
                <div class="bar" style="--h: 70%"><span>Пт</span></div>
                <div class="bar active" style="--h: 95%"><span>Сб</span></div>
                <div class="bar" style="--h: 55%"><span>Вс</span></div>
              </div>
            </div>
          </div>
        </section>

        <!-- Components Showcase -->
        <section class="showcase">
          <h2 class="section-title">UI Components</h2>

          <div class="showcase-grid">
            <!-- Buttons -->
            <div class="showcase-card">
              <h4 class="showcase-label">Кнопки</h4>
              <div class="showcase-content">
                <button class="btn-glow">Primary</button>
                <button class="btn-glass">Glass</button>
                <button class="btn-ghost">Ghost</button>
                <button class="btn-outline">Outline</button>
              </div>
            </div>

            <!-- Inputs -->
            <div class="showcase-card">
              <h4 class="showcase-label">Поля ввода</h4>
              <div class="showcase-content column">
                <div class="input-group">
                  <i class="fas fa-envelope"></i>
                  <input type="email" placeholder="email@example.com">
                </div>
                <div class="input-group">
                  <i class="fas fa-lock"></i>
                  <input type="password" placeholder="Пароль">
                  <button class="input-action"><i class="fas fa-eye"></i></button>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div class="showcase-card">
              <h4 class="showcase-label">Теги</h4>
              <div class="showcase-content wrap">
                <span class="tag">Активный</span>
                <span class="tag tag-light">Новый</span>
                <span class="tag tag-outline">Важно</span>
                <span class="tag tag-muted">Архив</span>
              </div>
            </div>

            <!-- Toggle -->
            <div class="showcase-card">
              <h4 class="showcase-label">Переключатели</h4>
              <div class="showcase-content column">
                <label class="toggle-row">
                  <span>Уведомления</span>
                  <input type="checkbox" class="toggle" checked>
                </label>
                <label class="toggle-row">
                  <span>Автосохранение</span>
                  <input type="checkbox" class="toggle">
                </label>
              </div>
            </div>

            <!-- Progress -->
            <div class="showcase-card wide">
              <h4 class="showcase-label">Прогресс</h4>
              <div class="showcase-content column">
                <div class="progress-item">
                  <div class="progress-header">
                    <span>Завершение курса</span>
                    <span>78%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="--w: 78%"></div>
                  </div>
                </div>
                <div class="progress-item">
                  <div class="progress-header">
                    <span>Тесты пройдены</span>
                    <span>45%</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" style="--w: 45%"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Avatar Group -->
            <div class="showcase-card">
              <h4 class="showcase-label">Аватары</h4>
              <div class="showcase-content">
                <div class="avatar-group">
                  <div class="avatar-item">А</div>
                  <div class="avatar-item">Б</div>
                  <div class="avatar-item">В</div>
                  <div class="avatar-item">Г</div>
                  <div class="avatar-item more">+12</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Color Palette -->
        <section class="palette-section">
          <h2 class="section-title">Палитра (светлая тема)</h2>
          <div class="palette-grid">
            <div class="palette-item" style="--c: #4a5a24">
              <div class="palette-swatch"></div>
              <span class="palette-name">Primary</span>
              <span class="palette-hex">#4a5a24</span>
            </div>
            <div class="palette-item" style="--c: #5d6d2e">
              <div class="palette-swatch"></div>
              <span class="palette-name">Medium</span>
              <span class="palette-hex">#5d6d2e</span>
            </div>
            <div class="palette-item" style="--c: #3a4a1a">
              <div class="palette-swatch"></div>
              <span class="palette-name">Dark</span>
              <span class="palette-hex">#3a4a1a</span>
            </div>
            <div class="palette-item" style="--c: #e8ede0">
              <div class="palette-swatch swatch-light"></div>
              <span class="palette-name">Background</span>
              <span class="palette-hex">#e8ede0</span>
            </div>
            <div class="palette-item" style="--c: #1b2b1c">
              <div class="palette-swatch"></div>
              <span class="palette-name">Text</span>
              <span class="palette-hex">#1b2b1c</span>
            </div>
            <div class="palette-item" style="--c: #fffefa">
              <div class="palette-swatch swatch-light"></div>
              <span class="palette-name">Sunray</span>
              <span class="palette-hex">#fffefa</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ===== Variables — светлая тема (природа + солнце + стекло) ===== */
.app {
  /* Мягкий природный фон */
  --bg: #e8ede0;
  --bg-secondary: #dfe6d3;
  --bg-card: rgba(255, 255, 255, 0.45);
  --bg-card-hover: rgba(255, 255, 255, 0.6);
  --glass: rgba(255, 255, 255, 0.35);
  --glass-border: rgba(255, 255, 255, 0.5);
  --glass-shadow: rgba(27, 43, 28, 0.08);
  
  /* Тёмный текст */
  --text: #1b2b1c;
  --text-secondary: #3d4a35;
  --text-tertiary: #5a6652;
  
  /* Насыщенный зелёный для контраста */
  --accent: #4a5a24;
  --accent-light: #5d6d2e;
  --accent-lighter: #6b7d38;
  --accent-dark: #3a4a1a;
  --accent-glow: rgba(74, 90, 36, 0.25);
  --accent-pale: rgba(74, 90, 36, 0.12);
  
  /* Солнечный свет — тёплый белый, не жёлтый */
  --sunray: rgba(255, 255, 250, 0.9);
  --sunray-soft: rgba(255, 252, 245, 0.6);
  --sunray-glow: rgba(255, 250, 240, 0.5);
  
  --radius: 20px;
  --radius-sm: 12px;
  --radius-xs: 8px;
}

/* ===== Base ===== */
.app {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.app-ready {
  opacity: 1;
}

/* ===== Nature Background — контрастная зелень для эффекта стекла ===== */
.mesh-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #e8ede0;
}

.mesh-gradient {
  position: absolute;
  animation: float 30s ease-in-out infinite;
}

/* Большое зелёное пятно — имитация листвы слева */
.mesh-1 {
  width: 70vw;
  height: 70vw;
  top: -25%;
  left: -20%;
  background: radial-gradient(ellipse at 60% 60%, 
    rgba(74, 90, 36, 0.5) 0%, 
    rgba(93, 109, 46, 0.35) 25%,
    rgba(107, 125, 56, 0.2) 45%,
    transparent 65%
  );
  filter: blur(40px);
  animation-delay: 0s;
}

/* Зелёное пятно справа внизу */
.mesh-2 {
  width: 55vw;
  height: 55vw;
  bottom: -15%;
  right: -10%;
  background: radial-gradient(ellipse at 40% 40%,
    rgba(58, 74, 26, 0.45) 0%,
    rgba(74, 90, 36, 0.3) 30%,
    rgba(93, 109, 46, 0.15) 50%,
    transparent 70%
  );
  filter: blur(50px);
  animation-delay: -10s;
}

/* Солнечное пятно — тёплый свет справа сверху */
.mesh-3 {
  width: 50vw;
  height: 50vw;
  top: -10%;
  right: 5%;
  background: radial-gradient(ellipse at 30% 70%,
    rgba(255, 255, 240, 0.95) 0%,
    rgba(255, 252, 235, 0.6) 25%,
    rgba(255, 250, 230, 0.3) 45%,
    transparent 65%
  );
  filter: blur(30px);
  animation-delay: -20s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(1.5%, 1%) scale(1.01); }
  50% { transform: translate(-1%, 2%) scale(0.99); }
  75% { transform: translate(-1.5%, -0.5%) scale(1.005); }
}

.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.025;
  pointer-events: none;
}

/* ===== Floating Orbs — солнечные зайчики ===== */
.orbs {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, 
    rgba(255, 255, 245, 0.9), 
    rgba(255, 255, 240, 0.5) 35%, 
    transparent 65%
  );
  animation: orb-float 25s ease-in-out infinite;
}

.orb-1 {
  width: 280px;
  height: 280px;
  top: 5%;
  right: 15%;
  filter: blur(2px);
  animation-delay: 0s;
}

.orb-2 {
  width: 200px;
  height: 200px;
  bottom: 20%;
  left: 8%;
  opacity: 0.8;
  filter: blur(3px);
  animation-delay: -8s;
}

.orb-3 {
  width: 150px;
  height: 150px;
  top: 40%;
  left: 35%;
  opacity: 0.6;
  filter: blur(2px);
  animation-delay: -16s;
}

@keyframes orb-float {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(20px, -15px); }
  66% { transform: translate(-15px, 20px); }
}

/* ===== Sidebar — выраженный glassmorphism ===== */
.sidebar {
  width: 260px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-right: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 
    4px 0 32px rgba(74, 90, 36, 0.08),
    inset -1px 0 0 rgba(255, 255, 255, 0.2);
  z-index: 100;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--accent), var(--accent-light));
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.logo-text {
  font-family: 'Old Standard TT', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.toggle-btn {
  width: 32px;
  height: 32px;
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--accent-pale);
  color: var(--accent);
}

/* ===== Navigation ===== */
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.nav-item i {
  width: 20px;
  font-size: 1.1rem;
}

.nav-item:hover {
  background: var(--accent-pale);
  color: var(--accent);
}

.nav-item.active {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid var(--glass-border);
}

.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
}

.avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
}

.role {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* ===== Main Content ===== */
.main {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 10;
  padding: 24px 32px;
  overflow-y: auto;
}

/* ===== Header ===== */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Old Standard TT', serif;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  line-height: 1.1;
  color: var(--text);
}

.page-subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  position: relative;
}

.action-btn.glass {
  width: 44px;
  padding: 0;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: var(--text-secondary);
}

.action-btn.glass:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.5);
  color: var(--accent);
}

.action-btn.primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px var(--accent-glow);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background: var(--accent);
  border-radius: 50%;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
}

/* ===== Bento Grid ===== */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 20px;
  margin-bottom: 48px;
}

/* Карточки — выраженный glassmorphism */
.bento-item {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius);
  padding: 24px;
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  box-shadow: 
    0 8px 32px rgba(74, 90, 36, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(74, 90, 36, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: bento-in 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
  animation-delay: var(--delay, 0s);
}

@keyframes bento-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

.bento-item:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-4px);
  box-shadow: 
    0 16px 48px rgba(74, 90, 36, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

/* Hero Card */
.hero-card {
  grid-column: span 2;
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.12));
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--accent-pale);
  color: var(--accent-dark);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  width: fit-content;
  margin-bottom: 16px;
}

.hero-title {
  font-family: 'Old Standard TT', serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 12px 0;
  max-width: 400px;
  color: var(--text);
}

.hero-desc {
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  max-width: 380px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 12px;
}

.btn-glow {
  padding: 12px 24px;
  background: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 16px var(--accent-glow);
  transition: all 0.2s;
}

.btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px var(--accent-glow);
}

.btn-ghost {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
}

.hero-visual {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 200px;
  height: 200px;
}

/* Floating cards — выраженное стекло */
.floating-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  box-shadow: 
    0 8px 24px rgba(74, 90, 36, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  animation: float-card 6s ease-in-out infinite;
}

.card-1 {
  width: 60px;
  height: 60px;
  font-size: 1.2rem;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.card-2 {
  width: 50px;
  height: 50px;
  bottom: 20%;
  left: 10%;
  animation-delay: -2s;
}

.card-3 {
  width: 45px;
  height: 45px;
  top: 50%;
  right: 30%;
  animation-delay: -4s;
}

@keyframes float-card {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

/* Stats Cards */
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
  background: var(--accent-pale);
  color: var(--accent);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--text);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.stat-glow {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  right: -20px;
  bottom: -20px;
  opacity: 0.2;
  filter: blur(25px);
  background: var(--sunray-glow);
}

/* Actions Card */
.actions-card {
  grid-column: span 2;
}

.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-pale);
  color: var(--accent);
}

/* Activity Card */
.activity-card {
  grid-row: span 2;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--accent-pale);
  color: var(--accent);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--glass);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.activity-item:hover {
  background: var(--bg-secondary);
}

.activity-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  background: var(--accent-pale);
  color: var(--accent);
}

.activity-info {
  display: flex;
  flex-direction: column;
}

.activity-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Chart Card */
.chart-card {
  grid-column: span 2;
}

.chart-tabs {
  display: flex;
  gap: 4px;
  background: var(--glass);
  padding: 4px;
  border-radius: var(--radius-xs);
}

.tab {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab.active {
  background: var(--accent);
  color: white;
}

.chart-visual {
  margin-top: 20px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 120px;
  gap: 12px;
}

.bar {
  flex: 1;
  height: var(--h);
  background: linear-gradient(180deg, rgba(93, 104, 45, 0.2), rgba(93, 104, 45, 0.05));
  border-radius: var(--radius-xs) var(--radius-xs) 0 0;
  position: relative;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.bar span {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

.bar:hover {
  background: linear-gradient(180deg, var(--accent), rgba(93, 104, 45, 0.15));
}

.bar.active {
  background: linear-gradient(180deg, var(--accent), var(--accent-light));
  box-shadow: 0 0 16px var(--accent-glow);
}

/* ===== Showcase ===== */
.showcase {
  margin-bottom: 48px;
}

.section-title {
  font-family: 'Old Standard TT', serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 24px 0;
  color: var(--text);
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.showcase-card {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: var(--radius);
  padding: 24px;
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  box-shadow: 
    0 8px 32px rgba(74, 90, 36, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.showcase-card.wide {
  grid-column: span 2;
}

.showcase-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.showcase-content {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.showcase-content.column {
  flex-direction: column;
}

.showcase-content.wrap {
  flex-wrap: wrap;
}

/* Buttons */
.btn-glass {
  padding: 12px 24px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-glass:hover {
  background: var(--bg-secondary);
}

.btn-outline {
  padding: 12px 24px;
  background: transparent;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  color: var(--accent);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: var(--accent-pale);
}

/* Inputs */
.input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: white;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.input-group:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-pale);
}

.input-group i {
  color: var(--text-tertiary);
}

.input-group input {
  flex: 1;
  height: 48px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
}

.input-group input::placeholder {
  color: var(--text-tertiary);
}

.input-action {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 8px;
  transition: color 0.2s;
}

.input-action:hover {
  color: var(--accent);
}

/* Tags */
.tag {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--accent-pale);
  color: var(--accent);
}

.tag-light {
  background: rgba(255, 255, 255, 0.6);
  color: var(--accent);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.tag-outline {
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
}

.tag-muted {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

/* Toggle */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--glass);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.toggle-row span {
  font-size: 0.9rem;
  color: var(--text);
}

.toggle {
  appearance: none;
  width: 48px;
  height: 26px;
  background: var(--bg-secondary);
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toggle:checked {
  background: var(--accent);
}

.toggle:checked::before {
  transform: translateX(22px);
}

/* Progress */
.progress-item {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 8px;
  color: var(--text);
}

.progress-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: var(--w);
  border-radius: 4px;
  transition: width 1s ease;
  background: linear-gradient(90deg, var(--accent-dark), var(--accent));
}

/* Avatar Group */
.avatar-group {
  display: flex;
}

.avatar-item {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  margin-left: -8px;
  border: 2px solid var(--bg);
  background: var(--accent);
  color: white;
}

.avatar-item:first-child {
  margin-left: 0;
}

.avatar-item:nth-child(2) { background: var(--accent-light); }
.avatar-item:nth-child(3) { background: var(--accent-dark); }
.avatar-item:nth-child(4) { background: var(--accent-lighter); }

.avatar-item.more {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

/* ===== Palette ===== */
.palette-section {
  margin-bottom: 48px;
}

.palette-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.palette-swatch {
  width: 72px;
  height: 72px;
  background: var(--c);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 16px rgba(27, 43, 28, 0.12);
  transition: transform 0.2s;
}

.palette-swatch.swatch-light {
  border: 1px solid var(--glass-border);
}

.palette-swatch:hover {
  transform: scale(1.1);
}

.palette-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
}

.palette-hex {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  font-family: monospace;
}

/* ===== Responsive ===== */
@media (max-width: 1200px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-card {
    grid-column: span 2;
  }
  .chart-card {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
  }
  .sidebar.collapsed {
    width: 0;
    padding: 0;
    overflow: hidden;
  }
  .main {
    padding: 20px;
  }
  .showcase-grid {
    grid-template-columns: 1fr;
  }
  .showcase-card.wide {
    grid-column: span 1;
  }
}

@media (max-width: 600px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
  .hero-card, .actions-card, .chart-card {
    grid-column: span 1;
  }
  .activity-card {
    grid-row: span 1;
  }
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  .header {
    flex-direction: column;
    gap: 16px;
  }
  .hero-visual {
    display: none;
  }
}
</style>
