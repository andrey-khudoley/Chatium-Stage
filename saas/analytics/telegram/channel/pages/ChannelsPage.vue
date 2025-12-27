<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import Header from '../shared/Header.vue'
import { apiGetChannelLinksListRoute, apiAddChannelLinkRoute, apiDeleteChannelLinkRoute } from '../api/channel-links'
import { apiGetChannelsListRoute } from '../api/channels'
import { apiGetBotsListRoute } from '../api/bots'

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
}>()

const displayedTitle = ref('')
const displayedDescription = ref('')
const showCursor = ref(false)
const showContent = ref(false)
const showTitleUnderline = ref(false)
const cursorPosition = ref<'title' | 'description' | 'final'>('title')
const bootLoaderDone = ref(false)

// Данные
const links = ref<Array<{
  id: string
  name: string
  trackingUrl: string
  targetUrl: string
  chatId: string
  botId: string
  channelTitle: string
  botName: string
  leadsCount: number
}>>([])

const channels = ref<Array<{
  chatId: string
  chatTitle: string
  chatUsername: string | null
  botId: string
  botName: string
}>>([])

const bots = ref<Array<{
  id: string
  botName: string | null
  botUsername: string | null
}>>([])

const loading = ref(true)
const error = ref<string | null>(null)
const showAddModal = ref(false)
const addingLink = ref(false)
const linkError = ref<string | null>(null)

// Форма добавления
const formName = ref('')
const formChatId = ref('')
const formBotId = ref('')
const channelSearchQuery = ref('')

let bootloaderCompleteHandler: (() => void) | null = null
let escHandler: ((e: KeyboardEvent) => void) | null = null

// Фильтрованные каналы для поиска
const filteredChannels = computed(() => {
  if (!channelSearchQuery.value.trim()) {
    return channels.value
  }
  const query = channelSearchQuery.value.toLowerCase().trim()
  return channels.value.filter(ch => 
    ch.chatTitle.toLowerCase().includes(query) ||
    (ch.chatUsername && ch.chatUsername.toLowerCase().includes(query)) ||
    ch.botName.toLowerCase().includes(query)
  )
})

// Боты для выбранного канала
const availableBots = computed(() => {
  if (!formChatId.value) {
    // Если канал не выбран, показываем всех ботов, которые связаны с какими-либо каналами
    const botsWithChannels = new Set(channels.value.map(ch => ch.botId))
    return bots.value.filter(bot => botsWithChannels.has(bot.id))
  }
  const selectedChannel = channels.value.find(ch => ch.chatId === formChatId.value)
  if (!selectedChannel) {
    return []
  }
  // Показываем только бота, который связан с этим каналом
  const bot = bots.value.find(bot => bot.id === selectedChannel.botId)
  return bot ? [bot] : []
})

// Автовыбор бота, если он один
const autoSelectBot = () => {
  if (availableBots.value.length === 1) {
    formBotId.value = availableBots.value[0].id
  } else if (availableBots.value.length === 0) {
    formBotId.value = ''
  }
}

// Автоматически выбираем бота при изменении availableBots
watch(availableBots, () => {
  autoSelectBot()
})

onMounted(() => {
  if (window.hideAppLoader) {
    window.hideAppLoader()
  }

  const startAnimations = () => {
    bootLoaderDone.value = true
    
    showCursor.value = true
    cursorPosition.value = 'title'
    
    setTimeout(() => {
      typeTextSequence()
    }, 500)
  }

  bootloaderCompleteHandler = startAnimations

  if ((window as any).bootLoaderComplete) {
    startAnimations()
  } else {
    window.addEventListener('bootloader-complete', bootloaderCompleteHandler)
  }

  const typeTextSequence = () => {
    const titleText = 'Управление каналами'
    cursorPosition.value = 'title'
    
    let titleIndex = 0
    const titleInterval = setInterval(() => {
      if (titleIndex < titleText.length) {
        displayedTitle.value = titleText.substring(0, titleIndex + 1)
        titleIndex++
      } else {
        clearInterval(titleInterval)
        showTitleUnderline.value = true
        typeDescription()
      }
    }, 40)
  }

  const typeDescription = () => {
    const descriptionText = 'Настройте отслеживание переходов для ваших Telegram-каналов и создавайте отслеживаемые ссылки'
    cursorPosition.value = 'description'
    let descIndex = 0
    const descInterval = setInterval(() => {
      if (descIndex < descriptionText.length) {
        displayedDescription.value = descriptionText.substring(0, descIndex + 1)
        descIndex++
      } else {
        clearInterval(descInterval)
        cursorPosition.value = 'final'
        showContent.value = true
        loadData()
      }
    }, 20)
  }

  // Обработчик Esc для закрытия модального окна
  escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showAddModal.value && !addingLink.value) {
      closeAddModal()
    }
  }
  window.addEventListener('keydown', escHandler)
})

