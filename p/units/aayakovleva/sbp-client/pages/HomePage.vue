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
      :panelUrl="panelUrl"
    />

    <main class="content-wrapper flex-1 relative z-10 min-h-0 overflow-y-auto">
      <div class="content-inner" :class="{ ready: bootLoaderDone }">
        <HomeStatusStrip
          :allConfigured="allConfigured"
          :missingConfig="missingConfig"
          :baseUrl="baseUrl"
          @copy="copyText"
        />

        <HomeToolbar
          :visibleTabs="visibleTabs"
          :activeTab="activeTab"
          :fromDate="fromDate"
          :fromTime="fromTime"
          :toDate="toDate"
          :toTime="toTime"
          :hasActiveFilter="hasActiveFilter"
          :dateFilterSaving="dateFilterSaving"
          :dateFilterError="dateFilterError"
          :liveMode="liveMode"
          :searchValue="searchValue"
          @set-tab="setTab"
          @update:fromDate="fromDate = $event"
          @update:fromTime="fromTime = $event"
          @update:toDate="toDate = $event"
          @update:toTime="toTime = $event"
          @filter-change="onFilterChange"
          @reset-filter="resetDateFilter"
          @update:liveMode="liveMode = $event"
          @update:searchValue="searchValue = $event"
          @search="doSearch"
          @clear-search="clearSearch"
        />

        <HomeSearchResult
          v-if="searchResult"
          :result="searchResult"
          :searchedQuery="searchedQuery"
          @close="searchResult = null"
        />

        <HomeOverviewTab
          v-if="activeTab === 'overview'"
          :analytics="analytics"
          :periodLabel="periodLabel"
          :recentRequestsPreview="recentRequestsPreview"
          :recentWebhooksPreview="recentWebhooksPreview"
          :lastUpdated="lastUpdated"
          :now="now"
          @set-tab="setTab"
          @copy-text="copyText"
        />

        <HomeRequestsTab
          v-show="activeTab === 'requests'"
          :filteredRequests="filteredRequests"
          :filters="requestsFilters"
          :currentFilter="requestsFilter"
          :counts="requestCounts"
          :lastUpdatedTs="lastUpdated.requests"
          :now="now"
          @refresh="loadRequests"
          @update:filter="requestsFilter = $event"
          @lookup="lookupRequest"
          @copy-text="copyText"
          @open-raw="openRaw"
          @set-tab="setTab"
        />

        <HomeWebhooksTab
          v-show="activeTab === 'webhooks'"
          :filteredWebhooks="filteredWebhooks"
          :filters="webhooksFilters"
          :currentFilter="webhooksFilter"
          :counts="webhookCounts"
          :lastUpdatedTs="lastUpdated.webhooks"
          :now="now"
          @refresh="loadWebhooks"
          @update:filter="webhooksFilter = $event"
          @open-raw="openRaw"
        />

        <HomeCreateBillTab
          v-show="activeTab === 'createBill'"
          :bill="bill"
          :billLoading="billLoading"
          :billResult="billResult"
          :billSuccessData="billSuccessData"
          @submit="createBill"
          @reset-result="resetBillResult"
          @lookup="lookupRequest"
          @copy-text="copyText"
          @update:bill="bill = $event"
        />

        <HomeAccessTab
          v-if="activeTab === 'access' && isAdmin"
          :invites="invites"
          :grants="grants"
          :accessError="accessError"
          @load-access="loadAccess"
          @open-invite-modal="openInviteModal"
          @revoke-invite="revokeInvite"
          @revoke-grant="revokeGrant"
        />
      </div>
    </main>

    <AppFooter v-if="bootLoaderDone" @chatium-click="openChatiumLink" />

    <HomeRawModal v-if="rawModal" :modal="rawModal" @close="closeRaw" @copy="copyText" />

    <HomeCreateInviteModal
      v-if="inviteModal"
      :modal="inviteModal"
      @close="closeInviteModal"
      @submit="createInvite"
      @copy="copyText"
      @update-note="onInviteNote"
    />
  </div>
</template>

