<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createComponentLogger, type LogEntry } from '../shared/logger'
import { getRecentLogsRoute } from '../api/admin/logs/recent'
import { getLogsBeforeRoute } from '../api/admin/logs/before'

const log = createComponentLogger('LogStreamPanel')

declare const ctx: app.Ctx

const props = withDefaults(
  defineProps<{
    enableExpandAll?: boolean
  }>(),
  {
    enableExpandAll: true
  }
)

const MAX_LOG_ENTRIES = 500
const LOG_FETCH_LIMIT = 50

const logEntries = ref<LogEntry[]>([])
const logsOutputRef = ref<HTMLElement | null>(null)
const logsLoading = ref(false)
const logsError = ref('')
const logsHasMore = ref(false)
const oldestLogTimestamp = ref<number | null>(null)
const selectedLogStream = ref<'all' | 'info' | 'warn' | 'error'>('all')
const logsRequestId = ref(0)

const LOG_STREAM_TO_SEVERITIES: Record<'all' | 'info' | 'warn' | 'error', number[]> = {
  all: [0, 1, 2, 3, 4, 5, 6, 7],
  info: [5, 6, 7],
  warn: [4],
  error: [0, 1, 2, 3]
}

const LOG_STREAM_LABELS: Record<'all' | 'info' | 'warn' | 'error', string> = {
  all: 'Весь поток',
  info: 'Инфо',
  warn: 'Предупреждения',
  error: 'Ошибки'
}

const LOG_STREAM_KEYS: Array<'all' | 'info' | 'warn' | 'error'> = ['all', 'info', 'warn', 'error']

const selectedLogStreamLabel = computed(() => LOG_STREAM_LABELS[selectedLogStream.value])
const currentLogCount = computed(() => logEntries.value.length)

type LogDisplayItem =
  | { type: 'log'; entry: LogEntry; formattedTime: string; formattedMessage: string }
  | { type: 'divider'; date: string }

function getSeveritiesQueryForStream(
  stream: 'all' | 'info' | 'warn' | 'error'
): string | undefined {
  if (stream === 'all') return undefined
  return LOG_STREAM_TO_SEVERITIES[stream].join(',')
}

function doesEntryMatchSelectedStream(entry: LogEntry): boolean {
  return LOG_STREAM_TO_SEVERITIES[selectedLogStream.value].includes(entry.severity)
}

function updateOldestTimestamp(entries: Array<LogEntry & { id?: string }>) {
  const first = entries[0]
  if (!first) return
  const oldest = entries.reduce(
    (min, item) => (item.timestamp < min ? item.timestamp : min),
    first.timestamp
  )
  oldestLogTimestamp.value = oldest
}

function formatLogTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function formatLogMessage(e: LogEntry): string {
  return e.args
    .map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)))
    .join(' ')
}

function formatDateDivider(timestamp: number): string {
  const d = new Date(timestamp)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function trimOldLogs() {
  if (logEntries.value.length > MAX_LOG_ENTRIES) {
    const sorted = [...logEntries.value].sort((a, b) => b.timestamp - a.timestamp)
    logEntries.value = sorted.slice(0, MAX_LOG_ENTRIES)
  }
}

function pushEntry(entry: LogEntry) {
  if (!doesEntryMatchSelectedStream(entry)) return
  logEntries.value.push(entry)
  trimOldLogs()
}

const displayedLogs = computed<LogDisplayItem[]>(() => {
  if (!logEntries.value.length) return []
  const sorted = [...logEntries.value].sort((a, b) => b.timestamp - a.timestamp)
  const items: LogDisplayItem[] = []
  let lastDateKey = ''
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i]
    if (!entry) continue
    const dateKey = getDateKey(entry.timestamp)
    if (i > 0 && dateKey !== lastDateKey) {
      items.push({ type: 'divider', date: formatDateDivider(entry.timestamp) })
    }
    lastDateKey = dateKey
    items.push({
      type: 'log',
      entry,
      formattedTime: formatLogTime(entry.timestamp),
      formattedMessage: formatLogMessage(entry)
    })
  }
  return items
})

