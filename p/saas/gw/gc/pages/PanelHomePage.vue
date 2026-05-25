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
              v-for="t in visibleTabs"
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

        <!-- ====== DATE FILTER ====== -->
        <section v-show="activeTab === 'overview' || activeTab === 'invocations'" class="filter-bar">
          <div class="filter-group">
            <span class="filter-label"><i class="far fa-calendar"></i> С</span>
            <input v-model="filter.fromDate" type="date" class="filter-input" />
            <input v-model="filter.fromTime" type="time" class="filter-input filter-time" />
          </div>
          <div class="filter-group">
            <span class="filter-label">по</span>
            <input v-model="filter.toDate" type="date" class="filter-input" />
            <input v-model="filter.toTime" type="time" class="filter-input filter-time" />
          </div>
          <div class="filter-actions">
            <button type="button" class="btn-mini" :disabled="filterSaving || !filterValid" @click="applyFilter" title="Применить фильтр">
              <i class="fas fa-filter"></i> Применить
            </button>
            <button type="button" class="btn-mini" :disabled="filterSaving || !hasFilter" @click="resetFilter" title="Сбросить фильтр">
              <i class="fas fa-xmark"></i> Сбросить
            </button>
            <span v-if="!filterValid" class="filter-msg is-err">Начало не может быть позже окончания</span>
            <span v-else-if="filterError" class="filter-msg is-err">{{ filterError }}</span>
            <span v-else-if="hasFilter" class="filter-msg muted">Фильтр активен</span>
          </div>
        </section>

        <!-- ====== TAB: OVERVIEW ====== -->
        <template v-if="activeTab === 'overview'">
          <section class="kpi-grid" aria-label="Ключевые метрики">
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-arrows-rotate"></i></div>
              <div class="kpi-label">Вызовов /v1/&#123;op&#125;</div>
              <div class="kpi-value">{{ formatKpi(summary.total) }}</div>
            </article>
            <article class="kpi-card kpi-hero kpi-success">
              <div class="kpi-icon"><i class="fas fa-circle-check"></i></div>
              <div class="kpi-label">Успешных</div>
              <div class="kpi-value">{{ formatKpi(summary.okCount) }}</div>
            </article>
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-bug"></i></div>
              <div class="kpi-label">Ошибок</div>
              <div class="kpi-value">{{ formatKpi(summary.errCount) }}</div>
            </article>
            <article class="kpi-card kpi-hero">
              <div class="kpi-icon"><i class="fas fa-gauge-high"></i></div>
              <div class="kpi-label">avg, ms</div>
              <div class="kpi-value">{{ formatKpi(summary.avgDurationMs) }}</div>
            </article>
          </section>

          <section class="kpi-grid kpi-grid-secondary" aria-label="Латентность">
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-stopwatch"></i> p50, ms</div>
              <div class="stat-value">{{ formatKpi(summary.p50DurationMs) }}</div>
            </article>
            <article class="stat-card">
              <div class="stat-label"><i class="fas fa-stopwatch-20"></i> p95, ms</div>
              <div class="stat-value">{{ formatKpi(summary.p95DurationMs) }}</div>
            </article>
          </section>

          <section v-if="summary.topOps && summary.topOps.length" class="panel-section">
            <header class="panel-section-head">
              <span class="prompt">›</span>
              <h2>Топ операций</h2>
            </header>
            <div class="table-wrapper">
              <table class="data-table">
                <thead><tr><th>op</th><th>вызовов</th></tr></thead>
                <tbody>
                  <tr v-for="o in summary.topOps" :key="o.op"><td>{{ o.op }}</td><td>{{ o.count }}</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <!-- ====== TAB: INVOCATIONS ====== -->
        <section v-show="activeTab === 'invocations'" class="panel-section">
          <header class="panel-section-head">
            <span class="prompt">›</span>
            <h2>Завершённые вызовы /v1/&#123;op&#125;</h2>
            <span class="updated-since muted">{{ updatedSince(lastUpdated.invocations) }}</span>
            <button type="button" class="btn-mini head-action" @click="loadInvocations" title="Обновить">
              <i class="fas fa-rotate"></i>
            </button>
          </header>
          <div v-if="items.length > 0" class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>requestId</th>
                  <th>op</th>
                  <th>метод</th>
                  <th>контур</th>
                  <th>HTTP</th>
                  <th>errorCode</th>
                  <th>ms</th>
                  <th>raw</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, idx) in items" :key="it.requestId || idx" :class="it.ok ? 'row-ok' : 'row-err'">
                  <td>{{ formatTime(it.timestamp) }}</td>
                  <td><code>{{ it.requestId || '—' }}</code></td>
                  <td>{{ it.op || '—' }}</td>
                  <td>{{ it.httpMethod || '—' }}</td>
                  <td>{{ it.contour || '—' }}</td>
                  <td>{{ it.clientHttpStatus || '—' }}</td>
                  <td>{{ it.errorCode || '—' }}</td>
                  <td>{{ it.durationMs != null ? it.durationMs : '—' }}</td>
                  <td>
                    <button class="btn-mini" @click="openRaw(it)" title="Полная запись">
                      <i class="fas fa-code"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-inbox empty-icon"></i>
            <p class="empty-title">{{ hasFilter ? 'За выбранный период вызовов нет' : 'Завершённых вызовов пока нет' }}</p>
            <p class="empty-hint">Источник — серверные логи завершения /v1/&#123;op&#125;.</p>
          </div>
        </section>

        <!-- ====== TAB: ACCESS (Admin only) ====== -->
        <template v-if="activeTab === 'access' && isAdmin">
          <section class="panel-section">
            <header class="panel-section-head">
              <span class="prompt">›</span>
              <h2>Пригласительные ссылки</h2>
              <button type="button" class="btn-mini head-action" @click="loadInvites" title="Обновить">
                <i class="fas fa-rotate"></i>
              </button>
              <button type="button" class="btn-mini" @click="openCreateInvite" title="Создать пригласительную ссылку">
                <i class="fas fa-plus"></i> Создать инвайт
              </button>
            </header>
            <div v-if="invites.length > 0" class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Статус</th>
                    <th>Комментарий</th>
                    <th>Создал</th>
                    <th>Создан</th>
                    <th>Истекает</th>
                    <th>Использован</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="inv in invites" :key="inv.inviteId">
                    <td><span class="badge" :class="'badge-' + inv.status">{{ inviteStatusLabel(inv.status) }}</span></td>
                    <td>{{ inv.note || '—' }}</td>
                    <td>{{ inv.createdByDisplayName }}</td>
                    <td>{{ formatDateTime(inv.issuedAt) }}</td>
                    <td>{{ formatDateTime(inv.expiresAt) }}</td>
                    <td>{{ inv.usedByDisplayName ? `${inv.usedByDisplayName} (${formatDateTime(inv.usedAt)})` : '—' }}</td>
                    <td>
                      <button v-if="inv.status === 'active'" class="btn-mini btn-danger" @click="revokeInvite(inv.inviteId)" title="Отозвать инвайт">
                        <i class="fas fa-ban"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state">
              <i class="fas fa-link empty-icon"></i>
              <p class="empty-title">Инвайтов пока нет</p>
              <p class="empty-hint">Создайте ссылку и передайте её сотруднику, которому нужен доступ к панели.</p>
            </div>
          </section>

          <section class="panel-section">
            <header class="panel-section-head">
              <span class="prompt">›</span>
              <h2>Выданные доступы</h2>
              <button type="button" class="btn-mini head-action" @click="loadGrants" title="Обновить">
                <i class="fas fa-rotate"></i>
              </button>
            </header>
            <div v-if="grants.length > 0" class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Статус</th>
                    <th>Пользователь</th>
                    <th>Email</th>
                    <th>Выдан</th>
                    <th>Кем</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="g in grants" :key="g.userId" :class="{ 'row-revoked': !g.active }">
                    <td><span class="badge" :class="g.active ? 'badge-active' : 'badge-revoked'">{{ g.active ? 'активен' : 'отозван' }}</span></td>
                    <td>{{ g.userDisplayName }}</td>
                    <td>{{ g.userEmail || '—' }}</td>
                    <td>{{ formatDateTime(g.grantedAt) }}</td>
                    <td>{{ g.grantedByDisplayName }}</td>
                    <td>
                      <button v-if="g.active" class="btn-mini btn-danger" @click="revokeGrant(g.userId)" title="Отозвать доступ">
                        <i class="fas fa-user-slash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-state">
              <i class="fas fa-users empty-icon"></i>
              <p class="empty-title">Выданных доступов нет</p>
              <p class="empty-hint">Администраторы аккаунта имеют доступ автоматически, без записи здесь.</p>
            </div>
          </section>
        </template>

      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" />

    <!-- ====== RAW MODAL ====== -->
    <div v-if="rawModal" class="raw-modal-backdrop" @click.self="closeRaw">
      <div class="raw-modal" role="dialog" aria-modal="true">
        <header class="raw-modal-head">
          <span class="prompt">›</span>
          <h2>Запись вызова <span class="muted">{{ rawModal.entry && rawModal.entry.requestId }}</span></h2>
          <button type="button" class="btn-mini head-action" @click="closeRaw" title="Закрыть">
            <i class="fas fa-xmark"></i> Закрыть
          </button>
        </header>
        <div class="raw-modal-body">
          <div class="raw-modal-actions">
            <button class="btn-mini" @click="copyText(rawJsonString(rawModal.entry))" title="Скопировать JSON">
              <i class="far fa-copy"></i> Скопировать
            </button>
          </div>
          <pre class="json-block">{{ rawJsonString(rawModal.entry) }}</pre>
        </div>
      </div>
    </div>

    <!-- ====== CREATE INVITE MODAL ====== -->
    <div v-if="createModal" class="raw-modal-backdrop" @click.self="closeCreateInvite">
      <div class="raw-modal raw-modal-narrow" role="dialog" aria-modal="true">
        <header class="raw-modal-head">
          <span class="prompt">›</span>
          <h2>Создать пригласительную ссылку</h2>
          <button type="button" class="btn-mini head-action" @click="closeCreateInvite" title="Закрыть">
            <i class="fas fa-xmark"></i> Закрыть
          </button>
        </header>
        <div class="raw-modal-body">
          <template v-if="!createModal.result">
            <label class="field-label">Комментарий (необязательно)</label>
            <input v-model="createModal.note" type="text" class="filter-input field-full" placeholder="например: для Ольги" />
            <p v-if="createModal.error" class="form-msg is-err">{{ createModal.error }}</p>
            <div class="raw-modal-actions">
              <button class="btn-mini btn-primary" :disabled="createModal.submitting" @click="submitCreateInvite">
                <i v-if="createModal.submitting" class="fas fa-spinner fa-spin"></i>
                <span>{{ createModal.submitting ? 'Создание…' : 'Создать ссылку' }}</span>
              </button>
            </div>
          </template>
          <template v-else>
            <p class="form-msg is-ok"><i class="fas fa-circle-check"></i> Ссылка создана. Скопируйте её — повторно она не показывается.</p>
            <pre class="json-block">{{ createModal.result.fullUrl }}</pre>
            <div class="raw-modal-actions">
              <button class="btn-mini" @click="copyText(createModal.result.fullUrl)"><i class="far fa-copy"></i> Скопировать ссылку</button>
              <button class="btn-mini btn-primary" @click="closeCreateInvite"><i class="fas fa-check"></i> Готово</button>
            </div>
          </template>
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
const LIST_LIMIT = 100

