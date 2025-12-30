<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Header from '../shared/Header.vue'
import { apiGetBotsListRoute, apiValidateTokenRoute, apiAddBotRoute, apiDeleteBotRoute } from '../api/bots'
import { apiCheckWebhookRoute } from '../api/webhook'
import { webhooksPageRoute } from '../webhooks'

declare const ctx: any

declare global {
  interface Window {
    hideAppLoader?: () => void
  }
}

const props = defineProps<{
  projectTitle: string
  projectId: string // Обязательный параметр projectId
  indexUrl: string
  profileUrl: string
  loginUrl: string
  isAuthenticated: boolean
  projectsPageUrl?: string
}>()

// Данные ботов из таблицы
const bots = ref<Array<{
  id: string
  token: string
  botName: string | null
  botUsername: string | null
  projectId: string
  channelsCount?: number
  groupsCount?: number
  inviteLinksCount?: number
}>>([])

const loading = ref(true)
const error = ref<string | null>(null)
const missingProjectId = ref(false)
const showAddTokenModal = ref(false)
const newToken = ref('')
const bootLoaderDone = ref(false)
const addingToken = ref(false)
const tokenError = ref<string | null>(null)

// Анимация печатания текста
const displayedTitle = ref('')
const displayedDescription = ref('')
const showCursor = ref(false)
const cursorPosition = ref<'title' | 'description' | 'final'>('title')
const showTitleUnderline = ref(false)
const showContent = ref(false)

let escHandler: ((e: KeyboardEvent) => void) | null = null

// Загрузка данных из таблицы через .run()
const loadBots = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Более строгая проверка с нормализацией (как в ChannelsPage.vue)
    const projectId = props.projectId?.trim()
    if (!projectId) {
      const errorMsg = 'Для управления ботами необходимо выбрать проект.'
      console.error('[BotsPage] projectId не найден в props')
      error.value = errorMsg
      missingProjectId.value = true
      loading.value = false
      // Редирект на страницу проектов если доступна
      if (props.projectsPageUrl) {
        setTimeout(() => {
          window.location.href = props.projectsPageUrl!
        }, 2000) // Даём время увидеть сообщение об ошибке
      }
      return
    }
    
    missingProjectId.value = false
    
    console.log('[BotsPage] Начало загрузки списка ботов для проекта:', projectId)
    // ИСПРАВЛЕНИЕ Bug 4: Используем .query() для передачи query параметров в GET запрос
    // Для GET запросов нужно использовать .query() перед .run(), а не передавать параметры во второй аргумент .run()
    // Второй аргумент .run() используется только для POST запросов (body)
    const result = await apiGetBotsListRoute.query({ projectId: projectId }).run(ctx)
    console.log('[BotsPage] Результат запроса:', result)
    
    if (result.success && result.bots) {
      console.log(`[BotsPage] Получено ботов: ${result.bots.length}`)
      // Преобразуем данные из таблицы в формат для отображения
      bots.value = result.bots.map((bot: any) => ({
        id: bot.id,
        token: bot.token,
        botName: bot.botName || null,
        botUsername: bot.botUsername || null,
        projectId: bot.projectId,
        // Количество каналов из API
        channelsCount: bot.channelsCount || 0,
        // Временные значения для статистики (пока не реализовано)
        groupsCount: 0,
        inviteLinksCount: 0
      }))
      console.log('[BotsPage] Данные ботов успешно обработаны и установлены')
    } else {
      const errorMsg = result.error || 'Ошибка при получении списка ботов'
      console.warn('[BotsPage] Ошибка в ответе API:', errorMsg)
      error.value = errorMsg
    }
  } catch (e: any) {
    const errorMsg = e.message || 'Ошибка при загрузке ботов'
    console.error('[BotsPage] Исключение при загрузке ботов:', e)
    console.error('[BotsPage] Stack trace:', e.stack)
    error.value = errorMsg
  } finally {
    loading.value = false
    console.log('[BotsPage] Загрузка завершена, loading установлен в false')
  }
}

onMounted(async () => {
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }
  
  // Обработчик Esc для закрытия модального окна (добавляем сразу)
  escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showAddTokenModal.value) {
      closeAddTokenModal()
    }
  }
  window.addEventListener('keydown', escHandler)
  
  // Ждём завершения bootloader для анимации
  const startAnimations = () => {
    bootLoaderDone.value = true
    
    // 1. Сначала 1 секунда мигает курсор без текста
    showCursor.value = true
    cursorPosition.value = 'title'
    
    setTimeout(() => {
      // 2. Начинаем последовательный набор текста
      typeTextSequence()
    }, 1000)
  }

  if ((window as any).bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', startAnimations)
  }

  const typeTextSequence = () => {
    const titleText = 'Управление ботами'
    cursorPosition.value = 'title'
    
    // Набираем заголовок
    let titleIndex = 0
    const titleInterval = setInterval(() => {
      if (titleIndex < titleText.length) {
        displayedTitle.value = titleText.substring(0, titleIndex + 1)
        titleIndex++
      } else {
        clearInterval(titleInterval)
        // После завершения набора заголовка показываем разделительную черту
        showTitleUnderline.value = true
        // Затем набираем описание
        typeDescription()
      }
    }, 30)
  }

  const typeDescription = () => {
    const descriptionText = 'Настройте Telegram-ботов для автоматизации работы с аналитикой и уведомлениями'
    cursorPosition.value = 'description'
    let descIndex = 0
    const descInterval = setInterval(() => {
      if (descIndex < descriptionText.length) {
        displayedDescription.value = descriptionText.substring(0, descIndex + 1)
        descIndex++
      } else {
        clearInterval(descInterval)
        // После завершения набора всех элементов показываем контент
        cursorPosition.value = 'final'
        showContent.value = true
        // Загружаем данные из таблицы
        loadBots()
      }
    }, 30)
  }
})

onUnmounted(() => {
  // Cleanup обработчика Esc
  if (escHandler) {
    window.removeEventListener('keydown', escHandler)
    escHandler = null // Очищаем ссылку для предотвращения утечек
  }
})

const openAddTokenModal = () => {
  showAddTokenModal.value = true
  newToken.value = ''
  tokenError.value = null
}

const closeAddTokenModal = () => {
  showAddTokenModal.value = false
  newToken.value = ''
  tokenError.value = null
  addingToken.value = false
}

const addToken = async () => {
  if (!newToken.value || !newToken.value.trim()) {
    tokenError.value = 'Введите токен бота'
    return
  }
  
  // Явная проверка projectId вместо вызова getProjectId()
  const projectId = props.projectId?.trim()
  if (!projectId) {
    tokenError.value = 'Для добавления бота необходимо выбрать проект.'
    console.error('[BotsPage] addToken: projectId не найден в props')
    return
  }
  
  addingToken.value = true
  tokenError.value = null
  
  try {
    console.log('[BotsPage] addToken: Начало валидации токена')
    
    // 1. Валидация токена через API
    const validationResult = await apiValidateTokenRoute.run(ctx, {
      token: newToken.value.trim()
    })
    
    console.log('[BotsPage] addToken: Результат валидации:', validationResult)
    
    if (!validationResult.success) {
      tokenError.value = validationResult.error || 'Ошибка при проверке токена'
      return
    }
    
    // 2. Сохранение токена в таблицу
    console.log('[BotsPage] addToken: Сохранение бота в таблицу')
    const saveResult = await apiAddBotRoute.run(ctx, {
      token: newToken.value.trim(),
      botName: validationResult.botInfo.name,
      botUsername: validationResult.botInfo.username,
      projectId: projectId
    })
    
    console.log('[BotsPage] addToken: Результат сохранения:', saveResult)
    
    if (!saveResult.success) {
      tokenError.value = saveResult.error || 'Ошибка при сохранении токена'
      return
    }
    
    // 3. Обновление списка и закрытие модального окна
    console.log('[BotsPage] addToken: Обновление списка ботов')
    await loadBots()
    closeAddTokenModal()
  } catch (e: any) {
    console.error('[BotsPage] addToken: Ошибка при добавлении токена:', e)
    console.error('[BotsPage] addToken: Stack trace:', e.stack)
    tokenError.value = e.message || 'Ошибка при добавлении токена'
  } finally {
    addingToken.value = false
  }
}