const expandedLogRows = ref<Record<number, boolean>>({})
const toggleLogRow = (idx: number) => {
  expandedLogRows.value[idx] = !expandedLogRows.value[idx]
}

const displayedLogRowIndices = computed(() => {
  const items = displayedLogs.value
  const indices: number[] = []
  for (let i = 0; i < items.length; i++) {
    if (items[i]?.type === 'log') indices.push(i)
  }
  return indices
})

const hasAnyExpandedLogRow = computed(() => {
  const exp = expandedLogRows.value
  for (const idx of displayedLogRowIndices.value) {
    if (exp[idx]) return true
  }
  return false
})

const toggleExpandCollapseAllLogs = () => {
  const indices = displayedLogRowIndices.value
  if (!indices.length) return
  if (hasAnyExpandedLogRow.value) {
    expandedLogRows.value = {}
  } else {
    const next: Record<number, boolean> = {}
    for (const idx of indices) {
      next[idx] = true
    }
    expandedLogRows.value = next
  }
}

const toggleLogFilter = (stream: 'all' | 'info' | 'warn' | 'error') => {
  if (selectedLogStream.value === stream) return
  selectedLogStream.value = stream
  log.info('Поток логов переключён', stream)
}

const loadRecentLogs = async () => {
  const requestId = ++logsRequestId.value
  const severities = getSeveritiesQueryForStream(selectedLogStream.value)
  const query: { limit: string; severities?: string } = { limit: String(LOG_FETCH_LIMIT) }
  if (severities) query.severities = severities

  logsLoading.value = true
  logsError.value = ''
  try {
    const res = await getRecentLogsRoute.query(query).run(ctx)
    if (requestId !== logsRequestId.value) return
    const data = res as {
      success?: boolean
      entries?: Array<LogEntry & { id: string }>
      error?: string
    }
    if (data?.success && Array.isArray(data.entries)) {
      logEntries.value = [...data.entries]
      updateOldestTimestamp(data.entries)
      logsHasMore.value = data.entries.length === LOG_FETCH_LIMIT
      log.info('Последние логи загружены', { count: data.entries.length })
    } else {
      logsError.value = data?.error || 'Ошибка загрузки логов'
      log.error('Ошибка загрузки логов', logsError.value)
    }
  } catch (e) {
    if (requestId !== logsRequestId.value) return
    logsError.value = (e as Error)?.message || 'Ошибка сети'
    log.error('Ошибка загрузки логов', e)
  } finally {
    if (requestId !== logsRequestId.value) return
    logsLoading.value = false
  }
}

const loadMoreLogs = async () => {
  if (!oldestLogTimestamp.value) {
    log.warning('Попытка загрузить больше логов без oldestLogTimestamp')
    return
  }

  const requestId = ++logsRequestId.value
  const severities = getSeveritiesQueryForStream(selectedLogStream.value)
  const query: { beforeTimestamp: string; limit: string; severities?: string } = {
    beforeTimestamp: String(oldestLogTimestamp.value),
    limit: String(LOG_FETCH_LIMIT)
  }
  if (severities) query.severities = severities

  logsLoading.value = true
  logsError.value = ''
  try {
    const res = await getLogsBeforeRoute.query(query).run(ctx)
    if (requestId !== logsRequestId.value) return
    const data = res as {
      success?: boolean
      entries?: Array<LogEntry & { id: string }>
      hasMore?: boolean
      error?: string
    }
    if (data?.success && Array.isArray(data.entries)) {
      logEntries.value = [...logEntries.value, ...data.entries]
      updateOldestTimestamp(data.entries)
      logsHasMore.value = data.hasMore ?? data.entries.length === LOG_FETCH_LIMIT
      log.info('Дополнительные логи загружены', { count: data.entries.length })
    } else {
      logsError.value = data?.error || 'Ошибка загрузки логов'
      log.error('Ошибка загрузки дополнительных логов', logsError.value)
    }
  } catch (e) {
    if (requestId !== logsRequestId.value) return
    logsError.value = (e as Error)?.message || 'Ошибка сети'
    log.error('Ошибка загрузки дополнительных логов', e)
  } finally {
    if (requestId !== logsRequestId.value) return
    logsLoading.value = false
  }
}

