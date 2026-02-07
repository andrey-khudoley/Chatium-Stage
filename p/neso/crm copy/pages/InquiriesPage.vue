<script setup lang="ts">
import { computed, ref } from 'vue'
import AppShell from '../web/design/components/AppShell.vue'

type ListTab = 'all' | 'unread' | 'open' | 'mine'
type DetailsTab = 'about' | 'comments' | 'deals' | 'tasks'
type InquiryStatus = 'open' | 'waiting' | 'closed'
type ChannelKind = 'telegram' | 'whatsapp' | 'email'
type MessageAuthor = 'agent' | 'client' | 'system'
type MobilePane = 'list' | 'thread' | 'details'

interface InquiryMessage {
  id: string
  author: MessageAuthor
  text: string
  time: string
}

interface InquiryComment {
  id: string
  author: string
  text: string
  time: string
}

interface InquiryDeal {
  id: string
  title: string
  status: string
  sum: string
}

interface InquiryTask {
  id: string
  title: string
  deadline: string
  done: boolean
}

interface InquiryItem {
  id: string
  clientName: string
  preview: string
  lastAt: string
  channel: ChannelKind
  status: InquiryStatus
  unreadCount: number
  assignedToMe: boolean
  priority: string
  responsible: string
  phone?: string
  email?: string
  source: string
  tags: string[]
  messages: InquiryMessage[]
  comments: InquiryComment[]
  deals: InquiryDeal[]
  tasks: InquiryTask[]
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  testsUrl?: string
  inquiriesUrl: string
  loginUrl: string
  isAuthenticated: boolean
  isAdmin?: boolean
  adminUrl?: string
}>()

const navItems = computed(() =>
  [
    { id: 'dashboard', icon: 'fa-house', label: 'Главная', href: props.indexUrl },
    { id: 'inquiries', icon: 'fa-comments', label: 'Обращения', href: props.inquiriesUrl },
    { id: 'profile', icon: 'fa-user', label: 'Профиль', href: props.profileUrl },
    { id: 'admin', icon: 'fa-gear', label: 'Админка', href: props.adminUrl },
    { id: 'tests', icon: 'fa-flask', label: 'Тесты', href: props.testsUrl }
  ].filter((item) => item.href)
)

const listTab = ref<ListTab>('all')
const detailsTab = ref<DetailsTab>('about')
const searchQuery = ref('')
const selectedId = ref('inq-2045')
const mobilePane = ref<MobilePane>('list')