onUnmounted(() => {
  if (bootloaderCompleteHandler) {
    window.removeEventListener('bootloader-complete', bootloaderCompleteHandler)
    bootloaderCompleteHandler = null
  }
  if (escHandler) {
    window.removeEventListener('keydown', escHandler)
    escHandler = null
  }
})

const loadData = async () => {
  loading.value = true
  error.value = null
  
  // Очищаем данные перед загрузкой для предотвращения отображения устаревших данных
  links.value = []
  channels.value = []
  bots.value = []
  
  try {
    // Проверяем доступность ctx (должен быть доступен глобально в Chatium)
    if (typeof ctx === 'undefined') {
      console.error('[ChannelsPage] ctx не доступен')
      error.value = 'Ошибка инициализации: контекст не доступен'
      return
    }
    
    // Загружаем все данные параллельно для ускорения и атомарности
    const [linksResult, channelsResult, botsResult] = await Promise.all([
      apiGetChannelLinksListRoute.run(ctx),
      apiGetChannelsListRoute.run(ctx),
      apiGetBotsListRoute.run(ctx)
    ])
    
    // Проверяем все результаты перед сохранением данных
    if (!linksResult.success) {
      error.value = linksResult.error || 'Ошибка при загрузке ссылок'
      return
    }
    if (!channelsResult.success) {
      error.value = channelsResult.error || 'Ошибка при загрузке каналов'
      return
    }
    if (!botsResult.success) {
      error.value = botsResult.error || 'Ошибка при загрузке ботов'
      return
    }
    
    // Только после успешной загрузки всех данных сохраняем их
    if (linksResult.links) {
      links.value = linksResult.links
    }
    if (channelsResult.channels) {
      channels.value = channelsResult.channels
    }
    if (botsResult.bots) {
      bots.value = botsResult.bots.map((bot: any) => ({
        id: bot.id,
        botName: bot.botName,
        botUsername: bot.botUsername
      }))
    }
  } catch (e: any) {
    // Очищаем все данные при исключении
    links.value = []
    channels.value = []
    bots.value = []
    console.error('[ChannelsPage] Ошибка загрузки данных:', e)
    error.value = e.message || 'Ошибка при загрузке данных'
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  showAddModal.value = true
  formName.value = ''
  formChatId.value = ''
  formBotId.value = ''
  channelSearchQuery.value = ''
  linkError.value = null
}

const closeAddModal = () => {
  showAddModal.value = false
  formName.value = ''
  formChatId.value = ''
  formBotId.value = ''
  channelSearchQuery.value = ''
  linkError.value = null
  addingLink.value = false
}

const onChannelSelect = (chatId: string) => {
  formChatId.value = chatId
  channelSearchQuery.value = ''
  // Очищаем выбранного бота при смене канала, чтобы избежать несоответствия
  formBotId.value = ''
  autoSelectBot()
}

const addLink = async () => {
  if (!formName.value || !formName.value.trim()) {
    linkError.value = 'Введите название ссылки'
    return
  }
  
  if (!formChatId.value) {
    linkError.value = 'Выберите канал'
    return
  }
  
  if (!formBotId.value) {
    linkError.value = 'Выберите бота'
    return
  }
  
  // Проверяем, что выбранный канал существует
  const selectedChannel = channels.value.find(ch => ch.chatId === formChatId.value)
  if (!selectedChannel) {
    linkError.value = 'Выбранный канал не найден. Пожалуйста, обновите страницу и попробуйте снова.'
    return
  }
  
  // Проверяем, что выбранный бот доступен для выбранного канала
  const isBotValid = availableBots.value.some(bot => bot.id === formBotId.value)
  if (!isBotValid) {
    linkError.value = 'Выбранный бот не соответствует выбранному каналу'
    return
  }
  
  // Проверяем доступность ctx
  if (typeof ctx === 'undefined') {
    linkError.value = 'Ошибка инициализации: контекст не доступен'
    return
  }
  
  addingLink.value = true
  linkError.value = null
  
  try {
    const result = await apiAddChannelLinkRoute.run(ctx, {
      name: formName.value.trim(),
      chatId: formChatId.value,
      botId: formBotId.value
    })
    
    if (!result.success) {
      linkError.value = result.error || 'Ошибка при добавлении ссылки'
      return
    }
    
    await loadData()
    closeAddModal()
  } catch (e: any) {
    console.error('[ChannelsPage] Ошибка при добавлении ссылки:', e)
    linkError.value = e.message || 'Ошибка при добавлении ссылки'
  } finally {
    addingLink.value = false
  }
}

const deleteLink = async (linkId: string) => {
  if (!confirm('Вы уверены, что хотите удалить эту ссылку?')) {
    return
  }
  
  // Проверяем доступность ctx
  if (typeof ctx === 'undefined') {
    alert('Ошибка инициализации: контекст не доступен')
    return
  }
  
  try {
    const result = await apiDeleteChannelLinkRoute.run(ctx, {
      linkId: linkId
    })
    
    if (!result.success) {
      alert(result.error || 'Ошибка при удалении ссылки')
      return
    }
    
    await loadData()
  } catch (e: any) {
    console.error('[ChannelsPage] Ошибка при удалении ссылки:', e)
    alert(e.message || 'Ошибка при удалении ссылки')
  }
}

const copyLink = async (trackingUrl: string) => {
  try {
    await navigator.clipboard.writeText(trackingUrl)
    // Можно добавить уведомление об успешном копировании
    console.log('[ChannelsPage] Ссылка скопирована:', trackingUrl)
  } catch (e: any) {
    console.error('[ChannelsPage] Ошибка при копировании ссылки:', e)
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea')
    textArea.value = trackingUrl
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      console.log('[ChannelsPage] Ссылка скопирована (fallback)')
    } catch (err) {
      console.error('[ChannelsPage] Ошибка при копировании (fallback):', err)
      alert('Не удалось скопировать ссылку. Скопируйте вручную: ' + trackingUrl)
    }
    document.body.removeChild(textArea)
  }
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
            <i class="fas fa-broadcast-tower"></i>
          </div>
          <h1 class="page-title" :class="{ 'show-underline': showTitleUnderline }">
            {{ displayedTitle }}<span v-if="showCursor && (cursorPosition === 'title' || cursorPosition === 'final')" class="typing-cursor">▮</span>
          </h1>
          <p class="page-description">
            {{ displayedDescription }}<span v-if="showCursor && cursorPosition === 'description'" class="typing-cursor">▮</span>
          </p>
        </section>

        <!-- Add Button -->
        <section class="actions-section" :class="{ 'content-visible': showContent }">
          <button @click="openAddModal" class="add-link-btn">
            <i class="fas fa-plus"></i>
            <span>Добавить ссылку</span>
          </button>
        </section>

        <!-- Links Table -->
        <section class="links-section" :class="{ 'content-visible': showContent }">
          <div v-if="loading" class="empty-state">
            <i class="fas fa-spinner fa-spin empty-icon"></i>
            <p class="empty-text">Загрузка ссылок...</p>
          </div>
          
          <div v-else-if="error" class="empty-state">
            <i class="fas fa-exclamation-triangle empty-icon"></i>
            <p class="empty-text">Ошибка загрузки</p>
            <p class="empty-subtext">{{ error }}</p>
          </div>
          
          <div v-else-if="links.length === 0" class="empty-state">
            <i class="fas fa-link empty-icon"></i>
            <p class="empty-text">Нет ссылок</p>
            <p class="empty-subtext">Создайте первую ссылку для отслеживания переходов</p>
          </div>

          <div v-else class="links-table-wrapper">
            <table class="links-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Канал</th>
                  <th>Бот-контроллер</th>
                  <th>Лиды</th>
                  <th>Управление</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="link in links" :key="link.id" class="link-row">
                  <td class="link-name">{{ link.name }}</td>
                  <td class="link-channel">{{ link.channelTitle }}</td>
                  <td class="link-bot">{{ link.botName }}</td>
                  <td class="link-leads">{{ link.leadsCount }}</td>
                  <td class="link-actions">
                    <button @click="copyLink(link.trackingUrl)" class="action-btn copy-btn" title="Скопировать ссылку">
                      <i class="fas fa-copy"></i>
                    </button>
                    <button @click="deleteLink(link.id)" class="action-btn delete-btn" title="Удалить">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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

    <!-- Add Link Modal -->
    <Transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click="() => !addingLink && closeAddModal()">
        <div class="modal-content" @click.stop>
          <div class="modal-scanlines"></div>
          
          <div class="modal-header">
            <h2 class="modal-title">Добавить ссылку</h2>
            <button @click="closeAddModal" class="modal-close-btn" :disabled="addingLink">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-tag"></i>
                Название ссылки *
              </label>
              <input 
                v-model="formName"
                type="text" 
                class="form-input"
                placeholder="Введите название ссылки"
                :disabled="addingLink"
              />
            </div>


            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-broadcast-tower"></i>
                Канал *
              </label>
              <div class="channel-select-wrapper">
                <input 
                  v-if="!formChatId"
                  v-model="channelSearchQuery"
                  type="text" 
                  class="form-input"
                  placeholder="Начните вводить для поиска..."
                  :disabled="addingLink"
                />
                <div v-else class="selected-channel-wrapper">
                  <div class="selected-channel">
                    <span>{{ channels.find(ch => ch.chatId === formChatId)?.chatTitle }}</span>
                    <button 
                      type="button"
                      @click="formChatId = ''; formBotId = ''; channelSearchQuery = ''"
                      class="selected-channel-remove"
                      :disabled="addingLink"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div v-if="!formChatId && channelSearchQuery && filteredChannels.length > 0" class="channel-dropdown">
                  <div 
                    v-for="channel in filteredChannels" 
                    :key="channel.chatId"
                    class="channel-option"
                    @click="onChannelSelect(channel.chatId)"
                  >
                    <div class="channel-option-title">{{ channel.chatTitle }}</div>
                    <div class="channel-option-bot">{{ channel.botName }}</div>
                  </div>
                </div>
                <div v-if="!formChatId && channelSearchQuery && filteredChannels.length === 0" class="channel-dropdown">
                  <div class="channel-option channel-option-empty">
                    Каналы не найдены
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-robot"></i>
                Бот-контроллер *
              </label>
              <select 
                v-model="formBotId"
                class="form-input"
                :disabled="addingLink"
              >
                <option value="">Выберите бота</option>
                <option v-for="bot in availableBots" :key="bot.id" :value="bot.id">
                  {{ bot.botName || bot.botUsername || 'Неизвестный бот' }}
                </option>
              </select>
              <p v-if="availableBots.length === 1 && formBotId" class="form-hint">Бот выбран автоматически</p>
            </div>

            <div v-if="linkError" class="form-error">
              <i class="fas fa-exclamation-circle"></i>
              {{ linkError }}
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeAddModal" class="modal-btn modal-btn-cancel" :disabled="addingLink">
              Отмена
            </button>
            <button @click="addLink" class="modal-btn modal-btn-primary" :disabled="addingLink">
              <span v-if="addingLink">
                <i class="fas fa-spinner fa-spin"></i> Добавление...
              </span>
              <span v-else>
                <i class="fas fa-plus"></i> Добавить
              </span>
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
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--color-text);
  margin: 0;
  letter-spacing: 0.05em;
  text-shadow: 
    0 0 10px rgba(232, 232, 232, 0.3),
    0 0 20px rgba(211, 35, 75, 0.2);
  position: relative;
}