const log = createComponentLogger('GcPanelHomePage')

/** Разбивает Unix ms на компоненты date (YYYY-MM-DD) и time (HH:MM) в локальной зоне. */
function msToDateTimeParts(ms) {
  if (!ms || !Number.isFinite(ms)) return { date: '', time: '' }
  const d = new Date(ms)
  const pad = (n) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { date, time }
}

/** Собирает Unix ms из date+time. Если date пуст — возвращает undefined. */
function partsToMs(date, time, endOfDay) {
  if (!date) return undefined
  const t = time || (endOfDay ? '23:59' : '00:00')
  const ms = new Date(`${date}T${t}`).getTime()
  return Number.isFinite(ms) ? ms : undefined
}

const EMPTY_SUMMARY = {
  total: 0,
  okCount: 0,
  errCount: 0,
  avgDurationMs: 0,
  p50DurationMs: 0,
  p95DurationMs: 0,
  topOps: [],
  topErrors: []
}

export default {
  name: 'GcPanelHomePage',
  components: { Header, GlobalGlitch, AppFooter },
  props: {
    projectTitle: { type: String, default: 'GC Gateway / Панель' },
    indexUrl: { type: String, default: '/' },
    profileUrl: { type: String, default: '/' },
    loginUrl: { type: String, default: '/' },
    isAuthenticated: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    adminUrl: { type: String, default: '' },
    testsUrl: { type: String, default: '' },
    initialDateFilter: {
      type: Object,
      default: () => ({})
    },
    apiUrls: {
      type: Object,
      default: () => ({
        invocations: '',
        filterSave: '',
        accessGenerateInvite: '',
        accessRevokeInvite: '',
        accessRevokeGrant: '',
        accessInvites: '',
        accessGrants: ''
      })
    }
  },
  data() {
    const fromParts = msToDateTimeParts(this.initialDateFilter && this.initialDateFilter.from)
    const toParts = msToDateTimeParts(this.initialDateFilter && this.initialDateFilter.to)
    return {
      bootLoaderDone: false,
      activeTab: 'overview',
      liveMode: false,
      now: Date.now(),
      items: [],
      summary: { ...EMPTY_SUMMARY },
      lastUpdated: { invocations: 0 },
      refreshTimer: null,
      tickTimer: null,
      rawModal: null,
      filter: {
        fromDate: fromParts.date,
        fromTime: fromParts.time,
        toDate: toParts.date,
        toTime: toParts.time
      },
      filterSaving: false,
      filterError: '',
      grants: [],
      invites: [],
      createModal: null
    }
  },
  computed: {
    visibleTabs() {
      const tabs = [
        { id: 'overview', label: 'Обзор', icon: 'fa-chart-line' },
        { id: 'invocations', label: 'Вызовы', icon: 'fa-list' }
      ]
      if (this.isAdmin) {
        tabs.push({ id: 'access', label: 'Доступы', icon: 'fa-user-shield' })
      }
      return tabs
    },
    fromMs() {
      return partsToMs(this.filter.fromDate, this.filter.fromTime, false)
    },
    toMs() {
      return partsToMs(this.filter.toDate, this.filter.toTime, true)
    },
    hasFilter() {
      return this.fromMs !== undefined || this.toMs !== undefined
    },
    filterValid() {
      if (this.fromMs !== undefined && this.toMs !== undefined) {
        return this.fromMs <= this.toMs
      }
      return true
    }
  },
  watch: {
    liveMode(value) {
      log.info('liveMode toggled', { value })
      this.applyLiveMode()
    },
    activeTab(value) {
      log.info('activeTab changed', { value })
      if (value === 'overview' || value === 'invocations') this.loadInvocations()
      else if (value === 'access') { this.loadInvites(); this.loadGrants() }
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
      this.loadInvocations()
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
        if (this.activeTab === 'overview' || this.activeTab === 'invocations') this.loadInvocations()
      }, REFRESH_INTERVAL_MS)
    },
    stopRefresh() {
      if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null }
    },

    buildFilters() {
      const filters = {}
      if (this.fromMs !== undefined) filters.dateFromMs = this.fromMs
      if (this.toMs !== undefined) filters.dateToMs = this.toMs
      return filters
    },

    async loadInvocations() {
      const url = this.apiUrls && this.apiUrls.invocations
      if (!url) return
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ mode: 'list', limit: LIST_LIMIT, filters: this.buildFilters() })
        })
        const data = await res.json()
        if (data && data.success) {
          this.items = Array.isArray(data.items) ? data.items : []
          this.summary = data.summary ? { ...EMPTY_SUMMARY, ...data.summary } : { ...EMPTY_SUMMARY }
          this.lastUpdated.invocations = Date.now()
        }
      } catch (e) {
        log.error('loadInvocations failed', { error: String(e) })
      }
    },

    /* ===== Date filter ===== */
    async applyFilter() {
      if (!this.filterValid || this.filterSaving) return
      const url = this.apiUrls && this.apiUrls.filterSave
      if (!url) return
      this.filterSaving = true
      this.filterError = ''
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: this.fromMs ?? null, to: this.toMs ?? null })
        })
        const data = await res.json().catch(() => ({}))
        if (!data || data.success !== true) {
          this.filterError = (data && data.error) || 'Не удалось сохранить фильтр'
        } else {
          this.loadInvocations()
        }
      } catch (e) {
        this.filterError = String(e)
      } finally {
        this.filterSaving = false
      }
    },
    async resetFilter() {
      const url = this.apiUrls && this.apiUrls.filterSave
      if (!url || this.filterSaving) return
      this.filterSaving = true
      this.filterError = ''
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: null, to: null })
        })
        const data = await res.json().catch(() => ({}))
        if (data && data.success === true) {
          this.filter = { fromDate: '', fromTime: '', toDate: '', toTime: '' }
          this.loadInvocations()
        } else {
          this.filterError = (data && data.error) || 'Не удалось сбросить фильтр'
        }
      } catch (e) {
        this.filterError = String(e)
      } finally {
        this.filterSaving = false
      }
    },

    openRaw(entry) {
      this.rawModal = { entry }
    },
    closeRaw() { this.rawModal = null },
    rawJsonString(entry) {
      if (!entry) return ''
      try { return JSON.stringify(entry, null, 2) } catch (_e) { return '<unstringifiable>' }
    },

    /* ===== Access (Admin only) ===== */
    async loadInvites() {
      const url = this.apiUrls && this.apiUrls.accessInvites
      if (!url) return
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (data && data.success && Array.isArray(data.invites)) {
          this.invites = data.invites
        }
      } catch (e) {
        log.error('loadInvites failed', { error: String(e) })
      }
    },
    async loadGrants() {
      const url = this.apiUrls && this.apiUrls.accessGrants
      if (!url) return
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        const data = await res.json()
        if (data && data.success && Array.isArray(data.grants)) {
          this.grants = data.grants
        }
      } catch (e) {
        log.error('loadGrants failed', { error: String(e) })
      }
    },
    openCreateInvite() {
      this.createModal = { note: '', submitting: false, error: '', result: null }
    },
    closeCreateInvite() {
      this.createModal = null
      this.loadInvites()
    },
    async submitCreateInvite() {
      const url = this.apiUrls && this.apiUrls.accessGenerateInvite
      if (!url || !this.createModal || this.createModal.submitting) return
      this.createModal.submitting = true
      this.createModal.error = ''
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: this.createModal.note || '' })
        })
        const data = await res.json().catch(() => ({}))
        if (data && data.success && data.fullUrl) {
          this.createModal.result = { fullUrl: data.fullUrl }
        } else {
          this.createModal.error = (data && data.error) || 'Не удалось создать ссылку'
        }
      } catch (e) {
        this.createModal.error = String(e)
      } finally {
        if (this.createModal) this.createModal.submitting = false
      }
    },
    async revokeInvite(inviteId) {
      const url = this.apiUrls && this.apiUrls.accessRevokeInvite
      if (!url || !inviteId) return
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteId })
        })
        this.loadInvites()
      } catch (e) {
        log.error('revokeInvite failed', { error: String(e) })
      }
    },
    async revokeGrant(userId) {
      const url = this.apiUrls && this.apiUrls.accessRevokeGrant
      if (!url || !userId) return
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        this.loadGrants()
      } catch (e) {
        log.error('revokeGrant failed', { error: String(e) })
      }
    },
    inviteStatusLabel(status) {
      switch (status) {
        case 'active': return 'активен'
        case 'used': return 'использован'
        case 'revoked': return 'отозван'
        case 'expired': return 'истёк'
        default: return status
      }
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
    formatDateTime(ts) {
      if (!ts) return '—'
      try { return new Date(ts).toLocaleString('ru-RU', { hour12: false }) } catch (_e) { return '—' }
    },
    updatedSince(ts) {
      if (!ts) return ''
      const diffSec = Math.floor((this.now - ts) / 1000)
      if (diffSec < 5) return 'только что'
      if (diffSec < 60) return `${diffSec} с назад`
      const min = Math.floor(diffSec / 60)
      return `${min} мин назад`
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
  background: transparent;
  position: relative;
}
.content-wrapper { padding: 1.5rem 0 2rem; }
.content-inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* === Toolbar === */
.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0.75rem;
  flex-wrap: wrap;
  background: rgba(20, 20, 20, 0.65);
  border: 1px solid var(--color-border);
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.panel-tabs {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  padding: 0.45rem 0.85rem;
  font-family: inherit;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.tab.active {
  color: var(--color-text);
  border-color: var(--color-accent);
  background: var(--color-accent-light);
}
.panel-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.75rem; }
.live-toggle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--color-text-tertiary);
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}
.live-toggle input { display: none; }
.live-toggle .live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-text-tertiary);
}
.live-toggle.on .live-dot {
  background: #d97a8a;
  box-shadow: 0 0 0 2px rgba(217, 122, 138, 0.2);
  animation: live-pulse 1.5s ease-in-out infinite;
}
.live-label { font-size: 0.75rem; letter-spacing: 0.1em; color: var(--color-text-secondary); }