const mockInquiries: InquiryItem[] = [
  {
    id: 'inq-2045',
    clientName: 'Клиент 001',
    preview: 'Можно уточнить, как быстро получится запустить первую рассылку?',
    lastAt: '10:02',
    channel: 'telegram',
    status: 'open',
    unreadCount: 2,
    assignedToMe: true,
    priority: 'Средний',
    responsible: 'Оператор 01',
    phone: '',
    email: 'client001@demo.local',
    source: 'Канал A',
    tags: ['webinar', 'sales', 'hot'],
    messages: [
      {
        id: 'm1',
        author: 'client',
        text: 'Поймешь, почему инфобизнес - самый перспективный источник дохода на ближайшие годы.',
        time: '09:58'
      },
      {
        id: 'm2',
        author: 'agent',
        text: 'Отлично. Ниже отправил план и чек-лист, чтобы старт прошел без задержек.',
        time: '09:59'
      },
      {
        id: 'm3',
        author: 'system',
        text: 'Оператор сменился: Оператор 01.',
        time: '10:00'
      },
      {
        id: 'm4',
        author: 'client',
        text: 'Если запущу сегодня, когда увижу первые отклики?',
        time: '10:02'
      }
    ],
    comments: [
      {
        id: 'c1',
        author: 'Оператор 01',
        text: 'Клиент теплый, в диалоге активно задает вопросы по запуску.',
        time: 'Сегодня, 10:03'
      }
    ],
    deals: [
      {
        id: 'd1',
        title: 'Пакет "Старт"',
        status: 'В работе',
        sum: '24 900 RUB'
      }
    ],
    tasks: [
      {
        id: 't1',
        title: 'Отправить подробный FAQ',
        deadline: 'Сегодня',
        done: false
      },
      {
        id: 't2',
        title: 'Проверить оплату тарифа',
        deadline: '07.02',
        done: false
      }
    ]
  },
  {
    id: 'inq-2037',
    clientName: 'Клиент 002',
    preview: 'Спасибо, все понял. Вернусь с финальным решением сегодня вечером.',
    lastAt: '09:40',
    channel: 'whatsapp',
    status: 'waiting',
    unreadCount: 0,
    assignedToMe: false,
    priority: 'Низкий',
    responsible: 'Оператор 02',
    phone: '+7 (900) 000-00-02',
    email: '',
    source: 'Канал B',
    tags: ['follow-up'],
    messages: [
      {
        id: 'm1',
        author: 'agent',
        text: 'Подготовили для вас два сценария запуска. Посмотрите, какой вариант ближе.',
        time: '09:12'
      },
      {
        id: 'm2',
        author: 'client',
        text: 'Спасибо, все понял. Вернусь с финальным решением сегодня вечером.',
        time: '09:40'
      }
    ],
    comments: [],
    deals: [],
    tasks: [
      {
        id: 't1',
        title: 'Напомнить о решении по тарифу',
        deadline: 'Сегодня, 18:00',
        done: false
      }
    ]
  },
  {
    id: 'inq-2011',
    clientName: 'Клиент 003',
    preview: 'Нужен счет на юрлицо и договор для отдела закупок.',
    lastAt: '08:52',
    channel: 'email',
    status: 'open',
    unreadCount: 1,
    assignedToMe: true,
    priority: 'Высокий',
    responsible: 'Оператор 01',
    phone: '+7 (900) 000-00-03',
    email: 'client003@demo.local',
    source: 'Сайт',
    tags: ['b2b', 'docs'],
    messages: [
      {
        id: 'm1',
        author: 'client',
        text: 'Нужен счет на юрлицо и договор для отдела закупок.',
        time: '08:52'
      }
    ],
    comments: [
      {
        id: 'c1',
        author: 'Оператор 01',
        text: 'Попросила закрывающие документы заранее, отправить шаблон КП.',
        time: 'Сегодня, 08:56'
      }
    ],
    deals: [
      {
        id: 'd1',
        title: 'Корпоративный тариф',
        status: 'Согласование',
        sum: '79 000 RUB'
      }
    ],
    tasks: [
      {
        id: 't1',
        title: 'Подготовить договор и счет',
        deadline: 'Сегодня, 14:00',
        done: false
      }
    ]
  },
  {
    id: 'inq-1993',
    clientName: 'Клиент 004',
    preview: 'Подписка отменена, но доступ пока активен. Что делать?',
    lastAt: 'Вчера',
    channel: 'telegram',
    status: 'closed',
    unreadCount: 0,
    assignedToMe: false,
    priority: 'Низкий',
    responsible: 'Поддержка',
    phone: '',
    email: '',
    source: 'Канал A',
    tags: ['support'],
    messages: [
      {
        id: 'm1',
        author: 'client',
        text: 'Подписка отменена, но доступ пока активен. Что делать?',
        time: 'Вчера, 19:22'
      },
      {
        id: 'm2',
        author: 'agent',
        text: 'Проверили: доступ отключится автоматически в конце оплаченного периода.',
        time: 'Вчера, 19:28'
      },
      {
        id: 'm3',
        author: 'system',
        text: 'Обращение закрыто оператором.',
        time: 'Вчера, 19:31'
      }
    ],
    comments: [],
    deals: [],
    tasks: []
  }
]

const filteredConversations = computed(() => {
  let list = mockInquiries

  if (listTab.value === 'unread') {
    list = list.filter((item) => item.unreadCount > 0)
  }

  if (listTab.value === 'open') {
    list = list.filter((item) => item.status !== 'closed')
  }

  if (listTab.value === 'mine') {
    list = list.filter((item) => item.assignedToMe)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    list = list.filter((item) => {
      return (
        item.clientName.toLowerCase().includes(query) ||
        item.preview.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      )
    })
  }

  return list
})

const selectedConversation = computed(() =>
  mockInquiries.find((item) => item.id === selectedId.value) ?? null
)

