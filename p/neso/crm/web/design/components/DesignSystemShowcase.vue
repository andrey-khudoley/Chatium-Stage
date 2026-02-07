<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from './AppShell.vue'

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

const showModal = ref(true)

const themeName = computed(() => {
  if (typeof window === 'undefined') return 'dark'
  return window.__getTheme?.() || 'dark'
})

const isDarkTheme = computed(() => themeName.value === 'dark')
const pageTitle = computed(() => `CRM Design System · ${isDarkTheme.value ? 'Dark' : 'Light'}`)
const pageSubtitle = computed(() =>
  isDarkTheme.value
    ? 'Ночной лес: глубина, мягкий контраст, фокус на задаче'
    : 'Солнечная листва: воздух, чистота, лёгкая иерархия'
)

const navItems = computed(() => [
  { id: 'design-home', icon: 'fa-house', label: 'Главная', href: props.indexUrl },
  { id: 'design-profile', icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
  { id: 'design-admin', icon: 'fa-screwdriver-wrench', label: 'Админка', href: props.adminUrl || props.indexUrl },
  { id: 'design-layers', icon: 'fa-layer-group', label: 'Паттерны', href: props.indexUrl },
  { id: 'design-flows', icon: 'fa-filter', label: 'Фильтры', href: props.indexUrl }
])

const statCards = [
  { value: '42', label: 'UI-компонента', icon: 'fa-cubes' },
  { value: '18', label: 'Паттернов CRM', icon: 'fa-table-cells' },
  { value: '2', label: 'Равные темы', icon: 'fa-circle-half-stroke' },
  { value: 'AA', label: 'Контраст', icon: 'fa-circle-check' }
]

const quickActions = [
  { icon: 'fa-gauge-high', label: 'Dashboard' },
  { icon: 'fa-user', label: 'Профиль' },
  { icon: 'fa-gear', label: 'Админка' },
  { icon: 'fa-right-to-bracket', label: 'Логин' }
]

const changelog = [
  { tag: 'UX', text: 'Обновлён layout карточек обращений', ago: '4 мин назад' },
  { tag: 'DS', text: 'Добавлены токены focus/loading/error', ago: '11 мин назад' },
  { tag: 'QA', text: 'Проверен desktop-first сценарий', ago: '26 мин назад' }
]

const releaseBars = [
  { day: 'Пн', h: '46%' },
  { day: 'Вт', h: '63%' },
  { day: 'Ср', h: '58%' },
  { day: 'Чт', h: '88%' },
  { day: 'Пт', h: '71%' },
  { day: 'Сб', h: '51%' },
  { day: 'Вс', h: '38%' }
]

const topList = [
  { stage: 'HOT', title: 'Клиент 001 · #inq-2045', note: 'нужно уточнить сроки запуска первой рассылки', time: '10:02' },
  { stage: 'WAIT', title: 'Клиент 002 · #inq-2037', note: 'вернусь с решением сегодня вечером', time: '09:40' }
]

const tableRows = [
  { client: 'Мария Петрова', channel: 'WhatsApp', status: 'В работе', sla: '01:24' },
  { client: 'Иван Смирнов', channel: 'Telegram', status: 'Новый', sla: '00:41' },
  { client: 'Анна Орлова', channel: 'Email', status: 'Закрыт', sla: '03:12' }
]

const coverage = [
  { icon: 'fa-sitemap', text: 'Навигация и shell' },
  { icon: 'fa-sliders', text: 'Фильтры и поиск' },
  { icon: 'fa-table-list', text: 'Списки и карточки' },
  { icon: 'fa-table', text: 'Таблицы и статус' },
  { icon: 'fa-pen-to-square', text: 'Формы и валидация' },
  { icon: 'fa-bell', text: 'Уведомления' },
  { icon: 'fa-up-right-and-down-left-from-center', text: 'Модальные сценарии' },
  { icon: 'fa-wave-square', text: 'Loading / Empty / Error' }
]

const palette = computed(() =>
  isDarkTheme.value
    ? [
        { label: 'BACKGROUND', hex: '#05080A', token: 'var(--bg-primary)' },
        { label: 'SURFACE', hex: '#11191B', token: 'var(--bg-elevated)' },
        { label: 'ACCENT', hex: '#AFC45F', token: 'var(--accent-primary)' },
        { label: 'ACCENT DEEP', hex: '#6F8440', token: 'var(--accent-dark)' },
        { label: 'TEXT', hex: '#EEF4EB', token: 'var(--text-primary)' },
        { label: 'GLOW', hex: '#C5D879', token: 'var(--accent-light)' }
      ]
    : [
        { label: 'BACKGROUND', hex: '#F8FBE9', token: 'var(--bg-primary)' },
        { label: 'SURFACE', hex: '#FFFFFF', token: 'var(--bg-elevated)' },
        { label: 'ACCENT', hex: '#4F6F2F', token: 'var(--accent-primary)' },
        { label: 'ACCENT WARM', hex: '#7A8F3F', token: 'var(--accent-light)' },
        { label: 'TEXT', hex: '#243523', token: 'var(--text-primary)' },
        { label: 'SUNRAY', hex: '#FFF3CA', token: 'rgba(255,243,202,0.88)' }
      ]
)

function navigate(href?: string) {
  if (!href) return
  window.location.href = href
}
</script>

<template>
  <AppShell
    :pageTitle="pageTitle"
    :pageSubtitle="pageSubtitle"
    :navItems="navItems"
    activeSection="design-home"
    :userName="props.isAuthenticated ? 'Алексей' : 'Гость'"
    :userRole="props.isAuthenticated ? (props.isAdmin ? 'Admin' : 'Product') : 'Guest'"
    :logoText="'CRM DS'"
  >
    <template #headerActions>
      <button class="action-btn glass" type="button" aria-label="Поиск">
        <i class="fas fa-search"></i>
      </button>
      <button class="action-btn glass" type="button" aria-label="Уведомления">
        <i class="fas fa-comment-dots"></i>
        <span class="badge">3</span>
      </button>
      <button class="action-btn primary" type="button" @click="navigate(props.indexUrl)">
        <i class="fas fa-arrow-right"></i>
        <span>Открыть CRM</span>
      </button>
    </template>

    <section class="crm-ds-layout">
      <article class="crm-ds-panel crm-ds-hero">
        <div class="crm-ds-hero-main">
          <span class="crm-ds-kicker">NEW UI FOUNDATION</span>
          <h2 class="crm-ds-hero-title">A/Ley Services / Design Demo {{ isDarkTheme ? '' : '(Light)' }}</h2>
          <p class="crm-ds-hero-text">
            Полностью новый визуальный фундамент CRM: адаптивный shell, единые
            токены, компонентный каталог и стандартизированные состояния для
            масштабирования интерфейса.
          </p>
          <div class="crm-ds-hero-actions">
            <button class="btn-glow" type="button" @click="navigate(props.profileUrl)">
              <span>Открыть профиль</span>
              <i class="fas fa-arrow-right"></i>
            </button>
            <button class="btn-glass" type="button" @click="navigate(props.loginUrl)">Открыть auth-flow</button>
          </div>
        </div>
        <div class="crm-ds-hero-side">
          <button class="crm-ds-icon-tile" type="button" aria-label="Сетка"><i class="fas fa-table-cells-large"></i></button>
          <button class="crm-ds-icon-tile" type="button" aria-label="Фильтр"><i class="fas fa-filter"></i></button>
          <button class="crm-ds-icon-tile" type="button" aria-label="Чаты"><i class="fas fa-message"></i></button>
        </div>
      </article>

      <div class="crm-ds-stats-row">
        <article v-for="item in statCards" :key="item.label" class="crm-ds-panel crm-ds-stat-card">
          <div class="crm-ds-stat-icon"><i :class="['fas', item.icon]"></i></div>
          <div>
            <p class="crm-ds-stat-value">{{ item.value }}</p>
            <p class="crm-ds-stat-label">{{ item.label }}</p>
          </div>
        </article>
      </div>

      <div class="crm-ds-overview-row">
        <article class="crm-ds-panel crm-ds-overview-card">
          <header class="crm-ds-panel-head">
            <h3>Быстрые сценарии</h3>
          </header>
          <div class="crm-ds-actions-grid">
            <button v-for="action in quickActions" :key="action.label" class="crm-ds-action-pill" type="button">
              <i :class="['fas', action.icon]"></i>
              <span>{{ action.label }}</span>
            </button>
          </div>
        </article>

        <article class="crm-ds-panel crm-ds-overview-card">
          <header class="crm-ds-panel-head">
            <h3>Журнал изменений</h3>
            <span class="crm-ds-live-chip"><i class="fas fa-circle"></i> LIVE</span>
          </header>
          <div class="crm-ds-feed">
            <article v-for="entry in changelog" :key="entry.text" class="crm-ds-feed-item">
              <span class="crm-ds-feed-tag">{{ entry.tag }}</span>
              <div>
                <p>{{ entry.text }}</p>
                <small>{{ entry.ago }}</small>
              </div>
            </article>
          </div>
        </article>

        <article class="crm-ds-panel crm-ds-overview-card">
          <header class="crm-ds-panel-head">
            <h3>Релизная динамика</h3>
            <div class="crm-ds-tabs-mini">
              <button class="tab active" type="button">Неделя</button>
              <button class="tab" type="button">Месяц</button>
            </div>
          </header>
          <div class="crm-ds-release-bars">
            <div v-for="bar in releaseBars" :key="bar.day" class="crm-ds-release-col">
              <div class="crm-ds-release-bar" :style="{ '--h': bar.h }"></div>
              <span>{{ bar.day }}</span>
            </div>
          </div>
        </article>
      </div>

      <section class="crm-ds-section">
        <h2 class="crm-ds-section-title">Каталог компонентов CRM</h2>

        <div class="crm-ds-catalog-grid">
          <article class="crm-ds-panel crm-ds-catalog-card">
            <header class="crm-ds-panel-head"><h3>Кнопки и интеракции</h3></header>
            <div class="crm-ds-control-row">
              <button class="btn-glow" type="button">Primary</button>
              <button class="btn-glass" type="button">Secondary</button>
              <button class="btn-ghost" type="button">Ghost</button>
              <button class="btn-outline" type="button">Outline</button>
            </div>
            <div class="crm-ds-control-row">
              <button class="btn-glow" type="button"><i class="fas fa-paper-plane"></i> Action</button>
              <button class="btn-glass" type="button" disabled><i class="fas fa-lock"></i> Disabled</button>
              <button class="btn-glass" type="button"><i class="fas fa-spinner fa-spin"></i> Loading</button>
            </div>
          </article>

          <article class="crm-ds-panel crm-ds-catalog-card">
            <header class="crm-ds-panel-head"><h3>Форма и валидация</h3></header>
            <div class="crm-ds-field-stack">
              <label>
                <span>Имя клиента</span>
                <div class="input-group">
                  <i class="fas fa-user"></i>
                  <input type="text" value="Имя клиента" readonly />
                </div>
              </label>
              <label class="has-error">
                <span>Email</span>
                <div class="input-group">
                  <i class="fas fa-envelope"></i>
                  <input type="text" value="email@example.com" readonly />
                  <button class="input-action" type="button"><i class="fas fa-copy"></i></button>
                </div>
                <small>Нужен валидный адрес для уведомлений SLA</small>
              </label>
              <label>
                <span>Комментарий</span>
                <div class="crm-ds-textarea">
                  <textarea rows="3" readonly>Комментарий оператора</textarea>
                </div>
                <small>Поддерживаются markdown-ссылки и теги.</small>
              </label>
            </div>
          </article>

          <article class="crm-ds-panel crm-ds-catalog-card">
            <header class="crm-ds-panel-head"><h3>Фильтрация и поиск</h3></header>
            <div class="input-group">
              <i class="fas fa-search"></i>
              <input type="text" value="Поиск по клиенту, тегу, ID обращения" readonly />
            </div>
            <div class="crm-ds-control-row">
              <button class="tab active" type="button">Все</button>
              <button class="tab" type="button">Непрочитанные</button>
              <button class="tab" type="button">Открытые</button>
              <button class="tab" type="button">Мои</button>
            </div>
            <div class="crm-ds-chip-row">
              <span class="tag"><i class="fas fa-circle"></i> В работе</span>
              <span class="tag tag-light">Новый</span>
              <span class="tag">Приоритет</span>
              <span class="tag tag-muted">Архив</span>
            </div>
          </article>

          <article class="crm-ds-panel crm-ds-catalog-card">
            <header class="crm-ds-panel-head"><h3>Уведомления</h3></header>
            <div class="crm-ds-notice-list">
              <article class="crm-ds-notice success">
                <div>
                  <p>Настройки сохранены</p>
                  <small>только что</small>
                </div>
                <button class="btn-glass" type="button">Открыть</button>
              </article>
              <article class="crm-ds-notice warn">
                <div>
                  <p>SLA для Telegram не задан</p>
                  <small>нужна настройка</small>
                </div>
                <button class="btn-glass" type="button">Исправить</button>
              </article>
              <article class="crm-ds-notice info">
                <div>
                  <p>Доступна версия UI Kit v3.0</p>
                  <small>обновление дизайна</small>
                </div>
                <button class="btn-glass" type="button">Обновить</button>
              </article>
            </div>
          </article>
        </div>

        <article class="crm-ds-panel crm-ds-table-panel">
          <header class="crm-ds-panel-head"><h3>Список и таблица</h3></header>
          <div class="crm-ds-conversation-list">
            <article v-for="item in topList" :key="item.title" class="crm-ds-conversation-item">
              <span class="crm-ds-stage">{{ item.stage }}</span>
              <div>
                <p>{{ item.title }}</p>
                <small>{{ item.note }}</small>
              </div>
              <time>{{ item.time }}</time>
            </article>
          </div>
          <div class="crm-ds-table-wrap">
            <table class="crm-ds-table">
              <thead>
                <tr>
                  <th>Клиент</th>
                  <th>Канал</th>
                  <th>Статус</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in tableRows" :key="row.client">
                  <td>{{ row.client }}</td>
                  <td>{{ row.channel }}</td>
                  <td><span class="tag">{{ row.status }}</span></td>
                  <td>{{ row.sla }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="crm-ds-panel crm-ds-states-panel">
          <header class="crm-ds-panel-head"><h3>Состояния и модальные сценарии</h3></header>
          <div class="crm-ds-state-grid">
            <div class="crm-ds-state-item">
              <span class="crm-ds-state-title">Loading</span>
              <div class="crm-ds-spinner"></div>
              <p>Загружаем данные таблицы...</p>
            </div>
            <div class="crm-ds-state-item">
              <span class="crm-ds-state-title">Skeleton</span>
              <div class="crm-ds-skeleton-line"></div>
              <div class="crm-ds-skeleton-line short"></div>
            </div>
            <div class="crm-ds-state-item">
              <span class="crm-ds-state-title">Error</span>
              <p class="error-text">Ошибка сети: не удалось обновить логи</p>
              <button class="btn-outline" type="button">Повторить</button>
            </div>
            <div class="crm-ds-state-item">
              <span class="crm-ds-state-title">Empty</span>
              <p>Нет обращений по текущему фильтру.</p>
              <button class="btn-glass" type="button">Сбросить фильтр</button>
            </div>
          </div>

          <div class="crm-ds-modal-zone">
            <div v-if="showModal" class="crm-ds-modal-card">
              <header>
                <h4>Создать новое обращение</h4>
                <button class="btn-ghost" type="button" @click="showModal = false"><i class="fas fa-times"></i></button>
              </header>
              <div class="crm-ds-field-stack compact">
                <div class="input-group">
                  <i class="fas fa-user"></i>
                  <input type="text" value="Имя клиента" readonly />
                </div>
                <div class="input-group">
                  <i class="fas fa-phone"></i>
                  <input type="text" value="Телефон" readonly />
                </div>
                <div class="input-group">
                  <i class="fas fa-filter"></i>
                  <input type="text" value="Telegram" readonly />
                  <button class="input-action" type="button"><i class="fas fa-chevron-down"></i></button>
                </div>
              </div>
              <footer>
                <button class="btn-ghost" type="button">Отмена</button>
                <button class="btn-glow" type="button">Создать</button>
              </footer>
            </div>
            <div v-else class="crm-ds-modal-closed">
              <p>Модалка закрыта</p>
              <button class="btn-glass" type="button" @click="showModal = true">Открыть снова</button>
            </div>
          </div>
        </article>

        <article class="crm-ds-panel crm-ds-placeholder-panel">
          <i class="fas fa-seedling"></i>
          <h3>Новый раздел готов к наполнению</h3>
          <p>Используйте карточки и состояния выше как исходники для новых страниц CRM.</p>
          <div class="crm-ds-control-row center">
            <button class="btn-glow" type="button">Создать первый элемент</button>
            <button class="btn-glass" type="button">Открыть шаблоны</button>
          </div>
        </article>
      </section>

      <section class="crm-ds-section">
        <h2 class="crm-ds-section-title">Покрытие дизайн-системы</h2>
        <article class="crm-ds-panel crm-ds-coverage-panel">
          <span v-for="item in coverage" :key="item.text" class="crm-ds-coverage-chip">
            <i :class="['fas', item.icon]"></i>
            {{ item.text }}
          </span>
        </article>
      </section>

      <section class="crm-ds-section">
        <h2 class="crm-ds-section-title">Палитра темы</h2>
        <div class="crm-ds-palette-grid">
          <article v-for="item in palette" :key="item.label" class="crm-ds-palette-card">
            <div class="crm-ds-palette-swatch" :style="{ background: item.token }"></div>
            <p>{{ item.label }}</p>
            <strong>{{ item.hex }}</strong>
          </article>
        </div>
      </section>
    </section>
  </AppShell>
</template>