const deleteToken = async (botId: string) => {
  try {
    console.log('[BotsPage] deleteToken: Начало удаления бота с ID:', botId)
    
    // Вызываем API для удаления бота
    const result = await apiDeleteBotRoute.run(ctx, {
      botId: botId
    })
    
    console.log('[BotsPage] deleteToken: Результат удаления:', result)
    
    if (!result.success) {
      console.error('[BotsPage] deleteToken: Ошибка при удалении:', result.error)
      // Можно показать уведомление об ошибке пользователю
      return
    }
    
    // Обновляем список ботов после успешного удаления
    console.log('[BotsPage] deleteToken: Обновление списка ботов')
    await loadBots()
  } catch (e: any) {
    console.error('[BotsPage] deleteToken: Исключение при удалении:', e)
    console.error('[BotsPage] deleteToken: Stack trace:', e.stack)
    // Можно показать уведомление об ошибке пользователю
  }
}

const maskToken = (token: string) => {
  // Маскируем токен, показывая только первые 10 и последние 4 символа
  if (token.length <= 14) {
    return '•'.repeat(token.length)
  }
  return token.substring(0, 10) + '•'.repeat(token.length - 14) + token.substring(token.length - 4)
}

const checkWebhook = async (botId: string) => {
  try {
    console.log('[BotsPage] checkWebhook: Проверка webhook для бота:', botId)
    
    // Для роутов с параметрами пути используем route({ param }).run(ctx)
    const result = await apiCheckWebhookRoute({ id: botId }).run(ctx)
    
    console.log('[BotsPage] checkWebhook: Результат проверки:', result)
    
    if (result.success && result.webhookInfo) {
      const info = result.webhookInfo
      const message = `Webhook статус:\n` +
        `URL: ${info.url || 'не установлен'}\n` +
        `Ожидаемый URL: ${result.expectedUrl}\n` +
        `Правильный: ${result.isCorrect ? 'Да' : 'Нет'}\n` +
        `Ожидает обновлений: ${info.has_custom_certificate ? 'Да' : 'Нет'}\n` +
        `Ошибок: ${info.pending_update_count || 0}\n` +
        (info.last_error_date ? `Последняя ошибка: ${new Date(info.last_error_date * 1000).toLocaleString()}\n` : '') +
        (info.last_error_message ? `Сообщение: ${info.last_error_message}` : '')
      
      alert(message)
    } else {
      alert(`Ошибка проверки webhook: ${result.error || 'Неизвестная ошибка'}`)
    }
  } catch (e: any) {
    console.error('[BotsPage] checkWebhook: Ошибка:', e)
    alert(`Ошибка при проверке webhook: ${e.message || 'Неизвестная ошибка'}`)
  }
}

const viewWebhooks = (botId: string) => {
  // Переходим на страницу вебхуков с фильтром по botId
  const webhooksUrl = webhooksPageRoute.query({ botId: botId }).url()
  window.location.href = webhooksUrl
}
</script>

<template>
  <div class="app-layout bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
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
        <!-- Page Title -->
        <section class="page-header">
          <div class="page-header-icon">
            <i class="fas fa-robot"></i>
          </div>
          <h1 class="page-title" :class="{ 'show-underline': showTitleUnderline }">
            {{ displayedTitle }}<span v-if="showCursor && (cursorPosition === 'title' || cursorPosition === 'final')" class="typing-cursor">▮</span>
          </h1>
          <div v-if="showContent" class="project-name-badge">
            <i class="fas fa-folder"></i>
            <span>{{ props.projectTitle }}</span>
          </div>
          <p class="page-description">
            {{ displayedDescription }}<span v-if="showCursor && cursorPosition === 'description'" class="typing-cursor">▮</span>
          </p>
        </section>

        <!-- Add Token Button -->
        <section class="actions-section" :class="{ 'content-visible': showContent }">
          <button @click="openAddTokenModal" class="add-token-btn">
            <i class="fas fa-plus"></i>
            <span>Ввести новый токен</span>
          </button>
        </section>

        <!-- Bots List -->
        <section class="bots-section" :class="{ 'content-visible': showContent }">
          <div v-if="loading" class="empty-state" :class="{ 'content-visible': showContent }">
            <i class="fas fa-spinner fa-spin empty-icon"></i>
            <p class="empty-text">Загрузка ботов...</p>
          </div>
          
          <div v-else-if="error" class="empty-state" :class="{ 'content-visible': showContent }">
            <i class="fas fa-exclamation-triangle empty-icon"></i>
            <p class="empty-text">Ошибка загрузки</p>
            <p class="empty-subtext">{{ error }}</p>
            <!-- ИСПРАВЛЕНИЕ Bug 4: Проверяем наличие projectsPageUrl перед рендерингом ссылки -->
            <a 
              v-if="missingProjectId && props.projectsPageUrl && props.projectsPageUrl.trim()" 
              :href="props.projectsPageUrl.trim()" 
              class="btn btn-primary mt-4"
            >
              <i class="fas fa-folder-open"></i>
              Перейти к проектам
            </a>
          </div>
          
          <div v-else-if="bots.length === 0" class="empty-state" :class="{ 'content-visible': showContent }">
            <i class="fas fa-robot empty-icon"></i>
            <p class="empty-text">Нет добавленных ботов</p>
            <p class="empty-subtext">Добавьте первый токен бота, чтобы начать работу</p>
          </div>

          <div v-else class="bots-list" :class="{ 'content-visible': showContent }">
            <div 
              v-for="(bot, index) in bots" 
              :key="bot.id" 
              class="bot-card"
              :style="{ '--delay': Number(index) * 0.1 + 's' }"
            >
              <div class="bot-card-content">
                <!-- CRT scanlines эффект -->
                <div class="bot-card-scanlines"></div>
                
                <div class="bot-card-header">
                  <div class="bot-card-icon">
                    <i class="fas fa-robot"></i>
                  </div>
                  <div class="bot-card-title-section">
                    <h3 class="bot-card-title">{{ bot.botName || 'Telegram Bot' }}</h3>
                    <div v-if="bot.botUsername" class="bot-card-username">
                      <span class="username-label">Username:</span>
                      <span class="username-value">@{{ bot.botUsername }}</span>
                    </div>
                    <div class="bot-card-token">
                      <span class="token-label">Токен:</span>
                      <span class="token-value">{{ maskToken(bot.token) }}</span>
                    </div>
                  </div>
                  <button 
                    @click="checkWebhook(bot.id)" 
                    class="bot-check-btn"
                    title="Проверить webhook"
                  >
                    <i class="fas fa-link"></i>
                  </button>
                  <button 
                    @click="viewWebhooks(bot.id)" 
                    class="bot-view-webhooks-btn"
                    title="Просмотр вебхуков"
                  >
                    <i class="fas fa-list"></i>
                  </button>
                  <button 
                    @click="deleteToken(bot.id)" 
                    class="bot-delete-btn"
                    title="Удалить токен"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>

                <div class="bot-card-stats">
                  <div class="stat-item">
                    <div class="stat-icon stat-icon-channels">
                      <i class="fas fa-broadcast-tower"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ bot.channelsCount }}</div>
                      <div class="stat-label">Каналов</div>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon stat-icon-links">
                      <i class="fas fa-link"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ bot.inviteLinksCount }}</div>
                      <div class="stat-label">Ссылок</div>
                    </div>
                  </div>

                  <div class="stat-item">
                    <div class="stat-icon stat-icon-groups">
                      <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-value">{{ bot.groupsCount }}</div>
                      <div class="stat-label">Лидов</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
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

