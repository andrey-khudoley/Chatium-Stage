<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getOrCreateBrowserSocketClient } from '@app/socket'
import { clearTokenRoute } from '../api/token/clear'
import { getTokenStateRoute } from '../api/token/get'
import { saveTokenRoute } from '../api/token/save'
import { sendTelegramTextRoute } from '../api/telegram/send'
import { watchTelegramGroupsRoute } from '../api/telegram/watch-groups'

declare const ctx: app.Ctx

type TelegramGroup = {
  id: string
  title: string
  username: string | null
  active: boolean
  channelId: string | null
}

const props = defineProps<{
  encodedSocketId: string
  socketId: string
  pageUrl: string
}>()

const clarityUid = ref('')
const initLoading = ref(true)

const hasToken = ref(false)
const tokenInput = ref('')
const tokenBusy = ref(false)
const tokenError = ref('')

const groups = ref<TelegramGroup[]>([])
const selectedChatId = ref('')
const groupsStatus = ref('')
const isWatching = ref(false)
const incomingWebhooks = ref<
  { updateType: string; chatTitle: string; chatId: string; textPreview: string; timestamp: number }[]
>([])

const textInput = ref('')
const sendBusy = ref(false)
const sendError = ref('')
const sendResult = ref('')
const uploadedFileName = ref('')

const pageHint = computed(() => {
  if (initLoading.value) return 'Загрузка профиля сессии...'
  if (!clarityUid.value) return 'Не удалось получить Clarity UID. Разрешите скрипты трекинга и обновите страницу.'
  if (!hasToken.value) return 'Введите BotAPI токен для начала работы.'
  return 'Отправьте сообщение в Telegram-чат, где бот администратор, затем обновите список.'
})

const canSend = computed(() => {
  return !!selectedChatId.value && textInput.value.trim().length > 0 && !sendBusy.value
})

let socketSubscription: any = null
let activeWatchRequest = 0

function readClarityUid(): string {
  const uid = (window as any)?.clrtUid
  return typeof uid === 'string' ? uid.trim() : ''
}

async function resolveClarityUid(): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const uid = readClarityUid()
    if (uid) return uid
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return ''
}

function applyGroups(nextGroups: TelegramGroup[]) {
  groups.value = [...nextGroups].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    return a.title.localeCompare(b.title, 'ru')
  })

  if (groups.value.length === 0) {
    selectedChatId.value = ''
    return
  }

  const selectedExists = groups.value.some((group) => group.id === selectedChatId.value)
  if (!selectedExists) {
    selectedChatId.value = groups.value[0].id
  }
}

function handleSocketPacket(packet: any) {
  if (!packet || typeof packet !== 'object') return

  if (packet.type === 'groups-update') {
    const incoming = Array.isArray(packet?.data?.groups) ? packet.data.groups : []
    const normalized: TelegramGroup[] = incoming
      .map((group: any) => ({
        id: String(group?.id ?? '').trim(),
        title: String(group?.title ?? group?.id ?? 'Без названия'),
        username: group?.username ? String(group.username) : null,
        active: group?.active !== false,
        channelId: group?.channelId ? String(group.channelId) : null
      }))
      .filter((group) => !!group.id)

    applyGroups(normalized)
  }

  if (packet.type === 'groups-status') {
    const message = typeof packet?.data?.message === 'string' ? packet.data.message : ''
    if (message) groupsStatus.value = message
  }

  if (packet.type === 'webhook-incoming') {
    const d = packet?.data
    if (d) {
      incomingWebhooks.value = [
        ...incomingWebhooks.value,
        {
          updateType: typeof d.updateType === 'string' ? d.updateType : '?',
          chatTitle: typeof d.chatTitle === 'string' ? d.chatTitle : '-',
          chatId: typeof d.chatId === 'string' ? d.chatId : '-',
          textPreview: typeof d.textPreview === 'string' ? d.textPreview : '-',
          timestamp: typeof d.timestamp === 'number' ? d.timestamp : Date.now()
        }
      ]
    }
  }
}

async function subscribeToGroupsSocket() {
  const socketClient = await getOrCreateBrowserSocketClient()
  socketSubscription = socketClient.subscribeToData(props.encodedSocketId)
  socketSubscription.listen((packet: any) => {
    handleSocketPacket(packet)
  })
}

function unsubscribeFromGroupsSocket() {
  if (socketSubscription?.unsubscribe) {
    socketSubscription.unsubscribe()
    socketSubscription = null
  }
}