const unreadTotal = computed(() =>
  mockInquiries.reduce((sum, item) => sum + item.unreadCount, 0)
)

const showThreadOnMobile = computed(() => mobilePane.value === 'thread')
const showClientPanelOnMobile = computed(() => mobilePane.value === 'details')

function selectConversation(id: string) {
  selectedId.value = id
  mobilePane.value = 'thread'
  detailsTab.value = 'about'
}

function openClientPanelMobile() {
  if (!selectedConversation.value) return
  mobilePane.value = 'details'
}

function closeClientPanelMobile() {
  mobilePane.value = 'thread'
}

function backToList() {
  mobilePane.value = 'list'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('')
}

function getStatusLabel(status: InquiryStatus): string {
  if (status === 'open') return 'Открыто'
  if (status === 'waiting') return 'Ожидание'
  return 'Закрыто'
}

function getStatusClass(status: InquiryStatus): string {
  if (status === 'open') return 'tag-light'
  if (status === 'waiting') return 'tag-outline'
  return 'tag-muted'
}

function getChannelLabel(channel: ChannelKind): string {
  if (channel === 'telegram') return 'Telegram'
  if (channel === 'whatsapp') return 'WhatsApp'
  return 'Email'
}

function getChannelIcon(channel: ChannelKind): string {
  if (channel === 'telegram') return 'fa-paper-plane'
  if (channel === 'whatsapp') return 'fa-phone'
  return 'fa-envelope'
}
</script>