<script>
import Header from '../components/Header.vue'
import GlobalGlitch from '../components/GlobalGlitch.vue'
import AppFooter from '../components/AppFooter.vue'
import HomeStatusStrip from '../components/home/HomeStatusStrip.vue'
import HomeToolbar from '../components/home/HomeToolbar.vue'
import HomeSearchResult from '../components/home/HomeSearchResult.vue'
import HomeOverviewTab from '../components/home/HomeOverviewTab.vue'
import HomeRequestsTab from '../components/home/HomeRequestsTab.vue'
import HomeWebhooksTab from '../components/home/HomeWebhooksTab.vue'
import HomeCreateBillTab from '../components/home/HomeCreateBillTab.vue'
import HomeAccessTab from '../components/home/HomeAccessTab.vue'
import HomeRawModal from '../components/home/HomeRawModal.vue'
import HomeCreateInviteModal from '../components/home/HomeCreateInviteModal.vue'
import { sbpHomePageMethodsMixin } from './sbpHomePageMixin'
import {
  msToLocalDate,
  msToLocalTime,
  localPartsToMs,
  defaultSbpHomeApiUrls,
  defaultSbpHomeSettings,
  sbpHomeTabs,
  sbpRequestsFilters,
  sbpWebhooksFilters,
  sbpConfigChips,
  sbpRequestCounts,
  sbpWebhookCounts,
  sbpFilterRequests,
  sbpFilterWebhooks,
  sbpPeriodLabel
} from '../shared/sbpHomeFormat'

const TICK_INTERVAL_MS = 5000