async function loadTokenState() {
  if (!clarityUid.value) return

  const result = (await getTokenStateRoute.query({ clarityUid: clarityUid.value }).run(ctx)) as {
    success?: boolean
    hasToken?: boolean
    error?: string
  }

  if (!result?.success) {
    tokenError.value = result?.error || 'Не удалось загрузить токен'
    return
  }

  hasToken.value = !!result.hasToken

  if (hasToken.value) {
    incomingWebhooks.value = []
    await startWatchGroups()
  }
}

async function saveToken() {
  tokenError.value = ''
  sendResult.value = ''

  if (!clarityUid.value) {
    tokenError.value = 'Clarity UID не найден'
    return
  }

  tokenBusy.value = true

  try {
    const result = (await saveTokenRoute.run(ctx, {
      clarityUid: clarityUid.value,
      token: tokenInput.value
    })) as { success?: boolean; error?: string }

    if (!result?.success) {
      tokenError.value = result?.error || 'Не удалось сохранить токен'
      return
    }

    hasToken.value = true
    tokenInput.value = ''
    groups.value = []
    selectedChatId.value = ''
    incomingWebhooks.value = []
    groupsStatus.value = 'Токен сохранён. Запускаю поиск чатов...'
    await startWatchGroups()
  } finally {
    tokenBusy.value = false
  }
}

async function clearToken() {
  tokenError.value = ''
  sendError.value = ''
  sendResult.value = ''

  if (!clarityUid.value) {
    tokenError.value = 'Clarity UID не найден'
    return
  }

  tokenBusy.value = true

  try {
    const result = (await clearTokenRoute.run(ctx, {
      clarityUid: clarityUid.value
    })) as { success?: boolean; error?: string }

    if (!result?.success) {
      tokenError.value = result?.error || 'Не удалось очистить токен'
      return
    }

    hasToken.value = false
    groups.value = []
    selectedChatId.value = ''
    groupsStatus.value = ''
  } finally {
    tokenBusy.value = false
  }
}

async function startWatchGroups() {
  if (!clarityUid.value || isWatching.value) return

  isWatching.value = true
  groupsStatus.value = 'Запускаю обновление списка чатов...'
  incomingWebhooks.value = []
  sendError.value = ''

  const watchId = Date.now()
  activeWatchRequest = watchId

  try {
    const pageUrl =
      typeof window !== 'undefined' ? window.location.origin : (props.pageUrl?.startsWith('http') ? new URL(props.pageUrl).origin : props.pageUrl || '')
    const result = (await watchTelegramGroupsRoute.run(ctx, {
      clarityUid: clarityUid.value,
      socketId: props.socketId,
      pageUrl
    })) as { success?: boolean; found?: boolean; error?: string }

    if (activeWatchRequest !== watchId) return

    if (!result?.success) {
      groupsStatus.value = result?.error || 'Не удалось обновить список чатов'
    }
  } catch (error: any) {
    if (activeWatchRequest !== watchId) return
    groupsStatus.value = error?.message || 'Ошибка обновления списка чатов'
  } finally {
    if (activeWatchRequest === watchId) {
      isWatching.value = false
    }
  }
}

async function handleTxtFileChange(event: Event) {
  sendError.value = ''

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const lowerName = file.name.toLowerCase()
  if (!lowerName.endsWith('.txt')) {
    sendError.value = 'Поддерживаются только файлы .txt'
    input.value = ''
    return
  }

  try {
    const content = await file.text()
    textInput.value = content
    uploadedFileName.value = file.name
    sendResult.value = `Загружен файл: ${file.name}`
  } catch (error: any) {
    sendError.value = error?.message || 'Не удалось прочитать файл'
  } finally {
    input.value = ''
  }
}

async function sendText() {
  sendError.value = ''
  sendResult.value = ''

  if (!clarityUid.value) {
    sendError.value = 'Clarity UID не найден'
    return
  }

  if (!selectedChatId.value) {
    sendError.value = 'Выберите канал/группу'
    return
  }

  sendBusy.value = true

  try {
    const result = (await sendTelegramTextRoute.run(ctx, {
      clarityUid: clarityUid.value,
      chatId: selectedChatId.value,
      text: textInput.value
    })) as { success?: boolean; error?: string; sentCount?: number; targetTitle?: string }

    if (!result?.success) {
      sendError.value = result?.error || 'Ошибка отправки'
      return
    }

    const sentCount = Number(result.sentCount || 0)
    const title = result.targetTitle || 'выбранный чат'
    sendResult.value = sentCount > 1
      ? `Готово: отправлено ${sentCount} сообщения в «${title}».`
      : `Готово: сообщение отправлено в «${title}».`
  } finally {
    sendBusy.value = false
  }
}

onMounted(async () => {
  try {
    await subscribeToGroupsSocket()

    clarityUid.value = await resolveClarityUid()
    if (!clarityUid.value) return

    await loadTokenState()
  } finally {
    initLoading.value = false
  }
})

