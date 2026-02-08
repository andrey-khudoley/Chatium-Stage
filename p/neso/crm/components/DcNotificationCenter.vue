<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export type NotificationTone = 'critical' | 'warning' | 'info' | 'success'

export interface NotificationCenterItem {
  id: string
  source: string
  title: string
  message: string
  time: string
  tone?: NotificationTone
  unread?: boolean
  actionLabel?: string
  icon?: string
}

const props = withDefaults(defineProps<{
  theme?: 'dark' | 'light'
  notificationCount?: number
  notifications?: NotificationCenterItem[]
}>(), {
  theme: 'dark'
})

const isOpen = ref(false)
const filter = ref<'all' | 'unread' | 'priority'>('all')
const readIds = ref<string[]>([])
const rootRef = ref<HTMLElement | null>(null)

const demoNotifications: NotificationCenterItem[] = [
  {
    id: 'sla-critical',
    source: 'Поддержка',
    title: 'SLA истекает через 12 минут',
    message: 'Обращение #2418 в Telegram требует ответа до 14:30.',
    time: 'только что',
    tone: 'critical',
    unread: true,
    actionLabel: 'Открыть обращение',
    icon: 'fas fa-stopwatch'
  },
  {
    id: 'new-lead',
    source: 'CRM',
    title: 'Новый лид из лендинга "Весна 2026"',
    message: 'Канал: WhatsApp. Приоритет: высокий. Назначить менеджера.',
    time: '2 мин назад',
    tone: 'info',
    unread: true,
    actionLabel: 'Назначить',
    icon: 'fas fa-user-plus'
  },
  {
    id: 'payments-ok',
    source: 'Платежи',
    title: 'Автосписания обработаны без ошибок',
    message: '47 оплат успешно синхронизированы в карточках клиентов.',
    time: '7 мин назад',
    tone: 'success',
    unread: true,
    actionLabel: 'Смотреть отчёт',
    icon: 'fas fa-circle-check'
  },
  {
    id: 'campaign-warning',
    source: 'Маркетинг',
    title: 'Бюджет кампании почти исчерпан',
    message: 'Осталось 8% дневного бюджета в канале VK Ads.',
    time: '31 мин назад',
    tone: 'warning',
    unread: false,
    actionLabel: 'Пополнить',
    icon: 'fas fa-chart-line'
  },
  {
    id: 'security-login',
    source: 'Безопасность',
    title: 'Вход с нового устройства',
    message: 'Профиль admin@neso.pro, устройство: macOS, Санкт-Петербург.',
    time: '58 мин назад',
    tone: 'info',
    unread: false,
    actionLabel: 'Проверить',
    icon: 'fas fa-shield-halved'
  }
]

const allNotifications = computed(() =>
  props.notifications?.length ? props.notifications : demoNotifications
)
const readSet = computed(() => new Set(readIds.value))
const totalCount = computed(() => allNotifications.value.length)
const unreadCount = computed(() =>
  allNotifications.value.filter((item) => isUnread(item)).length
)
const readUnreadCount = computed(() =>
  allNotifications.value.filter((item) => !!item.unread && readSet.value.has(item.id)).length
)
const priorityCount = computed(() =>
  allNotifications.value.filter((item) => isPriority(item)).length
)
const badgeCount = computed(() =>
  props.notificationCount !== undefined
    ? Math.max(props.notificationCount - readUnreadCount.value, 0)
    : unreadCount.value
)
const badgeLabel = computed(() => (badgeCount.value > 99 ? '99+' : String(badgeCount.value)))
const filteredNotifications = computed(() => {
  if (filter.value === 'unread') {
    return allNotifications.value.filter((item) => isUnread(item))
  }
  if (filter.value === 'priority') {
    return allNotifications.value.filter((item) => isPriority(item))
  }
  return allNotifications.value
})

function isPriority(item: NotificationCenterItem): boolean {
  return item.tone === 'critical' || item.tone === 'warning'
}

function isUnread(item: NotificationCenterItem): boolean {
  return !!item.unread && !readSet.value.has(item.id)
}

