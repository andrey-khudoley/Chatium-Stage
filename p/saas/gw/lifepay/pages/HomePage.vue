<template>
  <div class="app-layout flex flex-col" @animationend="onAppLayoutAnimationEnd">
    <GlobalGlitch />
    <Header
      v-if="bootLoaderDone"
      :projectTitle="projectTitle"
      :indexUrl="indexUrl"
      :profileUrl="profileUrl"
      :loginUrl="loginUrl"
      :isAuthenticated="isAuthenticated"
      :isAdmin="isAdmin"
      :adminUrl="adminUrl"
      :testsUrl="testsUrl"
    />

    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner" :class="{ ready: bootLoaderDone }">

        <!-- ====== TABS ====== -->
        <nav class="panel-toolbar" aria-label="Разделы и live-режим">
          <div class="panel-tabs" role="tablist">
            <button
              v-for="t in tabs"
              :key="t.id"
              :class="['tab', { active: activeTab === t.id }]"
              :aria-selected="activeTab === t.id"
              role="tab"
              type="button"
              @click="setTab(t.id)"
            >
              <i class="fas" :class="t.icon"></i>
              <span>{{ t.label }}</span>
            </button>
          </div>
          <div class="panel-toolbar-right">
            <label class="live-toggle" :class="{ on: liveMode }" :title="liveMode ? 'Авто-обновление включено' : 'Включить авто-обновление'">
              <input v-model="liveMode" type="checkbox" />
              <span class="live-dot"></span>
              <span class="live-label">LIVE</span>
            </label>
          </div>
        </nav>

        <!-- ====== TAB: OVERVIEW ====== -->
        <template v-if="activeTab === 'overview'">
          <section class="kpi-grid" aria-label="Ключевые метрики за 24 часа">
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-paper-plane"></i></div>
              <div class="kpi-label">Входящих за 24ч</div>
              <div class="kpi-value">{{ formatKpi(counts.totalRequests) }}</div>
            </article>
            <article class="kpi-card kpi-hero kpi-success">
              <div class="kpi-icon"><i class="fas fa-circle-check"></i></div>
              <div class="kpi-label">Успешных</div>
              <div class="kpi-value">{{ formatKpi(counts.totalOk) }}</div>
            </article>
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-bug"></i></div>
              <div class="kpi-label">Ошибок ответа</div>
              <div class="kpi-value">{{ formatKpi(counts.totalErrors) }}</div>
            </article>
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-tower-broadcast"></i></div>
              <div class="kpi-label">Запросов к LifePay</div>
              <div class="kpi-value">{{ formatKpi(counts.upstreamTotal) }}</div>
            </article>
          </section>

          <section class="kpi-grid kpi-grid-secondary" aria-label="LifePay">
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-circle-check"></i> Upstream OK</div>
              <div class="stat-value">{{ formatKpi(counts.upstreamOk) }}</div>
            </article>
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-circle-xmark"></i> Upstream errors</div>
              <div class="stat-value">{{ formatKpi(counts.upstreamErrors) }}</div>
            </article>
          </section>
        </template>

        <!-- ====== TAB: REQUESTS ====== -->
        <section v-show="activeTab === 'requests'" class="panel-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Входящие запросы клиентов</h2>
            <span class="updated-since muted">{{ updatedSince(lastUpdated.requests) }}</span>
            <button type="button" class="btn-mini head-action" @click="loadRequests" title="Обновить">
              <i class="fas fa-rotate"></i>
            </button>
          </header>
          <div v-if="requests.length > 0" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>requestId</th>
                  <th>op</th>
                  <th>метод</th>
                  <th>HTTP</th>
                  <th>errorCode</th>
                  <th>ms</th>
                  <th>raw</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in requests" :key="r.id" :class="rowClassRequest(r)">
                  <td>{{ formatTime(r.requestedAt) }}</td>
                  <td><code>{{ r.requestId }}</code></td>
                  <td>{{ r.op }}</td>
                  <td>{{ r.method }}</td>
                  <td>{{ r.clientHttpStatus }}</td>
                  <td>{{ r.errorCode || '—' }}</td>
                  <td>{{ r.durationMs }}</td>
                  <td>
                    <button class="btn-mini" @click="openRaw('request', r.id)" title="Полное тело запроса">
                      <i class="fas fa-code"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-inbox empty-icon"></i>
            <p class="empty-title">Запросов пока нет</p>
            <p class="empty-hint">Сюда попадут все обращения клиентов к /api/v1/{op}.</p>
          </div>
        </section>

        <!-- ====== TAB: UPSTREAM ====== -->
        <section v-show="activeTab === 'upstream'" class="panel-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Исходящие вызовы к LifePay</h2>
            <span class="updated-since muted">{{ updatedSince(lastUpdated.upstream) }}</span>
            <button type="button" class="btn-mini head-action" @click="loadUpstream" title="Обновить">
              <i class="fas fa-rotate"></i>
            </button>
          </header>
          <div v-if="upstream.length > 0" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>requestId</th>
                  <th>op</th>
                  <th>kind</th>
                  <th>HTTP LP</th>
                  <th>semanticRule</th>
                  <th>ms</th>
                  <th>raw</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in upstream" :key="u.id" :class="rowClassUpstream(u)">
                  <td>{{ formatTime(u.sentAt) }}</td>
                  <td><code>{{ u.requestId }}</code></td>
                  <td>{{ u.op }}</td>
                  <td>{{ u.upstreamKind }}</td>
                  <td>{{ u.lpHttpStatus || '—' }}</td>
                  <td>{{ u.semanticRule || '—' }}</td>
                  <td>{{ u.durationMs }}</td>
                  <td>
                    <button class="btn-mini" @click="openRaw('upstream', u.id)" title="Полное тело ответа LifePay">
                      <i class="fas fa-code"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-tower-broadcast empty-icon"></i>
            <p class="empty-title">Вызовов LifePay пока нет</p>
            <p class="empty-hint">Сюда попадут все исходящие запросы к LifePay.</p>
          </div>
        </section>

      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" />

    <!-- ====== RAW MODAL ====== -->
    <div v-if="rawModal" class="raw-modal-backdrop" @click.self="closeRaw">
      <div class="raw-modal" role="dialog" aria-modal="true">
        <header class="raw-modal-head">
          <span class="prompt">›</span>
          <h2>
            {{ rawModal.kind === 'upstream' ? 'Ответ LifePay' : 'Запрос клиента' }}
            <span class="muted">#{{ rawModal.id }}</span>
          </h2>
          <button type="button" class="btn-mini head-action" @click="closeRaw" title="Закрыть">
            <i class="fas fa-xmark"></i> Закрыть
          </button>
        </header>
        <div class="raw-modal-body">
          <p v-if="rawModal.loading" class="muted">
            <i class="fas fa-spinner fa-spin"></i> Загрузка…
          </p>
          <p v-else-if="rawModal.error" class="form-msg is-err">
            <i class="fas fa-circle-exclamation"></i> {{ rawModal.error }}
          </p>
          <template v-else-if="rawModal.entry">
            <div class="raw-modal-actions">
              <button class="btn-mini" @click="copyText(rawJsonString(rawModal.entry))" title="Скопировать JSON">
                <i class="far fa-copy"></i> Скопировать
              </button>
            </div>
            <pre class="json-block">{{ rawJsonString(rawModal.entry) }}</pre>
          </template>
          <p v-else class="muted">
            <i class="fas fa-circle-info"></i> Запись не найдена.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import { createComponentLogger } from '../shared/logger'