<template>
  <AppShell
    :pageTitle="'Обращения'"
    :pageSubtitle="projectTitle"
    :navItems="navItems"
    activeSection="inquiries"
    :userName="'Пользователь'"
    :userRole="props.isAdmin ? 'Admin' : 'User'"
  >
    <template #headerActions>
      <div class="inquiries-header-meta">
        <span class="tag tag-light">Всего {{ mockInquiries.length }}</span>
        <span v-if="unreadTotal > 0" class="tag">Непрочитанных: {{ unreadTotal }}</span>
      </div>
      <button class="action-btn glass" type="button" disabled aria-label="Фильтры">
        <i class="fas fa-filter"></i>
      </button>
    </template>

    <div class="inquiries-layout">
      <aside
        class="inquiries-list-panel"
        :class="{ 'mobile-hidden': showThreadOnMobile || showClientPanelOnMobile }"
      >
        <div class="inquiries-list-card showcase-card">
          <div class="inquiries-list-toolbar">
            <div class="input-group">
              <i class="fas fa-search"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Найти клиента или обращение..."
                aria-label="Найти клиента или обращение"
              />
            </div>
            <div class="inquiries-list-tabs">
              <button
                type="button"
                class="tab"
                :class="{ active: listTab === 'all' }"
                @click="listTab = 'all'"
              >
                Все
              </button>
              <button
                type="button"
                class="tab"
                :class="{ active: listTab === 'unread' }"
                @click="listTab = 'unread'"
              >
                Непрочитанные
              </button>
              <button
                type="button"
                class="tab"
                :class="{ active: listTab === 'open' }"
                @click="listTab = 'open'"
              >
                Активные
              </button>
              <button
                type="button"
                class="tab"
                :class="{ active: listTab === 'mine' }"
                @click="listTab = 'mine'"
              >
                Мои
              </button>
            </div>
          </div>

          <div class="inquiries-list-scroll">
            <template v-if="filteredConversations.length === 0">
              <div class="inquiries-empty">
                <i class="fas fa-inbox"></i>
                <p>Нет обращений</p>
                <span class="inquiries-empty-hint">Попробуйте изменить фильтры</span>
              </div>
            </template>
            <template v-else>
              <button
                v-for="conv in filteredConversations"
                :key="conv.id"
                type="button"
                class="inquiries-list-item"
                :class="{ active: selectedId === conv.id }"
                @click="selectConversation(conv.id)"
              >
                <div class="inquiries-list-avatar">
                  <span>{{ getInitials(conv.clientName) }}</span>
                </div>
                <div class="inquiries-list-main">
                  <div class="inquiries-list-row-top">
                    <span class="inquiries-list-item-name">{{ conv.clientName }}</span>
                    <div class="inquiries-list-time-wrap">
                      <span class="inquiries-list-item-date">{{ conv.lastAt }}</span>
                      <span v-if="conv.unreadCount > 0" class="inquiries-unread-badge">
                        {{ conv.unreadCount }}
                      </span>
                    </div>
                  </div>

                  <p class="inquiries-list-item-preview">{{ conv.preview }}</p>

                  <div class="inquiries-list-row-bottom">
                    <span class="inquiries-channel-pill">
                      <i :class="['fas', getChannelIcon(conv.channel)]"></i>
                      {{ getChannelLabel(conv.channel) }}
                    </span>
                    <span class="tag" :class="getStatusClass(conv.status)">
                      {{ getStatusLabel(conv.status) }}
                    </span>
                  </div>
                </div>
              </button>
            </template>
          </div>
        </div>
      </aside>

      <section class="inquiries-thread-panel" :class="{ 'mobile-hidden': !showThreadOnMobile }">
        <template v-if="selectedConversation">
          <div class="inquiries-thread-card showcase-card">
            <div class="inquiries-thread-header">
              <button
                type="button"
                class="inquiries-back-btn"
                aria-label="Назад к списку"
                @click="backToList"
              >
                <i class="fas fa-arrow-left"></i>
              </button>

              <div class="inquiries-thread-header-info">
                <h2 class="inquiries-thread-title">{{ selectedConversation.clientName }}</h2>
                <p class="inquiries-thread-subtitle">
                  #{{ selectedConversation.id }} •
                  {{ getChannelLabel(selectedConversation.channel) }}
                </p>
              </div>

              <div class="inquiries-thread-header-tags">
                <span class="tag" :class="getStatusClass(selectedConversation.status)">
                  {{ getStatusLabel(selectedConversation.status) }}
                </span>
                <span class="tag tag-light">{{ selectedConversation.priority }}</span>
              </div>

              <button
                type="button"
                class="inquiries-details-open-btn"
                aria-label="Открыть детали обращения"
                @click="openClientPanelMobile"
              >
                <i class="fas fa-address-card"></i>
                <span>Детали</span>
              </button>
            </div>

            <div class="inquiries-thread-messages">
              <div class="inquiries-message-list">
                <div
                  v-for="message in selectedConversation.messages"
                  :key="message.id"
                  class="inquiries-message-item"
                  :class="`author-${message.author}`"
                >
                  <template v-if="message.author === 'system'">
                    <div class="inquiries-system-event">
                      <span>{{ message.text }}</span>
                      <time>{{ message.time }}</time>
                    </div>
                  </template>
                  <template v-else>
                    <div class="inquiries-message-bubble">
                      <p>{{ message.text }}</p>
                      <time>{{ message.time }}</time>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <div class="inquiries-thread-compose">
              <div class="inquiries-compose-row">
                <textarea
                  class="inquiries-compose-input"
                  rows="2"
                  placeholder="Введите сообщение..."
                  disabled
                ></textarea>
                <button
                  type="button"
                  class="inquiries-attach-btn"
                  aria-label="Прикрепить файл"
                  disabled
                >
                  <i class="fas fa-paperclip"></i>
                </button>
              </div>
              <div class="inquiries-compose-actions">
                <button type="button" class="action-btn primary" disabled>
                  <i class="fas fa-paper-plane"></i>
                  <span>Отправить</span>
                </button>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="inquiries-thread-empty showcase-card">
            <div class="inquiries-empty">
              <i class="fas fa-comment-dots"></i>
              <p>Выберите обращение</p>
              <span class="inquiries-empty-hint">Список обращений находится слева</span>
            </div>
          </div>
        </template>
      </section>

      <aside
        class="inquiries-client-panel"
        :class="{
          'mobile-drawer': showClientPanelOnMobile
        }"
      >
        <template v-if="selectedConversation">
          <div class="inquiries-client-card showcase-card">
            <div class="inquiries-client-header">
              <div class="inquiries-client-title-wrap">
                <h3 class="inquiries-client-title">{{ selectedConversation.clientName }}</h3>
                <span class="inquiries-client-subtitle">ID: {{ selectedConversation.id }}</span>
              </div>
              <button
                type="button"
                class="inquiries-client-close"
                aria-label="Закрыть карточку"
                @click="closeClientPanelMobile"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="inquiries-client-actions">
              <button type="button" class="action-btn primary" disabled>
                <i class="fas fa-handshake"></i>
                <span>Основное действие</span>
              </button>
              <button type="button" class="action-btn glass inquiries-client-action-secondary" disabled>
                <i class="fas fa-share"></i>
                <span>Передать</span>
              </button>
            </div>

            <div class="inquiries-client-tabs">
              <button
                type="button"
                class="tab"
                :class="{ active: detailsTab === 'about' }"
                @click="detailsTab = 'about'"
              >
                О клиенте
              </button>
              <button
                type="button"
                class="tab"
                :class="{ active: detailsTab === 'comments' }"
                @click="detailsTab = 'comments'"
              >
                Комментарии
              </button>
              <button
                type="button"
                class="tab"
                :class="{ active: detailsTab === 'deals' }"
                @click="detailsTab = 'deals'"
              >
                Сделки
              </button>
              <button
                type="button"
                class="tab"
                :class="{ active: detailsTab === 'tasks' }"
                @click="detailsTab = 'tasks'"
              >
                Задачи
              </button>
            </div>

            <div class="inquiries-client-scroll">
              <section v-if="detailsTab === 'about'" class="inquiries-details-section">
                <div class="inquiries-prop-row">
                  <span class="inquiries-prop-label">Канал</span>
                  <span class="inquiries-prop-value">
                    {{ getChannelLabel(selectedConversation.channel) }}
                  </span>
                </div>
                <div class="inquiries-prop-row">
                  <span class="inquiries-prop-label">Телефон</span>
                  <span class="inquiries-prop-value">{{ selectedConversation.phone || 'Не указан' }}</span>
                </div>
                <div class="inquiries-prop-row">
                  <span class="inquiries-prop-label">Email</span>
                  <span class="inquiries-prop-value">{{ selectedConversation.email || 'Не указан' }}</span>
                </div>
                <div class="inquiries-prop-row">
                  <span class="inquiries-prop-label">Ответственный</span>
                  <span class="inquiries-prop-value">{{ selectedConversation.responsible }}</span>
                </div>
                <div class="inquiries-prop-row">
                  <span class="inquiries-prop-label">Источник</span>
                  <span class="inquiries-prop-value">{{ selectedConversation.source }}</span>
                </div>
                <div class="inquiries-prop-row">
                  <span class="inquiries-prop-label">Теги</span>
                  <div class="inquiries-tags">
                    <span v-for="tag in selectedConversation.tags" :key="tag" class="tag tag-light">
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </section>

              <section v-if="detailsTab === 'comments'" class="inquiries-details-section">
                <template v-if="selectedConversation.comments.length > 0">
                  <article
                    v-for="comment in selectedConversation.comments"
                    :key="comment.id"
                    class="inquiries-note-card"
                  >
                    <div class="inquiries-note-top">
                      <strong>{{ comment.author }}</strong>
                      <span>{{ comment.time }}</span>
                    </div>
                    <p>{{ comment.text }}</p>
                  </article>
                </template>
                <template v-else>
                  <div class="inquiries-empty compact">
                    <p>Комментариев пока нет</p>
                  </div>
                </template>
              </section>

              <section v-if="detailsTab === 'deals'" class="inquiries-details-section">
                <template v-if="selectedConversation.deals.length > 0">
                  <article
                    v-for="deal in selectedConversation.deals"
                    :key="deal.id"
                    class="inquiries-note-card"
                  >
                    <div class="inquiries-note-top">
                      <strong>{{ deal.title }}</strong>
                      <span>{{ deal.sum }}</span>
                    </div>
                    <p>Статус: {{ deal.status }}</p>
                  </article>
                </template>
                <template v-else>
                  <div class="inquiries-empty compact">
                    <p>Активных сделок нет</p>
                  </div>
                </template>
              </section>

              <section v-if="detailsTab === 'tasks'" class="inquiries-details-section">
                <template v-if="selectedConversation.tasks.length > 0">
                  <article
                    v-for="task in selectedConversation.tasks"
                    :key="task.id"
                    class="inquiries-note-card"
                  >
                    <div class="inquiries-note-top">
                      <strong>{{ task.title }}</strong>
                      <span>{{ task.deadline }}</span>
                    </div>
                    <p>{{ task.done ? 'Завершено' : 'Открыто' }}</p>
                  </article>
                </template>
                <template v-else>
                  <div class="inquiries-empty compact">
                    <p>Задач нет</p>
                  </div>
                </template>
              </section>
            </div>
          </div>
        </template>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.inquiries-header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inquiries-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr) 340px;
  gap: 16px;
  height: calc(100dvh - 190px);
  min-height: 620px;
  max-height: 860px;
}

