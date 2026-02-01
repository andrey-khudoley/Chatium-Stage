<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import { saveSettingRoute } from '../api/settings/save'
import { logInfo, logWarn, logError } from '../shared/logger'

declare const ctx: app.Ctx

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
}>()

const bootLoaderDone = ref(false)
const logLevel = ref<'info' | 'warn' | 'error' | 'disable'>('info')
const logLevelError = ref('')
const errorCount = ref(0)
const warnCount = ref(0)

const logFilters = ref({
  info: true,
  warn: true,
  error: true
})

const toggleLogFilter = (level: 'info' | 'warn' | 'error') => {
  logFilters.value[level] = !logFilters.value[level]
}

const startAnimations = () => {
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

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
})

const setLogLevel = async (level: 'info' | 'warn' | 'error' | 'disable') => {
  const prev = logLevel.value
  logLevel.value = level
  logLevelError.value = ''
  try {
    const res = await saveSettingRoute.run(ctx, { key: 'log_level', value: level })
    if (res && (res as { success?: boolean }).success === false) {
      logLevel.value = prev
      logLevelError.value = (res as { error?: string }).error || 'Ошибка сохранения'
    }
  } catch (e) {
    logLevel.value = prev
    logLevelError.value = (e as Error)?.message || 'Ошибка сохранения'
  }
}

const resetDashboard = () => {
  errorCount.value = 0
  warnCount.value = 0
}

const openChatiumLink = () => {
  window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
}
</script>

<template>
  <div class="app-layout bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
    <GlobalGlitch />
    <Header
      v-if="bootLoaderDone"
      :projectTitle="props.projectTitle"
      :indexUrl="props.indexUrl"
      :profileUrl="props.profileUrl"
      :loginUrl="props.loginUrl"
      :isAuthenticated="props.isAuthenticated"
      :isAdmin="props.isAdmin"
      :adminUrl="props.adminUrl"
    />

    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner">
        <section class="admin-section" :class="{ 'admin-visible': bootLoaderDone }">
          <div class="admin-header">
            <div class="admin-icon-wrapper">
              <i class="fas fa-cog admin-icon"></i>
            </div>
            <h1 class="admin-heading">Панель администратора</h1>
            <p class="admin-description">Управление логированием и мониторинг системы</p>
          </div>

          <!-- Logging Level -->
          <div class="admin-card">
            <div class="admin-card-header">
              <i class="fas fa-sliders-h admin-card-icon"></i>
              <h2 class="admin-card-title">Уровень логирования</h2>
            </div>
            <div class="log-level-buttons">
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'info' }"
                @click="setLogLevel('info')"
              >
                Info
              </button>
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'warn' }"
                @click="setLogLevel('warn')"
              >
                Warn
              </button>
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'error' }"
                @click="setLogLevel('error')"
              >
                Error
              </button>
              <button
                type="button"
                class="log-level-btn"
                :class="{ active: logLevel === 'disable' }"
                @click="setLogLevel('disable')"
              >
                Disable
              </button>
            </div>
            <p v-if="logLevelError" class="admin-card-error">{{ logLevelError }}</p>
          </div>

          <!-- Dashboard -->
          <div class="admin-card">
            <div class="admin-card-header">
              <i class="fas fa-chart-bar admin-card-icon"></i>
              <h2 class="admin-card-title">Дашборд</h2>
              <button
                type="button"
                class="dashboard-reset"
                title="Сбросить счётчики"
                @click="resetDashboard"
              >
                Сбросить
              </button>
            </div>
            <div class="dashboard-stats">
              <div class="dashboard-stat stat-errors">
                <span class="stat-value">{{ errorCount }}</span>
                <span class="stat-label">Ошибок</span>
                <i class="fas fa-exclamation-circle stat-icon"></i>
              </div>
              <div class="dashboard-stat stat-warnings">
                <span class="stat-value">{{ warnCount }}</span>
                <span class="stat-label">Предупреждений</span>
                <i class="fas fa-exclamation-triangle stat-icon"></i>
              </div>
            </div>
          </div>

          <!-- Logs Output -->
          <div class="admin-card logs-card">
            <div class="admin-card-header">
              <i class="fas fa-terminal admin-card-icon"></i>
              <h2 class="admin-card-title">Логи</h2>
            </div>
            <div class="logs-filters">
              <button
                type="button"
                class="log-filter-chip chip-info"
                :class="{ active: logFilters.info }"
                @click="toggleLogFilter('info')"
              >
                <i class="fas fa-info-circle"></i>
                Info
              </button>
              <button
                type="button"
                class="log-filter-chip chip-warn"
                :class="{ active: logFilters.warn }"
                @click="toggleLogFilter('warn')"
              >
                <i class="fas fa-exclamation-triangle"></i>
                Warn
              </button>
              <button
                type="button"
                class="log-filter-chip chip-error"
                :class="{ active: logFilters.error }"
                @click="toggleLogFilter('error')"
              >
                <i class="fas fa-exclamation-circle"></i>
                Error
              </button>
            </div>
            <div class="logs-output">
              <pre class="logs-content">Логи появятся здесь...</pre>
            </div>
          </div>
        </section>
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />
  </div>