/* === Date filter bar === */
.filter-bar {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid var(--color-border);
  padding: 0.65rem 0.9rem;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.filter-group { display: inline-flex; align-items: center; gap: 0.4rem; }
.filter-label { font-size: 0.75rem; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; }
.filter-label i { color: var(--color-accent); margin-right: 0.25rem; }
.filter-input {
  background: var(--color-bg); color: var(--color-text);
  border: 1px solid var(--color-border-light);
  padding: 0.3rem 0.5rem; font-family: inherit; font-size: 0.8rem;
  color-scheme: dark;
}
.filter-time { width: 6.5rem; }
.filter-actions { display: inline-flex; align-items: center; gap: 0.5rem; margin-left: auto; flex-wrap: wrap; }
.filter-msg { font-size: 0.75rem; }
.filter-msg.is-err { color: var(--color-accent); }

/* === KPI === */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;
}
.kpi-grid-secondary { grid-template-columns: repeat(4, 1fr); }
.kpi-card {
  position: relative;
  background: rgba(20, 20, 20, 0.65);
  border: 1px solid var(--color-border);
  padding: 1.1rem 1.25rem;
  overflow: hidden;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}
.kpi-card.kpi-success { border-left: 3px solid var(--color-accent); }
.kpi-icon {
  font-size: 1rem;
  color: var(--color-accent);
  margin-bottom: 0.4rem;
}
.kpi-label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.kpi-value {
  font-size: 1.85rem;
  color: var(--color-text);
  margin-top: 0.3rem;
  text-shadow: 0 0 8px rgba(232, 232, 232, 0.2);
  line-height: 1;
}
.stat-card {
  position: relative;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  padding: 0.7rem 0.85rem;
  overflow: hidden;
  clip-path: polygon(
    0 3px, 3px 3px, 3px 0,
    calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px)
  );
}
.stat-label {
  font-size: 0.65rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.stat-label i { margin-right: 0.3rem; color: var(--color-accent); opacity: 0.85; }
.stat-value {
  font-size: 1.2rem;
  color: var(--color-text);
  margin-top: 0.15rem;
  line-height: 1.1;
}

/* === Sections / tables === */
.panel-section {
  position: relative;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid var(--color-border);
  padding: 1.25rem 1.25rem 1rem;
  clip-path: polygon(
    0 4px, 4px 4px, 4px 0,
    calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
  );
}
.panel-section-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.85rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.panel-section-head h2 {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-accent);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 0 5px rgba(211, 35, 75, 0.25);
}
.panel-section-head .prompt {
  color: var(--color-accent);
  font-size: 1.1rem;
  line-height: 1;
}
.panel-section-head .muted { color: var(--color-text-tertiary); font-size: 0.75rem; margin-left: 0.5rem; }
.btn-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: transparent;
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
  padding: 0.15rem 0.4rem;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  margin-left: 0.35rem;
  transition: color 0.2s, border-color 0.2s;
}
.btn-mini:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
}
.btn-mini:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-mini.btn-primary { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
.btn-mini.btn-primary:hover { background: var(--color-accent-hover); border-color: var(--color-accent-hover); }
.btn-mini.btn-danger:hover { color: var(--color-accent); border-color: var(--color-accent); }
.head-action { margin-left: 0.5rem; }
.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  background: rgba(10, 10, 10, 0.65);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.data-table th, .data-table td {
  padding: 0.45rem 0.6rem;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--color-border);
}
.data-table th {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.65rem;
  border-bottom: 1px solid var(--color-border-light);
}
.data-table .row-err td { color: var(--color-accent); }
.data-table .row-revoked td { opacity: 0.55; }
.badge {
  display: inline-block; padding: 0.1rem 0.45rem;
  font-size: 0.7rem; border: 1px solid var(--color-border);
}
.badge-active { color: #6aaf7e; border-color: rgba(106, 175, 126, 0.4); }
.badge-used { color: var(--color-text-secondary); }
.badge-revoked { color: var(--color-accent); border-color: var(--color-accent); }
.badge-expired { color: var(--color-text-tertiary); }
.empty-state {
  padding: 1.75rem 1rem;
  text-align: center;
  color: var(--color-text-tertiary);
  border: 1px dashed var(--color-border);
  background: rgba(10, 10, 10, 0.4);
}
.empty-icon {
  font-size: 1.5rem;
  color: var(--color-text-tertiary);
  opacity: 0.6;
  display: block;
  margin-bottom: 0.5rem;
}
.empty-title {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin: 0 0 0.25rem;
  letter-spacing: 0.04em;
}
.empty-hint {
  margin: 0;
  font-size: 0.75rem;
}
.field-label {
  font-size: 0.68rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.field-full { width: 100%; box-sizing: border-box; }

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
.raw-modal-narrow { max-width: 560px; }
.raw-modal-head {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-tertiary);
}
.raw-modal-head h2 { font-size: 1rem; margin: 0; font-weight: 500; flex: 1; }
.raw-modal-head .muted { margin-left: 0.4rem; color: var(--color-text-tertiary); font-weight: 400; }
.raw-modal-body { padding: 1rem; overflow: auto; flex: 1; }
.raw-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.json-block {
  margin: 0;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text);
}
.form-msg.is-err { color: #d97a8a; }
.form-msg.is-ok { color: #6aaf7e; }
.muted {
  color: var(--color-text-tertiary);
  font-size: 0.78rem;
  margin: 0;
}

@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kpi-grid-secondary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .kpi-grid-secondary { grid-template-columns: 1fr; }
  .data-table { font-size: 0.72rem; }
  .raw-modal-backdrop { padding: 0.5rem; }
  .filter-actions { margin-left: 0; }
}
</style>