const clearLogs = () => {
  logsRequestId.value += 1
  logEntries.value = []
  oldestLogTimestamp.value = Date.now()
  logsHasMore.value = true
  logsError.value = ''
  // Прерванный по requestId in-flight запрос выходит из finally раньше и не сбрасывает
  // флаг — сбрасываем его здесь, чтобы индикатор загрузки пропал сразу.
  logsLoading.value = false
  expandedLogRows.value = {}
  log.debug('Логи очищены: монитор подготовлен к новому потоку')
}

// Смена фильтра сбрасывает список и сама инициирует загрузку — поведение остаётся внутри панели.
watch(selectedLogStream, () => {
  logsRequestId.value += 1
  logEntries.value = []
  oldestLogTimestamp.value = null
  logsHasMore.value = false
  logsError.value = ''
  expandedLogRows.value = {}
  loadRecentLogs()
})

// `logsLoading` экспонируем, чтобы родитель (Admin) мог отразить состояние загрузки
// в своём статус-пилле, не дублируя само состояние.
defineExpose({ pushEntry, loadRecent: loadRecentLogs, logsLoading })
</script>

<template>
  <section class="lsp-card">
    <div class="lsp-card-hd">
      <h2><i class="fas fa-stream lsp-icon-hd"></i> Монитор логов</h2>
      <span class="lsp-log-ct">{{ currentLogCount }} зап.</span>
    </div>
    <div class="lsp-log-filters">
      <button
        v-for="s in LOG_STREAM_KEYS"
        :key="s"
        type="button"
        class="lsp-flt"
        :class="{ active: selectedLogStream === s }"
        @click="toggleLogFilter(s)"
      >
        {{ LOG_STREAM_LABELS[s] }}
      </button>
    </div>
    <div v-if="props.enableExpandAll && displayedLogRowIndices.length" class="lsp-log-toggle-row">
      <button
        type="button"
        class="lsp-btn lsp-btn--toggle-all"
        @click="toggleExpandCollapseAllLogs"
      >
        <i :class="hasAnyExpandedLogRow ? 'fas fa-compress-alt' : 'fas fa-expand-alt'"></i>
        {{ hasAnyExpandedLogRow ? 'Свернуть все' : 'Развернуть все' }}
      </button>
    </div>
    <div class="lsp-log-out custom-scrollbar" ref="logsOutputRef">
      <div v-if="!displayedLogs.length" class="lsp-log-empty">
        <i
          class="fas fa-inbox"
          style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem; opacity: 0.4"
        ></i>
        Поток «{{ selectedLogStreamLabel }}» пуст
      </div>
      <template v-for="(item, index) in displayedLogs" :key="index">
        <div v-if="item.type === 'divider'" class="lsp-log-div">
          <span>{{ item.date }}</span>
        </div>
        <div
          v-else
          class="lsp-log-row"
          :class="{ expanded: expandedLogRows[index] }"
          @click="toggleLogRow(index)"
        >
          <span class="lsp-log-t">{{ item.formattedTime }}</span>
          <span class="lsp-log-l" :class="`lvl-${item.entry.level}`"
            >[{{ item.entry.level.toUpperCase() }}]</span
          >
          <span class="lsp-log-m">{{ item.formattedMessage }}</span>
        </div>
      </template>
    </div>
    <div class="lsp-log-ft">
      <span v-if="logsLoading" class="lsp-log-sync">
        <i class="fas fa-circle-notch fa-spin"></i> Загрузка...
      </span>
      <p v-if="logsError" class="lsp-err">
        <i class="fas fa-exclamation-circle"></i> {{ logsError }}
      </p>
      <div class="lsp-log-btns">
        <button
          v-if="logsHasMore && !logsLoading"
          type="button"
          class="lsp-btn"
          @click="loadMoreLogs"
        >
          <i class="fas fa-chevron-down"></i> Ещё 50
        </button>
        <button type="button" class="lsp-btn lsp-btn--danger" @click="clearLogs">
          <i class="fas fa-trash-alt"></i> Очистить
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lsp-card {
  /* Палитра дублирована локально (та же, что у страниц-родителей). */
  --c-bg: rgba(12, 11, 14, 0.97);
  --c-bg2: rgba(16, 15, 19, 0.96);
  --c-bg-deep: rgba(8, 7, 10, 0.98);
  --c-bdr: rgba(50, 44, 54, 0.55);
  --c-bdr-hi: rgba(75, 62, 78, 0.6);
  --c-tx: #e0dcdf;
  --c-tx2: #a39da0;
  --c-tx3: #7e777b;
  --c-red: #c4213f;
  --c-red-s: #d95672;
  --c-warn: #c9a660;
  --c-alert: #d97a8a;

  border: 1px solid var(--c-bdr);
  background: linear-gradient(175deg, var(--c-bg), var(--c-bg2));
  padding: 0.85rem 1rem;
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  animation: lsp-enter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s both;
}
.lsp-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 10%, var(--c-red) 50%, transparent 90%);
  opacity: 0.2;
}
.lsp-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.012) 0px,
    rgba(0, 0, 0, 0.012) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  opacity: 0.4;
}
@keyframes lsp-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.lsp-card,
.lsp-card :deep(*) {
  box-sizing: border-box;
  border-radius: 0 !important;
  line-height: 1.45;
}