.page-title.show-underline::after {
  content: '';
  position: absolute;
  bottom: -0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
  animation: underline-expand 0.6s ease-out 0.3s forwards;
  box-shadow: 0 0 10px rgba(211, 35, 75, 0.5);
}

@keyframes underline-expand {
  to {
    width: 100%;
  }
}

.typing-cursor {
  color: var(--color-accent);
  animation: cursor-blink 1s step-end infinite;
  text-shadow: 0 0 8px rgba(211, 35, 75, 0.8);
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.page-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 600px;
  line-height: 1.6;
  letter-spacing: 0.02em;
}

/* Actions Section */
.actions-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.actions-section.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.add-link-btn {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  border: none;
  color: white;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  transition: var(--transition);
  box-shadow: 
    0 4px 12px rgba(211, 35, 75, 0.3),
    0 2px 6px rgba(211, 35, 75, 0.2);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.add-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgba(211, 35, 75, 0.4),
    0 4px 8px rgba(211, 35, 75, 0.3);
}

/* Links Section */
.links-section {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.links-section.content-visible {
  opacity: 1;
  transform: translateY(0);
}

.links-table-wrapper {
  overflow-x: auto;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}

.links-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.links-table thead {
  background: var(--color-bg-tertiary);
  border-bottom: 2px solid var(--color-border);
}

.links-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}

