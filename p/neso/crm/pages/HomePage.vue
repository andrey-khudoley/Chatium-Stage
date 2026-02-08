<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { createComponentLogger } from '../shared/logger'
import {
  DcButton,
  DcCard,
  DcDemoSidebar,
  DcHeaderActions,
  DcHeroCard,
  DcPageHeader,
  type NavItem
} from '../components'
import { DcAppShell, DcMain } from '../layout'

const log = createComponentLogger('HomePage')

declare global {
  interface Window {
    hideAppLoader?: () => void
    bootLoaderComplete?: boolean
  }
}

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

const theme = 'dark' as const
const bootLoaderDone = ref(false)
const sidebarCollapsed = ref(false)
const sidebarOpen = ref(false)
const activeSection = ref('dashboard')

const navIdToUrl = computed<Record<string, string>>(() => ({
  dashboard: props.indexUrl,
  inquiries: props.inquiriesUrl ?? '',
  profile: props.profileUrl,
  admin: props.adminUrl ?? '',
  tests: props.testsUrl ?? '',
  login: props.loginUrl
}))

const menuItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная' },
    { id: 'inquiries', icon: 'fa-layer-group', label: 'Компоненты' },
    { id: 'profile', icon: 'fa-user', label: 'Профиль' },
    { id: 'admin', icon: 'fa-gear', label: 'Админка' },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты' },
    { id: 'login', icon: 'fa-right-to-bracket', label: 'Логин' }
  ]
  return items.filter((item) => navIdToUrl.value[item.id])
})

const heroDescription = computed(() => {
  return `${props.projectDescription}. Базовый контур уже собран, ключевые бизнес-сценарии внедряются поэтапно.`
})

const primaryAction = computed(() => {
  if (props.isAuthenticated) {
    return {
      label: 'Открыть рабочую область',
      href: props.inquiriesUrl || props.indexUrl,
      icon: 'fa-layer-group'
    }
  }
  return {
    label: 'Войти в систему',
    href: props.loginUrl,
    icon: 'fa-right-to-bracket'
  }
})

const roadmapItems = computed(() => [
  {
    id: 'foundation',
    title: 'Ядро интерфейса',
    note: 'Навигация, shell и базовая дизайн-система.',
    state: 'готово'
  },
  {
    id: 'sales',
    title: 'Сценарии продаж',
    note: 'Карточка клиента, обработка обращений и статусы сделок.',
    state: 'в работе'
  },
  {
    id: 'automation',
    title: 'Автоматизация и отчёты',
    note: 'Триггеры, интеграции и итоговая аналитика.',
    state: 'план'
  }
])

const moduleCards = computed(() => [
  {
    id: 'overview',
    title: 'Главный контур',
    description: 'Структура проекта и базовая навигация уже стабилизированы.',
    tone: 'ready',
    actionLabel: 'Текущий экран',
    href: props.indexUrl
  },
  {
    id: 'workspace',
    title: 'Рабочие модули',
    description: props.isAuthenticated
      ? 'Компоненты и тестовые сценарии доступны для просмотра.'
      : 'Открываются после авторизации пользователя.',
    tone: props.isAuthenticated ? 'progress' : 'planned',
    actionLabel: props.isAuthenticated ? 'Открыть модули' : 'Авторизация',
    href: props.isAuthenticated ? props.inquiriesUrl || props.indexUrl : props.loginUrl
  },
  {
    id: 'admin',
    title: 'Админ-инструменты',
    description: props.isAdmin
      ? 'Панель администрирования подключена и доступна по роли Admin.'
      : 'Раздел готов, но доступен только администраторам.',
    tone: props.isAdmin ? 'ready' : 'planned',
    actionLabel: props.isAdmin ? 'Открыть админку' : 'Проверить доступ',
    href: props.isAdmin && props.adminUrl ? props.adminUrl : props.loginUrl
  }
])

