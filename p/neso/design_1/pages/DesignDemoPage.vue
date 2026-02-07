<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('DesignDemoPage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

defineProps<{
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
const sidebarOpen = ref(false)
const activeSection = ref('dashboard')
const activeChartTab = ref('week')
const modalOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebarMobile() {
  sidebarOpen.value = !sidebarOpen.value
}

const menuItems = [
  { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
  { id: 'profile', icon: 'fa-user', label: 'Профиль' },
  { id: 'admin', icon: 'fa-gear', label: 'Админка' },
  { id: 'login', icon: 'fa-right-to-bracket', label: 'Логин' }
]

const changelog = [
  { role: 'UX', text: 'Обновлён layout карточек обращений', time: '4 мин назад' },
  { role: 'DS', text: 'Добавлены токены focus/loading/error', time: '11 мин назад' },
  { role: 'QA', text: 'Проверен desktop-first сценарий', time: '26 мин назад' }
]

const tableRows = [
  { client: 'Мария Петрова', channel: 'WhatsApp', status: 'В работе', sla: '01:24' },
  { client: 'Иван Смирнов', channel: 'Telegram', status: 'Новый', sla: '00:41' },
  { client: 'Анна Орлова', channel: 'Email', status: 'Закрыт', sla: '03:12' }
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
    <!-- Фон — ночной лес -->
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <!-- Летающие светлячки (орбы) -->
    <div class="orbs" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      aria-hidden="true"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed, 'mobile-open': sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon"><i class="fas fa-leaf"></i></div>
          <span v-if="!sidebarCollapsed" class="logo-text">NeSo</span>
        </div>
        <button class="toggle-btn" @click="sidebarCollapsed = !sidebarCollapsed" aria-label="Свернуть меню">
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
          <div class="avatar"><i class="fas fa-user"></i></div>
          <div class="user-info">
            <span class="name">Алексей</span>
            <span class="role">Admin</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="main">
      <!-- Header -->
      <header class="header">
        <button class="menu-toggle" aria-label="Открыть меню" @click="toggleSidebarMobile">
          <i class="fas fa-bars"></i>
        </button>
        <div class="header-left">
          <h1 class="page-title">CRM Design System · Dark</h1>
          <p class="page-subtitle">Ночной лес: глубина, мягкий контраст, фокус на задаче</p>
        </div>
        <div class="header-actions">
          <button class="action-btn icon"><i class="fas fa-search"></i></button>
          <button class="action-btn icon">
            <i class="fas fa-bell"></i>
            <span class="badge">3</span>
          </button>
          <a :href="indexUrl" class="action-btn primary">
            <i class="fas fa-arrow-right"></i>
            <span>Открыть CRM</span>
          </a>
        </div>
      </header>

      <div class="content">
        <!-- Hero Block -->
        <section class="hero-section">
          <div class="hero-card">
            <div class="glow-spot"></div>
            <span class="hero-tag">NEW UI FOUNDATION</span>
            <h2 class="hero-title">A/Ley Services / Design Demo</h2>
            <p class="hero-desc">
              Полностью новый визуальный фундамент CRM: адаптивный shell, единые токены,
              компонентный каталог и стандартизированные состояния для масштабирования интерфейса.
            </p>
            <div class="hero-actions">
              <a :href="profileUrl" class="btn primary">Открыть профиль →</a>
              <a :href="loginUrl" class="btn ghost">Открыть auth-flow</a>
            </div>
            <div class="hero-visual">
              <div class="visual-tile"><i class="fas fa-th-large"></i></div>
              <div class="visual-tile"><i class="fas fa-filter"></i></div>
              <div class="visual-tile"><i class="fas fa-comment"></i></div>
            </div>
          </div>
        </section>

        <!-- Stats -->
        <section class="stats-section">
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-leaf"></i></div>
            <span class="stat-value">42</span>
            <span class="stat-label">UI-компонента</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-th-large"></i></div>
            <span class="stat-value">18</span>
            <span class="stat-label">Паттернов CRM</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-circle-half-stroke"></i></div>
            <span class="stat-value">2</span>
            <span class="stat-label">Равные темы</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-check"></i></div>
            <span class="stat-value">AA</span>
            <span class="stat-label">Контраст</span>
          </div>
        </section>

        <!-- Main Grid -->
        <div class="main-grid">
          <!-- Quick Scenarios -->
          <section class="card">
            <h3 class="card-title">БЫСТРЫЕ СЦЕНАРИИ</h3>
            <div class="quick-scenarios">
              <a :href="indexUrl" class="quick-btn"><i class="fas fa-house"></i><span>Dashboard</span></a>
              <a :href="profileUrl" class="quick-btn"><i class="fas fa-user"></i><span>Профиль</span></a>
              <a :href="adminUrl || indexUrl" class="quick-btn"><i class="fas fa-gear"></i><span>Админка</span></a>
              <a :href="loginUrl" class="quick-btn"><i class="fas fa-right-to-bracket"></i><span>Логин</span></a>
            </div>
          </section>

          <!-- Changelog -->
          <section class="card">
            <div class="card-header">
              <h3 class="card-title">ЖУРНАЛ ИЗМЕНЕНИЙ</h3>
              <span class="live-badge"><span class="live-dot"></span> LIVE</span>
            </div>
            <div class="changelog-list">
              <div v-for="(item, i) in changelog" :key="i" class="changelog-item">
                <span class="changelog-role">{{ item.role }}</span>
                <span class="changelog-text">{{ item.text }}</span>
                <span class="changelog-time">{{ item.time }}</span>
              </div>
            </div>
          </section>

          <!-- Chart -->
          <section class="card chart-card">
            <div class="card-header">
              <h3 class="card-title">РЕЛИЗНАЯ ДИНАМИКА</h3>
              <div class="chart-tabs">
                <button class="tab" :class="{ active: activeChartTab === 'week' }" @click="activeChartTab = 'week'">Неделя</button>
                <button class="tab" :class="{ active: activeChartTab === 'month' }" @click="activeChartTab = 'month'">Месяц</button>
              </div>
            </div>
            <div class="chart-bars">
              <div class="bar" :style="{ '--h': '60%' }"><span>Пн</span></div>
              <div class="bar" :style="{ '--h': '80%' }"><span>Вт</span></div>
              <div class="bar" :style="{ '--h': '45%' }"><span>Ср</span></div>
              <div class="bar active" :style="{ '--h': '90%' }"><span>Чт</span></div>
              <div class="bar" :style="{ '--h': '70%' }"><span>Пт</span></div>
              <div class="bar" :style="{ '--h': '55%' }"><span>Сб</span></div>
              <div class="bar" :style="{ '--h': '40%' }"><span>Вс</span></div>
            </div>
          </section>
        </div>

        <!-- UI Components Showcase -->
        <section class="showcase">
          <h2 class="section-title">КНОПКИ И ИНТЕРАКЦИИ</h2>
          <div class="card showcase-card">
            <div class="btn-row">
              <button class="btn primary"><i class="fas fa-paper-plane"></i> Action</button>
              <button class="btn secondary">Secondary</button>
              <button class="btn ghost">Ghost</button>
              <button class="btn outline">Outline</button>
              <button class="btn" disabled>Disabled</button>
              <button class="btn loading" disabled><i class="fas fa-spinner fa-spin"></i> Loading</button>
            </div>
          </div>
        </section>

        <section class="showcase">
          <h2 class="section-title">ФОРМА И ВАЛИДАЦИЯ</h2>
          <div class="card showcase-card">
            <div class="form-row">
              <label class="field">
                <span class="field-label">ИМЯ КЛИЕНТА</span>
                <div class="input-wrap">
                  <i class="fas fa-user"></i>
                  <input type="text" placeholder="Имя клиента" />
                </div>
              </label>
              <label class="field error">
                <span class="field-label">EMAIL</span>
                <div class="input-wrap">
                  <input type="email" placeholder="email@example.com" />
                  <i class="fas fa-copy"></i>
                </div>
                <span class="field-error">Нужен валидный адрес для уведомлений SLA</span>
              </label>
              <label class="field">
                <span class="field-label">КОММЕНТАРИЙ</span>
                <textarea placeholder="Комментарий оператора" rows="3"></textarea>
                <span class="field-hint">Поддерживаются markdown-ссылки и теги.</span>
              </label>
            </div>
          </div>
        </section>

        <section class="showcase">
          <h2 class="section-title">ФИЛЬТРАЦИЯ И ПОИСК</h2>
          <div class="card showcase-card">
            <div class="search-wrap">
              <i class="fas fa-search"></i>
              <input type="search" placeholder="Поиск по клиенту, тегу, ID обращения" />
            </div>
            <div class="filter-tabs">
              <button class="filter-tab active">Все</button>
              <button class="filter-tab">Непрочитанные</button>
              <button class="filter-tab">Открытые</button>
              <button class="filter-tab">Мои</button>
            </div>
            <div class="filter-tags">
              <span class="tag active"><span class="tag-dot"></span> В работе</span>
              <span class="tag">Приоритет</span>
              <span class="tag">Архив</span>
            </div>
          </div>
        </section>

        <section class="showcase">
          <h2 class="section-title">УВЕДОМЛЕНИЯ</h2>
          <div class="card showcase-card">
            <div class="notify-list">
              <div class="notify success">
                <i class="fas fa-check"></i>
                <div>
                  <span class="notify-title">Настройки сохранены</span>
                  <span class="notify-sub">только что</span>
                </div>
                <button class="btn ghost small">Открыть</button>
              </div>
              <div class="notify warning">
                <i class="fas fa-triangle-exclamation"></i>
                <div>
                  <span class="notify-title">SLA для Telegram не задан</span>
                  <span class="notify-sub">нужна настройка</span>
                </div>
                <button class="btn ghost small">Исправить</button>
              </div>
              <div class="notify info">
                <i class="fas fa-circle-info"></i>
                <div>
                  <span class="notify-title">Доступна версия UI Kit v3.0</span>
                  <span class="notify-sub">обновление дизайна</span>
                </div>
                <button class="btn ghost small">Обновить</button>
              </div>
            </div>
          </div>
        </section>

        <section class="showcase">
          <h2 class="section-title">СПИСОК И ТАБЛИЦА</h2>
          <div class="card showcase-card two-col">
            <div class="list-panel">
              <div class="list-item">
                <span class="list-tag hot">HOT</span>
                <div class="list-body">
                  <span class="list-title">Клиент 001 · #inq-2045</span>
                  <span class="list-desc">Нужно уточнить сроки запуска первой рассылки</span>
                </div>
                <span class="list-time">10:02</span>
              </div>
              <div class="list-item">
                <span class="list-tag">WAIT</span>
                <div class="list-body">
                  <span class="list-title">Клиент 002 · #inq-2037</span>
                  <span class="list-desc">Вернусь с решением сегодня вечером</span>
                </div>
                <span class="list-time">09:40</span>
              </div>
            </div>
            <div class="table-panel">
              <table>
                <thead>
                  <tr><th>КЛИЕНТ</th><th>КАНАЛ</th><th>СТАТУС</th><th>SLA</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in tableRows" :key="i">
                    <td>{{ row.client }}</td>
                    <td>{{ row.channel }}</td>
                    <td><span class="badge-status" :class="row.status === 'Закрыт' ? 'muted' : ''">{{ row.status }}</span></td>
                    <td>{{ row.sla }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="showcase">
          <h2 class="section-title">СОСТОЯНИЯ И МОДАЛЬНЫЕ СЦЕНАРИИ</h2>
          <div class="card showcase-card states-grid">
            <div class="state-card">
              <span class="state-label">LOADING</span>
              <div class="state-content loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Загружаем данные таблицы...</span>
              </div>
            </div>
            <div class="state-card">
              <span class="state-label">SKELETON</span>
              <div class="state-content skeleton">
                <div class="sk-line"></div>
                <div class="sk-line short"></div>
                <div class="sk-line mid"></div>
              </div>
            </div>
            <div class="state-card">
              <span class="state-label">ERROR</span>
              <div class="state-content error">
                <span>Ошибка сети: не удалось обновить логи</span>
                <button class="btn ghost small">Повторить</button>
              </div>
            </div>
            <div class="state-card">
              <span class="state-label">EMPTY</span>
              <div class="state-content empty">
                <span>Нет обращений по текущему фильтру.</span>
                <button class="btn ghost small">Сбросить фильтр</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Modal -->
        <Teleport to="body">
          <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
            <div class="modal">
              <div class="modal-header">
                <h3>Создать новое обращение</h3>
                <button class="modal-close" @click="modalOpen = false" aria-label="Закрыть">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="modal-body">
                <div class="input-wrap"><i class="fas fa-user"></i><input placeholder="Имя клиента" /></div>
                <div class="input-wrap"><i class="fas fa-phone"></i><input placeholder="Телефон" /></div>
                <div class="input-wrap select"><i class="fas fa-telegram"></i><select><option>Telegram</option></select><i class="fas fa-chevron-down"></i></div>
              </div>
              <div class="modal-footer">
                <button class="btn ghost" @click="modalOpen = false">Отмена</button>
                <button class="btn primary">Создать</button>
              </div>
            </div>
          </div>
        </Teleport>

        <section class="showcase">
          <button class="btn primary" @click="modalOpen = true">
            <i class="fas fa-plus"></i> Открыть модальное окно
          </button>
        </section>

        <!-- Coverage & Palette -->
        <section class="showcase">
          <h2 class="section-title">ПОКРЫТИЕ ДИЗАЙН-СИСТЕМЫ</h2>
          <div class="coverage-tags">
            <span class="cov-tag"><i class="fas fa-bars"></i> Навигация и shell</span>
            <span class="cov-tag"><i class="fas fa-filter"></i> Фильтры и поиск</span>
            <span class="cov-tag"><i class="fas fa-list"></i> Списки и карточки</span>
            <span class="cov-tag"><i class="fas fa-table"></i> Таблицы и статусы</span>
            <span class="cov-tag"><i class="fas fa-check"></i> Формы и валидация</span>
            <span class="cov-tag"><i class="fas fa-bell"></i> Уведомления</span>
            <span class="cov-tag"><i class="fas fa-window-maximize"></i> Модальные сценарии</span>
            <span class="cov-tag"><i class="fas fa-spinner"></i> Loading / Empty / Error</span>
          </div>
        </section>

        <section class="showcase">
          <h2 class="section-title">ПАЛИТРА ТЕМЫ</h2>
          <div class="palette-grid">
            <div class="palette-item"><div class="swatch" style="background:#05080a"></div><span>BACKGROUND</span><code>#05080a</code></div>
            <div class="palette-item"><div class="swatch" style="background:#11191b"></div><span>SURFACE</span><code>#11191b</code></div>
            <div class="palette-item"><div class="swatch" style="background:#afc45f"></div><span>ACCENT</span><code>#afc45f</code></div>
            <div class="palette-item"><div class="swatch" style="background:#6f8440"></div><span>ACCENT DEEP</span><code>#6f8440</code></div>
            <div class="palette-item"><div class="swatch" style="background:#eef4eb"></div><span>TEXT</span><code>#eef4eb</code></div>
            <div class="palette-item"><div class="swatch" style="background:#c5d879"></div><span>GLOW</span><code>#c5d879</code></div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  --bg: #05080a;
  --bg2: #0d1214;
  --surface: #11191b;
  --accent: #afc45f;
  --accent-deep: #6f8440;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.75);
  --text3: rgba(238, 244, 235, 0.5);
  --glow: #c5d879;
  --glow-soft: rgba(175, 196, 95, 0.15);
  --border: rgba(175, 196, 95, 0.12);
  --error: #e85555;
  --warning: #e5b04a;
  --info: #5a9cf5;
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
}

.app {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.app-ready { opacity: 1; }

/* Фоновое изображение — ночной лес */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_3IQ3znw7md.1376x768.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.4;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    135deg,
    rgba(5, 8, 10, 0.88) 0%,
    rgba(13, 18, 20, 0.78) 50%,
    rgba(17, 25, 27, 0.88) 100%
  );
  backdrop-filter: blur(3px);
}

/* Летающие светлячки — орбы поверх фона */
.orbs {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(175, 196, 95, 0.08),
    rgba(197, 216, 121, 0.03) 50%,
    transparent 70%
  );
  animation: orb-float 22s ease-in-out infinite;
}

.orb-1 {
  width: 320px;
  height: 320px;
  top: calc(10% + 80px);
  right: 12%;
  animation-delay: 0s;
}

.orb-2 {
  width: 220px;
  height: 220px;
  bottom: 18%;
  left: 8%;
  animation-delay: -6s;
}

.orb-3 {
  width: 180px;
  height: 180px;
  top: 55%;
  right: 25%;
  animation-delay: -12s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0.6;
  }
  33% {
    transform: translate(25px, -25px) rotate(110deg);
    opacity: 1;
  }
  66% {
    transform: translate(-18px, 22px) rotate(230deg);
    opacity: 0.6;
  }
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.6);
  animation: fade 0.2s ease;
}
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }

.sidebar {
  width: 240px;
  height: 100vh;
  position: sticky;
  top: 0;
  padding: 24px 16px;
  background: rgba(8, 14, 16, 0.45);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-right: 1px solid var(--border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    4px 0 28px rgba(0, 0, 0, 0.35);
  z-index: 100;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}
.sidebar.collapsed { width: 72px; }

.menu-toggle { display: none; }

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}
.logo { display: flex; align-items: center; gap: 12px; }
.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--accent);
  color: var(--bg);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text { font-family: 'Old Standard TT', serif; font-size: 1.25rem; font-weight: 700; }
.toggle-btn {
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.toggle-btn:hover { background: var(--glow-soft); color: var(--accent); }

.nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.nav-item i { width: 20px; }
.nav-item:hover { background: var(--glow-soft); color: var(--text); }
.nav-item.active { background: var(--accent); color: var(--bg); }

.sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); }
.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(8px);
  border-radius: var(--radius);
  border: 1px solid rgba(255,255,255,0.04);
}
.avatar {
  width: 36px;
  height: 36px;
  background: var(--accent-deep);
  color: var(--text);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-info { display: flex; flex-direction: column; }
.name { font-weight: 600; font-size: 0.9rem; }
.role { font-size: 0.75rem; color: var(--text3); }

.main {
  flex: 1;
  min-width: 0;
  padding: 32px 40px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 40px;
}
.header-left { flex: 1; }
.page-title {
  font-family: 'Old Standard TT', serif;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 4px 0;
}
.page-subtitle { margin: 0; font-size: 0.95rem; color: var(--text2); }
.header-actions { display: flex; gap: 12px; align-items: center; }
.action-btn {
  height: 44px;
  padding: 0 20px;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  position: relative;
}
.action-btn.icon {
  width: 44px;
  padding: 0;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.06);
  color: var(--text2);
}
.action-btn.icon:hover { background: var(--glow-soft); color: var(--accent); }
.action-btn.primary {
  background: var(--accent);
  color: var(--bg);
}
.action-btn.primary:hover { filter: brightness(1.1); }
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--accent);
  color: var(--bg);
  border-radius: 9px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content { max-width: 1200px; }