.inquiries-list-panel,
.inquiries-thread-panel,
.inquiries-client-panel {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.inquiries-list-card,
.inquiries-thread-card,
.inquiries-client-card,
.inquiries-thread-empty {
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inquiries-list-toolbar {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 20px;
  background: var(--surface-glass);
  border-bottom: 1px solid var(--border-glass-light);
  backdrop-filter: blur(20px) saturate(150%);
}

.inquiries-list-tabs {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.inquiries-list-tabs .tab {
  white-space: nowrap;
  font-size: 0.8rem;
  padding: 8px 12px;
}

.inquiries-list-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inquiries-list-item {
  width: 100%;
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  background: var(--surface-glass);
  color: var(--text-primary);
  padding: 12px;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.inquiries-list-item:hover {
  border-color: var(--border-glass);
  background: var(--surface-glass-hover);
}

.inquiries-list-item.active {
  border-color: var(--accent-primary);
  background: var(--accent-soft);
}

.inquiries-list-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-primary), #6f7c3f);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 4px 12px var(--accent-glow);
}

.inquiries-list-main {
  min-width: 0;
}

.inquiries-list-row-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.inquiries-list-item-name {
  font-weight: 700;
  font-size: 0.92rem;
  line-height: 1.2;
}

.inquiries-list-time-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.inquiries-list-item-date {
  font-size: 0.73rem;
  color: var(--text-tertiary);
}

.inquiries-unread-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  padding: 0 6px;
  background: var(--accent-primary);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}

.inquiries-list-item-preview {
  margin: 6px 0;
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.inquiries-list-row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.inquiries-channel-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.inquiries-thread-header {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 14px;
  border-bottom: 1px solid var(--border-glass-light);
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(150%);
}

.inquiries-thread-header-info {
  flex: 1;
  min-width: 0;
}

.inquiries-thread-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.15;
}

.inquiries-thread-subtitle {
  margin: 4px 0 0 0;
  font-size: 0.83rem;
  color: var(--text-tertiary);
}

.inquiries-thread-header-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inquiries-thread-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 20px;
}