</template>

<style>
.content-wrapper {
  position: relative;
  z-index: 10;
}

.content-inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .content-inner {
    padding: 1.5rem 1rem;
  }
}
</style>

<style scoped>
.admin-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.admin-section.admin-visible {
  opacity: 1;
  transform: translateY(0);
}

.admin-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.admin-icon-wrapper {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.25rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 6px 20px rgba(211, 35, 75, 0.35),
    0 0 24px rgba(211, 35, 75, 0.15);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.admin-icon {
  font-size: 1.5rem;
  color: #fff;
}

.admin-heading {
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  letter-spacing: 0.05em;
}

.admin-description {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin: 0;
}

/* Admin Cards */
.admin-card {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
}

.admin-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
}

.admin-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.admin-card-icon {
  color: var(--color-accent);
  font-size: 1rem;
}

.admin-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
}

/* Log Level Buttons */
.log-level-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.log-level-btn {
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.05em;
}

.log-level-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-light);
  background: rgba(255, 255, 255, 0.05);
}

.log-level-btn.active {
  color: #fff;
  background: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 0 12px rgba(211, 35, 75, 0.3);
}

.admin-card-error {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: #e74c3c;
}

/* Dashboard */
.dashboard-reset {
  padding: 0.25rem 0.6rem;
  font-family: inherit;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  letter-spacing: 0.04em;
}

.dashboard-reset:hover {
  color: var(--color-text-secondary);
}

.dashboard-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.dashboard-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  min-width: 140px;
}

.dashboard-stat .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.dashboard-stat .stat-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  flex: 1;
}

.stat-icon {
  font-size: 1.25rem;
  opacity: 0.6;
}

.stat-errors .stat-value,
.stat-errors .stat-icon {
  color: #e74c3c;
}

.stat-warnings .stat-value,
.stat-warnings .stat-icon {
  color: #f39c12;
}

/* Logs Output */
.logs-card {
  margin-bottom: 0;
}

.logs-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.log-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.04em;
}

.log-filter-chip:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-border-light);
  background: rgba(255, 255, 255, 0.05);
}

.log-filter-chip.active {
  color: var(--color-text);
}

.log-filter-chip i {
  font-size: 0.75rem;
  opacity: 0.9;
}

.log-filter-chip.chip-info.active {
  border-color: #3498db;
  background: rgba(52, 152, 219, 0.12);
}

.log-filter-chip.chip-info.active i {
  color: #3498db;
}

.log-filter-chip.chip-warn.active {
  border-color: #f39c12;
  background: rgba(243, 156, 18, 0.12);
}

.log-filter-chip.chip-warn.active i {
  color: #f39c12;
}

.log-filter-chip.chip-error.active {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.12);
}

.log-filter-chip.chip-error.active i {
  color: #e74c3c;
}

.logs-output {
  background: #080808;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  min-height: 200px;
  max-height: 400px;
  overflow: auto;
  padding: 1rem;
}

.logs-content {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .admin-heading {
    font-size: 1.6rem;
  }

  .admin-card {
    padding: 1.25rem;
  }

  .dashboard-stat {
    min-width: 100%;
  }
}
</style>