const REFRESH_INTERVAL_MS = 15000
const TICK_INTERVAL_MS = 5000

const log = createComponentLogger('GatewayHomePage')

export default {
  name: 'GatewayHomePage',
  components: { Header, GlobalGlitch, AppFooter },
  props: {
    projectTitle: { type: String, default: 'LifePay Gateway / Панель' },
    indexUrl: { type: String, default: '/' },
    profileUrl: { type: String, default: '/' },
    loginUrl: { type: String, default: '/' },
    isAuthenticated: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    adminUrl: { type: String, default: '' },
    testsUrl: { type: String, default: '' },
    apiUrls: {
      type: Object,
      default: () => ({
        recentRequests: '',
        recentUpstream: '',
        rawRequest: '',
        rawUpstream: '',
        counts: ''
      })
    }
  },
  data() {
    return {
      bootLoaderDone: false,
      activeTab: 'overview',
      tabs: [
        { id: 'overview', label: 'Обзор', icon: 'fa-chart-line' },
        { id: 'requests', label: 'Входящие', icon: 'fa-list' },
        { id: 'upstream', label: 'К LifePay', icon: 'fa-tower-broadcast' }
      ],
      liveMode: false,
      now: Date.now(),
      counts: {
        totalRequests: 0,
        totalOk: 0,
        totalErrors: 0,
        upstreamTotal: 0,
        upstreamOk: 0,
        upstreamErrors: 0
      },
      requests: [],
      upstream: [],
      lastUpdated: {
        counts: 0,
        requests: 0,
        upstream: 0
      },
      refreshTimer: null,
      tickTimer: null,
      rawModal: null
    }
  },
  watch: {
    liveMode(value) {
      log.info('liveMode toggled', { value })
      this.applyLiveMode()
    },
    activeTab(value) {
      log.info('activeTab changed', { value })
      if (value === 'requests') this.loadRequests()
      else if (value === 'upstream') this.loadUpstream()
      else if (value === 'overview') this.loadCounts()
    }
  },
  mounted() {
    log.info('Component mounted')
    if (window.hideAppLoader) window.hideAppLoader()
    const bootReady = !!window.bootLoaderComplete
    if (bootReady) this.onBootComplete()
    else window.addEventListener('bootloader-complete', this.onBootComplete)
    this.tickTimer = setInterval(() => { this.now = Date.now() }, TICK_INTERVAL_MS)
  },
  beforeUnmount() {
    log.info('beforeUnmount')
    this.stopRefresh()
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null }
    window.removeEventListener('bootloader-complete', this.onBootComplete)
  },
  methods: {
    onBootComplete() {
      this.bootLoaderDone = true
      log.info('Boot complete — initial load')
      this.loadCounts()
      this.loadRequests()
      this.loadUpstream()
    },
    onAppLayoutAnimationEnd(e) {
      if (e.animationName === 'crt-power-on') {
        e.target.classList.add('app-layout-appeared')
      }
    },
    setTab(id) { this.activeTab = id },
    applyLiveMode() {
      if (this.liveMode) this.startRefresh()
      else this.stopRefresh()
    },
    startRefresh() {
      this.stopRefresh()
      this.refreshTimer = setInterval(() => {
        this.loadCounts()
        if (this.activeTab === 'requests') this.loadRequests()
        if (this.activeTab === 'upstream') this.loadUpstream()
      }, REFRESH_INTERVAL_MS)
    },
    stopRefresh() {
      if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null }
    },

    async loadCounts() {
      const url = this.apiUrls?.counts
      if (!url) return
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (data && data.success && data.counts) {
          this.counts = { ...this.counts, ...data.counts }
          this.lastUpdated.counts = Date.now()
        }
      } catch (e) {
        log.error('loadCounts failed', { error: String(e) })
      }
    },
    async loadRequests() {
      const url = this.apiUrls?.recentRequests
      if (!url) return
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (data && data.success && Array.isArray(data.entries)) {
          this.requests = data.entries
          this.lastUpdated.requests = Date.now()
        }
      } catch (e) {
        log.error('loadRequests failed', { error: String(e) })
      }
    },
    async loadUpstream() {
      const url = this.apiUrls?.recentUpstream
      if (!url) return
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (data && data.success && Array.isArray(data.entries)) {
          this.upstream = data.entries
          this.lastUpdated.upstream = Date.now()
        }
      } catch (e) {
        log.error('loadUpstream failed', { error: String(e) })
      }
    },

    async openRaw(kind, id) {
      const url = kind === 'upstream' ? this.apiUrls?.rawUpstream : this.apiUrls?.rawRequest
      if (!url || !id) {
        this.rawModal = { kind, id, entry: null, loading: false, error: 'URL или id отсутствуют' }
        return
      }
      this.rawModal = { kind, id, entry: null, loading: true, error: '' }
      try {
        const sep = url.includes('?') ? '&' : '?'
        const res = await fetch(`${url}${sep}id=${encodeURIComponent(String(id))}`, {
          method: 'GET',
          headers: { Accept: 'application/json' }
        })
        const data = await res.json()
        if (!data || data.success !== true) {
          this.rawModal = { kind, id, entry: null, loading: false, error: data?.error || 'Ошибка загрузки' }
          return
        }
        this.rawModal = { kind, id, entry: data.entry || null, loading: false, error: '' }
      } catch (e) {
        this.rawModal = { kind, id, entry: null, loading: false, error: String(e) }
      }
    },
    closeRaw() { this.rawModal = null },
    rawJsonString(entry) {
      if (!entry) return ''
      try { return JSON.stringify(entry, null, 2) } catch (_e) { return '<unstringifiable>' }
    },

    /* helpers */
    formatKpi(n) {
      if (typeof n !== 'number' || !Number.isFinite(n)) return '0'
      return String(n)
    },
    formatTime(ts) {
      if (!ts) return '—'
      const d = new Date(ts)
      return d.toLocaleTimeString('ru-RU', { hour12: false })
    },
    updatedSince(ts) {
      if (!ts) return ''
      const diffSec = Math.floor((this.now - ts) / 1000)
      if (diffSec < 5) return 'только что'
      if (diffSec < 60) return `${diffSec} с назад`
      const min = Math.floor(diffSec / 60)
      return `${min} мин назад`
    },
    rowClassRequest(r) {
      if (!r.errorCode && r.clientHttpStatus < 400) return 'row-ok'
      return 'row-err'
    },
    rowClassUpstream(u) {
      if (u.upstreamKind === 'json_ok' && !u.semanticRule) return 'row-ok'
      return 'row-err'
    },
    copyText(text) {
      try { if (navigator && navigator.clipboard) navigator.clipboard.writeText(text) } catch (_e) {}
    }
  }
}
</script>