const developmentSignals = computed(() => [
  {
    id: 'status',
    label: 'Статус',
    value: 'Система в разработке'
  },
  {
    id: 'sprint',
    label: 'Текущий этап',
    value: 'UI foundation и core-flow'
  },
  {
    id: 'focus',
    label: 'Фокус релиза',
    value: 'Стабильный CRM-контур'
  }
])

const releaseNote = computed(() => {
  if (props.isAuthenticated) {
    return 'Доступны базовые разделы. Следующий шаг: расширение клиентских сценариев и автоматизации.'
  }
  return 'Демо-контур доступен в режиме просмотра. Для рабочих сценариев требуется авторизация.'
})

const profileActionHref = computed(() => {
  return props.isAuthenticated ? props.profileUrl : props.loginUrl
})

const profileActionLabel = computed(() => {
  return props.isAuthenticated ? 'Открыть профиль' : 'Авторизоваться'
})

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebarMobile() {
  sidebarOpen.value = !sidebarOpen.value
}

function onSidebarSelect(id: string) {
  const url = navIdToUrl.value[id]
  if (url) window.location.href = url
}

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

onUnmounted(() => {
  window.removeEventListener('bootloader-complete', startAnimations)
})
</script>

<template>
  <DcAppShell
    :theme="theme"
    :ready="bootLoaderDone"
    :sidebar-collapsed="sidebarCollapsed"
    :sidebar-open="sidebarOpen"
    @close-sidebar="closeSidebar"
  >
    <template #sidebar>
      <DcDemoSidebar
        :theme="theme"
        logo-text="NeSo CRM"
        :user-name="props.isAuthenticated ? 'Пользователь' : 'Гость'"
        :user-role="props.isAuthenticated ? (props.isAdmin ? 'Admin' : 'User') : 'Guest'"
        :logout-url="loginUrl"
        :items="menuItems"
        :collapsed="sidebarCollapsed"
        :mobile-open="sidebarOpen"
        :active-id="activeSection"
        @close="closeSidebar"
        @select="onSidebarSelect"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />
    </template>
    <template #header>
      <DcPageHeader
        :theme="theme"
        :title="projectTitle"
        :breadcrumbs="['Главная', 'Сводка']"
        :show-menu-toggle="true"
        @menu-toggle="toggleSidebarMobile"
      >
        <template #actions>
          <DcHeaderActions :theme="theme" :index-url="indexUrl" :notification-count="0" />
        </template>
      </DcPageHeader>
    </template>

    <DcMain>
      <section class="home-page" :class="{ 'home-page--ready': bootLoaderDone }">
        <div class="home-hero-grid">
          <DcHeroCard
            :theme="theme"
            :title="projectName"
            :desc="heroDescription"
          >
            <template #actions>
              <div class="hero-actions">
                <div class="hero-actions-row">
                  <DcButton
                    :theme="theme"
                    variant="primary"
                    :icon="primaryAction.icon"
                    :href="primaryAction.href"
                  >
                    {{ primaryAction.label }}
                  </DcButton>
                  <DcButton
                    :theme="theme"
                    variant="secondary"
                    icon="fa-user"
                    :href="profileActionHref"
                  >
                    {{ profileActionLabel }}
                  </DcButton>
                </div>
                <div class="hero-status-row">
                  <span class="home-status-pill home-status-pill--accent">
                    <i class="fas fa-screwdriver-wrench" aria-hidden="true"></i>
                    Система в активной разработке
                  </span>
                  <span class="home-status-pill">
                    <i class="fas fa-shield-heart" aria-hidden="true"></i>
                    Приоритет: стабильный user-flow
                  </span>
                </div>
              </div>
            </template>
          </DcHeroCard>

          <DcCard :theme="theme" title="Состояние релиза">
            <div class="release-panel">
              <p class="release-note">{{ releaseNote }}</p>
              <div class="release-list">
                <article
                  v-for="item in roadmapItems"
                  :key="item.id"
                  class="release-item"
                >
                  <span class="release-state">{{ item.state }}</span>
                  <div>
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.note }}</p>
                  </div>
                </article>
              </div>
            </div>
          </DcCard>
        </div>

        <div class="home-cards-grid">
          <DcCard :theme="theme" title="Модульная готовность">
            <div class="module-list">
              <article
                v-for="module in moduleCards"
                :key="module.id"
                class="module-item"
              >
                <div class="module-heading">
                  <h3>{{ module.title }}</h3>
                  <span
                    class="module-tone"
                    :class="`module-tone--${module.tone}`"
                  >
                    {{ module.tone === 'ready' ? 'Готово' : module.tone === 'progress' ? 'В работе' : 'План' }}
                  </span>
                </div>
                <p>{{ module.description }}</p>
                <a :href="module.href" class="module-link">
                  {{ module.actionLabel }}
                  <i class="fas fa-arrow-right" aria-hidden="true"></i>
                </a>
              </article>
            </div>
          </DcCard>

          <DcCard :theme="theme" title="Текущий фокус разработки">
            <div class="signal-list">
              <article
                v-for="signal in developmentSignals"
                :key="signal.id"
                class="signal-item"
              >
                <p class="signal-label">{{ signal.label }}</p>
                <p class="signal-value">{{ signal.value }}</p>
              </article>
            </div>
          </DcCard>
        </div>
      </section>
    </DcMain>
  </DcAppShell>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.home-page--ready {
  opacity: 1;
  transform: translateY(0);
}

