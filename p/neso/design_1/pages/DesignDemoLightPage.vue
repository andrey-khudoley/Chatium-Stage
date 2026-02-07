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
    <!-- Фон — солнечное утро, листва -->
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <!-- Летающие солнечные лучи (орбы) -->
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
            <span class="name">Андрей</span>
            <span class="role">Admin</span>
          </div>
        </div>
      </div>
    </aside>

    <main class="main">
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
        <section class="hero-section">
          <div class="hero-card">
            <div class="sunray-diagonal"></div>
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

        <div class="main-grid">
          <section class="card">
            <h3 class="card-title">БЫСТРЫЕ СЦЕНАРИИ</h3>
            <div class="quick-scenarios">
              <a :href="indexUrl" class="quick-btn"><i class="fas fa-house"></i><span>Dashboard</span></a>
              <a :href="profileUrl" class="quick-btn"><i class="fas fa-user"></i><span>Профиль</span></a>
              <a :href="adminUrl || indexUrl" class="quick-btn"><i class="fas fa-gear"></i><span>Админка</span></a>
              <a :href="loginUrl" class="quick-btn"><i class="fas fa-right-to-bracket"></i><span>Логин</span></a>
            </div>
          </section>

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
  --bg: #f8f6eb;
  --bg2: #f0ede0;
  --surface: #ffffff;
  --accent: #4f6f2f;
  --accent-warm: #7a8f3f;
  --text: #243523;
  --text2: #3d4a35;
  --text3: #5a6652;
  --accent-soft: rgba(79, 111, 47, 0.1);
  --border: rgba(79, 111, 47, 0.12);
  --error: #c53d3d;
  --warning: #c9972e;
  --info: #3a7bd5;
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

/* Фоновое изображение — солнечное утро, листва */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('https://sel.cdn-chatium.io/get/image_msk_09YXnJj0kv.1408x768.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    135deg,
    rgba(248, 246, 235, 0.78) 0%,
    rgba(240, 237, 224, 0.68) 50%,
    rgba(255, 255, 255, 0.55) 100%
  );
  backdrop-filter: blur(2px);
}

/* Солнечная дымка + микро-пылинки (без пиксельных орбов) */
.orbs {
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(66% 52% at 12% 90%, rgba(255, 243, 202, 0.34), transparent 74%),
    radial-gradient(58% 48% at 90% 12%, rgba(255, 243, 202, 0.28), transparent 76%),
    radial-gradient(42% 34% at 56% 48%, rgba(122, 143, 63, 0.08), transparent 78%);
  animation: light-ambient-shift 42s ease-in-out infinite alternate;
}

.orbs::before,
.orbs::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orbs::before {
  background-image: radial-gradient(rgba(122, 143, 63, 0.38) 0.6px, transparent 0.8px);
  background-size: 4px 4px;
  opacity: 0.028;
  mix-blend-mode: soft-light;
}

.orbs::after {
  inset: -12%;
  background:
    radial-gradient(50% 38% at 18% 14%, rgba(255, 243, 202, 0.24), transparent 74%),
    radial-gradient(44% 34% at 84% 86%, rgba(122, 143, 63, 0.1), transparent 76%);
  opacity: 0.2;
  mix-blend-mode: soft-light;
  animation: light-ambient-breathe 52s ease-in-out infinite alternate;
}

.orb {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fff3ca;
  mix-blend-mode: soft-light;
  opacity: 0.44;
  box-shadow:
    0 0 0 1px rgba(255, 243, 202, 0.22),
    0 0 12px rgba(255, 243, 202, 0.4),
    0 0 28px rgba(122, 143, 63, 0.16);
  animation:
    light-mote-drift 18s ease-in-out infinite,
    light-mote-pulse 5.2s ease-in-out infinite;
}

.orb-1 {
  top: 20%;
  right: 20%;
  animation-delay: 0s, -0.8s;
}

.orb-2 {
  width: 4px;
  height: 4px;
  bottom: 30%;
  left: 16%;
  opacity: 0.36;
  animation-delay: -6s, -2.4s;
}

.orb-3 {
  width: 3px;
  height: 3px;
  top: 60%;
  left: 38%;
  opacity: 0.3;
  animation-delay: -10s, -3.6s;
}

@keyframes light-ambient-shift {
  0% {
    transform: translate3d(-0.7%, -0.6%, 0);
  }
  100% {
    transform: translate3d(0.7%, 0.6%, 0);
  }
}

@keyframes light-ambient-breathe {
  0% {
    transform: translate3d(-1.1%, -0.7%, 0) scale(1);
  }
  100% {
    transform: translate3d(1%, 0.8%, 0) scale(1.04);
  }
}

@keyframes light-mote-drift {
  0%, 100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(14px, -11px, 0);
  }
}

@keyframes light-mote-pulse {
  0%, 100% {
    opacity: 0.24;
  }
  50% {
    opacity: 0.56;
  }
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.3);
  animation: fade 0.2s ease;
}
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }

.sidebar {
  width: 240px;
  height: 100vh;
  position: sticky;
  top: 0;
  padding: 24px 16px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border-right: 1px solid var(--border);
  box-shadow:
    2px 0 24px rgba(79, 111, 47, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
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
  color: white;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text { font-family: 'Old Standard TT', serif; font-size: 1.25rem; font-weight: 700; }
.toggle-btn {
  width: 32px;
  height: 32px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.toggle-btn:hover { background: var(--accent-soft); color: var(--accent); }

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
.nav-item:hover { background: var(--accent-soft); color: var(--accent); }
.nav-item.active { background: var(--accent); color: white; }

.sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border); }
.user-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border-radius: var(--radius);
  border: 1px solid rgba(79, 111, 47, 0.06);
}
.avatar {
  width: 36px;
  height: 36px;
  background: var(--accent);
  color: white;
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
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border);
  color: var(--text2);
}
.action-btn.icon:hover { background: var(--accent-soft); color: var(--accent); }
.action-btn.primary {
  background: var(--accent);
  color: white;
}
.action-btn.primary:hover { filter: brightness(1.08); }
.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--accent);
  color: white;
  border-radius: 9px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content { max-width: 1200px; }

.hero-section { margin-bottom: 32px; }
.hero-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 4px 32px rgba(79, 111, 47, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.sunray-diagonal {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 150%;
  height: 150%;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 243, 202, 0.25) 35%,
    transparent 55%
  );
  pointer-events: none;
  transform: rotate(-12deg);
}
.hero-tag {
  display: inline-block;
  padding: 6px 12px;
  background: var(--accent-soft);
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
  background: var(--accent-soft);
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
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow:
    0 4px 24px rgba(79, 111, 47, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
.stat-icon {
  width: 44px;
  height: 44px;
  background: var(--accent-soft);
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
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow:
    0 4px 24px rgba(79, 111, 47, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
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
  background: var(--accent-soft);
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
  background: var(--bg2);
  border-radius: var(--radius);
  color: var(--text2);
  text-decoration: none;
  transition: all 0.2s;
}
.quick-btn:hover { background: var(--accent-soft); color: var(--accent); }

.changelog-list { display: flex; flex-direction: column; gap: 12px; }
.changelog-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg2);
  border-radius: var(--radius);
}
.changelog-role {
  width: 32px;
  height: 32px;
  background: var(--accent-soft);
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
.tab.active { background: var(--accent); color: white; }
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
  background: var(--accent-soft);
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
.btn.primary { background: var(--accent); color: white; }
.btn.primary:hover:not(:disabled) { filter: brightness(1.08); }
.btn.secondary { background: var(--bg2); color: var(--text); }
.btn.secondary:hover { background: #e8e6df; }
.btn.ghost { background: transparent; color: var(--text2); }
.btn.ghost:hover { background: var(--accent-soft); color: var(--accent); }
.btn.outline { background: transparent; border: 1px solid var(--accent); color: var(--accent); }
.btn.outline:hover { background: var(--accent-soft); }
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: all 0.2s;
}
.input-wrap:focus-within { border-color: var(--accent); outline: none; box-shadow: 0 0 0 2px var(--accent-soft); }
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
  background: var(--surface);
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
  background: var(--surface);
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
.filter-tab.active { background: var(--accent); color: white; }
.filter-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.tag {
  padding: 8px 14px;
  background: var(--bg2);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text2);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.tag.active { background: var(--accent); color: white; }
.tag-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }

.notify-list { display: flex; flex-direction: column; gap: 12px; }
.notify {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg2);
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
  background: var(--surface);
  border: 1px solid var(--border);
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
.list-tag.new { background: var(--accent); color: white; }
.list-tag:not(.new) { background: var(--bg2); color: var(--text2); }
.list-body { flex: 1; min-width: 0; }
.list-title { display: block; font-weight: 600; font-size: 0.9rem; }
.list-desc { font-size: 0.85rem; color: var(--text3); }
.list-time { font-size: 0.85rem; color: var(--text3); flex-shrink: 0; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
th { font-size: 0.75rem; font-weight: 600; color: var(--text3); letter-spacing: 0.05em; }
.badge-status {
  padding: 4px 10px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 12px;
  font-size: 0.8rem;
}
.badge-status.muted { background: var(--bg2); color: var(--text2); }

.states-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.state-card {
  padding: 20px;
  background: var(--bg2);
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
  background: rgba(79, 111, 47, 0.12);
  border-radius: 4px;
  width: 100%;
}
.sk-line.short { width: 60%; }
.sk-line.mid { width: 80%; }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fade 0.2s ease;
}
.modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  box-shadow:
    0 24px 64px rgba(79, 111, 47, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 1);
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
.modal-close:hover { background: var(--accent-soft); color: var(--accent); }
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
  background: var(--bg2);
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
    background: var(--bg2);
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