function getIcon(item: NotificationCenterItem): string {
  if (item.icon) return item.icon
  if (item.tone === 'critical') return 'fas fa-circle-exclamation'
  if (item.tone === 'warning') return 'fas fa-triangle-exclamation'
  if (item.tone === 'success') return 'fas fa-circle-check'
  return 'fas fa-circle-info'
}

function togglePanel() {
  isOpen.value = !isOpen.value
}

function closePanel() {
  isOpen.value = false
}

function markAsRead(id: string) {
  if (readSet.value.has(id)) return
  readIds.value = [...readIds.value, id]
}

function markAllAsRead() {
  const unreadIds = allNotifications.value.filter((item) => item.unread).map((item) => item.id)
  readIds.value = Array.from(new Set([...readIds.value, ...unreadIds]))
}

function handleOutsidePointer(event: PointerEvent) {
  const target = event.target as Node | null
  if (!isOpen.value || !rootRef.value || !target) return
  if (!rootRef.value.contains(target)) closePanel()
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') closePanel()
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsidePointer)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsidePointer)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div ref="rootRef" class="dc-notification-center" :class="`theme-${theme}`">
    <button
      type="button"
      class="dc-action-btn dc-action-btn-icon dc-notification-toggle"
      :class="{ 'is-active': isOpen }"
      aria-label="Уведомления"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="togglePanel"
    >
      <i class="fas fa-bell"></i>
      <span v-if="badgeCount > 0" class="dc-badge">{{ badgeLabel }}</span>
    </button>

    <transition name="dc-notification-pop">
      <section
        v-if="isOpen"
        class="dc-notification-panel"
        role="dialog"
        aria-label="Центр уведомлений"
      >
        <header class="dc-notification-panel__header">
          <div>
            <span class="dc-notification-panel__eyebrow">Realtime feed</span>
            <h3>Уведомления</h3>
          </div>
          <button
            type="button"
            class="dc-notification-panel__mark-all"
            :disabled="unreadCount === 0"
            @click="markAllAsRead"
          >
            Прочитать все
          </button>
        </header>

        <div class="dc-notification-panel__filters">
          <button
            type="button"
            class="dc-filter-chip"
            :class="{ 'is-active': filter === 'all' }"
            @click="filter = 'all'"
          >
            Все <span>{{ totalCount }}</span>
          </button>
          <button
            type="button"
            class="dc-filter-chip"
            :class="{ 'is-active': filter === 'unread' }"
            @click="filter = 'unread'"
          >
            Непрочитанные <span>{{ unreadCount }}</span>
          </button>
          <button
            type="button"
            class="dc-filter-chip"
            :class="{ 'is-active': filter === 'priority' }"
            @click="filter = 'priority'"
          >
            Приоритет <span>{{ priorityCount }}</span>
          </button>
        </div>

        <ul v-if="filteredNotifications.length" class="dc-notification-list">
          <li v-for="item in filteredNotifications" :key="item.id">
            <article
              class="dc-notification-item"
              :class="[
                `tone-${item.tone ?? 'info'}`,
                { 'is-unread': isUnread(item) }
              ]"
            >
              <div class="dc-notification-item__icon">
                <i :class="getIcon(item)"></i>
              </div>
              <div class="dc-notification-item__body">
                <div class="dc-notification-item__meta">
                  <span class="dc-notification-item__source">{{ item.source }}</span>
                  <span class="dc-notification-item__time">{{ item.time }}</span>
                </div>
                <p class="dc-notification-item__title">{{ item.title }}</p>
                <p class="dc-notification-item__message">{{ item.message }}</p>
                <button
                  v-if="item.actionLabel"
                  type="button"
                  class="dc-notification-item__action"
                  @click="markAsRead(item.id)"
                >
                  {{ item.actionLabel }}
                </button>
              </div>
              <button
                v-if="isUnread(item)"
                type="button"
                class="dc-notification-item__read-dot"
                aria-label="Отметить как прочитанное"
                @click="markAsRead(item.id)"
              ></button>
            </article>
          </li>
        </ul>

        <div v-else class="dc-notification-empty">
          <i class="fas fa-check-circle"></i>
          <p>Новых уведомлений по выбранному фильтру нет</p>
        </div>
      </section>
    </transition>
  </div>
