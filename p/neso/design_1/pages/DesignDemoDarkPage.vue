<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('DesignDemoDarkPage')

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
          <h1 class="page-title">{{ projectTitle }}</h1>
          <p class="page-subtitle">Главная · сводка и последние изменения</p>
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
        <!-- Приветственный блок -->
        <section class="hero-section">
          <div class="hero-card">
            <div class="glow-spot"></div>
            <h2 class="hero-title">Добрый день</h2>
            <p class="hero-desc">
              За сегодня обработано 12 обращений. 3 требуют ответа в течение часа.
            </p>
            <div class="hero-actions">
              <a :href="profileUrl" class="btn primary">Перейти к обращениям</a>
              <a :href="loginUrl" class="btn ghost">Выйти</a>
            </div>
          </div>
        </section>

        <!-- Метрики -->
        <section class="stats-section">
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-inbox"></i></div>
            <span class="stat-value">12</span>
            <span class="stat-label">Сегодня</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-spinner"></i></div>
            <span class="stat-value">5</span>
            <span class="stat-label">В работе</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-bell"></i></div>
            <span class="stat-value">3</span>
            <span class="stat-label">Новых</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="fas fa-check"></i></div>
            <span class="stat-value">4</span>
            <span class="stat-label">Закрыто</span>
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

          <!-- График -->
          <section class="card chart-card">
            <div class="card-header">
              <h3 class="card-title">ОБРАЩЕНИЯ ЗА НЕДЕЛЮ</h3>
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

        <!-- Обращения за сегодня -->
        <section class="page-block">
          <h3 class="card-title">ПОСЛЕДНИЕ ОБРАЩЕНИЯ</h3>
          <div class="card">
            <table class="page-table">
              <thead>
                <tr><th>Клиент</th><th>Канал</th><th>Статус</th><th>SLA</th></tr>
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
  --border-strong: rgba(175, 196, 95, 0.22);
  --glass-strong: rgba(12, 20, 22, 0.68);
  --glass-soft: rgba(12, 20, 22, 0.56);
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
  background:
    radial-gradient(circle at 16% 12%, rgba(175, 196, 95, 0.1), transparent 34%),
    radial-gradient(circle at 84% 86%, rgba(111, 132, 64, 0.08), transparent 38%),
    linear-gradient(140deg, var(--bg) 0%, var(--bg2) 60%, var(--surface) 100%);
  color: var(--text);
  font-family: 'Mulish', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow-x: hidden;
  opacity: 0;
  transition: opacity 0.55s ease;
  isolation: isolate;
}
.app-ready { opacity: 1; }

.app::before,
.app::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.app::before {
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.06), transparent 26%, transparent 74%, rgba(255, 255, 255, 0.05));
  mix-blend-mode: soft-light;
}

.app::after {
  background: radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.34) 100%);
}

/* Фоновое изображение — ночной лес */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_3IQ3znw7md.1376x768.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.34;
  transform: scale(1.03);
  filter: saturate(112%) contrast(106%);
}

.bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    145deg,
    rgba(5, 8, 10, 0.92) 0%,
    rgba(13, 18, 20, 0.82) 48%,
    rgba(17, 25, 27, 0.9) 100%
  );
  backdrop-filter: blur(4px);
}

/* Атмосферный свет + микро-светлячки (чисто, без пиксельных орбов) */
.orbs {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(68% 54% at 14% 92%, rgba(175, 196, 95, 0.11), transparent 74%),
    radial-gradient(62% 52% at 88% 10%, rgba(197, 216, 121, 0.09), transparent 76%),
    radial-gradient(40% 34% at 58% 52%, rgba(175, 196, 95, 0.06), transparent 78%);
  animation: dark-ambient-shift 38s ease-in-out infinite alternate;
}

.orbs::before,
.orbs::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orbs::before {
  background-image: radial-gradient(rgba(197, 216, 121, 0.55) 0.6px, transparent 0.8px);
  background-size: 4px 4px;
  opacity: 0.03;
  mix-blend-mode: screen;
}

.orbs::after {
  inset: -14%;
  background:
    radial-gradient(50% 38% at 78% 16%, rgba(197, 216, 121, 0.12), transparent 74%),
    radial-gradient(44% 34% at 28% 84%, rgba(175, 196, 95, 0.1), transparent 76%);
  opacity: 0.24;
  animation: dark-ambient-breathe 46s ease-in-out infinite alternate;
}

