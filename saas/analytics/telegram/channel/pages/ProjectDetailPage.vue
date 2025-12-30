<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import Header from '../shared/Header.vue'
import { 
  apiGetProjectRoute, 
  apiGetProjectRequestsRoute, 
  apiApproveProjectRequestRoute, 
  apiRejectProjectRequestRoute,
  apiRemoveProjectMemberRoute
} from '../api/projects'
import { apiGetBotsListRoute, apiValidateTokenRoute, apiAddBotRoute } from '../api/bots'
import { apiGetChannelsListRoute } from '../api/channels'

declare const ctx: any

declare global {
  interface Window {
    hideAppLoader?: () => void
  }
}

const props = defineProps<{
  projectTitle: string
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  projectsPageUrl?: string
  botsPageUrl?: string
  channelsPageUrl?: string
  projectId: string
  target?: string // Параметр target из query параметров (links, channels, bots)
}>()

const project = ref<{
  id: string
  name: string
  description?: string
  membersCount: number
  members?: Array<{ userId: string; role: string }>
} | null>(null)

const requests = ref<Array<{
  id: string
  userId: string
  requestedAt: Date | string
}>>([])

const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'info' | 'bots' | 'channels' | 'links' | 'members' | 'requests'>('info')
const loadingRequests = ref(false)
const processingRequestId = ref<string | null>(null)
const removingMemberId = ref<string | null>(null)

// Данные ботов
const bots = ref<Array<{
  id: string
  token: string
  botName: string | null
  botUsername: string | null
  projectId: string
  channelsCount?: number
}>>([])
const loadingBots = ref(false)
const botsError = ref<string | null>(null)

// Данные каналов
const channels = ref<Array<{
  id: string
  chatId: string
  chatType: string | null
  chatTitle: string | null
  chatUsername: string | null
  firstSeenAt: Date | string
  lastSeenAt: Date | string
}>>([])
const loadingChannels = ref(false)
const channelsError = ref<string | null>(null)

// Фильтр для вкладки "Ссылки"
const selectedChannelId = ref<string | null>(null)

// Модальное окно для добавления бота
const showAddTokenModal = ref(false)
const newToken = ref('')
const addingToken = ref(false)
const tokenError = ref<string | null>(null)

// Проверка прав доступа
const isOwner = computed(() => {
  if (!project.value || !ctx.user) return false
  return project.value.members?.some((m: any) => 
    m.userId === ctx.user.id && m.role === 'owner'
  ) || false
})

const isMember = computed(() => {
  if (!project.value || !ctx.user) return false
  return project.value.members?.some((m: any) => 
    m.userId === ctx.user.id && (m.role === 'owner' || m.role === 'member')
  ) || false
})

const isAdmin = computed(() => {
  return ctx.user?.is && ctx.user.is('Admin')
})

const canViewRequests = computed(() => {
  return isMember.value || isAdmin.value
})

const canManageMembers = computed(() => {
  return isOwner.value || isAdmin.value
})

// Загрузка информации о проекте
const loadProject = async () => {
  loading.value = true
  error.value = null
  
  try {
    const result = await apiGetProjectRoute({ id: props.projectId }).run(ctx)
    
    if (result.success && result.project) {
      project.value = result.project
    } else {
      error.value = result.error || 'Ошибка при загрузке проекта'
    }
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка загрузки проекта:', e)
    error.value = e.message || 'Ошибка при загрузке проекта'
  } finally {
    loading.value = false
  }
}

// Загрузка заявок
const loadRequests = async () => {
  if (!canViewRequests.value) return
  
  loadingRequests.value = true
  
  try {
    const result = await apiGetProjectRequestsRoute({ id: props.projectId }).run(ctx)
    
    if (result.success && result.requests) {
      requests.value = result.requests
    }
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка загрузки заявок:', e)
  } finally {
    loadingRequests.value = false
  }
}

// Одобрение заявки
const approveRequest = async (requestId: string) => {
  if (processingRequestId.value) return
  
  processingRequestId.value = requestId
  
  try {
    const result = await apiApproveProjectRequestRoute({ id: props.projectId, requestId }).run(ctx)
    
    if (result.success) {
      // Обновляем данные
      await loadProject()
      await loadRequests()
    } else {
      alert(result.error || 'Ошибка при одобрении заявки')
    }
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка одобрения заявки:', e)
    alert(e.message || 'Ошибка при одобрении заявки')
  } finally {
    processingRequestId.value = null
  }
}