onBeforeUnmount(() => {
  activeWatchRequest = 0
  unsubscribeFromGroupsSocket()
})
</script>

<template>
  <div class="page-shell">
    <div class="background-grid"></div>
    <div class="background-spot spot-1"></div>
    <div class="background-spot spot-2"></div>

    <main class="layout">
      <section class="hero-card">
        <p class="eyebrow">Telegram Bot Publisher</p>
        <h1 class="headline">Отправка текста в Telegram-группы и каналы</h1>
        <p class="subline">{{ pageHint }}</p>
        <p class="meta">
          Clarity UID: <strong>{{ clarityUid || 'не получен' }}</strong>
        </p>
      </section>

      <section class="card" v-if="!hasToken">
        <h2>1. BotAPI токен</h2>
        <p class="card-text">
          Введите токен Telegram-бота. Токен будет сохранён в Heap-таблице проекта по вашему Clarity UID.
        </p>

        <label class="input-label" for="token-input">BotAPI token</label>
        <input
          id="token-input"
          class="text-input"
          type="password"
          placeholder="123456789:AA..."
          v-model="tokenInput"
          :disabled="tokenBusy || initLoading"
        />

        <div class="actions-row">
          <button class="btn btn-primary" @click="saveToken" :disabled="tokenBusy || !tokenInput.trim()">
            {{ tokenBusy ? 'Сохраняю...' : 'Сохранить токен' }}
          </button>
        </div>

        <p class="error" v-if="tokenError">{{ tokenError }}</p>
      </section>

      <template v-else>
        <section class="card">
          <div class="section-header">
            <h2>2. Каналы и группы</h2>
            <button class="btn btn-ghost" @click="clearToken" :disabled="tokenBusy">
              {{ tokenBusy ? 'Очищаю...' : 'Очистить токен' }}
            </button>
          </div>

          <div v-if="!selectedChatId && incomingWebhooks.length" class="incoming-updates">
            <p class="status">Апдейты от Telegram:</p>
            <ul class="incoming-updates-list">
              <li v-for="(w, i) in incomingWebhooks" :key="i" class="incoming-update-item">
                <span class="update-type">{{ w.updateType }}</span>
                <span class="update-chat">{{ w.chatTitle }}</span>
                <span v-if="w.textPreview !== '-'" class="update-preview">«{{ w.textPreview }}{{ w.textPreview.length >= 80 ? '…' : '' }}»</span>
              </li>
            </ul>
          </div>

          <p class="card-text">
            Отправьте любое сообщение в Telegram-чат, где бот уже администратор. Затем нажмите кнопку обновления.
          </p>

          <div class="actions-row">
            <button class="btn btn-primary" @click="startWatchGroups" :disabled="isWatching">
              {{ isWatching ? 'Обновляю список...' : 'Обновить список чатов' }}
            </button>
          </div>

          <p class="status" v-if="groupsStatus">{{ groupsStatus }}</p>

          <div class="groups-list" v-if="groups.length">
            <label class="group-item" v-for="group in groups" :key="group.id">
              <input type="radio" name="chat" :value="group.id" v-model="selectedChatId" />
              <div class="group-body">
                <div class="group-title-row">
                  <span class="group-title">{{ group.title }}</span>
                  <span class="badge" :class="group.active ? 'badge-active' : 'badge-inactive'">
                    {{ group.active ? 'active' : 'inactive' }}
                  </span>
                </div>
                <p class="group-meta">ID: {{ group.id }}<span v-if="group.username"> • @{{ group.username }}</span></p>
              </div>
            </label>
          </div>

          <p class="card-text" v-else>
            Пока нет доступных чатов. После отправки сообщения в Telegram нажмите обновление ещё раз.
          </p>
        </section>

        <section class="card">
          <h2>3. Текст для отправки</h2>
          <p class="card-text">
            Вставьте текст вручную или загрузите `.txt` файл. Если текст длиннее лимита Telegram, сервис разделит его до 3 сообщений.
          </p>

          <div class="input-block">
            <label class="input-label" for="txt-file">Загрузить `.txt`</label>
            <input id="txt-file" class="file-input" type="file" accept=".txt,text/plain" @change="handleTxtFileChange($event)" />
            <p class="status" v-if="uploadedFileName">Файл: {{ uploadedFileName }}</p>
          </div>

          <div class="input-block">
            <label class="input-label" for="text-input">Текст сообщения</label>
            <textarea
              id="text-input"
              class="textarea"
              placeholder="Вставьте текст для отправки"
              v-model="textInput"
            ></textarea>
          </div>

          <div class="actions-row">
            <button class="btn btn-primary" @click="sendText" :disabled="!canSend">
              {{ sendBusy ? 'Отправка...' : 'Отправить в Telegram' }}
            </button>
          </div>

          <p class="error" v-if="sendError">{{ sendError }}</p>
          <p class="success" v-if="sendResult">{{ sendResult }}</p>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