.links-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s ease;
}

.links-table tbody tr:hover {
  background: var(--color-bg-tertiary);
}

.links-table td {
  padding: 1rem;
  color: var(--color-text);
}

.link-name {
  font-weight: 500;
}

.link-channel,
.link-bot {
  color: var(--color-text-secondary);
}

.link-leads {
  text-align: center;
  font-weight: 500;
  color: var(--color-accent);
}

.link-actions {
  text-align: right;
}

.action-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 0.5rem;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}

.action-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.copy-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(211, 35, 75, 0.1);
}

.delete-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: rgba(211, 35, 75, 0.1);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--color-text-tertiary);
}

.empty-text {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.empty-subtext {
  font-size: 0.9rem;
  color: var(--color-text-tertiary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  clip-path: polygon(
    0 8px, 8px 8px, 8px 0,
    calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px)
  );
}

.modal-scanlines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px,
    rgba(0, 0, 0, 0.03) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 1;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  position: relative;
  z-index: 2;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0;
  color: var(--color-text);
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: var(--transition);
}

.modal-close-btn:hover:not(:disabled) {
  color: var(--color-text);
}

.modal-close-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 1.5rem;
  position: relative;
  z-index: 2;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-weight: 500;
}

.form-label i {
  color: var(--color-accent);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.9rem;
  transition: var(--transition);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
}