// Отклонение заявки
const rejectRequest = async (requestId: string) => {
  if (processingRequestId.value) return
  
  processingRequestId.value = requestId
  
  try {
    const result = await apiRejectProjectRequestRoute({ id: props.projectId, requestId }).run(ctx)
    
    if (result.success) {
      // Обновляем заявки
      await loadRequests()
    } else {
      alert(result.error || 'Ошибка при отклонении заявки')
    }
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка отклонения заявки:', e)
    alert(e.message || 'Ошибка при отклонении заявки')
  } finally {
    processingRequestId.value = null
  }
}

// Удаление участника
const removeMember = async (userId: string) => {
  if (!confirm('Вы уверены, что хотите удалить этого участника из проекта?')) {
    return
  }
  
  if (removingMemberId.value) return
  
  removingMemberId.value = userId
  
  try {
    const result = await apiRemoveProjectMemberRoute({ id: props.projectId }).run(ctx, {
      userId
    })
    
    if (result.success) {
      // Обновляем данные проекта
      await loadProject()
    } else {
      alert(result.error || 'Ошибка при удалении участника')
    }
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка удаления участника:', e)
    alert(e.message || 'Ошибка при удалении участника')
  } finally {
    removingMemberId.value = null
  }
}

// Загрузка ботов
const loadBots = async () => {
  if (!props.projectId) return
  
  loadingBots.value = true
  botsError.value = null
  
  try {
    const result = await apiGetBotsListRoute.query({ projectId: props.projectId }).run(ctx)
    
    if (result.success && result.bots) {
      bots.value = result.bots.map((bot: any) => ({
        id: bot.id,
        token: bot.token,
        botName: bot.botName || null,
        botUsername: bot.botUsername || null,
        projectId: bot.projectId,
        channelsCount: bot.channelsCount || 0
      }))
    } else {
      botsError.value = result.error || 'Ошибка при получении списка ботов'
    }
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка загрузки ботов:', e)
    botsError.value = e.message || 'Ошибка при загрузке ботов'
  } finally {
    loadingBots.value = false
  }
}

// Загрузка каналов
const loadChannels = async () => {
  if (!props.projectId) return
  
  loadingChannels.value = true
  channelsError.value = null
  
  try {
    const result = await apiGetChannelsListRoute.query({ projectId: props.projectId }).run(ctx)
    
    if (result.success && result.channels) {
      channels.value = result.channels.map((channel: any) => ({
        id: channel.id,
        chatId: channel.chatId,
        chatType: channel.chatType || null,
        chatTitle: channel.chatTitle || null,
        chatUsername: channel.chatUsername || null,
        firstSeenAt: channel.firstSeenAt,
        lastSeenAt: channel.lastSeenAt
      }))
    } else {
      channelsError.value = result.error || 'Ошибка при получении списка каналов'
    }
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка загрузки каналов:', e)
    channelsError.value = e.message || 'Ошибка при загрузке каналов'
  } finally {
    loadingChannels.value = false
  }
}

// Маскирование токена
const maskToken = (token: string) => {
  if (token.length <= 14) {
    return '•'.repeat(token.length)
  }
  return token.substring(0, 10) + '•'.repeat(token.length - 14) + token.substring(token.length - 4)
}

// Открытие модального окна для добавления бота
const openAddTokenModal = () => {
  showAddTokenModal.value = true
  newToken.value = ''
  tokenError.value = null
}

// Закрытие модального окна
const closeAddTokenModal = () => {
  showAddTokenModal.value = false
  newToken.value = ''
  tokenError.value = null
  addingToken.value = false
}