<style>
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
  --color-accent-medium: rgba(211, 35, 75, 0.25);
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

body {
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  margin: 0;
  background: var(--color-bg);
  letter-spacing: 0.03em;
}

::selection {
  background: #e0335a;
  color: #ffffff;
}

::-moz-selection {
  background: #e0335a;
  color: #ffffff;
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

/* Content Wrapper */
.content-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  z-index: 100;
  padding: 3rem 0;
  animation: content-fade-in 0.6s ease-out;
}

@keyframes content-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.content-inner {
  width: 100%;
  max-width: 1200px;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

/* Page Header */
.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  padding: 2rem 0;
  position: relative;
}

.page-header-icon {
  width: 5rem;
  height: 5rem;
  border-radius: 0;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 24px rgba(211, 35, 75, 0.4),
    0 4px 12px rgba(211, 35, 75, 0.3),
    0 0 30px rgba(211, 35, 75, 0.2),
    inset 0 0 0 2px rgba(0, 0, 0, 0.3);
  margin-bottom: 0.5rem;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.page-header-icon::before {
  content: '';
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
  z-index: 2;
  animation: scanline-flicker 8s linear infinite;
}

@keyframes scanline-flicker {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.5; }
}

.page-header-icon i {
  font-size: 2rem;
  color: white;
  position: relative;
  z-index: 3;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0.08em;
  margin: 0;
  margin-bottom: 0.5rem;
  min-height: 3rem;
  color: var(--color-text);
  position: relative;
  z-index: 10;
  text-shadow: 0 0 8px rgba(232, 232, 232, 0.3);
  /* Резервируем место заранее, чтобы контент не сдвигался */
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.page-title.show-underline::after {
  opacity: 1;
}

.typing-cursor {
  display: inline-block;
  margin-left: 0.25rem;
  animation: terminal-cursor-blink 1s step-end infinite;
  color: var(--color-accent);
  text-shadow: 0 0 8px rgba(211, 35, 75, 0.5);
  font-size: 1em;
  line-height: 1;
  vertical-align: baseline;
}

@keyframes terminal-cursor-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.page-description {
  font-size: 1rem;
  line-height: 1.6;
  color: var(--color-text-secondary);
  font-weight: 400;
  margin: 0;
  margin-bottom: 2rem;
  min-height: 1.6rem;
  max-width: 600px;
  letter-spacing: 0.05em;
  text-shadow: 0 0 6px rgba(160, 160, 160, 0.2);
  /* Резервируем место заранее, чтобы контент не сдвигался */
}

.project-name-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  background: rgba(211, 35, 75, 0.1);
  border: 1px solid rgba(211, 35, 75, 0.3);
  color: var(--color-accent);
  font-size: 0.875rem;
  letter-spacing: 0.03em;
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
}

.project-name-badge i {
  font-size: 0.75rem;
}

/* Actions Section */
.actions-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
  min-height: 60px;
  position: relative;
  opacity: 0;
  pointer-events: none;
  transform: scaleY(0.01);
  transform-origin: center;
  transition: opacity 0.1s;
  overflow: visible;
  filter: brightness(0.8);
  /* Резервируем место для контента - всегда занимаем полную высоту */
  margin-bottom: 1rem;
  /* Важно: элемент всегда занимает место в layout */
}

.actions-section.content-visible {
  opacity: 1;
  pointer-events: auto;
  animation: crt-tv-power-on 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes crt-tv-power-on {
  /* Мгновенное появление яркой полосы */
  0% {
    transform: scaleY(0.01) perspective(500px) rotateX(0deg);
    filter: brightness(1.5) contrast(1.3);
    clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%);
    opacity: 1;
  }
  /* Плавное начало развертки */
  0.5% {
    transform: scaleY(0.03) perspective(490px) rotateX(0.5deg);
    filter: brightness(1.45) contrast(1.32) drop-shadow(0.5px 0 0 rgba(255, 0, 0, 0.15)) drop-shadow(-0.5px 0 0 rgba(0, 0, 255, 0.15));
    clip-path: polygon(0 49%, 100% 49.5%, 100% 50.5%, 0 51%);
    opacity: 1;
  }
  2% {
    transform: scaleY(0.11) perspective(465px) rotateX(1.6deg);
    filter: brightness(1.35) contrast(1.37) drop-shadow(1.8px 0 0 rgba(255, 0, 0, 0.28)) drop-shadow(-1.8px 0 0 rgba(0, 0, 255, 0.28));
    clip-path: polygon(0 45%, 100% 47%, 100% 53%, 0 55%);
    opacity: 1;
  }
  /* Плавное расширение с искажениями */
  5% {
    transform: scaleY(0.24) perspective(440px) rotateX(2.3deg) scaleX(1.015);
    filter: brightness(1.25) blur(0.5px) contrast(1.43) drop-shadow(2.9px 0 0 rgba(255, 0, 0, 0.36)) drop-shadow(-2.9px 0 0 rgba(0, 0, 255, 0.36));
    clip-path: polygon(0 39%, 100% 42%, 100% 58%, 0 61%);
    opacity: 0.98;
  }
  9.5% {
    transform: scaleY(0.4) perspective(390px) rotateX(-1.5deg) scaleX(0.992);
    filter: brightness(1.08) blur(1.05px) contrast(1.47) drop-shadow(-2.7px 0 0 rgba(255, 0, 0, 0.34)) drop-shadow(2.7px 0 0 rgba(0, 0, 255, 0.34));
    clip-path: polygon(0 32%, 100% 35.5%, 100% 64.5%, 0 68%);
    opacity: 0.96;
  }
  /* Плавное продолжение развертки */
  16% {
    transform: scaleY(0.58) perspective(360px) rotateX(1.1deg) scaleX(1.015);
    filter: brightness(0.94) blur(0.95px) contrast(1.38) drop-shadow(2.15px 0 0 rgba(255, 0, 0, 0.3)) drop-shadow(-2.15px 0 0 rgba(0, 0, 255, 0.3));
    clip-path: polygon(0 24%, 100% 27.5%, 100% 72.5%, 0 76%);
    opacity: 0.94;
  }
  25% {
    transform: scaleY(0.77) perspective(320px) rotateX(-0.4deg) scaleX(1.01);
    filter: brightness(0.89) blur(0.75px) contrast(1.31) drop-shadow(-1.85px 0 0 rgba(255, 0, 0, 0.26)) drop-shadow(1.85px 0 0 rgba(0, 0, 255, 0.26));
    clip-path: polygon(0 16.5%, 100% 19.5%, 100% 80.5%, 0 83.5%);
    opacity: 0.94;
  }
  /* Плавное разворачивание */
  36% {
    transform: scaleY(0.9) perspective(270px) rotateX(0.3deg) scaleX(1.003);
    filter: brightness(0.91) blur(0.6px) contrast(1.28) drop-shadow(1.3px 0 0 rgba(255, 0, 0, 0.23)) drop-shadow(-1.3px 0 0 rgba(0, 0, 255, 0.23));
    clip-path: polygon(0 11%, 100% 13%, 100% 87%, 0 89%);
    opacity: 0.96;
  }
  48.5% {
    transform: scaleY(0.96) perspective(240px) rotateX(-0.15deg) scaleX(1.001);
    filter: brightness(0.95) blur(0.42px) contrast(1.2) drop-shadow(-0.95px 0 0 rgba(255, 0, 0, 0.19)) drop-shadow(0.95px 0 0 rgba(0, 0, 255, 0.19));
    clip-path: polygon(0 7.5%, 100% 9%, 100% 91%, 0 92.5%);
    opacity: 0.97;
  }
  /* Плавная стабилизация */
  61.5% {
    transform: scaleY(0.985) perspective(185px) rotateX(0.06deg) scaleX(1);
    filter: brightness(1.01) blur(0.26px) contrast(1.12) drop-shadow(0.65px 0 0 rgba(255, 0, 0, 0.15)) drop-shadow(-0.65px 0 0 rgba(0, 0, 255, 0.15));
    clip-path: polygon(0 4.5%, 100% 5.5%, 100% 94.5%, 0 95.5%);
    opacity: 0.99;
  }
  /* Финальная стабилизация */
  75% {
    transform: scaleY(0.995) perspective(125px) rotateX(0.02deg) scaleX(1);
    filter: brightness(1.01) blur(0.18px) contrast(1.08) drop-shadow(0.47px 0 0 rgba(255, 0, 0, 0.12)) drop-shadow(-0.47px 0 0 rgba(0, 0, 255, 0.12));
    clip-path: polygon(0 2.2%, 100% 2.8%, 100% 97.2%, 0 97.8%);
    opacity: 1;
  }
  88.5% {
    transform: scaleY(1) perspective(55px) rotateX(0.01deg) scaleX(1);
    filter: brightness(1) blur(0.1px) contrast(1.045) drop-shadow(0.3px 0 0 rgba(255, 0, 0, 0.08)) drop-shadow(-0.3px 0 0 rgba(0, 0, 255, 0.08));
    clip-path: polygon(0 1.1%, 100% 1.4%, 100% 98.6%, 0 98.9%);
    opacity: 1;
  }
  97% {
    transform: scaleY(1) perspective(15px) rotateX(0.005deg) scaleX(1);
    filter: brightness(1) blur(0.04px) contrast(1.015) drop-shadow(0.15px 0 0 rgba(255, 0, 0, 0.04)) drop-shadow(-0.15px 0 0 rgba(0, 0, 255, 0.04));
    clip-path: polygon(0 0.4%, 100% 0.5%, 100% 99.5%, 0 99.6%);
    opacity: 1;
  }
  100% {
    transform: scaleY(1) perspective(0) rotateX(0deg) scaleX(1);
    filter: brightness(1) blur(0) contrast(1);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    opacity: 1;
  }
}