export default {
  name: 'ClientHomePage',
  mixins: [sbpHomePageMethodsMixin],
  components: {
    Header,
    GlobalGlitch,
    AppFooter,
    HomeStatusStrip,
    HomeToolbar,
    HomeSearchResult,
    HomeOverviewTab,
    HomeRequestsTab,
    HomeWebhooksTab,
    HomeCreateBillTab,
    HomeAccessTab,
    HomeRawModal,
    HomeCreateInviteModal
  },
  props: {
    projectTitle: { type: String, default: 'LifePay SBP Client / Панель' },
    indexUrl: { type: String, default: '/' },
    profileUrl: { type: String, default: '/' },
    loginUrl: { type: String, default: '/' },
    isAuthenticated: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    adminUrl: { type: String, default: '' },
    testsUrl: { type: String, default: '' },
    panelUrl: { type: String, default: '' },
    webhookUrl: { type: String, default: '' },
    baseUrlPath: { type: String, default: '' },
    apiUrls: { type: Object, default: () => defaultSbpHomeApiUrls() },
    initialSettings: { type: Object, default: () => defaultSbpHomeSettings() },
    initialDateFilter: { type: Object, default: () => ({}) }
  },
  data() {
    const initFrom =
      typeof this.initialDateFilter?.from === 'number' ? this.initialDateFilter.from : null
    const initTo = typeof this.initialDateFilter?.to === 'number' ? this.initialDateFilter.to : null
    return {
      bootLoaderDone: false,
      origin: '',
      // Границы фильтра как строки полей: дата (обязательна) + время (необязательно).
      // Пустое время = 00:00. Источник истины — эти строки; ms выводится в computed.
      fromDate: msToLocalDate(initFrom),
      fromTime: msToLocalTime(initFrom),
      toDate: msToLocalDate(initTo),
      toTime: msToLocalTime(initTo),
      dateFilterSaving: false,
      dateFilterError: '',
      activeTab: 'overview',
      tabs: sbpHomeTabs(),
      requestsFilters: sbpRequestsFilters(),
      webhooksFilters: sbpWebhooksFilters(),
      requestsFilter: 'all',
      webhooksFilter: 'all',
      liveMode: false,
      now: Date.now(),
      lastUpdated: { analytics: 0, requests: 0, webhooks: 0 },
      // Снимок сохранённых настроек (из SSR) — только для индикатора статуса в шапке.
      // Редактирование настроек перенесено на страницу настроек проекта (/web/admin).
      savedSettings: {
        ...defaultSbpHomeSettings(),
        ...(this.initialSettings || {})
      },
      analytics: null,
      requests: [],
      webhooks: [],
      searchValue: '',
      searchedQuery: '',
      searchResult: null,
      bill: {
        orderNumber: '',
        amount: 1,
        customerEmail: '',
        description: 'Тестовый счёт',
        callbackUrl: this.webhookUrl,
        customerPhone: ''
      },
      billResult: null,
      billSuccessData: null,
      billLoading: false,
      refreshTimer: null,
      tickTimer: null,
      rawModal: null,
      invites: [],
      grants: [],
      accessError: '',
      inviteModal: null
    }
  },
  computed: {
    // Base URL = хост (читается на фронте) + путь до создания счёта (из config через проп).
    baseUrl() {
      if (!this.origin) return ''
      return `${this.origin}${this.baseUrlPath}`
    },
    // Границы в Unix ms, выведенные из строк полей. Пустое время → 00:00.
    fromMs() {
      return localPartsToMs(this.fromDate, this.fromTime)
    },
    toMs() {
      return localPartsToMs(this.toDate, this.toTime)
    },
    hasActiveFilter() {
      return this.fromMs !== null || this.toMs !== null
    },
    periodLabel() {
      return sbpPeriodLabel(this.fromMs, this.toMs)
    },
    visibleTabs() {
      return this.tabs.filter((t) => !t.adminOnly || this.isAdmin)
    },
    configChips() {
      return sbpConfigChips(this.savedSettings)
    },
    allConfigured() {
      return this.configChips.every((c) => c.set)
    },
    missingConfig() {
      return this.configChips.filter((c) => !c.set).map((c) => c.label)
    },
    filteredRequests() {
      return sbpFilterRequests(this.requests, this.requestsFilter)
    },
    filteredWebhooks() {
      return sbpFilterWebhooks(this.webhooks, this.webhooksFilter)
    },
    recentRequestsPreview() {
      return this.requests.slice(0, 5)
    },
    recentWebhooksPreview() {
      return this.webhooks.slice(0, 5)
    },
    requestCounts() {
      return sbpRequestCounts(this.requests)
    },
    webhookCounts() {
      return sbpWebhookCounts(this.webhooks)
    }
  },
  watch: {
    activeTab(newVal) {
      this.loadForTab(newVal)
    },
    liveMode(on) {
      if (on) this.startAutoRefresh()
      else this.stopAutoRefresh()
    },
    hasActiveFilter(active) {
      // При активном фильтре авто-обновление недоступно: выключаем Live,
      // watcher liveMode сам остановит таймер (без дублирующего stopAutoRefresh).
      if (active && this.liveMode) this.liveMode = false
    }
  },
  mounted() {
    this.loadQrcodeLib()
    if (typeof window !== 'undefined') {
      this.origin = window.location.origin
      if (window.hideAppLoader) window.hideAppLoader()
      if (window.bootLoaderComplete) {
        this.bootLoaderDone = true
        this.onReady()
      } else {
        window.addEventListener('bootloader-complete', this.handleBootComplete)
      }
    }
    this.tickTimer = setInterval(() => {
      this.now = Date.now()
    }, TICK_INTERVAL_MS)
  },
  beforeUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('bootloader-complete', this.handleBootComplete)
    }
    this.stopAutoRefresh()
    if (this.tickTimer) {
      clearInterval(this.tickTimer)
      this.tickTimer = null
    }
  },
  methods: {
    handleBootComplete() {
      this.bootLoaderDone = true
      this.onReady()
    },
    onReady() {
      this.loadForTab(this.activeTab)
    },
    setTab(id) {
      this.activeTab = id
    },
    onAppLayoutAnimationEnd(e) {
      if (e?.animationName === 'crt-power-on') {
        e.target?.classList?.add('app-layout-appeared')
      }
    },
    openChatiumLink() {
      if (typeof window !== 'undefined') {
        window.open('https://chatium.ru/?start=pl-LGBT1Oge7c61RkKTU4t0start', '_blank')
      }
    },
    copyText(text) {
      try {
        if (navigator && navigator.clipboard) navigator.clipboard.writeText(text)
      } catch (_e) {
        // ignore
      }
    }
  }
}
</script>