// Добавление бота
const addToken = async () => {
  if (!newToken.value || !newToken.value.trim()) {
    tokenError.value = 'Введите токен бота'
    return
  }
  
  if (!props.projectId) {
    tokenError.value = 'Для добавления бота необходимо выбрать проект.'
    return
  }
  
  addingToken.value = true
  tokenError.value = null
  
  try {
    // 1. Валидация токена через API
    const validationResult = await apiValidateTokenRoute.body({
      token: newToken.value.trim()
    }).run(ctx)
    
    if (!validationResult.success) {
      tokenError.value = validationResult.error || 'Ошибка при проверке токена'
      return
    }
    
    // 2. Сохранение токена в таблицу
    const saveResult = await apiAddBotRoute.body({
      token: newToken.value.trim(),
      botName: validationResult.botInfo.name,
      botUsername: validationResult.botInfo.username,
      projectId: props.projectId
    }).run(ctx)
    
    if (!saveResult.success) {
      tokenError.value = saveResult.error || 'Ошибка при сохранении токена'
      return
    }
    
    // 3. Обновление списка и закрытие модального окна
    await loadBots()
    closeAddTokenModal()
  } catch (e: any) {
    console.error('[ProjectDetailPage] Ошибка при добавлении токена:', e)
    tokenError.value = e.message || 'Ошибка при добавлении токена'
  } finally {
    addingToken.value = false
  }
}

// Форматирование даты
const formatDate = (date: Date | string | null | undefined) => {
  if (!date) {
    return 'Дата не указана'
  }
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    
    // Проверка на валидность даты
    if (isNaN(d.getTime())) {
      return 'Неверная дата'
    }
    
    return d.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('[ProjectDetailPage] Ошибка форматирования даты:', error)
    return 'Ошибка форматирования даты'
  }
}

let escHandler: ((e: KeyboardEvent) => void) | null = null

onMounted(async () => {
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
  
  // Обработчик Esc для закрытия модального окна
  escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showAddTokenModal.value && !addingToken.value) {
      closeAddTokenModal()
    }
  }
  window.addEventListener('keydown', escHandler)
  
  await loadProject()
  
  // Загружаем заявки, если есть права
  if (canViewRequests.value) {
    await loadRequests()
  }
  
  // Автоматически переключаем на нужную вкладку, если передан параметр target
  if (props.target) {
    // Маппинг значений target на вкладки
    const targetToTab: Record<string, 'info' | 'bots' | 'channels' | 'links' | 'members' | 'requests'> = {
      'links': 'links',     // Для "Управлять ссылками" открываем вкладку "Ссылки"
      'channels': 'channels',
      'bots': 'bots'
    }
    
    const targetTab = targetToTab[props.target]
    if (targetTab) {
      activeTab.value = targetTab
    }
  }
  
  // Загружаем данные при переключении на соответствующие вкладки
  if (activeTab.value === 'bots') {
    await loadBots()
  } else if (activeTab.value === 'channels' || activeTab.value === 'links') {
    await loadChannels()
  }
})

onUnmounted(() => {
  // Cleanup обработчика Esc
  if (escHandler) {
    window.removeEventListener('keydown', escHandler)
    escHandler = null
  }
})

// Загрузка данных при переключении вкладок
const handleTabChange = async (tab: 'info' | 'bots' | 'channels' | 'links' | 'members' | 'requests') => {
  activeTab.value = tab
  
  if (tab === 'bots' && bots.value.length === 0 && !loadingBots.value) {
    await loadBots()
  } else if ((tab === 'channels' || tab === 'links') && channels.value.length === 0 && !loadingChannels.value) {
    await loadChannels()
  }
}
</script>