.add-token-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  border: 2px solid var(--color-accent);
  color: white;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  text-transform: uppercase;
  box-shadow: 
    0 4px 12px rgba(211, 35, 75, 0.3),
    0 2px 6px rgba(211, 35, 75, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.add-token-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.1) 0px,
    rgba(0, 0, 0, 0.1) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 1;
}

.add-token-btn i,
.add-token-btn span {
  position: relative;
  z-index: 2;
}

.add-token-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgba(211, 35, 75, 0.4),
    0 3px 8px rgba(211, 35, 75, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  animation: button-glitch 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes button-glitch {
  0%, 100% {
    filter: none;
  }
  10% {
    filter: drop-shadow(1px 0 0 rgba(255, 0, 255, 0.5)) drop-shadow(-1px 0 0 rgba(0, 255, 255, 0.5));
  }
  20% {
    filter: drop-shadow(-1px 0 0 rgba(255, 0, 255, 0.5)) drop-shadow(1px 0 0 rgba(0, 255, 255, 0.5));
  }
  30% {
    filter: none;
  }
}

.add-token-btn:active {
  transform: translateY(0);
}

/* Bots Section */
.bots-section {
  width: 100%;
  min-height: 200px;
  position: relative;
  opacity: 0;
  pointer-events: none;
  transform: scaleY(0.01);
  transform-origin: center;
  transition: opacity 0.1s 0.2s;
  overflow: visible;
  filter: brightness(0.8);
  /* Резервируем место для контента - всегда занимаем полную высоту */
  padding-bottom: 2rem;
  /* Важно: элемент всегда занимает место в layout */
  display: block;
}

.bots-section.content-visible {
  opacity: 1;
  pointer-events: auto;
  animation: crt-tv-power-on-content 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s forwards;
  transform-style: preserve-3d;
}

@keyframes crt-tv-power-on-content {
  /* Мгновенное появление яркой полосы */
  0% {
    transform: scaleY(0.01) perspective(600px) rotateX(0deg);
    filter: brightness(1.5) contrast(1.3);
    clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%);
    opacity: 1;
  }
  /* Плавное начало развертки */
  0.5% {
    transform: scaleY(0.03) perspective(590px) rotateX(0.6deg);
    filter: brightness(1.45) contrast(1.32) drop-shadow(0.5px 0 0 rgba(255, 0, 0, 0.15)) drop-shadow(-0.5px 0 0 rgba(0, 0, 255, 0.15));
    clip-path: polygon(0 49%, 100% 49.5%, 100% 50.5%, 0 51%);
    opacity: 1;
  }
  2% {
    transform: scaleY(0.11) perspective(565px) rotateX(1.7deg);
    filter: brightness(1.35) contrast(1.37) drop-shadow(1.8px 0 0 rgba(255, 0, 0, 0.28)) drop-shadow(-1.8px 0 0 rgba(0, 0, 255, 0.28));
    clip-path: polygon(0 45%, 100% 47%, 100% 53%, 0 55%);
    opacity: 1;
  }
  /* Плавное расширение с искажениями */
  5% {
    transform: scaleY(0.24) perspective(525px) rotateX(2.65deg) scaleX(1.02);
    filter: brightness(1.25) blur(0.5px) contrast(1.43) drop-shadow(2.9px 0 0 rgba(255, 0, 0, 0.36)) drop-shadow(-2.9px 0 0 rgba(0, 0, 255, 0.36));
    clip-path: polygon(0 39%, 100% 42%, 100% 58%, 0 61%);
    opacity: 0.98;
  }
  9.5% {
    transform: scaleY(0.4) perspective(435px) rotateX(-1.5deg) scaleX(0.992);
    filter: brightness(1.08) blur(1.05px) contrast(1.47) drop-shadow(-2.7px 0 0 rgba(255, 0, 0, 0.34)) drop-shadow(2.7px 0 0 rgba(0, 0, 255, 0.34));
    clip-path: polygon(0 32%, 100% 35.5%, 100% 64.5%, 0 68%);
    opacity: 0.96;
  }
  /* Плавное продолжение развертки */
  16% {
    transform: scaleY(0.58) perspective(370px) rotateX(1.1deg) scaleX(1.015);
    filter: brightness(0.94) blur(0.95px) contrast(1.38) drop-shadow(2.15px 0 0 rgba(255, 0, 0, 0.3)) drop-shadow(-2.15px 0 0 rgba(0, 0, 255, 0.3));
    clip-path: polygon(0 24%, 100% 27.5%, 100% 72.5%, 0 76%);
    opacity: 0.94;
  }
  25% {
    transform: scaleY(0.77) perspective(330px) rotateX(-0.4deg) scaleX(1.01);
    filter: brightness(0.89) blur(0.75px) contrast(1.31) drop-shadow(-1.85px 0 0 rgba(255, 0, 0, 0.26)) drop-shadow(1.85px 0 0 rgba(0, 0, 255, 0.26));
    clip-path: polygon(0 16.5%, 100% 19.5%, 100% 80.5%, 0 83.5%);
    opacity: 0.94;
  }
  /* Плавное разворачивание */
  36% {
    transform: scaleY(0.9) perspective(275px) rotateX(0.3deg) scaleX(1.003);
    filter: brightness(0.91) blur(0.6px) contrast(1.28) drop-shadow(1.3px 0 0 rgba(255, 0, 0, 0.23)) drop-shadow(-1.3px 0 0 rgba(0, 0, 255, 0.23));
    clip-path: polygon(0 11%, 100% 13%, 100% 87%, 0 89%);
    opacity: 0.96;
  }
  48.5% {
    transform: scaleY(0.96) perspective(245px) rotateX(-0.15deg) scaleX(1.001);
    filter: brightness(0.95) blur(0.42px) contrast(1.2) drop-shadow(-0.95px 0 0 rgba(255, 0, 0, 0.19)) drop-shadow(0.95px 0 0 rgba(0, 0, 255, 0.19));
    clip-path: polygon(0 7.5%, 100% 9%, 100% 91%, 0 92.5%);
    opacity: 0.97;
  }
  /* Плавная стабилизация */
  61.5% {
    transform: scaleY(0.985) perspective(190px) rotateX(0.06deg) scaleX(1);
    filter: brightness(1.01) blur(0.26px) contrast(1.12) drop-shadow(0.65px 0 0 rgba(255, 0, 0, 0.15)) drop-shadow(-0.65px 0 0 rgba(0, 0, 255, 0.15));
    clip-path: polygon(0 4.5%, 100% 5.5%, 100% 94.5%, 0 95.5%);
    opacity: 0.99;
  }
  /* Финальная стабилизация */
  75% {
    transform: scaleY(0.995) perspective(130px) rotateX(0.02deg) scaleX(1);
    filter: brightness(1.01) blur(0.18px) contrast(1.08) drop-shadow(0.47px 0 0 rgba(255, 0, 0, 0.12)) drop-shadow(-0.47px 0 0 rgba(0, 0, 255, 0.12));
    clip-path: polygon(0 2.2%, 100% 2.8%, 100% 97.2%, 0 97.8%);
    opacity: 1;
  }
  88.5% {
    transform: scaleY(1) perspective(60px) rotateX(0.01deg) scaleX(1);
    filter: brightness(1) blur(0.1px) contrast(1.045) drop-shadow(0.3px 0 0 rgba(255, 0, 0, 0.08)) drop-shadow(-0.3px 0 0 rgba(0, 0, 255, 0.08));
    clip-path: polygon(0 1.1%, 100% 1.4%, 100% 98.6%, 0 98.9%);
    opacity: 1;
  }
  97% {
    transform: scaleY(1) perspective(20px) rotateX(0.005deg) scaleX(1);
    filter: brightness(1) blur(0.04px) contrast(1.015) drop-shadow(0.15px 0 0 rgba(255, 0, 0, 0.04)) drop-shadow(-0.15px 0 0 rgba(0, 0, 255, 0.04));
    clip-path: polygon(0 0.4%, 100% 0.5%, 100% 99.5%, 0 99.6%);
    opacity: 1;
  }
  100% {
    transform: scaleY(1) perspective(0) rotateX(0deg) scaleX(1);
    filter: brightness(1) blur(0) contrast(1);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
  min-height: 200px;
  position: relative;
  opacity: 0;
  pointer-events: none;
  transform: scaleY(0.01);
  transform-origin: center;
  transition: opacity 0.1s 0.3s;
  filter: brightness(0.8);
  /* Резервируем место для контента - всегда занимаем полную высоту */
  overflow: visible;
  /* Важно: элемент всегда занимает место в layout */
}

.empty-state.content-visible {
  opacity: 1;
  pointer-events: auto;
  animation: crt-tv-empty-power-on 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
  transform-style: preserve-3d;
}

@keyframes crt-tv-empty-power-on {
  /* Мгновенное появление яркой полосы */
  0% {
    transform: scaleY(0.01) perspective(600px) rotateX(0deg);
    filter: brightness(1.5) contrast(1.3);
    clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%);
    opacity: 1;
  }
  /* Плавное начало развертки */
  0.5% {
    transform: scaleY(0.03) perspective(590px) rotateX(0.6deg);
    filter: brightness(1.45) contrast(1.32) drop-shadow(0.5px 0 0 rgba(255, 0, 0, 0.15)) drop-shadow(-0.5px 0 0 rgba(0, 0, 255, 0.15));
    clip-path: polygon(0 49%, 100% 49.5%, 100% 50.5%, 0 51%);
    opacity: 1;
  }
  2% {
    transform: scaleY(0.11) perspective(565px) rotateX(1.7deg);
    filter: brightness(1.35) contrast(1.37) drop-shadow(1.8px 0 0 rgba(255, 0, 0, 0.28)) drop-shadow(-1.8px 0 0 rgba(0, 0, 255, 0.28));
    clip-path: polygon(0 45%, 100% 47%, 100% 53%, 0 55%);
    opacity: 1;
  }
  /* Плавное расширение с искажениями */
  5% {
    transform: scaleY(0.24) perspective(525px) rotateX(2.65deg) scaleX(1.02);
    filter: brightness(1.25) blur(0.5px) contrast(1.43) drop-shadow(2.9px 0 0 rgba(255, 0, 0, 0.36)) drop-shadow(-2.9px 0 0 rgba(0, 0, 255, 0.36));
    clip-path: polygon(0 39%, 100% 42%, 100% 58%, 0 61%);
    opacity: 0.98;
  }
  9.5% {
    transform: scaleY(0.4) perspective(435px) rotateX(-1.5deg) scaleX(0.992);
    filter: brightness(1.08) blur(1.05px) contrast(1.47) drop-shadow(-2.7px 0 0 rgba(255, 0, 0, 0.34)) drop-shadow(2.7px 0 0 rgba(0, 0, 255, 0.34));
    clip-path: polygon(0 32%, 100% 35.5%, 100% 64.5%, 0 68%);
    opacity: 0.96;
  }
  /* Плавное продолжение развертки */
  16% {
    transform: scaleY(0.58) perspective(370px) rotateX(1.1deg) scaleX(1.015);
    filter: brightness(0.94) blur(0.95px) contrast(1.38) drop-shadow(2.15px 0 0 rgba(255, 0, 0, 0.3)) drop-shadow(-2.15px 0 0 rgba(0, 0, 255, 0.3));
    clip-path: polygon(0 24%, 100% 27.5%, 100% 72.5%, 0 76%);
    opacity: 0.94;
  }
  25% {
    transform: scaleY(0.77) perspective(330px) rotateX(-0.4deg) scaleX(1.01);
    filter: brightness(0.89) blur(0.75px) contrast(1.31) drop-shadow(-1.85px 0 0 rgba(255, 0, 0, 0.26)) drop-shadow(1.85px 0 0 rgba(0, 0, 255, 0.26));
    clip-path: polygon(0 16.5%, 100% 19.5%, 100% 80.5%, 0 83.5%);
    opacity: 0.94;
  }
  /* Плавное разворачивание */
  36% {
    transform: scaleY(0.9) perspective(275px) rotateX(0.3deg) scaleX(1.003);
    filter: brightness(0.91) blur(0.6px) contrast(1.28) drop-shadow(1.3px 0 0 rgba(255, 0, 0, 0.23)) drop-shadow(-1.3px 0 0 rgba(0, 0, 255, 0.23));
    clip-path: polygon(0 11%, 100% 13%, 100% 87%, 0 89%);
    opacity: 0.96;
  }
  48.5% {
    transform: scaleY(0.96) perspective(245px) rotateX(-0.15deg) scaleX(1.001);
    filter: brightness(0.95) blur(0.42px) contrast(1.2) drop-shadow(-0.95px 0 0 rgba(255, 0, 0, 0.19)) drop-shadow(0.95px 0 0 rgba(0, 0, 255, 0.19));
    clip-path: polygon(0 7.5%, 100% 9%, 100% 91%, 0 92.5%);
    opacity: 0.97;
  }
  /* Плавная стабилизация */
  61.5% {
    transform: scaleY(0.985) perspective(190px) rotateX(0.06deg) scaleX(1);
    filter: brightness(1.01) blur(0.26px) contrast(1.12) drop-shadow(0.65px 0 0 rgba(255, 0, 0, 0.15)) drop-shadow(-0.65px 0 0 rgba(0, 0, 255, 0.15));
    clip-path: polygon(0 4.5%, 100% 5.5%, 100% 94.5%, 0 95.5%);
    opacity: 0.99;
  }
  /* Финальная стабилизация */
  75% {
    transform: scaleY(0.995) perspective(130px) rotateX(0.02deg) scaleX(1);
    filter: brightness(1.01) blur(0.18px) contrast(1.08) drop-shadow(0.47px 0 0 rgba(255, 0, 0, 0.12)) drop-shadow(-0.47px 0 0 rgba(0, 0, 255, 0.12));
    clip-path: polygon(0 2.2%, 100% 2.8%, 100% 97.2%, 0 97.8%);
    opacity: 1;
  }
  88.5% {
    transform: scaleY(1) perspective(60px) rotateX(0.01deg) scaleX(1);
    filter: brightness(1) blur(0.1px) contrast(1.045) drop-shadow(0.3px 0 0 rgba(255, 0, 0, 0.08)) drop-shadow(-0.3px 0 0 rgba(0, 0, 255, 0.08));
    clip-path: polygon(0 1.1%, 100% 1.4%, 100% 98.6%, 0 98.9%);
    opacity: 1;
  }
  97% {
    transform: scaleY(1) perspective(20px) rotateX(0.005deg) scaleX(1);
    filter: brightness(1) blur(0.04px) contrast(1.015) drop-shadow(0.15px 0 0 rgba(255, 0, 0, 0.04)) drop-shadow(-0.15px 0 0 rgba(0, 0, 255, 0.04));
    clip-path: polygon(0 0.4%, 100% 0.5%, 100% 99.5%, 0 99.6%);
    opacity: 1;
  }
  100% {
    transform: scaleY(1) perspective(0) rotateX(0deg) scaleX(1);
    filter: brightness(1) blur(0) contrast(1);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
    opacity: 1;
  }
}