.inquiries-message-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inquiries-message-item {
  display: flex;
}

.inquiries-message-item.author-client {
  justify-content: flex-start;
}

.inquiries-message-item.author-agent {
  justify-content: flex-end;
}

.inquiries-message-bubble {
  max-width: min(75%, 640px);
  border: 1px solid var(--border-glass-light);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(74, 90, 36, 0.04);
}

.inquiries-message-item.author-client .inquiries-message-bubble {
  background: var(--bg-elevated);
}

.inquiries-message-item.author-agent .inquiries-message-bubble {
  background: var(--accent-soft);
  border-color: rgba(74, 90, 36, 0.25);
}

.inquiries-message-bubble p {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.92rem;
  line-height: 1.45;
  white-space: pre-line;
  word-break: break-word;
}

.inquiries-message-bubble time {
  display: block;
  margin-top: 6px;
  text-align: right;
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

.inquiries-system-event {
  margin: 6px auto;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-size: 0.76rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.inquiries-thread-compose {
  position: sticky;
  bottom: 0;
  z-index: 3;
  border-top: 1px solid var(--border-glass-light);
  padding: 12px 20px 16px;
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(150%);
}

.inquiries-compose-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.inquiries-compose-input {
  flex: 1;
  min-height: 60px;
  max-height: 140px;
  resize: vertical;
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.92rem;
  padding: 12px 14px;
}

.inquiries-compose-input::placeholder {
  color: var(--text-tertiary);
}

.inquiries-attach-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass-light);
  background: var(--surface-glass);
  color: var(--text-secondary);
}