</template>

<style scoped>
.dc-notification-center {
  --accent: #afc45f;
  --text: #eef4eb;
  --text2: rgba(238, 244, 235, 0.78);
  --text3: rgba(238, 244, 235, 0.58);
  --panel-bg: rgba(9, 14, 16, 0.86);
  --panel-border: rgba(175, 196, 95, 0.26);
  --panel-shadow: 0 24px 48px rgba(0, 0, 0, 0.42), 0 10px 22px rgba(0, 0, 0, 0.28);
  --panel-glow: rgba(175, 196, 95, 0.22);
  --accent-soft: rgba(175, 196, 95, 0.18);
  --accent-soft-strong: rgba(175, 196, 95, 0.38);
  --item-bg: rgba(255, 255, 255, 0.04);
  --item-border: rgba(255, 255, 255, 0.08);
  --chip-bg: rgba(255, 255, 255, 0.05);
  --critical: #ff7f70;
  --warning: #f0b34d;
  --info: #78aef7;
  --success: #8fcf75;
  position: relative;
}

.dc-notification-center.theme-light {
  --accent: #4f6f2f;
  --text: #1f2f1d;
  --text2: rgba(31, 47, 29, 0.88);
  --text3: rgba(31, 47, 29, 0.68);
  --panel-bg: rgba(245, 240, 226, 0.95);
  --panel-border: rgba(79, 111, 47, 0.28);
  --panel-shadow: 0 22px 42px rgba(31, 49, 25, 0.2), 0 10px 22px rgba(31, 49, 25, 0.12);
  --panel-glow: rgba(79, 111, 47, 0.22);
  --accent-soft: rgba(79, 111, 47, 0.18);
  --accent-soft-strong: rgba(79, 111, 47, 0.36);
  --item-bg: rgba(250, 247, 238, 0.86);
  --item-border: rgba(79, 111, 47, 0.2);
  --chip-bg: rgba(79, 111, 47, 0.14);
  --critical: #d85b4c;
  --warning: #bc8328;
  --info: #3c6cbb;
  --success: #3f8a3f;
}

.dc-notification-toggle.is-active {
  color: var(--accent);
  transform: translateY(-1px);
}

.dc-notification-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 12px);
  width: min(420px, calc(100vw - 32px));
  max-height: min(560px, calc(100vh - 140px));
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  border: 1px solid var(--panel-border);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 48%), var(--panel-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--panel-shadow);
  overflow: hidden;
  z-index: 60;
}

.dc-notification-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 100% 0%, var(--panel-glow), transparent 44%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 20%);
}

.dc-notification-panel__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dc-notification-center.theme-light .dc-notification-panel__header {
  border-bottom-color: rgba(79, 111, 47, 0.14);
}

.dc-notification-panel__eyebrow {
  display: block;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.68rem;
  margin-bottom: 2px;
}

.dc-notification-panel__header h3 {
  margin: 0;
  font-family: 'Old Standard TT', serif;
  font-size: 1.3rem;
  color: var(--text);
}

.dc-notification-panel__mark-all {
  border: 1px solid var(--item-border);
  background: var(--chip-bg);
  color: var(--text2);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.22s ease;
}

.dc-notification-panel__mark-all:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.dc-notification-panel__mark-all:disabled {
  opacity: 0.45;
  cursor: default;
}

.dc-notification-panel__filters {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 8px;
  padding: 12px 16px;
}

