<script setup lang="ts">
import { computed } from 'vue'
import AppShell from '../web/design/components/AppShell.vue'
import { createComponentLogger } from '../shared/logger'

const log = createComponentLogger('HomePage')

const props = defineProps<{
  projectName: string
  projectTitle: string
  projectDescription: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
  testsUrl?: string
  inquiriesUrl?: string
}>()

const projectName = computed(() => props.projectTitle.split(' / ')[0] || props.projectTitle)

const navItems = computed(() =>
  [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная', href: props.indexUrl },
    { id: 'inquiries', icon: 'fa-comments', label: 'Обращения', href: props.inquiriesUrl },
    { id: 'profile', icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
    { id: 'admin', icon: 'fa-gear', label: 'Админка', href: props.adminUrl },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты', href: props.testsUrl }
  ].filter((item) => item.href)
)

const stats = [
  { value: '2.4K', label: 'Пользователей', icon: 'fa-users' },
  { value: '147', label: 'Курсов', icon: 'fa-graduation-cap' },
  { value: '98%', label: 'Довольных', icon: 'fa-heart' },
  { value: '4.9', label: 'Рейтинг', icon: 'fa-star' }
]

function navigate(href?: string) {
  if (!href) return
  window.location.href = href
}

log.info('Home page rendered')
</script>

<template>
  <AppShell
    :pageTitle="'Главная'"
    :pageSubtitle="projectName"
    :navItems="navItems"
    activeSection="dashboard"
    :userName="props.isAuthenticated ? 'Алексей' : 'Гость'"
    :userRole="props.isAuthenticated ? (props.isAdmin ? 'Admin' : 'User') : 'Guest'"
  >
    <template #headerActions>
      <button class="action-btn glass" type="button" @click="navigate(props.profileUrl)">
        <i class="fas fa-user"></i>
      </button>
      <button v-if="props.testsUrl" class="action-btn glass" type="button" @click="navigate(props.testsUrl)">
        <i class="fas fa-flask"></i>
      </button>
      <button class="action-btn primary" type="button" @click="navigate(props.isAuthenticated ? props.profileUrl : props.loginUrl)">
        <i class="fas fa-arrow-right"></i>
        <span>{{ props.isAuthenticated ? 'В кабинет' : 'Войти' }}</span>
      </button>
    </template>

    <section class="bento-grid">
      <div class="bento-item hero-card">
        <div class="hero-content">
          <span class="hero-tag">
            <i class="fas fa-sparkles"></i>
            CRM
          </span>
          <h2 class="hero-title">{{ projectName }}</h2>
          <p class="hero-desc">{{ props.projectDescription }}</p>
          <div class="hero-actions">
            <button class="btn-glow" type="button" @click="navigate(props.isAuthenticated ? props.profileUrl : props.loginUrl)">
              <span>{{ props.isAuthenticated ? 'Открыть профиль' : 'Войти' }}</span>
              <i class="fas fa-arrow-right"></i>
            </button>
            <button
              v-if="props.adminUrl"
              class="btn-ghost"
              type="button"
              @click="navigate(props.adminUrl)"
            >
              Админка
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="floating-card card-1">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="floating-card card-2">
            <i class="fas fa-user-check"></i>
          </div>
          <div class="floating-card card-3">
            <i class="fas fa-bolt"></i>
          </div>
        </div>
      </div>

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

      <div class="bento-item actions-card">
        <h3 class="card-title">Быстрые действия</h3>
        <div class="quick-actions">
          <button class="quick-btn" type="button" @click="navigate(props.profileUrl)">
            <div class="quick-icon"><i class="fas fa-user"></i></div>
            <span>Профиль</span>
          </button>
          <button v-if="props.adminUrl" class="quick-btn" type="button" @click="navigate(props.adminUrl)">
            <div class="quick-icon"><i class="fas fa-gear"></i></div>
            <span>Админка</span>
          </button>
          <button v-if="props.testsUrl" class="quick-btn" type="button" @click="navigate(props.testsUrl)">
            <div class="quick-icon"><i class="fas fa-flask"></i></div>
            <span>Тесты</span>
          </button>
          <button class="quick-btn" type="button" @click="navigate(props.loginUrl)">
            <div class="quick-icon"><i class="fas fa-right-to-bracket"></i></div>
            <span>Логин</span>
          </button>
        </div>
      </div>

      <div class="bento-item activity-card">
        <div class="card-header">
          <h3 class="card-title">Статус системы</h3>
          <span class="live-badge">
            <span class="live-dot"></span>
            Live
          </span>
        </div>
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-avatar">OK</div>
            <div class="activity-info">
              <span class="activity-name">Сервисы доступны</span>
              <span class="activity-time">обновлено сейчас</span>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-avatar">API</div>
            <div class="activity-info">
              <span class="activity-name">API отвечает</span>
              <span class="activity-time">200 ms</span>
            </div>
          </div>
          <div class="activity-item">
            <div class="activity-avatar">DB</div>
            <div class="activity-info">
              <span class="activity-name">База данных</span>
              <span class="activity-time">без ошибок</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bento-item chart-card">
        <div class="card-header">
          <h3 class="card-title">Активность</h3>
          <div class="chart-tabs">
            <button class="tab active" type="button">Неделя</button>
            <button class="tab" type="button">Месяц</button>
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
  </AppShell>
</template>