.hero-section { margin-bottom: 32px; }
.hero-card {
  background: rgba(12, 20, 22, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* Лёгкое свечение светлячка в углу hero */
.glow-spot {
  position: absolute;
  top: -30%;
  right: -15%;
  width: 60%;
  height: 80%;
  background: radial-gradient(
    ellipse at 70% 30%,
    rgba(175, 196, 95, 0.04),
    transparent 60%
  );
  pointer-events: none;
}
.hero-tag {
  display: inline-block;
  padding: 6px 12px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}
.hero-title { font-family: 'Old Standard TT', serif; font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0; }
.hero-desc { color: var(--text2); margin: 0 0 24px 0; max-width: 520px; line-height: 1.6; }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.hero-visual {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.visual-tile {
  width: 48px;
  height: 48px;
  background: rgba(255,255,255,0.06);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: rgba(12, 20, 22, 0.45);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
}
.stat-icon {
  width: 44px;
  height: 44px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value { font-size: 1.75rem; font-weight: 700; }
.stat-label { font-size: 0.85rem; color: var(--text2); }

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 48px;
}
.card {
  background: rgba(12, 20, 22, 0.42);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
}
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.card-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.05em;
  margin: 0;
}
.live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}
.live-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

.quick-scenarios { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.quick-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.04);
  border-radius: var(--radius);
  color: var(--text2);
  text-decoration: none;
  transition: all 0.2s;
}
.quick-btn:hover { background: var(--glow-soft); color: var(--accent); }