.inquiries-compose-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.inquiries-back-btn {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  cursor: pointer;
}

.inquiries-details-open-btn {
  display: none;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass-light);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.inquiries-client-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-glass-light);
  background: var(--surface-glass);
  backdrop-filter: blur(20px) saturate(150%);
}

.inquiries-client-title-wrap {
  min-width: 0;
}

.inquiries-client-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--text-primary);
}

.inquiries-client-subtitle {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--text-tertiary);
}

.inquiries-client-close {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass-light);
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.inquiries-client-actions {
  padding: 14px 20px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.inquiries-client-action-secondary {
  width: auto;
  padding: 0 14px;
}

.inquiries-client-action-secondary span {
  display: inline;
}

.inquiries-client-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-glass-light);
}

.inquiries-client-tabs .tab {
  white-space: nowrap;
  font-size: 0.8rem;
  padding: 8px 12px;
}

.inquiries-client-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px 20px;
}

.inquiries-details-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inquiries-prop-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-glass-light);
  border-radius: var(--radius-sm);
  background: var(--bg-elevated);
}

.inquiries-prop-label {
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.inquiries-prop-value {
  font-size: 0.86rem;
  color: var(--text-primary);
  text-align: right;
}

.inquiries-tags {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.inquiries-note-card {
  border: 1px solid var(--border-glass-light);
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.inquiries-note-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.inquiries-note-top strong {
  font-size: 0.86rem;
  color: var(--text-primary);
}

.inquiries-note-top span {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.inquiries-note-card p {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.4;
  color: var(--text-secondary);
}

.inquiries-empty {
  min-height: 180px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  color: var(--text-tertiary);
}

.inquiries-empty i {
  font-size: 1.8rem;
  opacity: 0.55;
}

.inquiries-empty p {
  margin: 0;
  color: var(--text-secondary);
}

.inquiries-empty-hint {
  font-size: 0.82rem;
}

.inquiries-empty.compact {
  min-height: 120px;
}

@media (max-width: 1360px) {
  .inquiries-layout {
    grid-template-columns: 300px minmax(0, 1fr) 320px;
  }
}

@media (max-width: 1120px) {
  .inquiries-layout {
    grid-template-columns: 320px minmax(0, 1fr);
    position: relative;
  }

  .inquiries-client-panel {
    display: none;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(360px, 56vw);
    z-index: 35;
  }

  .inquiries-client-panel.mobile-drawer {
    display: flex;
  }

  .inquiries-details-open-btn {
    display: inline-flex;
  }
}

@media (max-width: 900px) {
  .inquiries-header-meta {
    display: none;
  }

  .inquiries-layout {
    grid-template-columns: 1fr;
    position: relative;
    min-height: 520px;
    height: calc(100dvh - 150px);
  }

  .inquiries-list-panel.mobile-hidden {
    display: none;
  }

  .inquiries-thread-panel {
    position: absolute;
    inset: 0;
    z-index: 20;
  }

  .inquiries-thread-panel.mobile-hidden {
    display: none;
  }

  .inquiries-client-panel {
    width: 100%;
    inset: 0;
    z-index: 40;
  }

  .inquiries-client-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .inquiries-back-btn {
    display: inline-flex;
  }
}

@media (max-width: 640px) {
  .inquiries-layout {
    height: calc(100dvh - 130px);
    min-height: 480px;
  }

  .inquiries-thread-header,
  .inquiries-list-toolbar,
  .inquiries-client-header,
  .inquiries-client-actions,
  .inquiries-client-tabs,
  .inquiries-client-scroll,
  .inquiries-thread-messages,
  .inquiries-thread-compose {
    padding-left: 14px;
    padding-right: 14px;
  }

  .inquiries-thread-title {
    font-size: 1.08rem;
  }

  .inquiries-thread-header-tags {
    display: none;
  }
}
</style>