<style>
/* === Layout === */
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
  position: relative;
  z-index: 100;
  padding: 1.5rem 0;
}
.content-inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* === Toolbar === */
.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}
.panel-tabs { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.tab.active {
  background: var(--color-accent-light);
  color: var(--color-text);
  border-color: var(--color-accent);
}
.panel-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.75rem; }
.live-toggle {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.75rem; border: 1px solid var(--color-border);
  border-radius: 4px; cursor: pointer; background: var(--color-bg-secondary);
  user-select: none;
}
.live-toggle input { display: none; }
.live-toggle .live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-text-tertiary);
}
.live-toggle.on .live-dot {
  background: var(--color-accent);
  box-shadow: 0 0 8px var(--color-accent);
}
.live-label { font-size: 0.75rem; letter-spacing: 0.1em; color: var(--color-text-secondary); }

/* === KPI === */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
.kpi-grid-secondary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.kpi-card {
  position: relative;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem 1.1rem;
  min-height: 100px;
  display: flex; flex-direction: column; justify-content: center;
}
.kpi-card.kpi-success { border-left: 3px solid var(--color-accent); }
.kpi-icon { color: var(--color-accent); font-size: 1.1rem; margin-bottom: 0.4rem; }
.kpi-label { font-size: 0.7rem; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; }
.kpi-value { font-size: 1.75rem; color: var(--color-text); font-weight: 500; }
.stat-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.85rem 1rem;
}
.stat-label { font-size: 0.7rem; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.25rem; }
.stat-label i { margin-right: 0.35rem; color: var(--color-accent); }
.stat-value { font-size: 1.25rem; color: var(--color-text); }