.empty-icon {
  font-size: 4rem;
  color: var(--color-text-tertiary);
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.empty-subtext {
  font-size: 0.9375rem;
  color: var(--color-text-tertiary);
  margin: 0;
}

.bots-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* Bot Card */
.bots-list:not(.content-visible) .bot-card {
  opacity: 0;
  pointer-events: none;
}

.bot-card {
  display: block;
  min-height: 200px;
  transition: var(--transition);
  position: relative;
  perspective: 1000px;
  opacity: 0;
  pointer-events: none;
  transform: scaleY(0.01);
  transform-origin: center;
  filter: brightness(0.8);
  padding-top: 4px;
  /* Важно: элемент всегда занимает место в layout */
}

.bots-list.content-visible .bot-card {
  opacity: 1;
  pointer-events: auto;
  animation: crt-tv-card-power-on 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: var(--delay, 0s);
  transform-style: preserve-3d;
}

@keyframes crt-tv-card-power-on {
  /* Мгновенное появление яркой полосы */
  0% {
    opacity: 0;
    transform: scaleY(0.01) perspective(500px) rotateX(0deg);
    filter: brightness(1.5) contrast(1.3);
    clip-path: polygon(0 50%, 100% 50%, 100% 50%, 0 50%);
  }
  /* Плавное начало развертки */
  1% {
    opacity: 0.6;
    transform: scaleY(0.04) perspective(490px) rotateX(0.8deg);
    filter: brightness(1.45) contrast(1.32) drop-shadow(0.8px 0 0 rgba(255, 0, 0, 0.2)) drop-shadow(-0.8px 0 0 rgba(0, 0, 255, 0.2));
    clip-path: polygon(0 48%, 100% 49%, 100% 51%, 0 52%);
  }
  3.5% {
    opacity: 0.76;
    transform: scaleY(0.14) perspective(460px) rotateX(2deg);
    filter: brightness(1.35) contrast(1.37) drop-shadow(2px 0 0 rgba(255, 0, 0, 0.3)) drop-shadow(-2px 0 0 rgba(0, 0, 255, 0.3));
    clip-path: polygon(0 44%, 100% 46%, 100% 54%, 0 56%);
  }
  /* Плавное расширение с искажениями */
  7.5% {
    opacity: 0.85;
    transform: scaleY(0.28) perspective(420px) rotateX(2.65deg) scaleX(1.015);
    filter: brightness(1.25) blur(0.5px) contrast(1.43) drop-shadow(2.7px 0 0 rgba(255, 0, 0, 0.36)) drop-shadow(-2.7px 0 0 rgba(0, 0, 255, 0.36));
    clip-path: polygon(0 38%, 100% 41.5%, 100% 58.5%, 0 62%);
  }
  12.5% {
    opacity: 0.89;
    transform: scaleY(0.42) perspective(385px) rotateX(-1.5deg) scaleX(0.992);
    filter: brightness(1.08) blur(1.05px) contrast(1.47) drop-shadow(-2.7px 0 0 rgba(255, 0, 0, 0.34)) drop-shadow(2.7px 0 0 rgba(0, 0, 255, 0.34));
    clip-path: polygon(0 32%, 100% 35.5%, 100% 64.5%, 0 68%);
  }
  /* Плавное продолжение развертки */
  18.5% {
    opacity: 0.905;
    transform: scaleY(0.57) perspective(355px) rotateX(1.1deg) scaleX(1.015);
    filter: brightness(0.94) blur(0.95px) contrast(1.38) drop-shadow(2.15px 0 0 rgba(255, 0, 0, 0.3)) drop-shadow(-2.15px 0 0 rgba(0, 0, 255, 0.3));
    clip-path: polygon(0 26%, 100% 29.5%, 100% 70.5%, 0 74%);
  }
  26% {
    opacity: 0.92;
    transform: scaleY(0.71) perspective(325px) rotateX(-0.5deg) scaleX(1.01);
    filter: brightness(0.89) blur(0.75px) contrast(1.31) drop-shadow(-1.85px 0 0 rgba(255, 0, 0, 0.26)) drop-shadow(1.85px 0 0 rgba(0, 0, 255, 0.26));
    clip-path: polygon(0 20%, 100% 23%, 100% 77%, 0 80%);
  }
  /* Плавное разворачивание */
  35% {
    opacity: 0.94;
    transform: scaleY(0.83) perspective(290px) rotateX(0.3deg) scaleX(1.003);
    filter: brightness(0.9) blur(0.6px) contrast(1.28) drop-shadow(1.3px 0 0 rgba(255, 0, 0, 0.23)) drop-shadow(-1.3px 0 0 rgba(0, 0, 255, 0.23));
    clip-path: polygon(0 14%, 100% 16.5%, 100% 83.5%, 0 86%);
  }
  45% {
    opacity: 0.955;
    transform: scaleY(0.91) perspective(250px) rotateX(-0.2deg) scaleX(1.001);
    filter: brightness(0.93) blur(0.47px) contrast(1.23) drop-shadow(-0.95px 0 0 rgba(255, 0, 0, 0.2)) drop-shadow(0.95px 0 0 rgba(0, 0, 255, 0.2));
    clip-path: polygon(0 10%, 100% 11.5%, 100% 88.5%, 0 89%);
  }
  /* Плавная стабилизация */
  55% {
    opacity: 0.97;
    transform: scaleY(0.96) perspective(215px) rotateX(0.1deg) scaleX(1.001);
    filter: brightness(0.98) blur(0.35px) contrast(1.17) drop-shadow(0.75px 0 0 rgba(255, 0, 0, 0.16)) drop-shadow(-0.75px 0 0 rgba(0, 0, 255, 0.16));
    clip-path: polygon(0 6.5%, 100% 7.5%, 100% 92.5%, 0 93.5%);
  }
  67.5% {
    opacity: 0.985;
    transform: scaleY(0.98) perspective(160px) rotateX(0.05deg) scaleX(1);
    filter: brightness(1.01) blur(0.22px) contrast(1.11) drop-shadow(0.55px 0 0 rgba(255, 0, 0, 0.13)) drop-shadow(-0.55px 0 0 rgba(0, 0, 255, 0.13));
    clip-path: polygon(0 3.5%, 100% 4.5%, 100% 95.5%, 0 96.5%);
  }
  /* Финальная стабилизация */
  81.5% {
    opacity: 0.995;
    transform: scaleY(0.995) perspective(90px) rotateX(0.02deg) scaleX(1);
    filter: brightness(1) blur(0.12px) contrast(1.06) drop-shadow(0.32px 0 0 rgba(255, 0, 0, 0.09)) drop-shadow(-0.32px 0 0 rgba(0, 0, 255, 0.09));
    clip-path: polygon(0 1.4%, 100% 1.8%, 100% 98.2%, 0 98.6%);
  }
  94% {
    opacity: 1;
    transform: scaleY(1) perspective(30px) rotateX(0.01deg) scaleX(1);
    filter: brightness(1) blur(0.04px) contrast(1.02) drop-shadow(0.15px 0 0 rgba(255, 0, 0, 0.05)) drop-shadow(-0.15px 0 0 rgba(0, 0, 255, 0.05));
    clip-path: polygon(0 0.5%, 100% 0.6%, 100% 99.4%, 0 99.5%);
  }
  100% {
    opacity: 1;
    transform: scaleY(1) perspective(0) rotateX(0deg) scaleX(1);
    filter: brightness(1) blur(0) contrast(1);
    clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  }
}

.bot-card-content {
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
  border: 2px solid var(--color-border);
  border-radius: 0;
  padding: 2.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1), border-color 0.25s ease, box-shadow 0.25s ease, filter 0.3s ease;
  position: relative;
  z-index: 1;
  box-shadow: 
    0 0 0 0 rgba(0, 0, 0, 0),
    0 0 0 0 rgba(0, 0, 0, 0),
    inset 0 0 0 0 rgba(255, 255, 255, 0);
  overflow: visible;
  transform-style: preserve-3d;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

/* CRT scanlines эффект для карточек */
.bot-card-content::before {
  content: '';
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
  z-index: 10;
  opacity: 0.5;
  animation: scanline-move 8s linear infinite;
}

@keyframes scanline-move {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(4px);
  }
}