.dc-filter-chip {
  border: 1px solid transparent;
  background: var(--chip-bg);
  color: var(--text2);
  height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dc-filter-chip span {
  min-width: 16px;
  text-align: center;
  font-size: 0.72rem;
  color: var(--text3);
}

.dc-filter-chip.is-active,
.dc-filter-chip:hover {
  border-color: var(--panel-border);
  color: var(--accent);
}

.dc-notification-list {
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 0;
  padding: 2px 10px 12px;
  overflow: auto;
}

/* Скроллбар как у основной страницы (theme-dark) */
@supports not selector(::-webkit-scrollbar) {
  .dc-notification-list {
    scrollbar-width: thin;
    scrollbar-color: rgba(175, 196, 95, 0.25) rgba(5, 8, 10, 0.5);
  }
}
.dc-notification-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.dc-notification-list::-webkit-scrollbar-track {
  background: rgba(5, 8, 10, 0.5);
}
.dc-notification-list::-webkit-scrollbar-thumb {
  background: rgba(175, 196, 95, 0.2);
  border-radius: 4px;
}
.dc-notification-list::-webkit-scrollbar-thumb:hover {
  background: rgba(175, 196, 95, 0.35);
}

/* theme-light */
@supports not selector(::-webkit-scrollbar) {
  .dc-notification-center.theme-light .dc-notification-list {
    scrollbar-width: thin;
    scrollbar-color: rgba(79, 111, 47, 0.3) rgba(232, 226, 206, 0.78);
  }
}
.dc-notification-center.theme-light .dc-notification-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.dc-notification-center.theme-light .dc-notification-list::-webkit-scrollbar-track {
  background: rgba(232, 226, 206, 0.78);
}
.dc-notification-center.theme-light .dc-notification-list::-webkit-scrollbar-thumb {
  background: rgba(79, 111, 47, 0.26);
}
.dc-notification-center.theme-light .dc-notification-list::-webkit-scrollbar-thumb:hover {
  background: rgba(79, 111, 47, 0.44);
}

.dc-notification-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  border-radius: 14px;
  border: 1px solid var(--item-border);
  background: var(--item-bg);
  padding: 12px;
  margin-bottom: 8px;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.dc-notification-item:hover {
  transform: translateY(-1px);
  border-color: var(--accent-soft-strong);
}

.dc-notification-item.is-unread {
  background:
    linear-gradient(90deg, var(--accent-soft), transparent 35%),
    var(--item-bg);
}

.dc-notification-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: var(--info);
}

.dc-notification-center.theme-light .dc-notification-item__icon {
  background: rgba(79, 111, 47, 0.12);
}

.dc-notification-item.tone-critical .dc-notification-item__icon { color: var(--critical); }
.dc-notification-item.tone-warning .dc-notification-item__icon { color: var(--warning); }
.dc-notification-item.tone-success .dc-notification-item__icon { color: var(--success); }
.dc-notification-item.tone-info .dc-notification-item__icon { color: var(--info); }

.dc-notification-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.75rem;
}

.dc-notification-item__source {
  color: var(--text2);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dc-notification-item__time { color: var(--text3); }

.dc-notification-item__title {
  margin: 0 0 4px 0;
  color: var(--text);
  font-weight: 700;
  line-height: 1.35;
}

.dc-notification-item__message {
  margin: 0;
  color: var(--text3);
  line-height: 1.4;
  font-size: 0.83rem;
}

.dc-notification-item__action {
  margin-top: 8px;
  border: none;
  background: transparent;
  color: var(--accent);
  padding: 0;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.dc-notification-item__action:hover { text-decoration: underline; }

.dc-notification-item__read-dot {
  align-self: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent-soft-strong);
  cursor: pointer;
}

.dc-notification-empty {
  position: relative;
  z-index: 1;
  padding: 28px 20px;
  text-align: center;
  color: var(--text3);
}

.dc-notification-empty i {
  font-size: 1.3rem;
  color: var(--accent);
  margin-bottom: 10px;
}

.dc-notification-empty p { margin: 0; }

.dc-notification-pop-enter-active,
.dc-notification-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dc-notification-pop-enter-from,
.dc-notification-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.985);
}

@media (max-width: 768px) {
  .dc-notification-panel {
    width: min(420px, calc(100vw - 24px));
    right: 0;
    max-height: min(560px, calc(100vh - 120px));
  }
}
</style>