.changelog-list { display: flex; flex-direction: column; gap: 12px; }
.changelog-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius);
}
.changelog-role {
  width: 32px;
  height: 32px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}
.changelog-text { flex: 1; font-size: 0.9rem; }
.changelog-time { font-size: 0.8rem; color: var(--text3); }

.chart-card { grid-column: span 2; }
.chart-tabs { display: flex; gap: 4px; }
.tab {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab.active { background: var(--accent); color: var(--bg); }
.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 100px;
  margin-top: 20px;
}
.bar {
  flex: 1;
  height: var(--h);
  background: var(--glow-soft);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  position: relative;
  transition: all 0.2s;
}
.bar.active { background: var(--accent); }
.bar span {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text3);
}

.showcase { margin-bottom: 40px; }
.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.05em;
  margin: 0 0 16px 0;
}
.showcase-card { margin-top: 0; }
.btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
.btn {
  padding: 12px 20px;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
}
.btn.primary { background: var(--accent); color: var(--bg); }
.btn.primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn.secondary { background: rgba(255,255,255,0.08); color: var(--text); }
.btn.secondary:hover { background: rgba(255,255,255,0.12); }
.btn.ghost { background: transparent; color: var(--text2); }
.btn.ghost:hover { background: var(--glow-soft); color: var(--accent); }
.btn.outline { background: transparent; border: 1px solid var(--accent); color: var(--accent); }
.btn.outline:hover { background: var(--glow-soft); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.loading { opacity: 0.8; }
.btn.small { padding: 8px 14px; font-size: 0.85rem; }

.form-row { display: flex; flex-direction: column; gap: 20px; }
.field { display: block; }
.field-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text2);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.2s;
}
.input-wrap:focus-within { border-color: var(--accent); outline: none; }
.input-wrap.error { border-color: var(--error); }
.field.error .input-wrap { border-color: var(--error); }
.input-wrap input,
.input-wrap select {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
}
.input-wrap i { color: var(--text3); }
.input-wrap.select select { padding-right: 24px; }
textarea {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}
textarea:focus { border-color: var(--accent); outline: none; }
.field-error { font-size: 0.8rem; color: var(--error); margin-top: 6px; display: block; }
.field-hint { font-size: 0.8rem; color: var(--text3); margin-top: 6px; display: block; }