.orb {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c5d879;
  mix-blend-mode: screen;
  opacity: 0.52;
  box-shadow:
    0 0 0 1px rgba(197, 216, 121, 0.14),
    0 0 14px rgba(197, 216, 121, 0.48),
    0 0 30px rgba(175, 196, 95, 0.22);
  animation:
    dark-firefly-drift 16s ease-in-out infinite,
    dark-firefly-pulse 4.8s ease-in-out infinite;
}

.orb-1 {
  top: 24%;
  right: 22%;
  animation-delay: 0s, -1s;
}

.orb-2 {
  width: 5px;
  height: 5px;
  bottom: 28%;
  left: 18%;
  opacity: 0.42;
  animation-delay: -5s, -2.2s;
}

.orb-3 {
  width: 4px;
  height: 4px;
  top: 62%;
  right: 36%;
  opacity: 0.36;
  animation-delay: -9s, -3.1s;
}

@keyframes dark-ambient-shift {
  0% {
    transform: translate3d(-0.8%, -0.6%, 0);
  }
  100% {
    transform: translate3d(0.8%, 0.7%, 0);
  }
}

@keyframes dark-ambient-breathe {
  0% {
    transform: translate3d(-1.2%, -0.8%, 0) scale(1);
  }
  100% {
    transform: translate3d(1%, 0.9%, 0) scale(1.04);
  }
}

@keyframes dark-firefly-drift {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(18px, -14px, 0);
  }
}

@keyframes dark-firefly-pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.72;
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
  background: linear-gradient(165deg, rgba(13, 21, 23, 0.84), rgba(10, 16, 18, 0.72));
  backdrop-filter: blur(30px) saturate(170%);
  -webkit-backdrop-filter: blur(30px) saturate(170%);
  border-right: 1px solid var(--border-strong);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    6px 0 34px rgba(0, 0, 0, 0.4);
  z-index: 100;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sidebar.collapsed { width: 72px; }

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 24%);
  opacity: 0.75;
  z-index: 0;
}
.sidebar > * { position: relative; z-index: 1; }

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
  box-shadow:
    0 10px 22px rgba(175, 196, 95, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}
.logo-text { font-family: 'Old Standard TT', serif; font-size: 1.25rem; font-weight: 700; }
.toggle-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}
.toggle-btn:hover {
  background: rgba(175, 196, 95, 0.14);
  border-color: var(--border-strong);
  color: var(--accent);
}

.nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--text2);
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
}
.nav-item i { width: 20px; }
.nav-item:hover {
  background: rgba(175, 196, 95, 0.12);
  border-color: rgba(175, 196, 95, 0.18);
  color: var(--text);
}
.nav-item.active {
  background: var(--accent);
  border-color: rgba(197, 216, 121, 0.6);
  color: var(--bg);
  box-shadow: 0 10px 20px rgba(175, 196, 95, 0.22);
}

.sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); }
.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(17, 28, 29, 0.72);
  backdrop-filter: blur(16px);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
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
  transition: all 0.25s ease;
  border: none;
  position: relative;
}
.action-btn.icon {
  width: 44px;
  padding: 0;
  justify-content: center;
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(175,196,95,0.16);
  color: var(--text2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.action-btn.icon:hover {
  background: rgba(175, 196, 95, 0.14);
  color: var(--accent);
  transform: translateY(-1px);
}
.action-btn.primary {
  background: var(--accent);
  color: var(--bg);
  box-shadow:
    0 14px 24px rgba(175, 196, 95, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
.action-btn.primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
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
  background: linear-gradient(165deg, rgba(13, 22, 24, 0.8), rgba(11, 18, 20, 0.66));
  backdrop-filter: blur(26px) saturate(145%);
  -webkit-backdrop-filter: blur(26px) saturate(145%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 32px;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.hero-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 30%);
  z-index: -1;
}

.hero-card:hover {
  transform: translateY(-2px);
  border-color: rgba(175, 196, 95, 0.3);
  box-shadow:
    0 24px 46px rgba(0, 0, 0, 0.38),
    0 0 32px rgba(175, 196, 95, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

/* Лёгкое свечение светлячка в углу hero */
.glow-spot {
  position: absolute;
  top: -30%;
  right: -15%;
  width: 56%;
  height: 74%;
  background: radial-gradient(
    ellipse at 70% 30%,
    rgba(175, 196, 95, 0.08),
    transparent 60%
  );
  pointer-events: none;
  filter: blur(6px);
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
  background: rgba(255,255,255,0.08);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  border: 1px solid rgba(175, 196, 95, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: linear-gradient(165deg, var(--glass-strong), var(--glass-soft));
  backdrop-filter: blur(24px) saturate(135%);
  -webkit-backdrop-filter: blur(24px) saturate(135%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  box-shadow:
    0 14px 30px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(175, 196, 95, 0.26);
  box-shadow:
    0 18px 34px rgba(0, 0, 0, 0.28),
    0 0 26px rgba(175, 196, 95, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
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
  background: linear-gradient(165deg, var(--glass-strong), var(--glass-soft));
  backdrop-filter: blur(24px) saturate(135%);
  -webkit-backdrop-filter: blur(24px) saturate(135%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: relative;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  box-shadow:
    0 14px 30px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 26%);
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(175, 196, 95, 0.24);
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.3),
    0 0 24px rgba(175, 196, 95, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
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
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.12);
  border-radius: var(--radius);
  color: var(--text2);
  text-decoration: none;
  transition: all 0.25s ease;
}
.quick-btn:hover {
  background: rgba(175, 196, 95, 0.14);
  border-color: rgba(175, 196, 95, 0.28);
  color: var(--accent);
  transform: translateY(-1px);
}

.changelog-list { display: flex; flex-direction: column; gap: 12px; }
.changelog-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.1);
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
.page-block { margin-bottom: 32px; }
.page-block .card-title { margin: 0 0 16px 0; display: block; }
.page-table { width: 100%; border-collapse: collapse; }
.page-table th, .page-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
.page-table th { font-size: 0.75rem; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; }
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
.btn.primary {
  box-shadow:
    0 12px 22px rgba(175, 196, 95, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}
.btn.primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.btn.secondary { background: rgba(255,255,255,0.1); color: var(--text); border: 1px solid rgba(175, 196, 95, 0.14); }
.btn.secondary:hover { background: rgba(255,255,255,0.14); transform: translateY(-1px); }
.btn.ghost { background: transparent; color: var(--text2); }
.btn.ghost:hover { background: var(--glow-soft); color: var(--accent); }
.btn.outline { background: transparent; border: 1px solid var(--accent); color: var(--accent); }
.btn.outline:hover { background: var(--glow-soft); transform: translateY(-1px); }
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
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.16);
  border-radius: var(--radius);
  transition: all 0.25s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.input-wrap:focus-within {
  border-color: var(--accent);
  outline: none;
  box-shadow:
    0 0 0 2px rgba(175, 196, 95, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
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
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.16);
  border-radius: var(--radius);
  color: var(--text);
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
}
textarea:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow:
    0 0 0 2px rgba(175, 196, 95, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.field-error { font-size: 0.8rem; color: var(--error); margin-top: 6px; display: block; }
.field-hint { font-size: 0.8rem; color: var(--text3); margin-top: 6px; display: block; }

.search-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 44px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.16);
  border-radius: var(--radius);
  margin-bottom: 16px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
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
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.1);
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
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.1);
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
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius);
  border: 1px solid rgba(175, 196, 95, 0.14);
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
  background: rgba(0,0,0,0.66);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fade 0.2s ease;
}
.modal {
  background: linear-gradient(165deg, rgba(18, 27, 29, 0.94), rgba(14, 22, 24, 0.9));
  backdrop-filter: blur(30px) saturate(150%);
  -webkit-backdrop-filter: blur(30px) saturate(150%);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow:
    0 28px 72px rgba(0, 0, 0, 0.54),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.modal::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 26%);
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
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(175, 196, 95, 0.14);
  border-radius: var(--radius);
  font-size: 0.85rem;
  color: var(--text2);
  transition: all 0.25s ease;
}
.cov-tag:hover {
  background: rgba(175, 196, 95, 0.12);
  border-color: rgba(175, 196, 95, 0.24);
  color: var(--text);
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

@media (prefers-reduced-motion: reduce) {
  .orbs,
  .orbs::after,
  .orb,
  .live-dot {
    animation: none !important;
  }

  .hero-card,
  .card,
  .stat-card,
  .quick-btn,
  .action-btn,
  .btn,
  .cov-tag {
    transition: none !important;
    transform: none !important;
  }
}
</style>