/* Эффект мерцания старого монитора */
.bot-card-content::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(211, 35, 75, 0.02) 0%,
    transparent 50%,
    rgba(211, 35, 75, 0.02) 100%
  );
  pointer-events: none;
  z-index: 9;
  animation: crt-flicker 3s ease-in-out infinite;
  opacity: 0;
}

@keyframes crt-flicker {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 0.3;
  }
}

.bot-card:hover .bot-card-content::after {
  animation: crt-flicker-intense 0.15s ease-in-out infinite, crt-flicker 3s ease-in-out infinite;
}

@keyframes crt-flicker-intense {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.4;
  }
}

.bot-card:hover .bot-card-content {
  transform: translateY(-4px) rotateX(0.8deg) rotateY(-0.4deg);
  border-color: var(--color-border-light);
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.4),
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: card-glitch 4s ease-in-out infinite;
}

.bot-card:hover .bot-card-content {
  border-color: rgba(211, 35, 75, 0.5);
  box-shadow: 
    0 8px 20px rgba(211, 35, 75, 0.15),
    0 4px 10px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 30px rgba(211, 35, 75, 0.1);
}

/* RGB-разделение и искривление для карточек при hover */
@keyframes card-glitch {
  0%, 90%, 100% {
    filter: none;
  }
  91% {
    filter: drop-shadow(2px 0 0 rgba(255, 0, 255, 0.5)) drop-shadow(-2px 0 0 rgba(0, 255, 255, 0.5));
  }
  92% {
    filter: drop-shadow(-2px 0 0 rgba(255, 0, 255, 0.5)) drop-shadow(2px 0 0 rgba(0, 255, 255, 0.5));
  }
  93% {
    filter: none;
  }
  94%, 96%, 98% {
    filter: none;
  }
  95% {
    filter: drop-shadow(1px 0 0 rgba(255, 0, 255, 0.4)) drop-shadow(-1px 0 0 rgba(0, 255, 255, 0.4));
  }
  97% {
    filter: drop-shadow(-1px 0 0 rgba(255, 0, 255, 0.4)) drop-shadow(1px 0 0 rgba(0, 255, 255, 0.4));
  }
}