.search-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 44px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 16px;
}
.search-wrap i { color: var(--text3); }
.search-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-family: inherit;
}
.filter-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.filter-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-tab.active { background: var(--accent); color: var(--bg); }
.filter-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag {
  padding: 8px 14px;
  background: rgba(255,255,255,0.06);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text2);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tag.active { background: var(--accent); color: var(--bg); }
.tag-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }

.notify-list { display: flex; flex-direction: column; gap: 12px; }
.notify {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius);
}
.notify i { font-size: 1.25rem; }
.notify.success i { color: var(--accent); }
.notify.warning i { color: var(--warning); }
.notify.info i { color: var(--info); }
.notify-title { display: block; font-weight: 600; }
.notify-sub { font-size: 0.85rem; color: var(--text3); }
.notify .btn { margin-left: auto; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.list-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius);
  margin-bottom: 12px;
}
.list-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}
.list-tag.hot { background: var(--accent); color: var(--bg); }
.list-tag:not(.hot) { background: rgba(255,255,255,0.08); color: var(--text2); }
.list-body { flex: 1; min-width: 0; }
.list-title { display: block; font-weight: 600; font-size: 0.9rem; }
.list-desc { font-size: 0.85rem; color: var(--text3); }
.list-time { font-size: 0.85rem; color: var(--text3); flex-shrink: 0; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
th { font-size: 0.75rem; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; }
.badge-status {
  padding: 4px 10px;
  background: var(--glow-soft);
  color: var(--accent);
  border-radius: 12px;
  font-size: 0.8rem;
}
.badge-status.muted { background: rgba(255,255,255,0.08); color: var(--text2); }

.states-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.state-card {
  padding: 20px;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.state-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text3);
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}
.state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 80px;
  color: var(--text2);
  font-size: 0.85rem;
  text-align: center;
}
.state-content.loading i { font-size: 1.5rem; color: var(--accent); }
.state-content.error span { color: var(--error); }
.skeleton { align-items: stretch; }
.sk-line {
  height: 12px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px;
  width: 100%;
}
.sk-line.short { width: 60%; }
.sk-line.mid { width: 80%; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fade 0.2s ease;
}
.modal {
  background: rgba(17, 25, 27, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.modal-close {
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.modal-close:hover { background: var(--glow-soft); color: var(--accent); }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.modal-body .input-wrap { height: 44px; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

.coverage-tags { display: flex; flex-wrap: wrap; gap: 12px; }
.cov-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.85rem;
  color: var(--text2);
}
.cov-tag i { color: var(--accent); }

.palette-grid { display: flex; flex-wrap: wrap; gap: 24px; }
.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.swatch {
  width: 64px;
  height: 64px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.palette-item span { font-size: 0.8rem; font-weight: 600; }
.palette-item code { font-size: 0.75rem; color: var(--text3); font-family: monospace; }

@media (max-width: 1024px) {
  .main-grid { grid-template-columns: 1fr; }
  .chart-card { grid-column: span 1; }
  .stats-section { grid-template-columns: repeat(2, 1fr); }
  .two-col { grid-template-columns: 1fr; }
  .states-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text);
    cursor: pointer;
  }
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 0;
    padding: 0;
    overflow: hidden;
    transition: width 0.3s ease;
  }
  .sidebar.mobile-open { width: 240px; padding: 24px 16px; }
  .main { padding: 24px 20px; }
  .stats-section { grid-template-columns: 1fr; }
  .hero-visual { display: none; }
  .states-grid { grid-template-columns: 1fr; }
}

@media (min-width: 769px) {
  .sidebar-overlay { display: none !important; }
}
</style>