.home-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
  gap: 24px;
  align-items: stretch;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.hero-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.home-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  color: rgba(238, 244, 235, 0.78);
  border: 1px solid rgba(175, 196, 95, 0.2);
  background: rgba(175, 196, 95, 0.08);
}

.home-status-pill--accent {
  color: #eef4eb;
  border-color: rgba(175, 196, 95, 0.35);
  background: linear-gradient(135deg, rgba(175, 196, 95, 0.2), rgba(175, 196, 95, 0.08));
}

.release-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.release-note {
  margin: 0;
  color: rgba(238, 244, 235, 0.75);
  line-height: 1.6;
}

.release-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.release-item {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(175, 196, 95, 0.16);
  background: rgba(9, 15, 17, 0.55);
}

.release-state {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #afc45f;
}

.release-item h3 {
  margin: 0 0 6px 0;
  font-size: 0.95rem;
  color: #eef4eb;
}

.release-item p {
  margin: 0;
  font-size: 0.88rem;
  color: rgba(238, 244, 235, 0.72);
  line-height: 1.45;
}

.home-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-item {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid rgba(175, 196, 95, 0.14);
  background: rgba(9, 15, 17, 0.5);
}

.module-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.module-heading h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #eef4eb;
}

.module-tone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid transparent;
}

.module-tone--ready {
  color: #a8e2b4;
  border-color: rgba(116, 215, 146, 0.35);
  background: rgba(116, 215, 146, 0.16);
}

.module-tone--progress {
  color: #f2d38b;
  border-color: rgba(242, 189, 93, 0.35);
  background: rgba(242, 189, 93, 0.16);
}

.module-tone--planned {
  color: #9fb2ff;
  border-color: rgba(133, 168, 255, 0.35);
  background: rgba(133, 168, 255, 0.16);
}

.module-item p {
  margin: 10px 0 12px;
  color: rgba(238, 244, 235, 0.72);
  line-height: 1.5;
}

.module-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #afc45f;
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 700;
}

.module-link:hover {
  color: #c6da7d;
}

.signal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signal-item {
  border: 1px solid rgba(175, 196, 95, 0.14);
  background: rgba(9, 15, 17, 0.5);
  border-radius: 12px;
  padding: 14px;
}

.signal-label {
  margin: 0 0 6px 0;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(238, 244, 235, 0.58);
}

.signal-value {
  margin: 0;
  font-size: 0.98rem;
  color: #eef4eb;
}

@media (max-width: 1180px) {
  .home-hero-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .home-cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-actions-row {
    width: 100%;
  }

  .hero-actions-row :deep(.dc-btn) {
    width: 100%;
    justify-content: center;
  }

  .home-status-pill {
    width: 100%;
    justify-content: center;
  }

  .module-heading {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
