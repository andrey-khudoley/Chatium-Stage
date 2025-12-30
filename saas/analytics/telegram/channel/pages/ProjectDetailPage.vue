<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Header from '../shared/Header.vue'
import { 
  apiGetProjectRoute, 
  apiGetProjectRequestsRoute, 
  apiApproveProjectRequestRoute, 
  apiRejectProjectRequestRoute,
  apiRemoveProjectMemberRoute
} from '../api/projects'

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
const activeTab = ref<'info' | 'bots' | 'channels' | 'members' | 'requests'>('info')
const loadingRequests = ref(false)
const processingRequestId = ref<string | null>(null)
const removingMemberId = ref<string | null>(null)

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

onMounted(async () => {
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
  
  await loadProject()
  
  // Загружаем заявки, если есть права
  if (canViewRequests.value) {
    await loadRequests()
  }
  
  // Автоматически переключаем на нужную вкладку, если передан параметр target
  if (props.target) {
    // Маппинг значений target на вкладки
    const targetToTab: Record<string, 'info' | 'bots' | 'channels' | 'members' | 'requests'> = {
      'links': 'info',      // Для "Управлять ссылками" открываем вкладку "Информация"
      'channels': 'channels',
      'bots': 'bots'
    }
    
    const targetTab = targetToTab[props.target]
    if (targetTab) {
      activeTab.value = targetTab
    }
  }
})
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
              @click="activeTab = 'bots'"
              :class="['tab', { 'tab-active': activeTab === 'bots' }]"
            >
              <i class="fas fa-robot"></i>
              Боты
            </button>
            <button 
              @click="activeTab = 'channels'"
              :class="['tab', { 'tab-active': activeTab === 'channels' }]"
            >
              <i class="fas fa-broadcast-tower"></i>
              Каналы
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
                <a 
                  v-if="props.botsPageUrl"
                  :href="`${props.botsPageUrl}?projectId=${project.id}`"
                  class="btn btn-primary"
                >
                  <i class="fas fa-external-link-alt"></i>
                  Управлять ботами
                </a>
              </div>
              <p class="section-description">
                Для управления ботами проекта перейдите на страницу управления ботами.
              </p>
            </div>

            <!-- Channels Tab -->
            <div v-if="activeTab === 'channels'" class="tab-panel">
              <div class="section-header">
                <h2 class="section-title">Каналы проекта</h2>
                <a 
                  v-if="props.channelsPageUrl"
                  :href="`${props.channelsPageUrl}?projectId=${project.id}`"
                  class="btn btn-primary"
                >
                  <i class="fas fa-external-link-alt"></i>
                  Управлять каналами
                </a>
              </div>
              <p class="section-description">
                Для управления каналами проекта перейдите на страницу управления каналами.
              </p>
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