/* === Sections / tables === */
.panel-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem 1.1rem;
}
.panel-section-head {
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.panel-section-head h2 { font-size: 1rem; margin: 0; flex: 1; font-weight: 500; }
.panel-section-head .prompt { color: var(--color-accent); font-weight: 700; }
.panel-section-head .muted { color: var(--color-text-tertiary); font-size: 0.75rem; margin-left: 0.5rem; }
.btn-mini {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-tertiary); color: var(--color-text-secondary);
  border: 1px solid var(--color-border); border-radius: 3px; cursor: pointer;
  font-size: 0.75rem;
}
.btn-mini:hover { color: var(--color-text); border-color: var(--color-accent); }
.head-action { margin-left: 0.5rem; }
.table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.data-table th, .data-table td {
  text-align: left; padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
}
.data-table th { color: var(--color-text-tertiary); font-weight: 500; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; }
.data-table .row-err td { color: var(--color-accent); }
.empty-state { padding: 1.5rem; text-align: center; color: var(--color-text-tertiary); }
.empty-icon { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; color: var(--color-accent); }
.empty-title { color: var(--color-text-secondary); margin: 0.25rem 0; }
.empty-hint { font-size: 0.85rem; }

/* === Raw modal === */
.raw-modal-backdrop {
  position: fixed; inset: 0; z-index: 999999;
  background: rgba(0, 0, 0, 0.75);
  display: flex; align-items: center; justify-content: center;
  padding: 2rem;
  backdrop-filter: blur(2px);
}
.raw-modal {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  width: 100%; max-width: 980px; max-height: 86vh;
  display: flex; flex-direction: column;
  box-shadow: 0 12px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(211, 35, 75, 0.15);
}
.raw-modal-head {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}
.raw-modal-head h2 { font-size: 1rem; margin: 0; font-weight: 500; flex: 1; }
.raw-modal-head .muted { margin-left: 0.4rem; color: var(--color-text-tertiary); font-weight: 400; }
.raw-modal-body { padding: 1rem; overflow: auto; flex: 1; }
.raw-modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.5rem; }
.json-block {
  white-space: pre-wrap; word-break: break-all;
  font-size: 0.78rem;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 4px; padding: 0.75rem; margin: 0;
  color: var(--color-text);
  max-height: 70vh; overflow: auto;
}
.form-msg.is-err { color: var(--color-accent); }
.muted { color: var(--color-text-tertiary); }

@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kpi-grid-secondary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .kpi-grid-secondary { grid-template-columns: 1fr; }
  .data-table { font-size: 0.72rem; }
  .raw-modal-backdrop { padding: 0.5rem; }
}
</style>