.lsp-icon-hd {
  font-size: 0.68rem;
  opacity: 0.6;
  margin-right: 0.15rem;
}

.lsp-card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.lsp-card-hd h2 {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--c-tx2);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.lsp-log-ct {
  font-size: 0.7rem;
  color: var(--c-tx3);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.lsp-log-filters {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.45rem;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.lsp-flt {
  padding: 0.35rem;
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  color: var(--c-tx2);
  font-family: inherit;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  letter-spacing: 0.03em;
  position: relative;
  overflow: hidden;
}
.lsp-flt::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--c-red);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}
.lsp-flt:hover {
  border-color: var(--c-bdr-hi);
}
.lsp-flt:hover::after {
  transform: scaleX(1);
}
.lsp-flt.active {
  border-color: var(--c-red-s);
  background: rgba(196, 33, 63, 0.12);
  color: #fff;
}
.lsp-flt.active::after {
  transform: scaleX(1);
}

.lsp-log-toggle-row {
  margin-bottom: 0.55rem;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.lsp-btn--toggle-all {
  width: 100%;
  font-size: 0.72rem;
  padding: 0.32rem 0.55rem;
}

.lsp-log-out {
  flex: 1 1 auto;
  min-height: 7rem;
  overflow-y: auto;
  border: 1px solid rgba(50, 44, 54, 0.35);
  background: rgba(5, 4, 7, 0.98);
  padding: 0.55rem;
  margin-bottom: 0.55rem;
  font-size: 0.74rem;
  line-height: 1.6;
  position: relative;
  z-index: 1;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.25);
}
.lsp-log-empty {
  color: var(--c-tx3);
  padding: 2rem;
  text-align: center;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
}
.lsp-log-div {
  text-align: center;
  padding: 0.35rem 0;
  margin: 0.3rem 0;
}
.lsp-log-div span {
  font-size: 0.64rem;
  color: var(--c-warn);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.5;
  padding: 0.1rem 0.6rem;
  border-top: 1px solid rgba(201, 166, 96, 0.12);
  border-bottom: 1px solid rgba(201, 166, 96, 0.12);
}
.lsp-log-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.4rem;
  padding: 0.2rem 0;
  border-bottom: 1px solid rgba(50, 44, 54, 0.1);
  cursor: pointer;
  transition: background 0.1s ease;
  user-select: none;
}
.lsp-log-row:hover {
  background: rgba(255, 255, 255, 0.02);
}
.lsp-log-t {
  flex-shrink: 0;
  color: var(--c-tx3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.lsp-log-l {
  flex-shrink: 0;
  font-weight: 700;
  white-space: nowrap;
}
.lsp-log-m {
  flex: 1 1 0;
  min-width: 0;
  color: var(--c-tx);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lsp-log-row.expanded .lsp-log-m {
  flex-basis: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: visible;
  text-overflow: unset;
  margin-top: 0.15rem;
  padding: 0.2rem 0 0.1rem 0.5rem;
  border-left: 2px solid rgba(50, 44, 54, 0.3);
  user-select: text;
}

.lvl-debug {
  color: #7e767a;
}
.lvl-info {
  color: var(--c-tx2);
}
.lvl-notice {
  color: #8bb89c;
}
.lvl-warning {
  color: var(--c-warn);
}
.lvl-error,
.lvl-critical,
.lvl-alert,
.lvl-emergency {
  color: var(--c-alert);
}

.lsp-log-ft {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}
.lsp-log-sync {
  font-size: 0.74rem;
  color: var(--c-tx2);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.lsp-log-sync i {
  font-size: 0.62rem;
}
.lsp-log-btns {
  display: flex;
  gap: 0.4rem;
}
.lsp-log-btns .lsp-btn:first-child {
  flex: 1;
}

.lsp-err {
  margin: 0.4rem 0 0;
  color: var(--c-alert);
  font-size: 0.76rem;
}
.lsp-err i {
  font-size: 0.62rem;
  margin-right: 0.15rem;
}

/* ── BUTTONS ── */
.lsp-btn {
  padding: 0.42rem 0.8rem;
  border: 1px solid var(--c-bdr);
  background: var(--c-bg-deep);
  color: var(--c-tx);
  font-family: inherit;
  font-size: 0.76rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  letter-spacing: 0.03em;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0 2px,
    2px 2px,
    2px 0,
    calc(100% - 2px) 0,
    calc(100% - 2px) 2px,
    100% 2px,
    100% calc(100% - 2px),
    calc(100% - 2px) calc(100% - 2px),
    calc(100% - 2px) 100%,
    2px 100%,
    2px calc(100% - 2px),
    0 calc(100% - 2px)
  );
}
.lsp-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.04) 0px,
    rgba(0, 0, 0, 0.04) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
}
.lsp-btn::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--c-red);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}
.lsp-btn i {
  font-size: 0.62rem;
}
.lsp-btn:hover:not(:disabled) {
  border-color: var(--c-bdr-hi);
  background: rgba(24, 22, 28, 0.98);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
}
.lsp-btn:hover:not(:disabled)::after {
  transform: scaleX(1);
}
.lsp-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: none;
}
.lsp-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.lsp-btn--danger {
  border-color: rgba(217, 122, 138, 0.3);
  color: #ecc8cf;
  background: rgba(45, 14, 22, 0.9);
}
.lsp-btn--danger::after {
  background: var(--c-alert);
}
.lsp-btn--danger:hover:not(:disabled) {
  border-color: rgba(217, 122, 138, 0.5);
  background: rgba(60, 20, 30, 0.95);
}

/* Узкий экран: фильтры в 2 колонки. Ограничение высоты списка при разворачивании
   сетки в одну колонку задаёт страница-родитель через :deep() на своём брейкпоинте. */
@media (max-width: 720px) {
  .lsp-log-filters {
    grid-template-columns: repeat(2, 1fr);
  }
  .lsp-log-row {
    grid-template-columns: 1fr;
    gap: 0.1rem;
  }
}
</style>