:global(:root) {
  --bg-main: #06131f;
  --bg-card: rgba(6, 29, 46, 0.8);
  --line: rgba(120, 183, 255, 0.35);
  --text: #e9f2ff;
  --muted: #90a8c4;
  --accent: #3ec9b6;
  --accent-strong: #1ea892;
  --danger: #ff7878;
  --ok: #7ce6b7;
}

:global(body) {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  color: var(--text);
  background: radial-gradient(circle at 15% 20%, #0d2f4a 0%, transparent 45%),
    radial-gradient(circle at 85% 0%, #172356 0%, transparent 40%),
    #060d18;
}

.page-shell {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  padding: 24px 16px 36px;
}

.background-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(124, 170, 229, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 170, 229, 0.08) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.8), transparent 100%);
}

.background-spot {
  position: fixed;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.45;
  pointer-events: none;
}

.spot-1 {
  width: 260px;
  height: 260px;
  background: #24d8c3;
  top: -50px;
  right: -40px;
}

.spot-2 {
  width: 320px;
  height: 320px;
  background: #2e6bff;
  bottom: -90px;
  left: -80px;
}

.layout {
  position: relative;
  z-index: 1;
  max-width: 960px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.hero-card,
.card {
  border: 1px solid var(--line);
  background: linear-gradient(155deg, rgba(8, 27, 42, 0.92) 0%, var(--bg-card) 100%);
  box-shadow:
    0 12px 40px rgba(4, 13, 22, 0.45),
    inset 0 1px 0 rgba(139, 199, 255, 0.25);
  border-radius: 18px;
  padding: 20px;
}

.eyebrow {
  margin: 0;
  color: #8cd5ff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.headline {
  margin: 10px 0 6px;
  font-size: clamp(24px, 4vw, 36px);
  line-height: 1.15;
}

.subline,
.meta,
.card-text {
  margin: 0;
  color: var(--muted);
}

.meta {
  margin-top: 12px;
  font-family: 'IBM Plex Mono', monospace;
}

.card h2 {
  margin: 0;
  font-size: 22px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.input-block {
  margin-top: 14px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: #b9dbff;
  font-size: 14px;
}

.text-input,
.textarea,
.file-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(118, 168, 230, 0.4);
  background: rgba(3, 17, 30, 0.7);
  color: var(--text);
  padding: 12px 14px;
  font-size: 15px;
  font-family: 'IBM Plex Mono', monospace;
}

.textarea {
  min-height: 190px;
  resize: vertical;
}

.actions-row {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border: 0;
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  transform: translateY(-1px);
}

.btn-primary {
  color: #032a27;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%);
}

.btn-ghost {
  color: #ffd3d3;
  background: rgba(255, 133, 133, 0.15);
  border: 1px solid rgba(255, 133, 133, 0.35);
}

.groups-list {
  margin-top: 14px;
  display: grid;
  gap: 8px;
}

.group-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid rgba(118, 168, 230, 0.3);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(2, 15, 27, 0.65);
}

.group-body {
  flex: 1;
}

.group-title-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.group-title {
  font-weight: 700;
}

.group-meta {
  margin: 5px 0 0;
  color: var(--muted);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
}

.badge {
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 11px;
  font-family: 'IBM Plex Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.badge-active {
  background: rgba(124, 230, 183, 0.2);
  color: var(--ok);
}

.badge-inactive {
  background: rgba(255, 120, 120, 0.2);
  color: #ff9c9c;
}

.status,
.error,
.success {
  margin: 10px 0 0;
  font-size: 14px;
}

.status {
  color: #8fd0ff;
}

.error {
  color: var(--danger);
}

.success {
  color: var(--ok);
}

.incoming-updates {
  margin: 8px 0 0;
}

.incoming-updates-list {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--muted);
}

.incoming-update-item {
  margin: 2px 0;
  font-family: 'IBM Plex Mono', monospace;
}

.update-type {
  display: inline-block;
  min-width: 100px;
  color: #8fd0ff;
  font-size: 12px;
}

.update-chat {
  color: var(--ok);
  margin-right: 6px;
}

.update-preview {
  color: var(--muted);
  font-style: italic;
}

@media (max-width: 720px) {
  .page-shell {
    padding: 14px 10px 24px;
  }

  .hero-card,
  .card {
    padding: 16px;
    border-radius: 14px;
  }

  .headline {
    font-size: 24px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