.form-error {
  background: rgba(211, 35, 75, 0.1);
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.channel-select-wrapper {
  position: relative;
}

.channel-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.channel-option {
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid var(--color-border);
}

.channel-option:hover {
  background: var(--color-bg-secondary);
}

.channel-option-title {
  color: var(--color-text);
  font-weight: 500;
}

.channel-option-bot {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  margin-top: 0.25rem;
}

.selected-channel-wrapper {
  margin-top: 0;
}

.selected-channel {
  padding: 0.75rem;
  background: var(--color-accent-light);
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-channel-remove {
  background: transparent;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  padding: 0.25rem;
  transition: var(--transition);
}

.selected-channel-remove:hover:not(:disabled) {
  opacity: 0.7;
}

.selected-channel-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.channel-option-empty {
  color: var(--color-text-tertiary);
  font-style: italic;
  cursor: default;
}

.channel-option-empty:hover {
  background: transparent;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  position: relative;
  z-index: 2;
}

.modal-btn {
  padding: 0.75rem 1.5rem;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-btn-cancel {
  background: var(--color-bg-tertiary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.modal-btn-cancel:hover:not(:disabled) {
  background: var(--color-bg);
}

.modal-btn-primary {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%);
  color: white;
}

.modal-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(211, 35, 75, 0.3);
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Footer */
.app-footer {
  background: transparent;
  border-top: 1px solid var(--color-border);
  padding: 2rem 0;
  margin-top: auto;
  position: relative;
  z-index: 100;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.02em;
}

.footer-left,
.footer-center,
.footer-right {
  flex: 1;
  text-align: center;
}

.footer-left {
  text-align: left;
}

.footer-right {
  text-align: right;
}

.footer-link {
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  letter-spacing: inherit;
  transition: color 0.25s ease;
  padding: 0;
}

.footer-link:hover {
  color: var(--color-text-secondary);
}

.footer-heart {
  color: var(--color-accent);
  margin: 0 0.25rem;
  animation: heart-beat 2s ease-in-out infinite;
}

@keyframes heart-beat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }

  .page-description {
    font-size: 1rem;
  }

  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-left,
  .footer-right {
    text-align: center;
  }

  .links-table-wrapper {
    overflow-x: scroll;
  }

  .links-table {
    font-size: 0.8rem;
  }

  .links-table th,
  .links-table td {
    padding: 0.5rem;
  }
}
</style>