.bot-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.75rem;
  position: relative;
  z-index: 1;
}

.bot-card-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  color: var(--color-text);
  font-size: 1.25rem;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  transition: transform 0.5s ease-out, border-color 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  flex-shrink: 0;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}

/* CRT scanlines для навигационных иконок */
.bot-card-icon::before {
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

.bot-card-icon i {
  position: relative;
  z-index: 2;
}

.bot-card-icon::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
  z-index: 2;
}

.bot-card:hover .bot-card-icon::after {
  transform: scaleX(1);
}

.bot-card-icon {
  background: linear-gradient(135deg, var(--color-accent-medium) 0%, var(--color-accent-light) 100%);
  border-color: rgba(211, 35, 75, 0.3);
  color: var(--color-accent);
}

.bot-card:hover .bot-card-icon {
  border-color: var(--color-border-light);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.bot-card:hover .bot-card-icon {
  background: linear-gradient(135deg, rgba(211, 35, 75, 0.3) 0%, rgba(211, 35, 75, 0.2) 100%);
  border-color: var(--color-accent);
  box-shadow: 
    0 4px 12px rgba(211, 35, 75, 0.3),
    0 2px 6px rgba(211, 35, 75, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.bot-card-title-section {
  flex: 1;
  min-width: 0;
}

.bot-card-title {
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--color-text);
  margin: 0 0 1rem 0;
  line-height: 1.4;
  letter-spacing: 0.03em;
  position: relative;
  z-index: 1;
  text-shadow: 0 0 6px rgba(232, 232, 232, 0.2);
}

.bot-card-username {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.username-label {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.username-value {
  font-size: 0.8125rem;
  color: var(--color-accent);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
}

.bot-card-token {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.token-label {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.token-value {
  font-size: 0.8125rem;
  color: var(--color-text);
  font-family: 'Courier New', monospace;
  letter-spacing: 0.05em;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  width: 100%;
  word-break: break-all;
  position: relative;
  z-index: 1;
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
}

.bot-check-btn,
.bot-view-webhooks-btn,
.bot-delete-btn {
  width: 2.25rem;
  height: 2.25rem;
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
  flex-shrink: 0;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
  z-index: 1;
}

.bot-check-btn::before,
.bot-view-webhooks-btn::before,
.bot-delete-btn::before {
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

.bot-check-btn i,
.bot-view-webhooks-btn i,
.bot-delete-btn i {
  position: relative;
  z-index: 2;
  font-size: 0.875rem;
}

.bot-check-btn:hover,
.bot-view-webhooks-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(211, 35, 75, 0.1);
  transform: translateY(-2px);
  box-shadow: 
    0 4px 8px rgba(211, 35, 75, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.bot-check-btn:active,
.bot-view-webhooks-btn:active {
  transform: translateY(0);
}

.bot-delete-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(211, 35, 75, 0.1);
  transform: translateY(-2px);
  box-shadow: 
    0 4px 8px rgba(211, 35, 75, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.bot-delete-btn:active {
  transform: translateY(0);
}

.bot-card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  position: relative;
  z-index: 1;
  margin-top: auto;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
  transition: var(--transition);
}

.stat-item:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: var(--color-border-light);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  border: 2px solid var(--color-border);
  color: var(--color-text);
  font-size: 1rem;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 2px, 2px 2px, 2px 0,
    calc(100% - 2px) 0, calc(100% - 2px) 2px, 100% 2px,
    100% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 100%,
    2px 100%, 2px calc(100% - 2px), 0 calc(100% - 2px)
  );
}

.stat-icon-channels {
  color: var(--color-accent);
  border-color: rgba(211, 35, 75, 0.3);
  background: linear-gradient(135deg, var(--color-accent-medium) 0%, var(--color-accent-light) 100%);
}

.stat-icon-groups {
  color: var(--color-text);
  border-color: var(--color-border);
}

.stat-icon-links {
  color: var(--color-text);
  border-color: var(--color-border);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1.2;
  letter-spacing: 0.05em;
  text-shadow: 0 0 6px rgba(232, 232, 232, 0.2);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
  margin-top: 0.25rem;
}

/* Footer */
.app-footer {
  background: transparent;
  padding: 1.5rem 0;
  flex-shrink: 0;
  position: relative;
  z-index: 200;
}

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

.footer-left {
  flex: 1;
  text-align: left;
}

.footer-center {
  flex: 0 0 auto;
  text-align: center;
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
}

.footer-link:hover {
  color: var(--color-text);
}

.footer-heart {
  color: #dd3057;
  font-size: 0.875rem;
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
    3px 100%, 3px calc(100% - 4px), 0 calc(100% - 4px)
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
  font-family: 'Share Tech Mono', 'Courier New', monospace;
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

/* Глобальный эффект глитча для всей страницы */
.global-glitch-active {
  animation: global-page-glitch 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both !important;
}

@keyframes global-page-glitch {
  0%, 100% {
    transform: translate(0) skew(0deg);
    filter: none;
  }
  10% {
    transform: translate(-3px, 0) skew(-0.5deg);
    filter: drop-shadow(2px 0 0 rgba(255, 0, 255, 0.7)) 
            drop-shadow(-2px 0 0 rgba(0, 255, 255, 0.7))
            hue-rotate(90deg);
  }
  20% {
    transform: translate(3px, 0) skew(0.5deg);
    filter: drop-shadow(-2px 0 0 rgba(255, 0, 255, 0.7)) 
            drop-shadow(2px 0 0 rgba(0, 255, 255, 0.7))
            hue-rotate(-90deg);
  }
  30% {
    transform: translate(-2px, 0) skew(-0.3deg);
    filter: drop-shadow(2px 0 0 rgba(255, 0, 255, 0.8)) 
            drop-shadow(-2px 0 0 rgba(0, 255, 255, 0.8))
            brightness(1.2);
  }
  40% {
    transform: translate(2px, 0) skew(0.3deg);
    filter: drop-shadow(-2px 0 0 rgba(255, 0, 255, 0.8)) 
            drop-shadow(2px 0 0 rgba(0, 255, 255, 0.8))
            contrast(1.3);
  }
  50% {
    transform: translate(-3px, 0) skew(-0.5deg);
    filter: drop-shadow(2px 0 0 rgba(255, 0, 255, 0.7)) 
            drop-shadow(-2px 0 0 rgba(0, 255, 255, 0.7))
            saturate(2);
  }
  60% {
    transform: translate(3px, 0) skew(0.5deg);
    filter: drop-shadow(-2px 0 0 rgba(255, 0, 255, 0.7)) 
            drop-shadow(2px 0 0 rgba(0, 255, 255, 0.7))
            invert(0.1);
  }
  70% {
    transform: translate(-2px, 0) skew(-0.2deg);
    filter: drop-shadow(1px 0 0 rgba(255, 0, 255, 0.6)) 
            drop-shadow(-1px 0 0 rgba(0, 255, 255, 0.6))
            brightness(1.1);
  }
  80% {
    transform: translate(2px, 0) skew(0.2deg);
    filter: drop-shadow(-1px 0 0 rgba(255, 0, 255, 0.6)) 
            drop-shadow(1px 0 0 rgba(0, 255, 255, 0.6))
            contrast(1.2);
  }
  90% {
    transform: translate(-1px, 0) skew(0deg);
    filter: drop-shadow(1px 0 0 rgba(255, 0, 255, 0.5)) 
            drop-shadow(-1px 0 0 rgba(0, 255, 255, 0.5))
            brightness(1.05);
  }
}

.global-glitch-active * {
  pointer-events: none !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-inner {
    padding: 0 1rem;
    gap: 2rem;
  }

  .content-wrapper {
    padding: 2rem 0;
  }

  .page-header {
    padding: 1rem 0;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-description {
    font-size: 0.9375rem;
  }

  .bots-list {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .bot-card-content {
    padding: 2rem;
  }

  .bot-card-stats {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .modal-content {
    max-width: 100%;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1.5rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
    min-width: auto;
  }

  .footer-content {
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.8125rem;
  }

  .footer-left,
  .footer-center,
  .footer-right {
    text-align: center;
    flex: none;
  }
}

@media (max-width: 480px) {
  .content-inner {
    padding: 0 0.75rem;
    gap: 1.5rem;
  }

  .content-wrapper {
    padding: 1.5rem 0;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .page-description {
    font-size: 0.875rem;
  }

  .bot-card-content {
    padding: 1.75rem;
  }

  .bot-card-header {
    flex-wrap: wrap;
  }

  .bot-delete-btn {
    margin-left: auto;
  }

  .token-value {
    min-width: 100%;
  }

  .footer-content {
    font-size: 0.75rem;
  }
}
</style>