<template>
  <div class="app-layout bg-transparent text-[var(--color-text)] flex flex-col">
    <!-- Header -->
    <Header 
      :pageTitle="'A/Ley Services'" 
      :indexUrl="props.indexUrl" 
      :profileUrl="props.profileUrl" 
      :loginUrl="props.loginUrl" 
      :isAuthenticated="props.isAuthenticated" 
    />

    <!-- Content -->
    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner">
        <!-- Loading -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Загрузка проекта...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-container">
          <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ error }}</span>
          </div>
          <a v-if="props.projectsPageUrl" :href="props.projectsPageUrl" class="btn btn-primary mt-4">
            <i class="fas fa-arrow-left"></i>
            Вернуться к проектам
          </a>
        </div>

        <!-- Project Content -->
        <div v-else-if="project" class="project-detail">
          <!-- Project Header -->
          <div class="project-header">
            <div class="project-header-content">
              <h1 class="project-title">{{ project.name }}</h1>
              <p v-if="project.description" class="project-description">
                {{ project.description }}
              </p>
              <div class="project-meta">
                <span class="meta-item">
                  <i class="fas fa-users"></i>
                  {{ project.membersCount }} участников
                </span>
              </div>
            </div>
            <a v-if="props.projectsPageUrl" :href="props.projectsPageUrl" class="btn btn-secondary">
              <i class="fas fa-arrow-left"></i>
              К списку проектов
            </a>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button 
              @click="activeTab = 'info'"
              :class="['tab', { 'tab-active': activeTab === 'info' }]"
            >
              <i class="fas fa-info-circle"></i>
              Информация
            </button>
            <button 
              @click="handleTabChange('bots')"
              :class="['tab', { 'tab-active': activeTab === 'bots' }]"
            >
              <i class="fas fa-robot"></i>
              Боты
            </button>
            <button 
              @click="handleTabChange('channels')"
              :class="['tab', { 'tab-active': activeTab === 'channels' }]"
            >
              <i class="fas fa-broadcast-tower"></i>
              Каналы
            </button>
            <button 
              @click="handleTabChange('links')"
              :class="['tab', { 'tab-active': activeTab === 'links' }]"
            >
              <i class="fas fa-link"></i>
              Ссылки
            </button>
            <button 
              v-if="canManageMembers"
              @click="activeTab = 'members'"
              :class="['tab', { 'tab-active': activeTab === 'members' }]"
            >
              <i class="fas fa-users"></i>
              Участники
            </button>
            <button 
              v-if="canViewRequests"
              @click="activeTab = 'requests'"
              :class="['tab', { 'tab-active': activeTab === 'requests' }]"
            >
              <i class="fas fa-inbox"></i>
              Заявки
              <span v-if="requests.length > 0" class="tab-badge">{{ requests.length }}</span>
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Info Tab -->
            <div v-if="activeTab === 'info'" class="tab-panel">
              <div class="info-section">
                <h2 class="section-title">Информация о проекте</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label class="info-label">Название</label>
                    <div class="info-value">{{ project.name }}</div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">Описание</label>
                    <div class="info-value">{{ project.description || 'Нет описания' }}</div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">Участников</label>
                    <div class="info-value">{{ project.membersCount }}</div>
                  </div>
                  <div class="info-item">
                    <label class="info-label">ID проекта</label>
                    <div class="info-value info-value-code">{{ project.id }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bots Tab -->
            <div v-if="activeTab === 'bots'" class="tab-panel">
              <div class="section-header">
                <h2 class="section-title">Боты проекта</h2>
                <div class="section-actions">
                  <button @click="openAddTokenModal" class="btn btn-primary btn-sm">
                    <i class="fas fa-plus"></i>
                    Добавить бота
                  </button>
                  <button @click="loadBots" class="btn btn-secondary btn-sm" :disabled="loadingBots">
                    <i v-if="loadingBots" class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-sync-alt"></i>
                    Обновить
                  </button>
                </div>
              </div>
              
              <div v-if="loadingBots" class="loading-container-small">
                <div class="loading-spinner"></div>
                <p>Загрузка ботов...</p>
              </div>
              
              <div v-else-if="botsError" class="error-container">
                <div class="error-message">
                  <i class="fas fa-exclamation-circle"></i>
                  <span>{{ botsError }}</span>
                </div>
              </div>
              
              <div v-else-if="bots.length === 0" class="empty-state">
                <i class="fas fa-robot"></i>
                <p>Нет добавленных ботов</p>
                <p class="empty-subtext">Добавьте первого бота, чтобы начать работу</p>
              </div>
              
              <div v-else class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Username</th>
                      <th>Токен</th>
                      <th>Каналов</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="bot in bots" :key="bot.id">
                      <td>{{ bot.botName || 'Telegram Bot' }}</td>
                      <td>
                        <span v-if="bot.botUsername" class="username-value">@{{ bot.botUsername }}</span>
                        <span v-else class="text-secondary">—</span>
                      </td>
                      <td class="code-value">{{ maskToken(bot.token) }}</td>
                      <td>{{ bot.channelsCount || 0 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Channels Tab -->
            <div v-if="activeTab === 'channels'" class="tab-panel">
              <div class="section-header">
                <h2 class="section-title">Каналы проекта</h2>
                <button @click="loadChannels" class="btn btn-secondary btn-sm" :disabled="loadingChannels">
                  <i v-if="loadingChannels" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-sync-alt"></i>
                  Обновить
                </button>
              </div>
              
              <div v-if="loadingChannels" class="loading-container-small">
                <div class="loading-spinner"></div>
                <p>Загрузка каналов...</p>
              </div>
              
              <div v-else-if="channelsError" class="error-container">
                <div class="error-message">
                  <i class="fas fa-exclamation-circle"></i>
                  <span>{{ channelsError }}</span>
                </div>
              </div>
              
              <div v-else-if="channels.length === 0" class="empty-state">
                <i class="fas fa-broadcast-tower"></i>
                <p>Нет каналов</p>
                <p class="empty-subtext">Каналы появятся здесь после того, как бот начнёт получать вебхуки от Telegram</p>
              </div>
              
              <div v-else class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Username</th>
                      <th>Chat ID</th>
                      <th>Последняя активность</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="channel in channels" :key="channel.id">
                      <td>{{ channel.chatTitle || 'Канал без названия' }}</td>
                      <td>
                        <span v-if="channel.chatUsername" class="username-value">@{{ channel.chatUsername }}</span>
                        <span v-else class="text-secondary">—</span>
                      </td>
                      <td class="code-value">{{ channel.chatId }}</td>
                      <td>{{ formatDate(channel.lastSeenAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Links Tab -->
            <div v-if="activeTab === 'links'" class="tab-panel">
              <div class="section-header">
                <h2 class="section-title">Ссылки проекта</h2>
              </div>
              
              <div class="links-filter">
                <label class="filter-label">
                  <i class="fas fa-filter"></i>
                  Фильтр по каналу
                </label>
                <select 
                  v-model="selectedChannelId" 
                  class="filter-select"
                >
                  <option :value="null">Все каналы</option>
                  <option 
                    v-for="channel in channels" 
                    :key="channel.id" 
                    :value="channel.id"
                  >
                    {{ channel.chatTitle || channel.chatUsername || channel.chatId }}
                  </option>
                </select>
              </div>
              
              <div v-if="loadingChannels" class="loading-container-small">
                <div class="loading-spinner"></div>
                <p>Загрузка каналов...</p>
              </div>
              
              <div v-else-if="channels.length === 0" class="empty-state">
                <i class="fas fa-link"></i>
                <p>Нет каналов</p>
                <p class="empty-subtext">Сначала добавьте бота и дождитесь появления каналов</p>
              </div>
              
              <div v-else class="empty-state">
                <i class="fas fa-link"></i>
                <p>Функционал создания ссылок будет добавлен позже</p>
                <p class="empty-subtext">Здесь вы сможете создавать отслеживаемые ссылки для выбранного канала</p>
              </div>
            </div>

            <!-- Members Tab -->
            <div v-if="activeTab === 'members' && canManageMembers" class="tab-panel">
              <h2 class="section-title">Участники проекта</h2>
              <div v-if="project.members && project.members.length > 0" class="members-list">
                <div 
                  v-for="member in project.members" 
                  :key="member.userId"
                  class="member-item"
                >
                  <div class="member-info">
                    <div class="member-role">
                      <i 
                        :class="['fas', member.role === 'owner' ? 'fa-crown' : 'fa-user']"
                      ></i>
                      <span class="role-label">{{ member.role === 'owner' ? 'Владелец' : 'Участник' }}</span>
                    </div>
                    <div class="member-id">ID: {{ member.userId }}</div>
                  </div>
                  <button
                    v-if="member.userId !== ctx.user?.id && (isOwner || isAdmin)"
                    @click="removeMember(member.userId)"
                    class="btn btn-danger btn-sm"
                    :disabled="removingMemberId === member.userId"
                  >
                    <i v-if="removingMemberId === member.userId" class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-trash"></i>
                    Удалить
                  </button>
                </div>
              </div>
              <div v-else class="empty-state">
                <i class="fas fa-users"></i>
                <p>Нет участников</p>
              </div>
            </div>

            <!-- Requests Tab -->
            <div v-if="activeTab === 'requests' && canViewRequests" class="tab-panel">
              <div class="section-header">
                <h2 class="section-title">Входящие запросы</h2>
                <button @click="loadRequests" class="btn btn-secondary btn-sm" :disabled="loadingRequests">
                  <i v-if="loadingRequests" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-sync-alt"></i>
                  Обновить
                </button>
              </div>
              
              <div v-if="loadingRequests" class="loading-container-small">
                <div class="loading-spinner"></div>
                <p>Загрузка заявок...</p>
              </div>
              
              <div v-else-if="requests.length === 0" class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Нет входящих заявок</p>
              </div>
              
              <div v-else class="requests-list">
                <div 
                  v-for="request in requests" 
                  :key="request.id"
                  class="request-item"
                >
                  <div class="request-info">
                    <div class="request-user">
                      <i class="fas fa-user"></i>
                      <span>ID пользователя: {{ request.userId }}</span>
                    </div>
                    <div class="request-date">
                      <i class="fas fa-clock"></i>
                      <span>Подана: {{ formatDate(request.requestedAt) }}</span>
                    </div>
                  </div>
                  <div class="request-actions">
                    <button
                      @click="approveRequest(request.id)"
                      class="btn btn-success btn-sm"
                      :disabled="processingRequestId === request.id"
                    >
                      <i v-if="processingRequestId === request.id" class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-check"></i>
                      Принять
                    </button>
                    <button
                      @click="rejectRequest(request.id)"
                      class="btn btn-danger btn-sm"
                      :disabled="processingRequestId === request.id"
                    >
                      <i v-if="processingRequestId === request.id" class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-times"></i>
                      Отклонить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-left">ИП Худолей Андрей Германович</div>
        <div class="footer-center">Все права сохранены © 2025</div>
        <div class="footer-right">
          <button class="footer-link">
            Сделано с <i class="fas fa-heart footer-heart"></i> на Chatium
          </button>
        </div>
      </div>
    </footer>

    <!-- Add Token Modal -->
    <Transition name="modal">
      <div v-if="showAddTokenModal" class="modal-overlay" @click="addingToken ? null : closeAddTokenModal">
        <div class="modal-content" @click.stop>
          <div class="modal-scanlines"></div>
          
          <div class="modal-header">
            <h2 class="modal-title">Ввести новый токен</h2>
            <button @click="closeAddTokenModal" class="modal-close-btn" :disabled="addingToken">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-key"></i>
                Токен бота
              </label>
              <input 
                v-model="newToken"
                type="text" 
                class="form-input"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                :disabled="addingToken"
              />
              <p class="form-hint">
                Токен можно получить у <a href="https://t.me/BotFather" target="_blank" class="form-link">@BotFather</a>
              </p>
              <div v-if="tokenError" class="form-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{ tokenError }}</span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="addToken" class="modal-btn modal-btn-submit" :disabled="addingToken">
              <span v-if="addingToken">
                <i class="fas fa-spinner fa-spin"></i>
                Проверка...
              </span>
              <span v-else>Добавить</span>
            </button>
            <button @click="closeAddTokenModal" class="modal-btn modal-btn-cancel" :disabled="addingToken">
              Отмена
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
:root {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-bg-tertiary: #1a1a1a;
  --color-text: #e8e8e8;
  --color-text-secondary: #a0a0a0;
  --color-text-tertiary: #707070;
  --color-border: #2a2a2a;
  --color-border-light: #3a3a3a;
  --color-accent: #d3234b;
  --color-accent-hover: #e6395f;
  --color-accent-light: rgba(211, 35, 75, 0.15);
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* App Layout */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  position: relative;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  padding: 3rem 0;
}

.content-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  flex-direction: column;
  gap: 1rem;
}

.loading-container-small {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  flex-direction: column;
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(211, 35, 75, 0.1);
  border: 2px solid var(--color-accent);
  color: var(--color-accent);
  font-size: 1rem;
}

.project-detail {
  width: 100%;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
}

.project-header-content {
  flex: 1;
}

.project-title {
  font-size: 2rem;
  font-weight: 400;
  margin: 0 0 0.75rem 0;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.project-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.project-meta {
  display: flex;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
}

.meta-item i {
  color: var(--color-accent);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.btn-primary {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-primary:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent-hover);
}

.btn-secondary {
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-border-light);
  color: var(--color-text);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-success {
  border-color: #4ade80;
  color: #4ade80;
}

.btn-success:hover {
  background: rgba(74, 222, 128, 0.1);
  border-color: #22c55e;
}

.btn-danger {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.btn-danger:hover {
  background: var(--color-accent-light);
  border-color: var(--color-accent-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 2rem;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.tab {
  padding: 0.75rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
}

.tab:hover {
  color: var(--color-text);
}

.tab-active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.tab-badge {
  background: var(--color-accent);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.tab-content {
  min-height: 400px;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0;
  color: var(--color-text);
  letter-spacing: 0.05em;
}

.section-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.info-section {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  padding: 2rem;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.03em;
}

.info-value {
  font-size: 1rem;
  color: var(--color-text);
}

.info-value-code {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--color-accent);
  word-break: break-all;
}

.members-list,
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-item,
.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.member-info,
.request-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.member-role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 1rem;
}

.member-role i {
  color: var(--color-accent);
}

.role-label {
  font-weight: 500;
}

.member-id {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-family: 'Courier New', monospace;
}

.request-user,
.request-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text);
  font-size: 0.9375rem;
}

.request-user i,
.request-date i {
  color: var(--color-accent);
}

.request-date {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.request-actions {
  display: flex;
  gap: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--color-text-secondary);
}

.empty-state i {
  font-size: 4rem;
  color: var(--color-text-tertiary);
  margin-bottom: 1.5rem;
  display: block;
}

.empty-subtext {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  margin-top: 0.5rem;
}

.table-container {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  padding: 1.5rem;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.data-table thead {
  background: rgba(0, 0, 0, 0.3);
}

.data-table th {
  padding: 1rem;
  text-align: left;
  color: var(--color-text);
  font-weight: 400;
  letter-spacing: 0.03em;
  border-bottom: 2px solid var(--color-border);
}

.data-table td {
  padding: 1rem;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
}

.data-table tbody tr:hover {
  background: rgba(211, 35, 75, 0.05);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.code-value {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--color-accent);
  letter-spacing: 0.05em;
}

.username-value {
  color: var(--color-accent);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
}

.text-secondary {
  color: var(--color-text-secondary);
}

.links-filter {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--color-text);
  font-size: 0.9375rem;
  letter-spacing: 0.03em;
}

.filter-label i {
  color: var(--color-accent);
}

.filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.9375rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: var(--transition);
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 10px rgba(211, 35, 75, 0.3);
}

.filter-select:hover {
  border-color: var(--color-border-light);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 2px solid var(--color-accent);
  padding: 0;
  max-width: 600px;
  width: 100%;
  position: relative;
  box-shadow: 
    0 0 40px rgba(211, 35, 75, 0.4),
    0 0 80px rgba(211, 35, 75, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

/* Modal transitions */
.modal-enter-active {
  transition: opacity 0.3s ease-out;
}

.modal-leave-active {
  transition: opacity 0.3s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  animation: modal-appear 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.modal-leave-active .modal-content {
  animation: modal-disappear 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}

@keyframes modal-appear {
  from {
    transform: scale(0.8) translateY(20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes modal-disappear {
  from {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
  to {
    transform: scale(0.8) translateY(20px);
    opacity: 0;
  }
}

.modal-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15) 0px,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 1;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2rem 2.5rem;
  border-bottom: 1px solid var(--color-border);
  position: relative;
  z-index: 2;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
  letter-spacing: 0.08em;
  text-shadow: 
    0 0 10px rgba(232, 232, 232, 0.4),
    0 0 20px rgba(211, 35, 75, 0.2);
}

.modal-close-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0;
  background: transparent;
  border: 2px solid var(--color-border);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.modal-close-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.12) 0px,
    rgba(0, 0, 0, 0.12) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 0;
}

.modal-close-btn i {
  position: relative;
  z-index: 2;
}

.modal-close-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(211, 35, 75, 0.1);
}

.modal-body {
  padding: 2rem 2.5rem;
  position: relative;
  z-index: 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: var(--color-text);
  letter-spacing: 0.03em;
}

.form-label i {
  color: var(--color-accent);
}

.form-input {
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.9375rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
  transition: var(--transition);
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 10px rgba(211, 35, 75, 0.3);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.2);
}

.form-input::placeholder {
  color: var(--color-text-tertiary);
}

.form-hint {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0;
  letter-spacing: 0.02em;
}

.form-link {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.25s ease;
}

.form-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.form-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(211, 35, 75, 0.1);
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
}

.form-error i {
  flex-shrink: 0;
}

.form-error span {
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem 2.5rem;
  border-top: 1px solid var(--color-border);
  position: relative;
  z-index: 2;
}

.modal-btn {
  min-width: 120px;
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  border: 2px solid;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

.modal-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.12) 0px,
    rgba(0, 0, 0, 0.12) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 0;
}

.modal-btn span,
.modal-btn {
  position: relative;
  z-index: 2;
}

.modal-btn-cancel {
  color: var(--color-text-secondary);
  border-color: var(--color-border-light);
}

.modal-btn-cancel:hover {
  color: var(--color-text);
  border-color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.05);
}

.modal-btn-submit {
  color: var(--color-accent);
  border-color: var(--color-accent);
  box-shadow: 0 0 10px rgba(211, 35, 75, 0.3);
}

.modal-btn-submit:hover:not(:disabled) {
  background: var(--color-accent);
  color: white;
  box-shadow: 
    0 0 20px rgba(211, 35, 75, 0.6),
    0 0 40px rgba(211, 35, 75, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.modal-btn-submit:disabled {
  opacity: 0.6;
  cursor: wait;
}

.app-footer {
  background: transparent;
  padding: 1.5rem 0;
  flex-shrink: 0;
  position: relative;
  z-index: 200;
  margin-top: auto;
}

/* Terminal-style corner brackets for footer */
.app-footer::before {
  content: '';
  position: absolute;
  bottom: 10px;
  left: 10px;
  width: 20px;
  height: 20px;
  border-left: 2px solid rgba(211, 35, 75, 0.3);
  border-bottom: 2px solid rgba(211, 35, 75, 0.3);
  pointer-events: none;
}

.app-footer::after {
  content: '';
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border-right: 2px solid rgba(211, 35, 75, 0.3);
  border-bottom: 2px solid rgba(211, 35, 75, 0.3);
  pointer-events: none;
}

.footer-content {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.03em;
  position: relative;
}

.footer-left:hover,
.footer-center:hover {
  animation: glitch-footer 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes glitch-footer {
  0%, 100% {
    transform: translate(0);
    text-shadow: none;
  }
  10% {
    transform: translate(-1.5px, 0);
    text-shadow: 1px 0 #ff00ff, -1px 0 #00ffff;
  }
  20% {
    transform: translate(1.5px, 0);
    text-shadow: -1px 0 #ff00ff, 1px 0 #00ffff;
  }
  30% {
    transform: translate(-1px, 0);
    text-shadow: 1.5px 0 #ff00ff, -1.5px 0 #00ffff;
  }
  40% {
    transform: translate(1px, 0);
    text-shadow: -1.5px 0 #ff00ff, 1.5px 0 #00ffff;
  }
  50% {
    transform: translate(-1.5px, 0);
    text-shadow: 1px 0 #ff00ff, -1px 0 #00ffff;
  }
  60% {
    transform: translate(1.5px, 0);
    text-shadow: -1px 0 #ff00ff, 1px 0 #00ffff;
  }
  70% {
    transform: translate(-1px, 0);
    text-shadow: 1px 0 #ff00ff, -1px 0 #00ffff;
  }
  80% {
    transform: translate(1px, 0);
    text-shadow: -1px 0 #ff00ff, 1px 0 #00ffff;
  }
  90% {
    transform: translate(-0.5px, 0);
    text-shadow: 0.5px 0 #ff00ff, -0.5px 0 #00ffff;
  }
}

.footer-left {
  flex: 1;
  text-align: left;
  color: var(--color-text-secondary);
}

.footer-center {
  flex: 0 0 auto;
  text-align: center;
  color: var(--color-text-secondary);
}

.footer-right {
  flex: 1;
  text-align: right;
}

.footer-link {
  color: var(--color-text-secondary);
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.25s ease;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  position: relative;
  z-index: 10;
}

.footer-link:hover {
  color: var(--color-text);
  animation: glitch-footer 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.footer-heart {
  color: #dd3057;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .project-header {
    flex-direction: column;
  }
  
  .tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .member-item,
  .request-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .request-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
